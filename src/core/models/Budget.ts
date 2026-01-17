export interface Budget {
  id: string;
  name: string;
  category?: string;
  limitAmount: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetProgress {
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: 'SAFE' | 'EXCEEDED';
}

export type BudgetWithProgress = Budget & {
  progress?: BudgetProgress;
};

export interface CreateBudgetRequest {
  name: string;
  limitAmount: number;
  category?: string;
  startDate?: string;
  endDate?: string;
}
