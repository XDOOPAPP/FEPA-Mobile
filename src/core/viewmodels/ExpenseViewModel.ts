import { useCallback, useState } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import { CreateExpenseRequest, Expense } from '../models/Expense';
import { ExpenseGroupBy, ExpenseSummary } from '../models/ExpenseSummary';
import { expenseRepository } from '../repositories/ExpenseRepository';

export interface ExpenseViewModelState extends ViewModelState {
  expenses: Expense[];
}

export const useExpenseViewModel = (token: string | null) => {
  const { state, setLoading, setError, setSuccess, clearMessages } =
    useBaseViewModel();
  const [expenseState, setExpenseState] = useState<ExpenseViewModelState>({
    ...state,
    expenses: [],
  });

  const syncState = useCallback((updates: Partial<ExpenseViewModelState>) => {
    setExpenseState(prev => ({ ...prev, ...updates }));
  }, []);

  const getExpenses = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      if (token) {
        expenseRepository.setAuthToken(token);
      }
      const expenses = await expenseRepository.getExpenses();
      syncState({ expenses });
      return expenses;
    } catch (error: any) {
      setError(error.message || 'Failed to load expenses');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [token, setLoading, setError, clearMessages, syncState]);

  const createExpense = useCallback(
    async (payload: CreateExpenseRequest) => {
      setLoading(true);
      clearMessages();
      try {
        if (token) {
          expenseRepository.setAuthToken(token);
        }
        const created = await expenseRepository.createExpense(payload);
        syncState({ expenses: [created, ...expenseState.expenses] });
        setSuccess('Tạo chi tiêu thành công');
        return created;
      } catch (error: any) {
        setError(error.message || 'Failed to create expense');
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
      expenseState,
      syncState,
    ],
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      setLoading(true);
      clearMessages();
      try {
        if (token) {
          expenseRepository.setAuthToken(token);
        }
        await expenseRepository.deleteExpense(id);
        syncState({
          expenses: expenseState.expenses.filter(item => item.id !== id),
        });
        setSuccess('Xóa chi tiêu thành công');
      } catch (error: any) {
        setError(error.message || 'Failed to delete expense');
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
      expenseState,
      syncState,
    ],
  );

  const getExpenseSummary = useCallback(
    async (params?: {
      from?: string;
      to?: string;
      groupBy?: ExpenseGroupBy;
    }): Promise<ExpenseSummary> => {
      setLoading(true);
      clearMessages();
      try {
        if (token) {
          expenseRepository.setAuthToken(token);
        }
        return await expenseRepository.getExpenseSummary(params);
      } catch (error: any) {
        setError(error.message || 'Failed to load expense summary');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [token, setLoading, setError, clearMessages],
  );

  return {
    expenseState,
    getExpenses,
    createExpense,
    deleteExpense,
    getExpenseSummary,
    clearMessages,
  };
};
