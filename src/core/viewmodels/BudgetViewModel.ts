import { useCallback, useState } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import {
  Budget,
  BudgetWithProgress,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../models/Budget';
import { budgetRepository } from '../repositories/BudgetRepository';

export interface BudgetViewModelState extends ViewModelState {
  budgets: Budget[];
  budgetsWithProgress: BudgetWithProgress[];
  currentBudget: BudgetWithProgress | null;
}

export const useBudgetViewModel = (token: string | null) => {
  const { state, setLoading, setError, setSuccess, clearMessages } =
    useBaseViewModel();
  const [budgetState, setBudgetState] = useState<BudgetViewModelState>({
    ...state,
    budgets: [],
    budgetsWithProgress: [],
    currentBudget: null,
  });

  const syncState = useCallback((updates: Partial<BudgetViewModelState>) => {
    setBudgetState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Get all budgets (simple list)
   */
  const getBudgets = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const budgets = await budgetRepository.getBudgets();
      syncState({ budgets });
      return budgets;
    } catch (error: any) {
      setError(error.message || 'Failed to load budgets');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  /**
   * Get all budgets with their spending progress
   */
  const getAllBudgetsWithProgress = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const budgetsWithProgress = await budgetRepository.getAllBudgetsWithProgress();
      syncState({ 
        budgetsWithProgress,
        budgets: budgetsWithProgress,
      });
      return budgetsWithProgress;
    } catch (error: any) {
      setError(error.message || 'Failed to load budgets');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  /**
   * Get single budget by ID
   */
  const getBudgetById = useCallback(
    async (id: string): Promise<Budget> => {
      setLoading(true);
      clearMessages();
      try {
        const budget = await budgetRepository.getBudgetById(id);
        return budget;
      } catch (error: any) {
        setError(error.message || 'Failed to load budget');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearMessages],
  );

  /**
   * Create new budget
   */
  const createBudget = useCallback(
    async (payload: CreateBudgetRequest) => {
      setLoading(true);
      clearMessages();
      try {
        const created = await budgetRepository.createBudget(payload);
        syncState({ budgets: [created, ...budgetState.budgets] });
        setSuccess('Tạo ngân sách thành công');
        return created;
      } catch (error: any) {
        setError(error.message || 'Failed to create budget');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages, budgetState, syncState],
  );

  /**
   * Update existing budget
   */
  const updateBudget = useCallback(
    async (id: string, payload: UpdateBudgetRequest): Promise<Budget> => {
      setLoading(true);
      clearMessages();
      try {
        const updated = await budgetRepository.updateBudget(id, payload);
        syncState({
          budgets: budgetState.budgets.map(item =>
            item.id === id ? updated : item,
          ),
          budgetsWithProgress: budgetState.budgetsWithProgress.map(item =>
            item.id === id ? { ...item, ...updated } : item,
          ),
        });
        setSuccess('Cập nhật ngân sách thành công');
        return updated;
      } catch (error: any) {
        setError(error.message || 'Failed to update budget');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages, budgetState, syncState],
  );

  /**
   * Delete budget
   */
  const deleteBudget = useCallback(
    async (id: string) => {
      setLoading(true);
      clearMessages();
      try {
        await budgetRepository.deleteBudget(id);
        syncState({
          budgets: budgetState.budgets.filter(item => item.id !== id),
          budgetsWithProgress: budgetState.budgetsWithProgress.filter(item => item.id !== id),
          currentBudget: budgetState.currentBudget?.id === id ? null : budgetState.currentBudget,
        });
        setSuccess('Xóa ngân sách thành công');
      } catch (error: any) {
        setError(error.message || 'Failed to delete budget');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages, budgetState, syncState],
  );

  /**
   * Get budget progress (single budget with spending info)
   */
  const getBudgetProgress = useCallback(
    async (id: string): Promise<BudgetWithProgress> => {
      setLoading(true);
      clearMessages();
      try {
        const budgetWithProgress = await budgetRepository.getBudgetProgress(id);
        syncState({ currentBudget: budgetWithProgress });
        return budgetWithProgress;
      } catch (error: any) {
        setError(error.message || 'Failed to load budget progress');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearMessages, syncState],
  );

  /**
   * Check if any budget is exceeded or near limit
   */
  const getAlerts = useCallback(() => {
    return budgetState.budgetsWithProgress.filter(
      b => b.progress && (b.progress.status === 'EXCEEDED' || b.progress.status === 'WARNING'),
    );
  }, [budgetState.budgetsWithProgress]);

  /**
   * Clear current budget
   */
  const clearCurrentBudget = useCallback(() => {
    syncState({ currentBudget: null });
  }, [syncState]);

  return {
    budgetState,
    getBudgets,
    getAllBudgetsWithProgress,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,
    getAlerts,
    getBudgetProgress,
    clearCurrentBudget,
    clearMessages,
  };
};
