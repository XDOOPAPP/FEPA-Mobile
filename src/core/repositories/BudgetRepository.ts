import axiosInstance from '../../api/axiosInstance';
import {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../models/Budget';

class BudgetRepository {
  /**
   * Set authorization token for API requests
   * Note: axiosInstance handles token setup via request interceptor from AsyncStorage
   */
  setAuthToken(token: string) {
    // Token is automatically added via axiosInstance interceptor from AsyncStorage
  }

  /**
   * Get all budgets for current user
   */
  async getBudgets(): Promise<Budget[]> {
    try {
      const response = await axiosInstance.get('/budgets');
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
      const response = await axiosInstance.get(`/budgets/${id}`);
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
      const response = await axiosInstance.post('/budgets', request);
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
      const response = await axiosInstance.put(`/budgets/${id}`, request);
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
      await axiosInstance.delete(`/budgets/${id}`);
    } catch (error: any) {
      throw error.response?.data || { message: 'Lỗi xóa ngân sách' };
    }
  }
}

export const budgetRepository = new BudgetRepository();
