import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import { OcrJob } from '../models/Ocr';

class OcrRepository {
  private apiClient = axiosInstance;

  /**
   * Scan Invoice - Gửi FILE chuẩn qua Multipart/form-data dùng XHR
   */
  async scanInvoice(fileUri: string): Promise<OcrJob> {
    console.log('[OCR] === Start scanInvoice (Standard Multipart XHR) ===');
    
    const token = await AsyncStorage.getItem('userToken');
    const url = `${API_BASE_URL}${API_ENDPOINTS.OCR_SCAN}`;

    // Xử lý URI: Nếu là base64 thì không được, phải là đường dẫn file
    let cleanUri = fileUri;
    if (cleanUri.startsWith('data:')) {
       // Nếu lỡ nhận base64 từ gallery, chúng ta phải dùng cách khác hoặc báo lỗi. 
       // Nhưng tốt nhất là Screen nên gửi URI file://
       console.warn('[OCR] Warning: Received base64, converting back to file is needed for standard upload');
    }

    if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://')) {
      cleanUri = `file://${cleanUri}`;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'application/json');
      // KHÔNG set Content-Type

      xhr.onload = () => {
        console.log('[OCR] Response Status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res.data || res);
          } catch (e) {
            reject(new Error('JSON Parse Error'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || `Lỗi server ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Server error ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network Error - Kiểm tra kết nối mạng'));

      const formData = new FormData();
      const filename = cleanUri.split('/').pop() || 'invoice.jpg';
      
      // ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT ĐỂ TRÁNH LỖI "FIELD VALUE TOO LONG"
      formData.append('file', {
        uri: cleanUri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      console.log('[OCR] Sending file:', filename);
      xhr.send(formData);
    });
  }

  async getJob(jobId: string): Promise<OcrJob> {
    const response = await this.apiClient.get(API_ENDPOINTS.OCR_JOB(jobId));
    return response.data?.data || response.data;
  }
}

export const ocrRepository = new OcrRepository();
