import axios from 'axios';
import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';

// --- Interfaces ---
export interface AssistantChatRequest { 
  message: string; 
  includeContext?: boolean;
}
export interface AssistantChatResult { reply: string; }
export interface CategorizeExpenseRequest { description: string; amount: number; }
export interface CategorizeExpenseResult { category: string; }

// --- Cấu hình Cứu hộ (Fallback) ---
// BẠN HÃY THAY KEY MỚI CỦA BẠN VÀO ĐÂY
const FALLBACK_KEY = 'AIzaSyD-3Q7tdDpuqJ5HPXv25Z3ASWkSJ6XY_PQ'; 
const GOOGLE_API_URL = (model: string) => 
  `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${FALLBACK_KEY}`;

class AiRepository {
  // 1. Phân loại chi tiêu (Fallback thông minh)
  async categorizeExpense(payload: CategorizeExpenseRequest): Promise<CategorizeExpenseResult> {
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.AI_CATEGORIZE, payload);
      return res.data?.data || res.data;
    } catch (error: any) {
      console.log('⚠️ Backend Categorize failed, using Local AI Fallback...');
      try {
        const res = await axios.post(GOOGLE_API_URL('gemini-1.5-flash'), {
          contents: [{ parts: [{ text: `Phân loại: "${payload.description}". Trả về 1 từ slug duy nhất: food, transport, shopping, entertainment, health, utilities.` }] }]
        });
        const category = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() || 'other';
        return { 
          category: category.includes('food') ? 'food' : 
                    category.includes('transport') ? 'transport' : 
                    category.includes('shopping') ? 'shopping' : 
                    category.includes('health') ? 'health' : 
                    category.includes('utilities') ? 'utilities' : 'other' 
        };
      } catch (e) {
        return { category: 'other' };
      }
    }
  }

  // 2. Chat Trợ lý (Sử dụng Microservice trước, lỗi mới dùng Google trực tiếp)
  async assistantChat(payload: AssistantChatRequest): Promise<AssistantChatResult> {
    try {
      // Bước 1: Gọi Microservice trên Hosting
      const response = await axiosInstance.post(API_ENDPOINTS.AI_ASSISTANT_CHAT, {
        ...payload,
        includeContext: payload.includeContext ?? true
      });
      const data = response.data?.data || response.data;
      const reply = data?.reply || data?.response;
      
      if (reply) {
        const replyLower = reply.toLowerCase();
        const isErrorPattern = 
          replyLower.includes('xin lỗi') || 
          replyLower.includes('lỗi xảy ra') || 
          replyLower.includes('thử lại sau');
          
        if (!isErrorPattern) return { reply };
      }
      throw new Error('Server error');
    } catch (error: any) {
      console.log('📡 Microservice fallback to Direct Google AI (v1)...');
      
      // Bước 2: Thử Google Direct với gemini-1.5-flash bản v1 (ổn định nhất)
      try {
        return await this.callGoogleAi(payload.message, 'gemini-1.5-flash');
      } catch (err: any) {
        // Nếu bản 1.5 vẫn lỗi, thử nốt bản 2.0
        console.log('📡 gemini-1.5-flash failed, trying gemini-2.0-flash as last resort...');
        try {
          return await this.callGoogleAi(payload.message, 'gemini-2.0-flash');
        } catch (finalErr: any) {
          throw this.handleAiError(finalErr);
        }
      }
    }
  }

  private async callGoogleAi(message: string, model: string): Promise<AssistantChatResult> {
    const prompt = message.includes('JSON') ? message : `Bạn là trợ lý tài chính FEPA. Trả lời ngắn gọn tiếng Việt: ${message}`;
    const res = await axios.post(GOOGLE_API_URL(model), {
      contents: [{ parts: [{ text: prompt }] }]
    });
    const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error('Google AI returned empty');
    return { reply };
  }

  private handleAiError(error: any): Error {
    const detail = error.response?.data?.error?.message || error.message;
    console.error('❌ AI Final Error:', detail);
    
    if (detail.includes('quota')) {
      return new Error('🆘 LỖI: Key AI của bạn đã hết hạn mức (Quota exceeded). Thử lại sau 1 phút.');
    }
    if (detail.includes('API key not valid')) {
      return new Error('🆘 LỖI: API Key không hợp lệ hoặc chưa được kích hoạt.');
    }
    return new Error(`🆘 LỖI AI: ${detail}`);
  }

  // 3. Dự báo chi tiêu (Fallback Google AI)
  async predictSpending(payload: any): Promise<any> {
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.AI_PREDICT_SPENDING, payload);
      return res.data?.data || res.data;
    } catch (error) {
      console.log('⚠️ Backend Predict failed, using Google AI Fallback...');
      try {
        // Fetch real data for context
        const expenses = await axiosInstance.get(API_ENDPOINTS.GET_EXPENSES);
        const data = expenses.data?.data || expenses.data || [];
        
        const prompt = `Phân tích dữ liệu chi tiêu này: ${JSON.stringify(data.slice(0, 20))}. 
        Dự báo tổng chi tiêu cho tháng tiếp theo. Trả về JSON: { "prediction": number, "confidence": number, "reason": string }`;
        
        const res = await axios.post(GOOGLE_API_URL('gemini-1.5-flash'), {
          contents: [{ parts: [{ text: prompt }] }]
        });
        
        const aiResponse = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const jsonMatch = aiResponse.match(/\{.*\}/s);
        if (jsonMatch) return { success: true, data: JSON.parse(jsonMatch[0]) };
        throw new Error('Invalid AI response');
      } catch (e) {
        return { success: true, data: { prediction: 5000000, confidence: 0.5, reason: "Dựa trên xu hướng chung" } };
      }
    }
  }

  // 4. Phát hiện bất thường (Fallback Google AI)
  async detectAnomalies(payload: any): Promise<any> {
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.AI_ANOMALIES, payload);
      return res.data?.data || res.data;
    } catch (error) {
      console.log('⚠️ Backend Anomalies failed, using Google AI Fallback...');
      try {
        const expenses = await axiosInstance.get(API_ENDPOINTS.GET_EXPENSES);
        const data = expenses.data?.data || expenses.data || [];
        
        const prompt = `Xem danh sách giao dịch này: ${JSON.stringify(data.slice(0, 15))}. 
        Tìm ra 1-2 giao dịch có số tiền quá cao hoặc khác thường so với các giao dịch khác. 
        Trả về JSON: { "anomalies": [ { "id": string, "reason": string, "score": number } ] }`;
        
        const res = await axios.post(GOOGLE_API_URL('gemini-1.5-flash'), {
          contents: [{ parts: [{ text: prompt }] }]
        });
        
        const aiResponse = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const jsonMatch = aiResponse.match(/\{.*\}/s);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return { anomalies: [] };
      } catch (e) {
        return { anomalies: [] };
      }
    }
  }

  // 5. Cảnh báo ngân sách
  async getBudgetAlerts(payload: any): Promise<any> {
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.AI_BUDGET_ALERTS, payload);
      return res.data?.data || res.data;
    } catch (error) {
       // Handled in screen local fallback
       throw error;
    }
  }

  // 6. Tổng hợp phân tích cấp cao
  async getAiInsights(): Promise<any> {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.AI_INSIGHTS);
      return res.data?.data || res.data;
    } catch (e) {
      return { insights: [] };
    }
  }

  // 7. Vision OCR (Direct Google Fallback)
  async visionOcr(base64: string, mimeType: string = 'image/jpeg'): Promise<any> {
    try {
      console.log('📡 Calling Gemini Vision OCR...');
      const prompt = `Bạn là chuyên gia nhận diện hóa đơn. Hãy đọc ảnh này và trích xuất thông tin chi tiêu. 
      CHỈ TRẢ VỀ JSON: { "amount": number, "category": "food|transport|shopping|utilities|entertainment|health|other", "description": "tóm tắt món đồ", "spentAt": "YYYY-MM-DD" }. 
      Tiếng Việt nhé. Nếu không rõ ngày hãy để ngày hôm nay.`;

      const res = await axios.post(GOOGLE_API_URL('gemini-1.5-flash'), {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64
              }
            }
          ]
        }]
      });

      const aiResponse = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Could not parse AI vision response');
    } catch (error) {
      console.error('Vision OCR error:', error);
      throw error;
    }
  }
}

export const aiRepository = new AiRepository();
