export type SubscriptionTier = 'FREE' | 'PREMIUM';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  price: number; // in VND
  currency: string;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  paymentMethod: 'VNPAY' | 'MOMO' | 'STRIPE';
  transactionCode?: string;
  vnpayUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    paymentId: string;
    vnpayUrl?: string;
    amount: number;
    orderInfo: string;
  };
  error?: string;
}

export interface SubscriptionResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
