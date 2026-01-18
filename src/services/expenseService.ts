/**
 * Expense Service (used by OCR sync)
 */

import axiosInstance from '../api/axiosInstance';
import { StoredOCRScan } from '../utils/ocrStorage';

export interface CreateExpensePayload {
  amount: number;
  category?: string;
  description?: string;
  spentAt: string;
}

export interface Expense extends CreateExpensePayload {
  id: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

class ExpenseService {
  private readonly API_BASE = '/expenses';

  async createExpense(payload: CreateExpensePayload): Promise<Expense> {
    const response = await axiosInstance.post<Expense>(this.API_BASE, payload, {
      timeout: 10000,
    });
    return response.data;
  }

  async createExpenseFromOCR(ocrScan: StoredOCRScan): Promise<Expense> {
    const payload: CreateExpensePayload = {
      amount: ocrScan.amount,
      category: ocrScan.category,
      description: ocrScan.description,
      spentAt: ocrScan.date,
    };

    return this.createExpense(payload);
  }
}

const expenseService = new ExpenseService();
export default expenseService;
