import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';
import { OcrJob } from '../models/Ocr';

class OcrRepository {
  private apiClient = axiosInstance;

  private unwrapResponse<T>(payload: any): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as T;
    }
    return payload as T;
  }

  async scanInvoice(fileUrl: string): Promise<OcrJob> {
    try {
      const response = await this.apiClient.post(API_ENDPOINTS.OCR_SCAN, {
        fileUrl,
      });
      return this.unwrapResponse<OcrJob>(response.data);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getJob(jobId: string): Promise<OcrJob> {
    try {
      const response = await this.apiClient.get(API_ENDPOINTS.OCR_JOB(jobId));
      return this.unwrapResponse<OcrJob>(response.data);
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

export const ocrRepository = new OcrRepository();
