import axios from 'axios';
import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';

// --- Interfaces ---
export interface AssistantChatRequest { message: string; }
export interface AssistantChatResult { reply: string; }
export interface CategorizeExpenseRequest { description: string; amount: number; }
export interface CategorizeExpenseResult { category: string; }

// --- Cấu hình Cứu hộ (Fallback) ---
const FALLBACK_KEY = 'AIzaSyAS5XBYia0bIEPInVou-K5zSqIQ0rQ_dXQ';
const GOOGLE_API_URL = (model: string) => 
  `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${FALLBACK_KEY}`;

class AiRepository {
  // 1. Phân loại chi tiêu (Fallback thông minh)
  async categorizeExpense(payload: CategorizeExpenseRequest): Promise<CategorizeExpenseResult> {
    try {
      // Ưu tiên Microservice (Hosting)
      const res = await axiosInstance.post(API_ENDPOINTS.AI_CATEGORIZE, payload);
      return res.data?.data || res.data;
    } catch (error) {
      console.log('⚠️ Backend Categorize failed, using Local AI Fallback...');
      try {
        const prompt = `Phân loại: "${payload.description}". Trả về 1 từ slug duy nhất: food, transport, shopping, entertainment, health, utilities.`;
        const res = await axios.post(GOOGLE_API_URL('gemini-1.5-flash'), {
          contents: [{ parts: [{ text: prompt }] }]
        });
        const category = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || 'other';
        return { category: category.includes('food') ? 'food' : category.includes('transport') ? 'transport' : category.includes('shopping') ? 'shopping' : category.includes('health') ? 'health' : category.includes('utilities') ? 'utilities' : 'other' };
      } catch (e) {
        return { category: 'other' };
      }
    }
  }

  // 2. Chat Trợ lý (Sử dụng Microservice trước, lỗi mới dùng Google trực tiếp)
  async assistantChat(payload: AssistantChatRequest): Promise<AssistantChatResult> {
    try {
      // Bước 1: Gọi Microservice trên Hosting
      const response = await axiosInstance.post(API_ENDPOINTS.AI_ASSISTANT_CHAT, payload);
      const data = response.data?.data || response.data;
      if (data?.reply || data?.response) {
        return { reply: data.reply || data.response };
      }
      throw new Error('Server returned empty');
    } catch (error: any) {
      console.log('📡 Microservice error, triggering Direct Google AI...');
      
      // Bước 2: Google Direct Fallback
      try {
        const res = await axios.post(GOOGLE_API_URL('gemini-1.5-flash'), {
          contents: [{ parts: [{ text: `Bạn là trợ lý tài chính FEPA. Trả lời ngắn gọn tiếng Việt: ${payload.message}` }] }]
        });
        return { reply: res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI đang bảo trì.' };
      } catch (directError: any) {
        throw new Error('Cả Server và Google đều không phản hồi. Vui lòng kiểm tra kết nối.');
      }
    }
  }

  // Skeleton
  async getBudgetAlerts(p: any): Promise<any> { try { return (await axiosInstance.post(API_ENDPOINTS.AI_BUDGET_ALERTS, p)).data; } catch(e) { return { alerts: [] }; } }
  async predictSpending(p: any): Promise<any> { try { return (await axiosInstance.post(API_ENDPOINTS.AI_PREDICT_SPENDING, p)).data; } catch(e) { return { predictions: [] }; } }
  async detectAnomalies(p: any): Promise<any> { try { return (await axiosInstance.post(API_ENDPOINTS.AI_ANOMALIES, p)).data; } catch(e) { return { anomalies: [] }; } }
}

export const aiRepository = new AiRepository();
