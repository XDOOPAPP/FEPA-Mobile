// Expense categories
export type ExpenseCategory = 
  | 'food'
  | 'transport'
  | 'shopping'
  | 'utilities'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'other';

export interface Expense {
  id: string;
  userId?: string;
  amount: number;
  description: string;
  category?: ExpenseCategory | string;
  spentAt: string;
  receiptUrl?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  category?: ExpenseCategory | string;
  spentAt: string;
  receiptUrl?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateExpenseRequest {
  amount?: number;
  description?: string;
  category?: ExpenseCategory | string;
  spentAt?: string;
  receiptUrl?: string;
  notes?: string;
  tags?: string[];
}

