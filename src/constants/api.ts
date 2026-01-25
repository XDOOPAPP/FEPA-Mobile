// API Configuration
// 10.0.2.2 là IP của host máy từ Android emulator
// ⚠️ NOTE: Api-gateway sử dụng /api/v1/ prefix, không phải /api/
// export const API_BASE_URL = 'http://10.0.2.2:3000/api/v1'; // Emulator
export const API_BASE_URL = 'http://192.168.1.98:3000/api/v1'; // Physical Device (LAN IP)

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SOCIAL_LOGIN: '/auth/social-login',
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/verify-otp',
  RESEND_OTP: '/auth/resend-otp',
  TWO_FA_REQUEST: '/auth/2fa/request',
  TWO_FA_CONFIRM: '/auth/2fa/confirm',
  TWO_FA_LOGIN_VERIFY: '/auth/2fa/login/verify',
  TWO_FA_LOGIN_RESEND: '/auth/2fa/login/resend',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  GET_PROFILE: '/auth/me',
  UPDATE_PROFILE: '/auth/profile',

  // Expenses
  GET_EXPENSES: '/expenses',
  GET_EXPENSE: (id: string) => `/expenses/${id}`,
  CREATE_EXPENSE: '/expenses',
  UPDATE_EXPENSE: (id: string) => `/expenses/${id}`,
  DELETE_EXPENSE: (id: string) => `/expenses/${id}`,
  GET_EXPENSE_STATS: '/expenses/summary',
  GET_EXPENSE_EXPORT: '/expenses/export',

  // OCR
  OCR_SCAN: '/ocr/scan',
  OCR_JOBS: '/ocr/jobs',
  OCR_JOB: (id: string) => `/ocr/jobs/${id}`,

  // Budgets
  GET_BUDGETS: '/budgets',
  GET_BUDGET: (id: string) => `/budgets/${id}`,
  CREATE_BUDGET: '/budgets',
  UPDATE_BUDGET: (id: string) => `/budgets/${id}`,
  DELETE_BUDGET: (id: string) => `/budgets/${id}`,
  GET_BUDGET_PROGRESS: (id: string) => `/budgets/${id}/progress`,

  // Subscriptions
  SUBSCRIPTION_PLANS: '/subscriptions/plans',
  SUBSCRIPTION_CURRENT: '/subscriptions/current',
  SUBSCRIPTION_SUBSCRIBE: '/subscriptions',
  SUBSCRIPTION_CANCEL: '/subscriptions/cancel',
  SUBSCRIPTION_HISTORY: '/subscriptions/history',

  // Payments
  PAYMENT_CREATE: '/payments',
  PAYMENT_STATUS: (ref: string) => `/payments/${ref}`,

  // AI
  AI_CATEGORIZE: '/ai/categorize',
  AI_PREDICT_SPENDING: '/ai/predict-spending',
  AI_ANOMALIES: '/ai/anomalies',
  AI_BUDGET_ALERTS: '/ai/budget-alerts',
  AI_ASSISTANT_CHAT: '/ai/assistant/chat',
  AI_INSIGHTS: '/ai/insights',

  // Blogs
  GET_BLOGS: '/blogs',
  GET_BLOG_SLUG: (slug: string) => `/blogs/slug/${slug}`,
  GET_BLOG_ID: (id: string) => `/blogs/${id}`,

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_READ: (id: string) => `/notifications/${id}/read`,
  NOTIFICATION_READ_ALL: '/notifications/read-all',
  NOTIFICATION_UNREAD_COUNT: '/notifications/unread-count',
};

// Request timeout (ms)
export const API_TIMEOUT = 30000;
