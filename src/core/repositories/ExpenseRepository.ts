import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';
import { CreateExpenseRequest, Expense, UpdateExpenseRequest } from '../models/Expense';
import { ExpenseGroupBy, ExpenseSummary } from '../models/ExpenseSummary';

// Filter options for expenses list
export interface ExpenseFilterOptions {
  category?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'spentAt' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Paginated response
export interface PaginatedExpenses {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ExpenseRepository {
  private apiClient = axiosInstance;

  private unwrapResponse<T>(payload: any): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as T;
    }
    return payload as T;
  }

  /**
   * Get all expenses (simple list)
   */
  async getExpenses(): Promise<Expense[]> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_EXPENSES);
      return this.unwrapResponse<Expense[]>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get expenses with filtering and pagination
   */
  async getExpensesFiltered(options?: ExpenseFilterOptions): Promise<PaginatedExpenses> {
    try {
      const params: Record<string, any> = {};
      
      if (options?.category) params.category = options.category;
      if (options?.fromDate) params.from = options.fromDate;
      if (options?.toDate) params.to = options.toDate;
      if (options?.minAmount !== undefined) params.minAmount = options.minAmount;
      if (options?.maxAmount !== undefined) params.maxAmount = options.maxAmount;
      if (options?.search) params.search = options.search;
      if (options?.page) params.page = options.page;
      if (options?.limit) params.limit = options.limit;
      if (options?.sortBy) params.sortBy = options.sortBy;
      if (options?.sortOrder) params.sortOrder = options.sortOrder;

      const response = await this.apiClient.get(API_ENDPOINTS.GET_EXPENSES, { params });
      const responseData = response.data;

      // Handle both paginated and simple array responses
      if (Array.isArray(responseData)) {
        return {
          data: responseData,
          total: responseData.length,
          page: 1,
          limit: responseData.length,
          totalPages: 1,
        };
      }

      if (responseData && 'data' in responseData) {
        return {
          data: responseData.data || [],
          total: responseData.total || responseData.data?.length || 0,
          page: responseData.page || 1,
          limit: responseData.limit || 20,
          totalPages: responseData.totalPages || 1,
        };
      }

      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get single expense by ID
   */
  async getExpenseById(id: string): Promise<Expense> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_EXPENSE(id));
      return this.unwrapResponse<Expense>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Create new expense
   */
  async createExpense(payload: CreateExpenseRequest): Promise<Expense> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.CREATE_EXPENSE,
        payload,
      );
      return this.unwrapResponse<Expense>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update existing expense
   */
  async updateExpense(id: string, payload: UpdateExpenseRequest): Promise<Expense> {
    try {
      const response = await this.apiClient.patch(
        API_ENDPOINTS.UPDATE_EXPENSE(id),
        payload,
      );
      return this.unwrapResponse<Expense>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete expense
   */
  async deleteExpense(id: string): Promise<void> {
    try {
      await this.apiClient.delete(API_ENDPOINTS.DELETE_EXPENSE(id));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get expense summary/statistics
   */
  async getExpenseSummary(params?: {
    from?: string;
    to?: string;
    groupBy?: ExpenseGroupBy;
  }): Promise<ExpenseSummary> {
    try {
      const response = await this.apiClient.get(
        API_ENDPOINTS.GET_EXPENSE_STATS,
        { params },
      );
      return this.unwrapResponse<ExpenseSummary>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Có lỗi xảy ra. Vui lòng thử lại.';
    return new Error(message);
  }
}

export const expenseRepository = new ExpenseRepository();
