import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';
import {
  Budget,
  BudgetWithProgress,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../models/Budget';

class BudgetRepository {
  private apiClient = axiosInstance;

  private unwrapResponse<T>(payload: any): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as T;
    }
    return payload as T;
  }

  /**
   * Get all budgets
   */
  async getBudgets(): Promise<Budget[]> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BUDGETS);
      return this.unwrapResponse<Budget[]>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get single budget by ID
   */
  async getBudgetById(id: string): Promise<Budget> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BUDGET(id));
      return this.unwrapResponse<Budget>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Create new budget
   */
  async createBudget(payload: CreateBudgetRequest): Promise<Budget> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.CREATE_BUDGET,
        payload,
      );
      return this.unwrapResponse<Budget>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update existing budget
   */
  async updateBudget(id: string, payload: UpdateBudgetRequest): Promise<Budget> {
    try {
      const response = await this.apiClient.patch(
        API_ENDPOINTS.UPDATE_BUDGET(id),
        payload,
      );
      return this.unwrapResponse<Budget>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete budget
   */
  async deleteBudget(id: string): Promise<void> {
    try {
      await this.apiClient.delete(API_ENDPOINTS.DELETE_BUDGET(id));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get budget with progress (spending vs limit)
   */
  async getBudgetProgress(id: string): Promise<BudgetWithProgress> {
    try {
      const response = await this.apiClient.get(
        API_ENDPOINTS.GET_BUDGET_PROGRESS(id),
      );
      return this.unwrapResponse<BudgetWithProgress>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all budgets with their progress
   */
  async getAllBudgetsWithProgress(): Promise<BudgetWithProgress[]> {
    try {
      const budgets = await this.getBudgets();
      const budgetsWithProgress = await Promise.all(
        budgets.map(async (budget) => {
          try {
            return await this.getBudgetProgress(budget.id);
          } catch {
            // If progress fails, return budget with default progress
            return {
              ...budget,
              progress: {
                totalSpent: 0,
                remaining: budget.limitAmount,
                percentage: 0,
                status: 'SAFE' as const,
              },
            };
          }
        }),
      );
      return budgetsWithProgress;
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

export const budgetRepository = new BudgetRepository();
