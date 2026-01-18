export type ExpenseGroupBy = 'day' | 'week' | 'month' | 'year';

export interface ExpenseSummaryCategory {
  category: string;
  total: number;
  count: number;
}

export interface ExpenseSummaryPeriod {
  period: string;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  total: number;
  count: number;
  byCategory: ExpenseSummaryCategory[];
  byTimePeriod?: ExpenseSummaryPeriod[];
}
