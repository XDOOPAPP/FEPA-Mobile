export type ExpenseCategory = 'food' | 'transport' | 'entertainment' | 'utilities' | 'health' | 'shopping' | 'other';

export const EXPENSE_CATEGORIES: { label: string; value: ExpenseCategory }[] = [
  { label: '🍔 Ăn uống', value: 'food' },
  { label: '🚗 Giao thông', value: 'transport' },
  { label: '🏠 Nhà cửa', value: 'utilities' },
  { label: '🎓 Giáo dục', value: 'other' },
  { label: '👗 Quần áo', value: 'shopping' },
  { label: '💊 Sức khỏe', value: 'health' },
  { label: '🎮 Giải trí', value: 'entertainment' },
];

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
