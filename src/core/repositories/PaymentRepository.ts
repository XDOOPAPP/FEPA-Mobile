import axiosInstance from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';
import { PaymentInitResponse } from '../models/Subscription';

class PaymentRepository {
  private unwrapResponse<T>(response: any): T {
    if (response.data && response.data.data) {
      return response.data.data as T;
    }
    return response.data as T;
  }

  async createPayment(
    subscriptionId: string,
    planId: string,
  ): Promise<PaymentInitResponse> {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT_CREATE, {
        subscriptionId,
        planId,
      });
      return this.unwrapResponse<PaymentInitResponse>(response);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPaymentStatus(ref: string): Promise<any> {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PAYMENT_STATUS(ref),
      );
      return this.unwrapResponse<any>(response);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    const data = error.response?.data;
    console.log('[PaymentRepository] Error Data:', JSON.stringify(data));

    let serverMessage = '';
    if (data) {
      if (typeof data.message === 'string') {
        serverMessage = data.message;
      } else if (data.error?.message && typeof data.error.message === 'string') {
        serverMessage = data.error.message;
      } else if (Array.isArray(data.message)) {
        serverMessage = data.message.join(', ');
      } else if (typeof data.error === 'string') {
        serverMessage = data.error;
      } else if (data.data?.message) {
        serverMessage = data.data.message;
      } else if (typeof data === 'string') {
        serverMessage = data;
      } else {
        serverMessage = JSON.stringify(data);
      }
    }

    const message =
      serverMessage ||
      error.message ||
      'Có lỗi xảy ra. Vui lòng thử lại.';
    return new Error(message);
  }
}

export const paymentRepository = new PaymentRepository();
