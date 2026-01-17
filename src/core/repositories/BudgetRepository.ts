import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import {
  Budget,
  BudgetWithProgress,
  CreateBudgetRequest,
} from '../models/Budget';

class BudgetRepository {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });

  private unwrapResponse<T>(payload: any): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as T;
    }
    return payload as T;
  }

  setAuthToken(token: string) {
    this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.apiClient.defaults.headers.common['Authorization'];
  }

  async getBudgets(): Promise<Budget[]> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.GET_BUDGETS);
      return this.unwrapResponse<Budget[]>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

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

  async deleteBudget(id: string): Promise<void> {
    try {
      await this.apiClient.delete(API_ENDPOINTS.DELETE_BUDGET(id));
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

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

  private handleError(error: any): Error {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Có lỗi xảy ra. Vui lòng thử lại.';
    return new Error(message);
  }
}

export const budgetRepository = new BudgetRepository();
