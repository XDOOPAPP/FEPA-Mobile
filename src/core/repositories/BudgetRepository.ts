import axios from 'axios';
import {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../models/Budget';
import { API_BASE_URL } from '../../constants/api';

class BudgetRepository {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
  });

  /**
   * Set authorization token for API requests
   */
  setAuthToken(token: string) {
    this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Get all budgets for current user
   */
  async getBudgets(): Promise<Budget[]> {
    try {
      const response = await this.apiClient.get('/budgets');
      return response.data || [];
    } catch (error: any) {
      throw error.response?.data || { message: 'Lỗi lấy danh sách ngân sách' };
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(id: string): Promise<Budget> {
    try {
      const response = await this.apiClient.get(`/budgets/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Lỗi lấy chi tiết ngân sách' };
    }
  }

  /**
   * Create new budget
   */
  async createBudget(request: CreateBudgetRequest): Promise<Budget> {
    try {
      const response = await this.apiClient.post('/budgets', request);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Lỗi tạo ngân sách' };
    }
  }

  /**
   * Update budget
   */
  async updateBudget(
    id: string,
    request: UpdateBudgetRequest,
  ): Promise<Budget> {
    try {
      const response = await this.apiClient.put(`/budgets/${id}`, request);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Lỗi cập nhật ngân sách' };
    }
  }

  /**
   * Delete budget
   */
  async deleteBudget(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`/budgets/${id}`);
    } catch (error: any) {
      throw error.response?.data || { message: 'Lỗi xóa ngân sách' };
    }
  }
}

export const budgetRepository = new BudgetRepository();
