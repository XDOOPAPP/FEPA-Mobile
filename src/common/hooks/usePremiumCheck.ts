import { useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './useMVVM';

const MAX_FREE_USES_PER_DAY = 2;
const FEATURE_KEYS = {
  OCR: 'ocr_uses',
  AI: 'ai_uses',
  BLOG: 'blog_uses',
};

export const usePremiumCheck = () => {
  const { isPremium } = useAuth();
  const [dailyUsage, setDailyUsage] = useState<{ [key: string]: number }>({});
  const [lastResetDate, setLastResetDate] = useState<string>(
    new Date().toDateString(),
  );

  // Load usage counter từ AsyncStorage
  useEffect(() => {
    const loadUsageCounter = async () => {
      try {
        const stored = await AsyncStorage.getItem('premiumUsageCounter');
        const storedDate = await AsyncStorage.getItem('premiumUsageDate');
        const today = new Date().toDateString();

        if (storedDate !== today) {
          // Nếu ngày khác, reset counter
          await AsyncStorage.setItem('premiumUsageDate', today);
          await AsyncStorage.setItem('premiumUsageCounter', JSON.stringify({}));
          setDailyUsage({});
          setLastResetDate(today);
        } else if (stored) {
          setDailyUsage(JSON.parse(stored));
          setLastResetDate(today);
        }
      } catch (error) {
        console.error('Error loading usage counter:', error);
      }
    };

    loadUsageCounter();
  }, []);

  // Kiểm tra xem feature có thể dùng không
  const canUseFeature = useCallback(
    (feature: keyof typeof FEATURE_KEYS): boolean => {
      // Premium users: unlimited
      if (isPremium) {
        return true;
      }

      // Free users: max 2 lần/ngày
      const usage = dailyUsage[FEATURE_KEYS[feature]] || 0;
      return usage < MAX_FREE_USES_PER_DAY;
    },
    [isPremium, dailyUsage],
  );

  // Lấy số lần còn lại trong ngày
  const getRemainingUses = useCallback(
    (feature: keyof typeof FEATURE_KEYS): number => {
      if (isPremium) {
        return -1; // Unlimited
      }

      const usage = dailyUsage[FEATURE_KEYS[feature]] || 0;
      return Math.max(0, MAX_FREE_USES_PER_DAY - usage);
    },
    [isPremium, dailyUsage],
  );

  // Ghi lại lần sử dụng
  const incrementUsage = useCallback(
    async (feature: keyof typeof FEATURE_KEYS) => {
      if (isPremium) {
        return; // Premium: không cần ghi
      }

      try {
        const featureKey = FEATURE_KEYS[feature];
        const currentUsage = dailyUsage[featureKey] || 0;
        const newUsage = { ...dailyUsage, [featureKey]: currentUsage + 1 };

        setDailyUsage(newUsage);
        await AsyncStorage.setItem(
          'premiumUsageCounter',
          JSON.stringify(newUsage),
        );
      } catch (error) {
        console.error('Error incrementing usage:', error);
      }
    },
    [isPremium, dailyUsage],
  );

  return {
    isPremium,
    canUseFeature,
    getRemainingUses,
    incrementUsage,
    maxFreeUses: MAX_FREE_USES_PER_DAY,
  };
};
