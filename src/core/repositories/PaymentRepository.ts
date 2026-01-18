import axiosInstance from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';
import { PaymentInitResponse } from '../models/Subscription';

class PaymentRepository {
  async createPayment(
    subscriptionId: string,
    planId: string,
  ): Promise<PaymentInitResponse> {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT_CREATE, {
        subscriptionId,
        planId,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPaymentStatus(ref: string): Promise<any> {
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.PAYMENT_STATUS(ref),
      );
      return response.data;
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

export const paymentRepository = new PaymentRepository();
