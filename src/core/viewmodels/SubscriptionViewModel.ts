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
      const plans = await subscriptionRepository.getPlans();
      syncState({ plans });
      return plans;
    } catch (error: any) {
      setError(error.message || 'Failed to fetch plans');
      throw error;
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
