import { useState, useCallback } from 'react';
import { subscriptionRepository } from '../repositories/SubscriptionRepository';
import type {
  SubscriptionPlan,
  UserSubscription,
  Payment,
  PaymentResponse,
  SubscriptionTier,
} from '../models/Subscription';

interface SubscriptionState {
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  selectedPlan: SubscriptionPlan | null;
  history: UserSubscription[];
  payments: Payment[];
}

export const useSubscription = () => {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    plans: [],
    currentSubscription: null,
    selectedPlan: null,
    history: [],
    payments: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get all subscription plans
  const getPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const plans = await subscriptionRepository.getPlans();
      setSubscriptionState(prev => ({ ...prev, plans }));
      return plans;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tải gói';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get single plan
  const getPlanById = useCallback(async (planId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const plan = await subscriptionRepository.getPlanById(planId);
      setSubscriptionState(prev => ({ ...prev, selectedPlan: plan }));
      return plan;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tải gói';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get current subscription
  const getCurrentSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const subscription = await subscriptionRepository.getCurrentSubscription();
      setSubscriptionState(prev => ({ ...prev, currentSubscription: subscription }));
      return subscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tải gói hiện tại';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get subscription history
  const getHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const history = await subscriptionRepository.getSubscriptionHistory();
      setSubscriptionState(prev => ({ ...prev, history }));
      return history;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi tải lịch sử';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create payment for subscription
  const createPayment = useCallback(async (planId: string): Promise<PaymentResponse> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await subscriptionRepository.createPayment(planId);
      if (!result.success) {
        throw new Error(result.error || 'Lỗi tạo thanh toán');
      }
      setSuccess(true);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tạo thanh toán';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to plan
  const subscribe = useCallback(async (planId: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await subscriptionRepository.subscribe(planId);
      if (!result.success) {
        throw new Error(result.error || 'Lỗi nâng cấp gói');
      }
      const newSubscription = result.data;
      setSubscriptionState(prev => ({
        ...prev,
        currentSubscription: newSubscription || prev.currentSubscription,
      }));
      setSuccess(true);
      return newSubscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi nâng cấp gói';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await subscriptionRepository.cancelSubscription(subscriptionId);
      if (!result.success) {
        throw new Error(result.error || 'Lỗi hủy gói');
      }
      setSubscriptionState(prev => ({
        ...prev,
        currentSubscription: null,
      }));
      setSuccess(true);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi hủy gói';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get payment history
  const getPaymentHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payments = await subscriptionRepository.getPaymentHistory();
      setSubscriptionState(prev => ({ ...prev, payments }));
      return payments;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi tải lịch sử thanh toán';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get current user's tier
  const getCurrentTier = useCallback((): SubscriptionTier => {
    return subscriptionState.currentSubscription?.tier || 'FREE';
  }, [subscriptionState.currentSubscription]);

  // Check if premium
  const isPremium = useCallback((): boolean => {
    return getCurrentTier() === 'PREMIUM';
  }, [getCurrentTier]);

  return {
    subscriptionState,
    getPlans,
    getPlanById,
    getCurrentSubscription,
    getHistory,
    createPayment,
    subscribe,
    cancelSubscription,
    getPaymentHistory,
    getCurrentTier,
    isPremium,
    isLoading,
    error,
    success,
  };
};
