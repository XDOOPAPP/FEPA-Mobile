import { useSubscription } from './SubscriptionViewModel';
import type { SubscriptionTier } from '../models/Subscription';

/**
 * Feature-gating hook for premium features
 * Usage:
 * const { canCreateBudget, showPremiumPrompt } = useFeatureGate();
 * if (!canCreateBudget()) {
 *   showPremiumPrompt('Tạo ngân sách không giới hạn');
 *   return;
 * }
 */
export const useFeatureGate = () => {
  const { subscriptionState, getCurrentTier } = useSubscription();

  const currentTier = getCurrentTier();

  // Premium features configuration
  const premiumFeatures = {
    // Budget features
    unlimitedBudgets: {
      required: 'PREMIUM',
      description: 'Tạo ngân sách không giới hạn',
      freeLimit: 3,
    },
    advancedAnalytics: {
      required: 'PREMIUM',
      description: 'Báo cáo phân tích chi tiết',
    },
    budgetTemplates: {
      required: 'PREMIUM',
      description: 'Mẫu ngân sách sẵn có',
    },
    // Expense features
    unlimitedExpenses: {
      required: 'PREMIUM',
      description: 'Ghi chi tiêu không giới hạn',
      freeLimit: 50,
    },
    expenseRecurring: {
      required: 'PREMIUM',
      description: 'Chi tiêu định kỳ tự động',
    },
    expenseSplitting: {
      required: 'PREMIUM',
      description: 'Chia chi tiêu với bạn bè',
    },
    // Export & Sharing
    exportReports: {
      required: 'PREMIUM',
      description: 'Xuất báo cáo PDF/Excel',
    },
    shareReports: {
      required: 'PREMIUM',
      description: 'Chia sẻ báo cáo với người khác',
    },
    // Advanced features
    aiInsights: {
      required: 'PREMIUM',
      description: 'AI gợi ý chi tiêu',
    },
  };

  /**
   * Check if feature is available
   */
  const isFeatureAvailable = (featureKey: keyof typeof premiumFeatures): boolean => {
    const feature = premiumFeatures[featureKey];
    if (!feature) return true;

    return currentTier === feature.required || feature.required === 'FREE';
  };

  /**
   * Check if user can create budget (with limit check for free tier)
   */
  const canCreateBudget = (): boolean => {
    if (currentTier === 'PREMIUM') return true;

    // Free tier limit: 3 budgets
    const budgetCount = subscriptionState.currentSubscription ? 1 : 0;
    return budgetCount < (premiumFeatures.unlimitedBudgets.freeLimit || 3);
  };

  /**
   * Check if user can create expense (with limit check for free tier)
   */
  const canCreateExpense = (): boolean => {
    if (currentTier === 'PREMIUM') return true;

    // Free tier limit: 50 expenses per month
    return true; // Implement with actual expense count
  };

  /**
   * Get remaining budget quota for free tier
   */
  const getBudgetQuota = (): { used: number; total: number; remaining: number } => {
    const total = premiumFeatures.unlimitedBudgets.freeLimit || 3;
    const used = 1; // TODO: Get actual budget count
    return {
      used,
      total,
      remaining: Math.max(0, total - used),
    };
  };

  /**
   * Get remaining expense quota for free tier
   */
  const getExpenseQuota = (): { used: number; total: number; remaining: number } => {
    const total = premiumFeatures.unlimitedExpenses.freeLimit || 50;
    const used = 1; // TODO: Get actual expense count
    return {
      used,
      total,
      remaining: Math.max(0, total - used),
    };
  };

  /**
   * Get feature restrictions message
   */
  const getFeatureRestrictionMessage = (featureKey: keyof typeof premiumFeatures): string => {
    const feature = premiumFeatures[featureKey];
    return feature?.description || 'Tính năng này cần nâng cấp';
  };

  /**
   * Get all premium features list
   */
  const getPremiumFeatures = () => {
    return Object.entries(premiumFeatures).map(([key, feature]) => ({
      id: key,
      name: feature.description,
      restricted: !isFeatureAvailable(key as keyof typeof premiumFeatures),
    }));
  };

  /**
   * Check multiple features at once
   */
  const checkFeatures = (featureKeys: (keyof typeof premiumFeatures)[]): boolean => {
    return featureKeys.every(key => isFeatureAvailable(key));
  };

  return {
    currentTier,
    isPremium: currentTier === 'PREMIUM',
    isFree: currentTier === 'FREE',
    isFeatureAvailable,
    canCreateBudget,
    canCreateExpense,
    getBudgetQuota,
    getExpenseQuota,
    getFeatureRestrictionMessage,
    getPremiumFeatures,
    checkFeatures,
  };
};
