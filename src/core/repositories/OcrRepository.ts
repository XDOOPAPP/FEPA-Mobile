import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { OcrJob } from '../models/Ocr';

class OcrRepository {
  
  async scanInvoice(fileUri: string, userId: string, mimeType: string = 'image/jpeg'): Promise<OcrJob> {
    console.log('[OCR] === BƯỚC 1: TẢI ẢNH LÊN ocr/scan (Sử dụng XHR) ===');
    
    const token = await AsyncStorage.getItem('userToken');
    const url = `${API_BASE_URL}${API_ENDPOINTS.OCR_SCAN}`;
    
    // Chuẩn hóa URI cho Android
    const cleanUri = Platform.OS === 'android' && !fileUri.startsWith('file://') 
      ? `file://${fileUri}` 
      : fileUri;

    const formData = new FormData();
    const fileName = fileUri.split('/').pop() || 'receipt.jpg';

    // @ts-ignore
    formData.append('file', {
      uri: cleanUri,
      name: fileName,
      type: mimeType,
    });
    formData.append('userId', userId || 'unknown');
    formData.append('it-user-id', userId || 'unknown');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      // Cài đặt Headers
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('it-user-id', userId || 'unknown');

      xhr.onload = () => {
        console.log('[OCR] XHR Status:', xhr.status);
        console.log('[OCR] XHR Response:', xhr.responseText);
        
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response.data || response);
          } else {
            reject(new Error(response.message || `Server trả lỗi ${xhr.status}`));
          }
        } catch (e) {
          reject(new Error('Server không trả về JSON hợp lệ'));
        }
      };

      xhr.onerror = (e) => {
        console.error('[OCR] XHR Network Error:', e);
        reject(new Error('Network Error: Không thể kết nối tới Server. Hãy thử dùng 4G thay vì Wifi hoặc kiểm tra IP Server.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Hết thời gian chờ (Timeout). File ảnh có thể quá lớn.'));
      };

      xhr.timeout = 60000; // 60 giây
      xhr.send(formData);
    });
  }

  async getJob(jobId: string): Promise<OcrJob> {
    const token = await AsyncStorage.getItem('userToken');
    const url = `${API_BASE_URL}${API_ENDPOINTS.OCR_JOB(jobId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Lỗi lấy thông tin Job');
    return result.data || result;
  }
}

export const ocrRepository = new OcrRepository();
