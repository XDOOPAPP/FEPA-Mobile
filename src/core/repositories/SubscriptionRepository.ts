import { axiosInstance } from '../../api/axiosInstance';
import { API_ENDPOINTS } from '../../constants/api';
import { Subscription, SubscriptionPlan } from '../models/Subscription';

class SubscriptionRepository {
  private apiClient = axiosInstance;

  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await this.apiClient.get(
        API_ENDPOINTS.SUBSCRIPTION_PLANS,
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCurrent(): Promise<Subscription | null> {
    try {
      const response = await this.apiClient.get(
        API_ENDPOINTS.SUBSCRIPTION_CURRENT,
      );
      return response.data;
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
      return response.data;
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

export const subscriptionRepository = new SubscriptionRepository();
