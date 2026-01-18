import { useCallback, useState } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import { CreateExpenseRequest, Expense, UpdateExpenseRequest } from '../models/Expense';
import { ExpenseGroupBy, ExpenseSummary } from '../models/ExpenseSummary';
import { 
  expenseRepository, 
  ExpenseFilterOptions, 
  PaginatedExpenses 
} from '../repositories/ExpenseRepository';

export interface ExpenseViewModelState extends ViewModelState {
  expenses: Expense[];
  currentExpense: Expense | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ExpenseFilterOptions;
}

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export const useExpenseViewModel = (token: string | null) => {
  const { state, setLoading, setError, setSuccess, clearMessages } =
    useBaseViewModel();
  const [expenseState, setExpenseState] = useState<ExpenseViewModelState>({
    ...state,
    expenses: [],
    currentExpense: null,
    pagination: defaultPagination,
    filters: {},
  });

  const syncState = useCallback((updates: Partial<ExpenseViewModelState>) => {
    setExpenseState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Get all expenses (simple list)
   */
  const getExpenses = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const expenses = await expenseRepository.getExpenses();
      syncState({ expenses });
      return expenses;
    } catch (error: any) {
      setError(error.message || 'Failed to load expenses');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  /**
   * Get expenses with filtering and pagination
   */
  const getExpensesFiltered = useCallback(
    async (options?: ExpenseFilterOptions): Promise<PaginatedExpenses> => {
      setLoading(true);
      clearMessages();
      try {
        const result = await expenseRepository.getExpensesFiltered(options);
        syncState({
          expenses: result.data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
          filters: options || {},
        });
        return result;
      } catch (error: any) {
        setError(error.message || 'Failed to load expenses');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearMessages, syncState],
  );

  /**
   * Load more expenses (next page)
   */
  const loadMoreExpenses = useCallback(async () => {
    if (expenseState.pagination.page >= expenseState.pagination.totalPages) {
      return; // No more pages
    }

    const nextPage = expenseState.pagination.page + 1;
    setLoading(true);
    try {
      const result = await expenseRepository.getExpensesFiltered({
        ...expenseState.filters,
        page: nextPage,
      });
      syncState({
        expenses: [...expenseState.expenses, ...result.data],
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
      return result;
    } catch (error: any) {
      setError(error.message || 'Failed to load more expenses');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [expenseState, setLoading, setError, syncState]);

  /**
   * Get single expense by ID
   */
  const getExpenseById = useCallback(
    async (id: string): Promise<Expense> => {
      setLoading(true);
      clearMessages();
      try {
        const expense = await expenseRepository.getExpenseById(id);
        syncState({ currentExpense: expense });
        return expense;
      } catch (error: any) {
        setError(error.message || 'Failed to load expense');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearMessages, syncState],
  );

  /**
   * Create new expense
   */
  const createExpense = useCallback(
    async (payload: CreateExpenseRequest) => {
      setLoading(true);
      clearMessages();
      try {
        const created = await expenseRepository.createExpense(payload);
        syncState({ 
          expenses: [created, ...expenseState.expenses],
          pagination: {
            ...expenseState.pagination,
            total: expenseState.pagination.total + 1,
          },
        });
        setSuccess('Tạo chi tiêu thành công');
        return created;
      } catch (error: any) {
        setError(error.message || 'Failed to create expense');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages, expenseState, syncState],
  );

  /**
   * Update existing expense
   */
  const updateExpense = useCallback(
    async (id: string, payload: UpdateExpenseRequest): Promise<Expense> => {
      setLoading(true);
      clearMessages();
      try {
        const updated = await expenseRepository.updateExpense(id, payload);
        syncState({
          expenses: expenseState.expenses.map(item =>
            item.id === id ? updated : item,
          ),
          currentExpense: updated,
        });
        setSuccess('Cập nhật chi tiêu thành công');
        return updated;
      } catch (error: any) {
        setError(error.message || 'Failed to update expense');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages, expenseState, syncState],
  );

  /**
   * Delete expense
   */
  const deleteExpense = useCallback(
    async (id: string) => {
      setLoading(true);
      clearMessages();
      try {
        await expenseRepository.deleteExpense(id);
        syncState({
          expenses: expenseState.expenses.filter(item => item.id !== id),
          currentExpense: expenseState.currentExpense?.id === id ? null : expenseState.currentExpense,
          pagination: {
            ...expenseState.pagination,
            total: Math.max(0, expenseState.pagination.total - 1),
          },
        });
        setSuccess('Xóa chi tiêu thành công');
      } catch (error: any) {
        setError(error.message || 'Failed to delete expense');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages, expenseState, syncState],
  );

  /**
   * Get expense summary/statistics
   */
  const getExpenseSummary = useCallback(
    async (params?: {
      from?: string;
      to?: string;
      groupBy?: ExpenseGroupBy;
    }): Promise<ExpenseSummary> => {
      setLoading(true);
      clearMessages();
      try {
        return await expenseRepository.getExpenseSummary(params);
      } catch (error: any) {
        setError(error.message || 'Failed to load expense summary');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, clearMessages],
  );

  /**
   * Update filters and refresh list
   */
  const setFilters = useCallback(
    async (newFilters: ExpenseFilterOptions) => {
      return getExpensesFiltered({ ...newFilters, page: 1 });
    },
    [getExpensesFiltered],
  );

  /**
   * Clear current expense
   */
  const clearCurrentExpense = useCallback(() => {
    syncState({ currentExpense: null });
  }, [syncState]);

  return {
    expenseState,
    getExpenses,
    getExpensesFiltered,
    loadMoreExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
    setFilters,
    clearCurrentExpense,
    clearMessages,
  };
};
