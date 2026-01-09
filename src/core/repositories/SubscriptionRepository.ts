import { axiosInstance } from '../../api/axiosInstance';
import type {
  SubscriptionPlan,
  UserSubscription,
  Payment,
  PaymentResponse,
  SubscriptionResponse,
} from '../models/Subscription';

export class SubscriptionRepository {
  /**
   * Get all active subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await axiosInstance.get<SubscriptionResponse<SubscriptionPlan[]>>(
        '/subscriptions/plans'
      );
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get single plan by ID
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan> {
    try {
      const response = await axiosInstance.get<SubscriptionResponse<SubscriptionPlan>>(
        `/subscriptions/plans/${planId}`
      );
      if (!response.data?.data) {
        throw new Error('Plan not found');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw error;
    }
  }

  /**
   * Get current user's active subscription
   */
  async getCurrentSubscription(): Promise<UserSubscription | null> {
    try {
      const response = await axiosInstance.get<SubscriptionResponse<UserSubscription>>(
        '/subscriptions/current'
      );
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      return null;
    }
  }

  /**
   * Get subscription history for user
   */
  async getSubscriptionHistory(): Promise<UserSubscription[]> {
    try {
      const response = await axiosInstance.get<SubscriptionResponse<UserSubscription[]>>(
        '/subscriptions/history'
      );
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      throw error;
    }
  }

  /**
   * Create payment for subscription
   */
  async createPayment(planId: string): Promise<PaymentResponse> {
    try {
      const response = await axiosInstance.post<PaymentResponse>(
        '/payments',
        {
          planId,
          paymentMethod: 'VNPAY',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Subscribe to a plan
   */
  async subscribe(planId: string): Promise<SubscriptionResponse<UserSubscription>> {
    try {
      const response = await axiosInstance.post<SubscriptionResponse<UserSubscription>>(
        '/subscriptions',
        { planId }
      );
      return response.data;
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse<void>> {
    try {
      const response = await axiosInstance.patch<SubscriptionResponse<void>>(
        `/subscriptions/${subscriptionId}/cancel`
      );
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Verify VNPay payment callback
   */
  async verifyPaymentCallback(params: Record<string, string>): Promise<SubscriptionResponse<void>> {
    try {
      const response = await axiosInstance.get<SubscriptionResponse<void>>(
        '/payments/vnpay/ipn',
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<Payment[]> {
    try {
      const response = await axiosInstance.get<SubscriptionResponse<Payment[]>>(
        '/payments/history'
      );
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }
}

export const subscriptionRepository = new SubscriptionRepository();
