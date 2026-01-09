import { useCallback, useState, useEffect } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../models/Budget';
import { budgetRepository } from '../repositories/BudgetRepository';

export interface BudgetViewModelState extends ViewModelState {
  budgets: Budget[];
  selectedBudget: Budget | null;
  totalBudget: number;
  totalSpent: number;
}

export const useBudgetViewModel = (token: string | null) => {
  const { state, setLoading, setError, setSuccess, clearMessages } =
    useBaseViewModel();
  const [budgetState, setBudgetState] = useState<BudgetViewModelState>({
    ...state,
    budgets: [],
    selectedBudget: null,
    totalBudget: 0,
    totalSpent: 0,
  });

  // Set auth token
  useEffect(() => {
    if (token) {
      budgetRepository.setAuthToken(token);
    }
  }, [token]);

  /**
   * Get all budgets for current user
   */
  const getBudgets = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const budgets = await budgetRepository.getBudgets();
      const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

      setBudgetState(prev => ({
        ...prev,
        budgets,
        totalBudget,
      }));
      return budgets;
    } catch (error: any) {
      setError(error.message || 'Lỗi lấy danh sách ngân sách');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages]);

  /**
   * Get budget by ID
   */
  const getBudgetById = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const budget = await budgetRepository.getBudgetById(id);
        setBudgetState(prev => ({
          ...prev,
          selectedBudget: budget,
        }));
        return budget;
      } catch (error: any) {
        setError(error.message || 'Lỗi lấy chi tiết ngân sách');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * Create new budget
   */
  const createBudget = useCallback(
    async (request: CreateBudgetRequest) => {
      setLoading(true);
      clearMessages();
      try {
        const newBudget = await budgetRepository.createBudget(request);
        setBudgetState(prev => ({
          ...prev,
          budgets: [...prev.budgets, newBudget],
          totalBudget: prev.totalBudget + newBudget.limit,
        }));
        setSuccess('Tạo ngân sách thành công');
        return newBudget;
      } catch (error: any) {
        setError(error.message || 'Lỗi tạo ngân sách');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  /**
   * Update budget
   */
  const updateBudget = useCallback(
    async (id: string, request: UpdateBudgetRequest) => {
      setLoading(true);
      clearMessages();
      try {
        const updatedBudget = await budgetRepository.updateBudget(id, request);
        setBudgetState(prev => {
          const oldBudget = prev.budgets.find(b => b.id === id);
          const oldLimit = oldBudget?.limit || 0;
          const newLimit = updatedBudget.limit;
          const limitDiff = newLimit - oldLimit;

          return {
            ...prev,
            budgets: prev.budgets.map(b => (b.id === id ? updatedBudget : b)),
            selectedBudget:
              prev.selectedBudget?.id === id
                ? updatedBudget
                : prev.selectedBudget,
            totalBudget: prev.totalBudget + limitDiff,
          };
        });
        setSuccess('Cập nhật ngân sách thành công');
        return updatedBudget;
      } catch (error: any) {
        setError(error.message || 'Lỗi cập nhật ngân sách');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
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
        setBudgetState(prev => {
          const deletedBudget = prev.budgets.find(b => b.id === id);
          const deletedLimit = deletedBudget?.limit || 0;

          return {
            ...prev,
            budgets: prev.budgets.filter(b => b.id !== id),
            selectedBudget: null,
            totalBudget: prev.totalBudget - deletedLimit,
          };
        });
        setSuccess('Xóa ngân sách thành công');
      } catch (error: any) {
        setError(error.message || 'Lỗi xóa ngân sách');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  return {
    budgetState,
    getBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,
    isLoading: budgetState.isLoading,
    error: budgetState.error,
    success: budgetState.success,
  };
};

export default useBudgetViewModel;
