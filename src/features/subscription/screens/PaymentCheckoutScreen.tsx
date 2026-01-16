import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axiosInstance from '../../../api/axiosInstance';

type RootStackParamList = {
  PaymentCheckout: { planId: string; planName: string; price: number };
  PaymentSuccess: { transactionId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentCheckout'>;

const PaymentCheckoutScreen: React.FC<Props> = ({ navigation, route }) => {
  const { planId, planName, price } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentMethodSelect = async (method: 'vnpay' | 'wallet') => {
    setIsProcessing(true);
    try {
      if (method === 'vnpay') {
        // Get VNPay payment URL
        const response = await axiosInstance.post('/payments/vnpay/create', {
          planId,
          amount: price,
          orderInfo: `Nâng cấp gói ${planName}`,
          returnUrl: 'fepa://payment/success',
        });

        const { paymentUrl } = response.data;

        // Open VNPay in browser
        if (paymentUrl) {
          const canOpen = await Linking.canOpenURL(paymentUrl);
          if (canOpen) {
            await Linking.openURL(paymentUrl);
          } else {
            Alert.alert('Lỗi', 'Không thể mở cổng thanh toán');
          }
        }
      } else {
        // Wallet payment
        const response = await axiosInstance.post('/payments/wallet/process', {
          planId,
          amount: price,
        });

        if (response.data?.success) {
          navigation.navigate('PaymentSuccess', {
            transactionId: response.data.transactionId,
          });
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Lỗi thanh toán',
        error.response?.data?.message || 'Vui lòng thử lại',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Thanh Toán</Text>
      </View>

      {/* Order Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Tóm Tắt Đơn Hàng</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Gói:</Text>
          <Text style={styles.summaryValue}>{planName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Giá tiền:</Text>
          <Text style={styles.summaryAmount}>
            ₫{price.toLocaleString('vi-VN')}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalAmount}>
            ₫{price.toLocaleString('vi-VN')}
          </Text>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chọn Phương Thức Thanh Toán</Text>

        {/* VNPay Option */}
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => handlePaymentMethodSelect('vnpay')}
          disabled={isProcessing}
        >
          <View style={styles.paymentIcon}>
            <Text style={styles.icon}>💳</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>Thẻ Tín Dụng / Debit (VNPay)</Text>
            <Text style={styles.paymentDesc}>
              Thanh toán bằng thẻ ngân hàng qua cổng VNPay
            </Text>
          </View>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : (
            <Text style={styles.arrow}>→</Text>
          )}
        </TouchableOpacity>

        {/* Wallet Option */}
        <TouchableOpacity
          style={styles.paymentOption}
          onPress={() => handlePaymentMethodSelect('wallet')}
          disabled={isProcessing}
        >
          <View style={styles.paymentIcon}>
            <Text style={styles.icon}>📱</Text>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentName}>Ví Mobile (Comming Soon)</Text>
            <Text style={styles.paymentDesc}>
              Thanh toán từ ví di động của bạn
            </Text>
          </View>
          <Text style={[styles.arrow, styles.arrowDisabled]}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Security Info */}
      <View style={styles.securityInfo}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>
          Thanh toán của bạn được bảo vệ bởi công nghệ mã hóa 256-bit
        </Text>
      </View>

      {/* FAQ */}
      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>Các Câu Hỏi</Text>
        <View style={styles.faqItem}>
          <Text style={styles.faqQ}>Thanh toán có an toàn không?</Text>
          <Text style={styles.faqA}>
            Có, chúng tôi sử dụng VNPay - nền tảng thanh toán hàng đầu Việt Nam
            với các biện pháp bảo mật cao nhất.
          </Text>
        </View>
        <View style={styles.faqItem}>
          <Text style={styles.faqQ}>Thanh toán khi nào có hiệu lực?</Text>
          <Text style={styles.faqA}>
            Ngay sau khi thanh toán thành công, bạn sẽ được nâng cấp gói dịch
            vụ.
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },
  totalRow: {
    paddingTop: 12,
    marginBottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  paymentDesc: {
    fontSize: 12,
    color: '#999999',
  },
  arrow: {
    fontSize: 20,
    color: '#2196F3',
  },
  arrowDisabled: {
    color: '#CCCCCC',
  },
  securityInfo: {
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 16,
  },
  faqSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  faqQ: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  faqA: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
});

export default PaymentCheckoutScreen;
