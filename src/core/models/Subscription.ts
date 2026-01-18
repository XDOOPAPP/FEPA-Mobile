export type PlanInterval = 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string;

export interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  interval: PlanInterval;
  features?: string[];
  isActive?: boolean;
  isFree?: boolean;
}

export interface Subscription {
  _id: string;
  userId: string;
  planId: SubscriptionPlan | string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | string;
  startDate: string;
  endDate?: string | null;
  autoRenew?: boolean;
  paymentRef?: string;
}

export interface PaymentInitResponse {
  paymentRef: string;
  paymentUrl: string;
}
