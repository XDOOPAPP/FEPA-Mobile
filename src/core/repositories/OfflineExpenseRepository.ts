import { Q } from '@nozbe/watermelondb';
import { database } from '../../database';
import ExpenseModel from '../../database/models/ExpenseModel';
import { CreateExpenseRequest, Expense, UpdateExpenseRequest } from '../models/Expense';
import { expenseRepository } from './ExpenseRepository';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

class OfflineExpenseRepository {
  private expensesCollection = database.collections.get<ExpenseModel>('expenses');

  private async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable !== false;
  }

  // Helper to map Local Model to App Entity
  private mapToEntity(model: ExpenseModel): Expense {
    return {
      id: model.serverId || model.id, // Prefer serverId if available for UI consistency
      amount: model.amount,
      category: model.category,
      description: model.description,
      spentAt: new Date(model.spentAt).toISOString(),
      createdAt: new Date(model.createdAt).toISOString(),
      updatedAt: new Date(model.updatedAt).toISOString(),
      // Add other fields if necessary
    } as Expense;
  }

  async getExpenses(): Promise<Expense[]> {
    try {
      // 1. Fetch from Local DB
      const localExpenses = await this.expensesCollection.query(
        Q.where('sync_status', Q.notEq('deleted'))
      ).fetch();
      
      const mappedExpenses = localExpenses.map(this.mapToEntity);

      // 2. Trigger background sync if online (fire and forget)
      this.syncExpenses().catch(console.error);

      return mappedExpenses;

    } catch (error) {
      console.error('Offline fetch failed', error);
      return [];
    }
  }

  async createExpense(payload: CreateExpenseRequest): Promise<Expense> {
    // 1. Save to Local DB
    const newExpense = await database.write(async () => {
      return await this.expensesCollection.create(expense => {
        expense.amount = payload.amount;
        expense.category = payload.category;
        expense.description = payload.description || '';
        expense.spentAt = new Date(payload.spentAt);
        expense.syncStatus = 'pending';
      });
    });

    // 2. Try to sync immediately if online
    if (await this.isOnline()) {
      try {
        const serverExpense = await expenseRepository.createExpense(payload);
        
        // Update local with server ID and synced status
        await database.write(async () => {
          await newExpense.update(expense => {
            expense.serverId = serverExpense.id;
            expense.syncStatus = 'synced';
          });
        });
        
        return serverExpense;
      } catch (error) {
         // Silently fail network, return local version
         console.log('Online creation failed, keeping local pending');
      }
    }

    return this.mapToEntity(newExpense);
  }

  async updateExpense(id: string, payload: UpdateExpenseRequest): Promise<Expense> {
    // Find local record (search by serverId or local ID)
    const localExpenses = await this.expensesCollection.query(
        Q.or(Q.where('id', id), Q.where('server_id', id))
    ).fetch();
    
    if (localExpenses.length === 0) throw new Error('Expense not found locally');
    const expenseToUpdate = localExpenses[0];

    await database.write(async () => {
      await expenseToUpdate.update(expense => {
        if (payload.amount !== undefined) expense.amount = payload.amount;
        if (payload.category !== undefined) expense.category = payload.category;
        if (payload.description !== undefined) expense.description = payload.description;
        if (payload.spentAt !== undefined) expense.spentAt = new Date(payload.spentAt);
        expense.syncStatus = 'updated';
      });
    });

    if (await this.isOnline() && expenseToUpdate.serverId) {
       try {
         const serverExpense = await expenseRepository.updateExpense(id, payload);
         await database.write(async () => {
             await expenseToUpdate.update(e => e.syncStatus = 'synced');
         });
         return serverExpense;
       } catch (e) { console.log('Update sync failed'); }
    }

    return this.mapToEntity(expenseToUpdate);
  }

  async deleteExpense(id: string): Promise<void> {
    const localExpenses = await this.expensesCollection.query(
        Q.or(Q.where('id', id), Q.where('server_id', id))
    ).fetch();

    if (localExpenses.length === 0) return;
    const expenseToDelete = localExpenses[0];

    await database.write(async () => {
        // Soft delete locally
        await expenseToDelete.update(e => e.syncStatus = 'deleted');
        // Or if it was never synced, hard delete
        if (!expenseToDelete.serverId) {
            await expenseToDelete.destroyPermanently();
        }
    });

    if (await this.isOnline() && expenseToDelete.serverId) {
        try {
            await expenseRepository.deleteExpense(id);
             await database.write(async () => {
                await expenseToDelete.destroyPermanently();
            });
        } catch (e) { console.log('Delete sync failed'); }
    }
  }

  /**
   * Main Sync Logic: Push Local Changes -> Pull Server Changes
   */
  async syncExpenses() {
     if (!(await this.isOnline())) return;

     // 1. PUSH Pending Created
     const pending = await this.expensesCollection.query(Q.where('sync_status', 'pending')).fetch();
     for (const e of pending) {
         try {
             const res = await expenseRepository.createExpense({
                 amount: e.amount,
                 category: e.category,
                 description: e.description,
                 spentAt: e.spentAt.toISOString()
             });
             await database.write(async () => {
                 await e.update(rec => {
                     rec.serverId = res.id;
                     rec.syncStatus = 'synced';
                 });
             });
         } catch(err) { console.error('Sync create failed', err); }
     }

     // 2. PUSH Pending Updates
     // ... (Similar logic for updated/deleted)
     
     // 3. PULL from Server
     try {
         const serverExpenses = await expenseRepository.getExpenses();
         await database.write(async () => {
             for (const remote of serverExpenses) {
                 const local = await this.expensesCollection.query(Q.where('server_id', remote.id)).fetch();
                 if (local.length > 0) {
                     // Update local if different? (Simple override for now)
                     await local[0].update(rec => {
                         rec.amount = remote.amount;
                         rec.category = remote.category;
                         rec.syncStatus = 'synced';
                     });
                 } else {
                     // Create local
                     await this.expensesCollection.create(rec => {
                         rec.serverId = remote.id;
                         rec.amount = remote.amount;
                         rec.category = remote.category;
                         rec.description = remote.description || '';
                         rec.spentAt = new Date(remote.spentAt);
                         rec.syncStatus = 'synced';
                     });
                 }
             }
         });
     } catch (err) { console.error('Pull failed', err); }
  }
}

export const offlineExpenseRepository = new OfflineExpenseRepository();
