export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetRequest {
  category: string;
  limit: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
}

export interface UpdateBudgetRequest {
  limit?: number;
  period?: 'monthly' | 'yearly';
  endDate?: string;
}

export interface BudgetStatus {
  budget: Budget;
  percentageUsed: number;
  remaining: number;
  isExceeded: boolean;
}
