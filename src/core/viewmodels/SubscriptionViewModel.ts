import { useCallback, useState } from 'react';
import { useBaseViewModel, ViewModelState } from './BaseViewModel';
import { subscriptionRepository } from '../repositories/SubscriptionRepository';
import { paymentRepository } from '../repositories/PaymentRepository';
import {
  PaymentInitResponse,
  Subscription,
  SubscriptionPlan,
} from '../models/Subscription';

export interface SubscriptionViewModelState extends ViewModelState {
  plans: SubscriptionPlan[];
  current: Subscription | null;
  history: Subscription[];
}

// Fallback Premium Plans for demo/offline mode
const FALLBACK_PREMIUM_PLANS: SubscriptionPlan[] = [
  {
    _id: 'demo-monthly',
    name: 'Premium Tháng',
    price: 49000,
    interval: 'MONTHLY',
    features: { OCR: true, AI: true, unlimitedBudgets: true, exportPDF: true },
    isActive: true,
    isFree: false,
  },
  {
    _id: 'demo-yearly',
    name: 'Premium Năm',
    price: 399000,
    interval: 'YEARLY',
    features: { OCR: true, AI: true, unlimitedBudgets: true, exportPDF: true, prioritySupport: true },
    isActive: true,
    isFree: false,
  },
];

export const useSubscriptionViewModel = () => {
  const { state, setLoading, setError, setSuccess, clearMessages } =
    useBaseViewModel();
  const [subState, setSubState] = useState<SubscriptionViewModelState>({
    ...state,
    plans: [],
    current: null,
    history: [],
  });

  const syncState = useCallback(
    (updates: Partial<SubscriptionViewModelState>) => {
      setSubState(prev => ({ ...prev, ...updates }));
    },
    [],
  );

  const getPlans = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      let plans = await subscriptionRepository.getPlans();
      
      // If no premium plans exist, inject fallback demo plans for UI display
      const hasPremium = plans.some((p: SubscriptionPlan) => !p.isFree && p.price > 0);
      if (!hasPremium) {
        plans = [...plans, ...FALLBACK_PREMIUM_PLANS];
      }
      
      syncState({ plans });
      return plans;
    } catch (error: any) {
      // On error, use fallback plans so UI still works
      syncState({ plans: FALLBACK_PREMIUM_PLANS });
      setError(error.message || 'Failed to fetch plans');
      return FALLBACK_PREMIUM_PLANS;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  const getCurrent = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const current = await subscriptionRepository.getCurrent();
      syncState({ current });
      return current;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch current subscription');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  const subscribe = useCallback(
    async (planId: string) => {
      setLoading(true);
      clearMessages();
      try {
        const subscription = await subscriptionRepository.subscribe(planId);
        syncState({ current: subscription });
        setSuccess('Subscription created');
        return subscription;
      } catch (error: any) {
        setError(error.message || 'Failed to subscribe');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages, syncState],
  );

  const cancel = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      await subscriptionRepository.cancel();
      setSuccess('Subscription cancelled');
      syncState({ current: null });
    } catch (error: any) {
      setError(error.message || 'Failed to cancel subscription');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSuccess, clearMessages, syncState]);

  const getHistory = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const history = await subscriptionRepository.getHistory();
      syncState({ history });
      return history;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch history');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, clearMessages, syncState]);

  const createPayment = useCallback(
    async (
      subscriptionId: string,
      planId: string,
    ): Promise<PaymentInitResponse> => {
      setLoading(true);
      clearMessages();
      try {
        const response = await paymentRepository.createPayment(
          subscriptionId,
          planId,
        );
        setSuccess('Payment created');
        return response;
      } catch (error: any) {
        setError(error.message || 'Failed to create payment');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setSuccess, clearMessages],
  );

  return {
    subState,
    getPlans,
    getCurrent,
    getHistory,
    subscribe,
    cancel,
    createPayment,
  };
};
