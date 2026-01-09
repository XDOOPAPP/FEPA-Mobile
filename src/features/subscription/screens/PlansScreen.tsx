import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSubscription } from '../../../core/viewmodels/SubscriptionViewModel';
import type { SubscriptionPlan } from '../../../core/models/Subscription';

interface PlansScreenProps {
  navigation: any;
}

export const PlansScreen: React.FC<PlansScreenProps> = ({ navigation }) => {
  const { subscriptionState, getPlans, getCurrentSubscription, isLoading, error } =
    useSubscription();
  const [currentTier, setCurrentTier] = useState<string>('FREE');

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      await Promise.all([getPlans(), getCurrentSubscription()]);
    } catch (err) {
      console.error('Error loading subscription data:', err);
    }
  };

  useEffect(() => {
    if (subscriptionState.currentSubscription) {
      setCurrentTier(subscriptionState.currentSubscription.tier);
    }
  }, [subscriptionState.currentSubscription]);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.tier === currentTier) {
      Alert.alert('Thông báo', 'Bạn đang sử dụng gói này');
      return;
    }
    navigation.navigate('Payment', { planId: plan.id, plan });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải gói...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lỗi: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeData}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gói đăng ký</Text>
        <Text style={styles.headerSubtitle}>
          {currentTier === 'PREMIUM' ? '✓ Bạn đang dùng Premium' : 'Nâng cấp lên Premium'}
        </Text>
      </View>

      <View style={styles.plansContainer}>
        {subscriptionState.plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isActive={plan.tier === currentTier}
            onSelect={() => handleSelectPlan(plan)}
          />
        ))}
      </View>

      {currentTier !== 'FREE' && (
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('SubscriptionHistory')}
        >
          <Text style={styles.historyButtonText}>Xem lịch sử</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

interface PlanCardProps {
  plan: SubscriptionPlan;
  isActive: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isActive, onSelect }) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    });
  };

  return (
    <View style={[styles.planCard, isActive && styles.activePlanCard]}>
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        {isActive && <Text style={styles.activeBadge}>✓ Hiện tại</Text>}
      </View>

      <Text style={styles.planDescription}>{plan.description}</Text>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>{formatPrice(plan.price)}</Text>
        <Text style={styles.billingPeriod}>/{plan.billingPeriod === 'MONTHLY' ? 'tháng' : 'năm'}</Text>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Tính năng:</Text>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.selectButton, isActive && styles.selectButtonActive]}
        onPress={onSelect}
        disabled={isActive}
      >
        <Text style={[styles.selectButtonText, isActive && styles.selectButtonTextActive]}>
          {isActive ? 'Gói hiện tại' : 'Chọn gói'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  plansContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activePlanCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  activeBadge: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  billingPeriod: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  featureBullet: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonActive: {
    backgroundColor: '#ccc',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectButtonTextActive: {
    color: '#666',
  },
  historyButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PlansScreen;
