import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';
import { Subscription, SubscriptionPlan } from '../models/Subscription';

class SubscriptionRepository {
  private apiClient = axiosInstance;

  private unwrapResponse<T>(response: any): T {
    if (response.data && response.data.data) {
      return response.data.data as T;
    }
    return response.data as T;
  }

  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await this.apiClient.get(
        API_ENDPOINTS.SUBSCRIPTION_PLANS,
      );
      return this.unwrapResponse<SubscriptionPlan[]>(response);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCurrent(): Promise<Subscription | null> {
    try {
      const response = await this.apiClient.get(
        API_ENDPOINTS.SUBSCRIPTION_CURRENT,
      );
      return this.unwrapResponse<Subscription | null>(response);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  async subscribe(planId: string): Promise<Subscription> {
    try {
      const response = await this.apiClient.post(
        API_ENDPOINTS.SUBSCRIPTION_SUBSCRIBE,
        {
          planId,
        },
      );
      return this.unwrapResponse<Subscription>(response);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async cancel(): Promise<void> {
    try {
      await this.apiClient.post(API_ENDPOINTS.SUBSCRIPTION_CANCEL, {});
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getHistory(): Promise<Subscription[]> {
    try {
      const response = await this.apiClient.get(
        API_ENDPOINTS.SUBSCRIPTION_HISTORY,
      );
      return this.unwrapResponse<Subscription[]>(response);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    const data = error.response?.data;
    console.log('[SubscriptionRepository] Error Data:', JSON.stringify(data));

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
    
    if (error.response?.status === 409) {
      return new Error(serverMessage || 'Bạn đang có một chu kỳ gói hoặc yêu cầu thanh toán chưa hoàn tất. Vui lòng kiểm tra lại hoặc hủy gói cũ trước khi nâng cấp.');
    }
    
    if (error.response?.status === 400) {
      return new Error(serverMessage || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
    }
    
    const message =
      serverMessage ||
      error.message ||
      'Có lỗi xảy ra. Vui lòng thử lại.';
    return new Error(message);
  }
}

export const subscriptionRepository = new SubscriptionRepository();
