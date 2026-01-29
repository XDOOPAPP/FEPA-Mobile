import { Platform } from 'react-native';
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

  async scanInvoice(fileUri: string): Promise<OcrJob> {
    try {
      const formData = new FormData();
      
      // Handle different URI formats
      const uri = Platform.OS === 'android' ? fileUri : fileUri.replace('file://', '');
      
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'invoice.jpg',
      } as any);

      console.log('[OCR] Sending multipart scan request for:', uri);

      const response = await this.apiClient.post(API_ENDPOINTS.OCR_SCAN, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Important for large file uploads
        timeout: 60000, 
      });
      
      return this.unwrapResponse<OcrJob>(response.data);
    } catch (error: any) {
      console.error('[OCR] scanInvoice error:', error);
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
