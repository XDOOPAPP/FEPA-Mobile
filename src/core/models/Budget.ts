export interface Budget {
  id: string;
  userId?: string;
  name: string;
  category?: string;
  limitAmount: number;
  currentSpent?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  progress?: {
    totalSpent: number;
    remaining: number;
    percentage: number;
    status: 'SAFE' | 'WARNING' | 'EXCEEDED';
    daysRemaining?: number;
    dailyAvgSpent?: number;
    projectedOverspend?: number;
  };
}

export interface BudgetProgress {
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'EXCEEDED';
  daysRemaining?: number;
  dailyAvgSpent?: number;
  projectedOverspend?: number;
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

export interface UpdateBudgetRequest {
  name?: string;
  limitAmount?: number;
  category?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

