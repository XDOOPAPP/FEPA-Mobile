import axios from 'axios';
import {
  Expense,
  CreateExpenseRequest,
  ExpenseFilter,
} from '../models/Expense';
import { API_BASE_URL } from '../../constants/api';

class ExpenseRepository {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
  });

  setAuthToken(token: string) {
    this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getExpenses(filter?: ExpenseFilter): Promise<Expense[]> {
    try {
      const response = await this.apiClient.get('/expenses', {
        params: filter,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch expenses' };
    }
  }

  async getExpenseById(id: string): Promise<Expense> {
    try {
      const response = await this.apiClient.get(`/expenses/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch expense' };
    }
  }

  async createExpense(request: CreateExpenseRequest): Promise<Expense> {
    try {
      const response = await this.apiClient.post('/expenses', request);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to create expense' };
    }
  }

  async updateExpense(
    id: string,
    request: Partial<CreateExpenseRequest>,
  ): Promise<Expense> {
    try {
      const response = await this.apiClient.put(`/expenses/${id}`, request);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to update expense' };
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`/expenses/${id}`);
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to delete expense' };
    }
  }

  async getExpenseStats(startDate: string, endDate: string) {
    try {
      const response = await this.apiClient.get('/expenses/stats', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Failed to fetch stats' };
    }
  }
}

export const expenseRepository = new ExpenseRepository();
