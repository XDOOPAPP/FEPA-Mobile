import { useAuthViewModel } from '../../core/viewmodels/AuthViewModel';
import { useExpenseViewModel } from '../../core/viewmodels/ExpenseViewModel';

/**
 * Custom hook để sử dụng Auth ViewModel
 * Usage: const { authState, login, register, verifyOtp, resendOtp, logout } = useAuth();
 */
export const useAuth = () => {
  return useAuthViewModel();
};

/**
 * Custom hook để sử dụng Expense ViewModel
 * Usage: const { expenseState, getExpenses, createExpense } = useExpense(token);
 */
export const useExpense = (token: string | null) => {
  return useExpenseViewModel(token);
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
