import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { useSubscription } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { SubscriptionPlan } from '../../../core/models/Subscription';

const PremiumScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const { subState, getPlans, getCurrent, subscribe, createPayment, cancel } =
    useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const isAuthenticated = !!authContext?.userToken;

  useEffect(() => {
    getPlans();
    if (isAuthenticated) {
      getCurrent();
    }
  }, [getPlans, getCurrent, isAuthenticated]);

  const handleSubscribe = useCallback(
    async (plan: SubscriptionPlan) => {
      if (!isAuthenticated) {
        Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để thanh toán.');
        return;
      }

      setIsProcessing(true);
      try {
        const subscription = await subscribe(plan._id);
        const subscriptionId =
          (subscription as any)?._id || (subscription as any)?.id;
        if (!subscriptionId) {
          throw new Error('Không lấy được subscriptionId');
        }
        const payment = await createPayment(subscriptionId, plan._id);
        if (!payment?.paymentUrl) {
          throw new Error('Không tạo được link thanh toán');
        }

        try {
          await Linking.openURL(payment.paymentUrl);
        } catch {
          Alert.alert('Không thể mở link thanh toán', payment.paymentUrl);
        }
      } catch (error: any) {
        Alert.alert('Lỗi', error.message || 'Thanh toán thất bại');
      } finally {
        setIsProcessing(false);
      }
    },
    [isAuthenticated, subscribe, createPayment],
  );

  const handleCancel = useCallback(async () => {
    Alert.alert('Hủy gói', 'Bạn muốn hủy gói hiện tại?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancel();
            await getCurrent();
            Alert.alert('Đã hủy', 'Gói đã được hủy.');
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể hủy');
          }
        },
      },
    ]);
  }, [cancel, getCurrent]);

  const currentPlanName = useMemo(() => {
    const plan = subState.current?.planId as
      | SubscriptionPlan
      | string
      | undefined;
    if (!plan) return 'Chưa có gói';
    return typeof plan === 'string' ? plan : plan.name;
  }, [subState]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nâng cấp Premium</Text>
      <View style={styles.card}>
        <Text style={styles.planTitle}>Gói hiện tại</Text>
        <Text style={styles.planPrice}>{currentPlanName}</Text>
        <Text style={styles.planNote}>
          Trạng thái: {subState.current?.status ?? 'NONE'}
        </Text>
        {subState.current && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Hủy gói</Text>
          </TouchableOpacity>
        )}
      </View>

      {subState.isLoading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        subState.plans.map(plan => (
          <View key={plan._id} style={styles.card}>
            <Text style={styles.planTitle}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              {Number(plan.price).toLocaleString('vi-VN')}₫ / {plan.interval}
            </Text>
            <Text style={styles.planNote}>Mở khóa tính năng Premium.</Text>
            <TouchableOpacity
              style={[styles.actionButton, isProcessing && styles.disabled]}
              onPress={() => handleSubscribe(plan)}
              disabled={isProcessing}
            >
              <Text style={styles.actionText}>Thanh toán</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  planTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  planNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  actionButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
  cancelButton: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
  },
  cancelText: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default PremiumScreen;
