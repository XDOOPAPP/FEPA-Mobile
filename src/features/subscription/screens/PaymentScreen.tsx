import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { useSubscription } from '../../../core/viewmodels/SubscriptionViewModel';
import { useAuth } from '../../../auth/hook/useAuth';
import type { SubscriptionPlan } from '../../../core/models/Subscription';

interface PaymentScreenProps {
  navigation: any;
  route: any;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { planId, plan } = route.params as { planId: string; plan: SubscriptionPlan };
  const { createPayment, isLoading, error } = useSubscription();
  const { state: authState } = useAuth();
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  const handlePayment = async () => {
    if (!planId) {
      Alert.alert('Lỗi', 'Không tìm thấy gói');
      return;
    }

    try {
      setPaymentInitiated(true);
      const response = await createPayment(planId);

      if (!response.success) {
        Alert.alert('Lỗi', response.error || 'Lỗi tạo thanh toán');
        setPaymentInitiated(false);
        return;
      }

      // If VNPay URL is provided, open it
      if (response.data?.vnpayUrl) {
        const vnpayUrl = response.data.vnpayUrl;
        const canOpen = await Linking.canOpenURL(vnpayUrl);
        if (canOpen) {
          await Linking.openURL(vnpayUrl);
          Alert.alert(
            'Thông báo',
            'Chuyển hướng đến VNPay. Sau khi thanh toán, bạn sẽ được chuyển hướng về ứng dụng.',
            [
              {
                text: 'Hoàn tất',
                onPress: () => {
                  // Check subscription status after payment
                  setTimeout(() => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Subscription' }],
                    });
                  }, 2000);
                },
              },
            ]
          );
        } else {
          Alert.alert('Lỗi', 'Không thể mở VNPay');
          setPaymentInitiated(false);
        }
      } else {
        Alert.alert('Thành công', 'Thanh toán đã được tạo. Vui lòng kiểm tra email để hoàn tất.');
        navigation.goBack();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi thanh toán';
      Alert.alert('Lỗi', message);
      setPaymentInitiated(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
      </View>

      <View style={styles.content}>
        {/* Plan Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Chi tiết đơn hàng</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gói:</Text>
            <Text style={styles.summaryValue}>{plan.name}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mô tả:</Text>
            <Text style={styles.summaryValue}>{plan.description}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thời gian:</Text>
            <Text style={styles.summaryValue}>
              {plan.billingPeriod === 'MONTHLY' ? '1 tháng' : '1 năm'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalPrice}>{formatPrice(plan.price)}</Text>
          </View>
        </View>

        {/* Features */}
        {plan.features.length > 0 && (
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Tính năng bao gồm:</Text>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {/* User Info */}
        {authState.user && (
          <View style={styles.userCard}>
            <Text style={styles.userCardTitle}>Thông tin tài khoản</Text>
            <View style={styles.userRow}>
              <Text style={styles.userLabel}>Email:</Text>
              <Text style={styles.userValue}>{authState.user.email}</Text>
            </View>
            <View style={styles.userRow}>
              <Text style={styles.userLabel}>Họ tên:</Text>
              <Text style={styles.userValue}>{authState.user.fullName || 'N/A'}</Text>
            </View>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Lỗi: {error}</Text>
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.paymentMethodsCard}>
          <Text style={styles.paymentMethodsTitle}>Phương thức thanh toán</Text>
          <View style={styles.methodItem}>
            <View style={styles.methodCheckbox}>
              <Text style={styles.methodCheckmark}>✓</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>VNPay</Text>
              <Text style={styles.methodDesc}>Chuyển khoản, ví điện tử, thẻ ngân hàng</Text>
            </View>
          </View>
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={[styles.paymentButton, (isLoading || paymentInitiated) && styles.paymentButtonDisabled]}
          onPress={handlePayment}
          disabled={isLoading || paymentInitiated}
        >
          {isLoading || paymentInitiated ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.paymentButtonText}>Thanh toán {formatPrice(plan.price)}</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Bằng cách nhấn "Thanh toán", bạn đồng ý với điều khoản dịch vụ và chính sách bảo mật của chúng tôi.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureBullet: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 10,
    marginTop: 2,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userLabel: {
    fontSize: 14,
    color: '#666',
  },
  userValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: '#ffe0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
  },
  paymentMethodsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  methodCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodCheckmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  methodDesc: {
    fontSize: 12,
    color: '#999',
  },
  paymentButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentButtonDisabled: {
    opacity: 0.6,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#0066cc',
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default PaymentScreen;
