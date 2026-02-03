import { useAuthViewModel } from '../../core/viewmodels/AuthViewModel';
import { useExpenseViewModel } from '../../core/viewmodels/ExpenseViewModel';
import { useBudgetViewModel } from '../../core/viewmodels/BudgetViewModel';
import { useOcrViewModel } from '../../core/viewmodels/OcrViewModel';
import { useSubscriptionViewModel } from '../../core/viewmodels/SubscriptionViewModel';
import { useBlogViewModel } from '../../core/viewmodels/BlogViewModel';
import { useAI as useAIHook } from './useAI';

// Re-export types for convenience
export type { ExpenseFilterOptions, PaginatedExpenses } from '../../core/repositories/ExpenseRepository';

/**
 * Custom hook để sử dụng Auth ViewModel
 * Usage: const { authState, login, register, verifyOtp, resendOtp, logout } = useAuth();
 */
export const useAuth = () => {
  return useAuthViewModel();
};

/**
 * Custom hook để sử dụng Expense ViewModel
 * Usage: 
 *   const { 
 *     expenseState, 
 *     getExpenses, 
 *     getExpensesFiltered,
 *     getExpenseById,
 *     createExpense, 
 *     updateExpense,
 *     deleteExpense,
 *     loadMoreExpenses,
 *     setFilters,
 *     getExpenseSummary 
 *   } = useExpense(token);
 */
export const useExpense = (token: string | null) => {
  return useExpenseViewModel(token);
};

/**
 * Custom hook để sử dụng Budget ViewModel
 * Usage: 
 *   const { 
 *     budgetState, 
 *     getBudgets, 
 *     getAllBudgetsWithProgress,
 *     getBudgetById,
 *     createBudget, 
 *     updateBudget,
 *     deleteBudget,
 *     getBudgetProgress,
 *     getAlerts 
 *   } = useBudget(token);
 */
export const useBudget = (token: string | null) => {
  return useBudgetViewModel(token);
};

/**
 * Custom hook để sử dụng Subscription ViewModel
 */
export const useSubscription = () => {
  return useSubscriptionViewModel();
};

/**
 * Custom hook để sử dụng Blog ViewModel
 */
export const useBlog = () => {
  return useBlogViewModel();
};

/**
 * Custom hook để sử dụng OCR ViewModel
 * Usage: const { scanInvoice, getJob, ocrState } = useOcr(token);
 */
export const useOcr = (token: string | null) => {
  return useOcrViewModel();
};

/**
 * Custom hook để handle API errors
 */
export const useApiError = (error: any) => {
  if (!error) return null;

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  return 'An error occurred';
};

export const useAI = (token: string | null) => {
  return useAIHook(token);
};
