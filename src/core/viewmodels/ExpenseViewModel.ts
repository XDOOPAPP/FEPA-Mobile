import { useCallback, useState, useEffect } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import {
  Expense,
  CreateExpenseRequest,
  ExpenseFilter,
} from '../models/Expense';
import { expenseRepository } from '../repositories/ExpenseRepository';

export interface ExpenseViewModelState extends ViewModelState {
  expenses: Expense[];
  selectedExpense: Expense | null;
  total: number;
  stats?: any;
}

export const useExpenseViewModel = (token: string | null) => {
  const { state, setLoading, setError, setSuccess, clearMessages } =
    useBaseViewModel();
  const [expenseState, setExpenseState] = useState<ExpenseViewModelState>({
    ...state,
    expenses: [],
    selectedExpense: null,
    total: 0,
  });

  // Set auth token
  useEffect(() => {
    if (token) {
      expenseRepository.setAuthToken(token);
    }
  }, [token]);

  // Get Expenses
  const getExpenses = useCallback(
    async (filter?: ExpenseFilter) => {
      setLoading(true);
      clearMessages();
      try {
        const expenses = await expenseRepository.getExpenses(filter);
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        setExpenseState(prev => ({
          ...prev,
          expenses,
          total,
        }));
        return expenses;
      } catch (error: any) {
        setError(error.message || 'Failed to fetch expenses');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearMessages],
  );

  // Get Expense By ID
  const getExpenseById = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const expense = await expenseRepository.getExpenseById(id);
        setExpenseState(prev => ({
          ...prev,
          selectedExpense: expense,
        }));
        return expense;
      } catch (error: any) {
        setError(error.message || 'Failed to fetch expense');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  // Create Expense
  const createExpense = useCallback(
    async (request: CreateExpenseRequest) => {
      setLoading(true);
      clearMessages();
      try {
        const newExpense = await expenseRepository.createExpense(request);
        setExpenseState(prev => ({
          ...prev,
          expenses: [newExpense, ...prev.expenses],
          total: prev.total + newExpense.amount,
        }));
        setSuccess('Expense created successfully');
        return newExpense;
      } catch (error: any) {
        setError(error.message || 'Failed to create expense');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Update Expense
  const updateExpense = useCallback(
    async (id: string, request: Partial<CreateExpenseRequest>) => {
      setLoading(true);
      clearMessages();
      try {
        const updatedExpense = await expenseRepository.updateExpense(
          id,
          request,
        );
        setExpenseState(prev => ({
          ...prev,
          expenses: prev.expenses.map(exp =>
            exp.id === id ? updatedExpense : exp,
          ),
          selectedExpense:
            prev.selectedExpense?.id === id
              ? updatedExpense
              : prev.selectedExpense,
        }));
        setSuccess('Expense updated successfully');
        return updatedExpense;
      } catch (error: any) {
        setError(error.message || 'Failed to update expense');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  // Delete Expense
  const deleteExpense = useCallback(
    async (id: string) => {
      setLoading(true);
      clearMessages();
      try {
        const expenseToDelete = expenseState.expenses.find(
          exp => exp.id === id,
        );
        await expenseRepository.deleteExpense(id);

        setExpenseState(prev => ({
          ...prev,
          expenses: prev.expenses.filter(exp => exp.id !== id),
          total: prev.total - (expenseToDelete?.amount || 0),
        }));
        setSuccess('Expense deleted successfully');
      } catch (error: any) {
        setError(error.message || 'Failed to delete expense');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages, expenseState.expenses],
  );

  // Get Stats
  const getStats = useCallback(
    async (startDate: string, endDate: string) => {
      setLoading(true);
      try {
        const stats = await expenseRepository.getExpenseStats(
          startDate,
          endDate,
        );
        setExpenseState(prev => ({
          ...prev,
          stats,
        }));
        return stats;
      } catch (error: any) {
        setError(error.message || 'Failed to fetch stats');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  return {
    expenseState,
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getStats,
    clearMessages,
  };
};
