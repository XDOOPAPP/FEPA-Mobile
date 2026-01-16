import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axiosInstance from '../../../api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/api';

type RootStackParamList = {
  SubscriptionPlans: undefined;
  PaymentCheckout: { planId: string; planName: string; price: number };
  PaymentSuccess: { transactionId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'SubscriptionPlans'>;

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  features: string[];
  isActive: boolean;
}

const SubscriptionPlansScreen: React.FC<Props> = ({ navigation }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  React.useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/subscriptions/plans');
      setPlans(response.data || []);

      // Load current subscription
      const currentResponse = await axiosInstance.get('/subscriptions/current');
      setCurrentPlan(currentResponse.data?.planId);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách gói');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    navigation.navigate('PaymentCheckout', {
      planId: plan._id,
      planName: plan.name,
      price: plan.price,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const sortedPlans = plans.sort((a, b) => a.price - b.price);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chọn Gói Dịch Vụ</Text>
        <Text style={styles.subtitle}>Nâng cấp để truy cập thêm tính năng</Text>
      </View>

      {/* Plans */}
      <View style={styles.plansContainer}>
        {sortedPlans.map(plan => (
          <View
            key={plan._id}
            style={[
              styles.planCard,
              currentPlan === plan._id && styles.planCardActive,
            ]}
          >
            {/* Badge */}
            {currentPlan === plan._id && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Gói hiện tại</Text>
              </View>
            )}

            {/* Header */}
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceSection}>
              <Text style={styles.price}>
                ₫{plan.price.toLocaleString('vi-VN')}
              </Text>
              <Text style={styles.billingCycle}>
                {plan.billingCycle === 'MONTHLY'
                  ? '/tháng'
                  : plan.billingCycle === 'YEARLY'
                  ? '/năm'
                  : 'Vĩnh viễn'}
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresSection}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            {currentPlan !== plan._id ? (
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => handleSubscribe(plan)}
              >
                <Text style={styles.subscribeButtonText}>Nâng cấp ngay</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.currentButton}>
                <Text style={styles.currentButtonText}>✓ Đang sử dụng</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* FAQ Section */}
      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Câu Hỏi Thường Gặp</Text>
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>
            Tôi có thể hủy gói dịch vụ bất cứ lúc nào không?
          </Text>
          <Text style={styles.faqAnswer}>
            Có, bạn có thể hủy gói tại bất kỳ thời điểm nào. Việc hủy sẽ có hiệu
            lực ngay lập tức.
          </Text>
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>
            Có thanh toán tiếp tục không khi hết hạn?
          </Text>
          <Text style={styles.faqAnswer}>
            Gói hàng tháng sẽ tự động gia hạn. Bạn sẽ nhận được thông báo trước
            khi tính phí.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  plansContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#EEEEEE',
  },
  planCardActive: {
    borderColor: '#2196F3',
    backgroundColor: '#F8FBFF',
  },
  currentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  planHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 12,
    color: '#666666',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2196F3',
  },
  billingCycle: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  featuresSection: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#1A1A1A',
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  currentButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  currentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  faqSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
});

export default SubscriptionPlansScreen;
