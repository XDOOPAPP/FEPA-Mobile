// API Configuration
// 10.0.2.2 là IP của host máy từ Android emulator
// ⚠️ NOTE: Api-gateway sử dụng /api/v1/ prefix, không phải /api/
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://10.0.2.2:3000/api/v1';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  LOGOUT: '/auth/logout',
  GET_PROFILE: '/auth/me',
  UPDATE_PROFILE: '/auth/profile',

  // Expenses
  GET_EXPENSES: '/expenses',
  GET_EXPENSE: (id: string) => `/expenses/${id}`,
  CREATE_EXPENSE: '/expenses',
  UPDATE_EXPENSE: (id: string) => `/expenses/${id}`,
  DELETE_EXPENSE: (id: string) => `/expenses/${id}`,
  GET_EXPENSE_STATS: '/expenses/stats',

  // Budgets
  GET_BUDGETS: '/budgets',
  GET_BUDGET: (id: string) => `/budgets/${id}`,
  CREATE_BUDGET: '/budgets',
  UPDATE_BUDGET: (id: string) => `/budgets/${id}`,
  DELETE_BUDGET: (id: string) => `/budgets/${id}`,
};

// Request timeout (ms)
export const API_TIMEOUT = 30000;
