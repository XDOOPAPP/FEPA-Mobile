export interface Expense {
  id: string;
  amount: number;
  description: string;
  category?: string;
  spentAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  category?: string;
  spentAt: string;
}
