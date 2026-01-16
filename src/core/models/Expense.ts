export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ENTERTAINMENT = 'entertainment',
  UTILITIES = 'utilities',
  HEALTH = 'health',
  SHOPPING = 'shopping',
  OTHER = 'other',
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
  receipt?: string;
}

export interface ExpenseFilter {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  minAmount?: number;
  maxAmount?: number;
}
