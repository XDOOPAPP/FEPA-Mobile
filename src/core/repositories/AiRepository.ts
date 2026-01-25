import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';

export interface CategorizeExpenseRequest {
  description: string;
  amount: number;
  spentAt?: string;
  merchantName?: string;
}

export interface CategorizeExpenseResult {
  category: string;
  confidence: number;
  suggestedCategories: Array<{ category: string; confidence: number }>;
}

export interface AssistantChatRequest {
  message: string;
  context?: string;
}

export interface AssistantChatResult {
  reply: string;
  conversationId?: string;
  sources?: Array<{ title: string; url: string }>;
}

export interface BudgetAlertRequest {
  month: string; // YYYY-MM
  categories?: string[];
}

export interface BudgetAlertResult {
  alerts: Array<{
    category: string;
    budget: number;
    spent: number;
    alertLevel: 'warning' | 'danger';
    message: string;
  }>;
}

export interface AnomalyDetectionRequest {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  categories?: string[];
}

export interface AnomalyDetectionResult {
  anomalies: Array<{
    date: string;
    category: string;
    amount: number;
    expected: number;
    score: number;
    description?: string;
  }>;
}

export interface PredictSpendingRequest {
  month: string; // YYYY-MM
  categories?: string[];
}

export interface PredictSpendingResult {
  predictions: Array<{
    category: string;
    amount: number;
    confidence: number;
  }>;
}

class AiRepository {
  private apiClient = axiosInstance;

  async categorizeExpense(
    payload: CategorizeExpenseRequest,
  ): Promise<CategorizeExpenseResult> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.AI_CATEGORIZE,
        payload,
      );
      if (response.data && response.data.data) {
        return response.data.data as CategorizeExpenseResult;
      }
      throw new Error('Không nhận được kết quả từ AI');
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Có lỗi AI';
      throw new Error(message);
    }
  }

  async assistantChat(
    payload: AssistantChatRequest,
  ): Promise<AssistantChatResult> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.AI_ASSISTANT_CHAT,
        payload,
      );
      if (response.data && response.data.data) {
        const rawData = response.data.data;
        return {
          reply: rawData.response || rawData.reply || '',
          conversationId: rawData.conversationId,
          sources: rawData.sources
        };
      }
      throw new Error('Không nhận được phản hồi từ AI assistant');
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Có lỗi AI';
      throw new Error(message);
    }
  }

  async getBudgetAlerts(
    payload: BudgetAlertRequest,
  ): Promise<BudgetAlertResult> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.AI_BUDGET_ALERTS,
        payload,
      );
      if (response.data && response.data.data) {
        return response.data.data as BudgetAlertResult;
      }
      throw new Error('Không nhận được cảnh báo ngân sách từ AI');
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Có lỗi AI';
      throw new Error(message);
    }
  }

  async detectAnomalies(
    payload: AnomalyDetectionRequest,
  ): Promise<AnomalyDetectionResult> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.AI_ANOMALIES,
        payload,
      );
      if (response.data && response.data.data) {
        return response.data.data as AnomalyDetectionResult;
      }
      throw new Error('Không nhận được kết quả bất thường từ AI');
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Có lỗi AI';
      throw new Error(message);
    }
  }

  async predictSpending(
    payload: PredictSpendingRequest,
  ): Promise<PredictSpendingResult> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.AI_PREDICT_SPENDING,
        payload,
      );
      if (response.data && response.data.data) {
        return response.data.data as PredictSpendingResult;
      }
      throw new Error('Không nhận được kết quả dự đoán từ AI');
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Có lỗi AI';
      throw new Error(message);
    }
  }
}

export const aiRepository = new AiRepository();
