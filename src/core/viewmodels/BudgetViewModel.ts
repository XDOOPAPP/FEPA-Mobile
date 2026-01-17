import { useCallback, useState } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import {
  Budget,
  BudgetWithProgress,
  CreateBudgetRequest,
} from '../models/Budget';
import { budgetRepository } from '../repositories/BudgetRepository';

export interface BudgetViewModelState extends ViewModelState {
  budgets: Budget[];
}

export const useBudgetViewModel = (token: string | null) => {
  const { state, setLoading, setError, setSuccess, clearMessages } =
    useBaseViewModel();
  const [budgetState, setBudgetState] = useState<BudgetViewModelState>({
    ...state,
    budgets: [],
  });

  const syncState = useCallback((updates: Partial<BudgetViewModelState>) => {
    setBudgetState(prev => ({ ...prev, ...updates }));
  }, []);

  const getBudgets = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      if (token) {
        budgetRepository.setAuthToken(token);
      }
      const budgets = await budgetRepository.getBudgets();
      syncState({ budgets });
      return budgets;
    } catch (error: any) {
      setError(error.message || 'Failed to load budgets');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [token, setLoading, setError, clearMessages, syncState]);

  const createBudget = useCallback(
    async (payload: CreateBudgetRequest) => {
      setLoading(true);
      clearMessages();
      try {
        if (token) {
          budgetRepository.setAuthToken(token);
        }
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
    [
      token,
      setLoading,
      setError,
      setSuccess,
      clearMessages,
      budgetState,
      syncState,
    ],
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      setLoading(true);
      clearMessages();
      try {
        if (token) {
          budgetRepository.setAuthToken(token);
        }
        await budgetRepository.deleteBudget(id);
        syncState({
          budgets: budgetState.budgets.filter(item => item.id !== id),
        });
        setSuccess('Xóa ngân sách thành công');
      } catch (error: any) {
        setError(error.message || 'Failed to delete budget');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      token,
      setLoading,
      setError,
      setSuccess,
      clearMessages,
      budgetState,
      syncState,
    ],
  );

  const getBudgetProgress = useCallback(
    async (id: string): Promise<BudgetWithProgress> => {
      setLoading(true);
      clearMessages();
      try {
        if (token) {
          budgetRepository.setAuthToken(token);
        }
        return await budgetRepository.getBudgetProgress(id);
      } catch (error: any) {
        setError(error.message || 'Failed to load budget progress');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [token, setLoading, setError, clearMessages],
  );

  return {
    budgetState,
    getBudgets,
    createBudget,
    deleteBudget,
    getBudgetProgress,
    clearMessages,
  };
};
