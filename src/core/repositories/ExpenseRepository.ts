import axiosInstance from '../../api/axiosInstance';
import {
  Expense,
  CreateExpenseRequest,
  ExpenseFilter,
} from '../models/Expense';

class ExpenseRepository {
  setAuthToken(token: string) {
    // Token is automatically added via axiosInstance interceptor from AsyncStorage
  }

  async getExpenses(filter?: ExpenseFilter): Promise<Expense[]> {
    try {
      const response = await axiosInstance.get('/expenses', {
        params: filter,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch expenses' };
    }
  }

  async getExpenseById(id: string): Promise<Expense> {
    try {
      const response = await axiosInstance.get(`/expenses/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch expense' };
    }
  }

  async createExpense(request: CreateExpenseRequest): Promise<Expense> {
    try {
      const response = await axiosInstance.post('/expenses', request);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to create expense' };
    }
  }

  async updateExpense(
    id: string,
    request: Partial<CreateExpenseRequest>,
  ): Promise<Expense> {
    try {
      const response = await axiosInstance.patch(`/expenses/${id}`, request);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to update expense' };
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/expenses/${id}`);
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to delete expense' };
    }
  }

  async getExpenseStats(startDate: string, endDate: string) {
    try {
      const response = await axiosInstance.get('/expenses/stats', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch stats' };
    }
  }
}

export const expenseRepository = new ExpenseRepository();
