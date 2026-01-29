import React, { useCallback, useContext, useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Linking, 
  ScrollView, 
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { useSubscription } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { SubscriptionPlan } from '../../../core/models/Subscription';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { GradientButton } from '../../../components/design-system/GradientButton';

import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const PREMIUM_FEATURES = [
  { id: 1, text: 'Không giới hạn ngân sách', icon: 'wallet-outline', color: '#4F46E5' },
  { id: 2, text: 'Phân tích AI chuyên sâu', icon: 'analytics-outline', color: '#8B5CF6' },
  { id: 3, text: 'Biểu đồ thống kê nâng cao', icon: 'pie-chart-outline', color: '#EC4899' },
  { id: 4, text: 'Xuất báo cáo PDF & Excel', icon: 'document-text-outline', color: '#10B981' },
  { id: 5, text: 'Hỗ trợ 24/7 ưu tiên', icon: 'headset-outline', color: '#0EA5E9' },
  { id: 6, text: 'Hoàn toàn không quảng cáo', icon: 'flash-off-outline', color: '#F59E0B' },
];

const PremiumScreen: React.FC = ({ navigation }: any) => {
  const authContext = useContext(AuthContext);
  const { subState, getPlans, getCurrent, subscribe, createPayment, cancel } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const isAuthenticated = !!authContext?.userToken;

  useFocusEffect(
    useCallback(() => {
      getPlans();
      if (isAuthenticated) getCurrent();
    }, [getPlans, getCurrent, isAuthenticated])
  );

  const handleSubscribe = useCallback(async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      return Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để nâng cấp gói Premium.');
    }
    
    setIsProcessing(true);
    try {
      const subscription = await subscribe(plan._id);
      const subscriptionId = (subscription as any)?._id || (subscription as any)?.id;
      
      if (!subscriptionId) {
        throw new Error('Hệ thống không lấy được mã đăng ký. Vui lòng thử lại.');
      }
      
      const payment = await createPayment(subscriptionId, plan._id);
      if (!payment?.paymentUrl) {
        throw new Error('Không thể tạo liên kết thanh toán.');
      }
      
      await Linking.openURL(payment.paymentUrl);
    } catch (error: any) {
      Alert.alert('Thất bại', error.message || 'Quá trình thanh toán gặp lỗi.');
    } finally {
      setIsProcessing(false);
    }
  }, [isAuthenticated, subscribe, createPayment]);

  const handleCancel = useCallback(async () => {
    Alert.alert(
      'Hủy đăng ký', 
      'Bạn có chắc chắn muốn hủy gói Premium hiện tại? Các tính năng ưu việt sẽ mất hiệu lực vào cuối chu kỳ.',
      [
        { text: 'Giữ lại', style: 'cancel' },
        { 
          text: 'Xác nhận hủy', 
          style: 'destructive', 
          onPress: async () => {
            try { 
              await cancel(); 
              await getCurrent(); 
              Alert.alert('Đã hủy', 'Gói đăng ký của bạn đã được hủy thành công.'); 
            } catch (error: any) { 
              Alert.alert('Lỗi', error.message || 'Không thể thực hiện hủy gói.'); 
            }
          }
        },
      ]
    );
  }, [cancel, getCurrent]);

  const activePlanId = typeof subState.current?.planId === 'object' 
    ? (subState.current.planId as any)._id 
    : subState.current?.planId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky Custom Header */}
        <View style={styles.headerWrapper}>
          <LinearGradient 
            colors={Colors.primaryGradient} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.header}
          >
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nâng cấp Premium</Text>
            <View style={{ width: 44 }} />
          </LinearGradient>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient 
            colors={['#FFFBEB', '#FEF3C7']} 
            style={styles.heroBackground}
          >
            <LinearGradient 
              colors={Colors.goldGradient} 
              style={styles.crownCircle}
            >
              <Ionicons name="diamond" size={42} color="#FFF" />
            </LinearGradient>
            <Text style={styles.heroTitle}>FEPA Premium</Text>
            <Text style={styles.heroSubtitle}>
              Làm chủ tài chính với những công cụ phân tích và quản lý tốt nhất dành riêng cho bạn.
            </Text>
          </LinearGradient>
        </View>

        {/* Features List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Đặc quyền Premium</Text>
          <View style={styles.featuresGrid}>
            {PREMIUM_FEATURES.map((feature) => (
              <View key={`feature-${feature.id}`} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '10' }]}>
                  <Ionicons name={feature.icon} size={22} color={feature.color} />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Plans Selection */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Chọn gói đăng ký</Text>
          
          {subState.isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : subState.plans.length === 0 ? (
            <View style={styles.emptyPlans}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Hiện tại chưa có gói đăng ký nào khả dụng.</Text>
            </View>
          ) : (
            subState.plans.map((plan) => {
              const isActive = activePlanId === plan._id && 
                              (subState.current?.status === 'ACTIVE' || subState.current?.status === 'active');
              
              return (
                <TouchableOpacity 
                  key={plan._id} 
                  activeOpacity={0.9} 
                  onPress={() => !isActive && handleSubscribe(plan)}
                  disabled={isActive || isProcessing}
                  style={styles.planCardWrapper}
                >
                  <GlassCard style={[
                    styles.planCard, 
                    isActive && styles.activePlanCard
                  ]}>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.activeBadgeText}>Đang sử dụng</Text>
                      </View>
                    )}
                    
                    <View style={styles.planInfo}>
                      <View>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planInterval}>
                          {plan.interval === 'MONTHLY' ? 'Thanh toán theo tháng' : 
                           plan.interval === 'YEARLY' ? 'Thanh toán theo năm' : 
                           'Thanh toán một lần'}
                        </Text>
                      </View>
                      <View style={styles.priceColumn}>
                        <Text style={styles.planPrice}>
                          {Number(plan.price).toLocaleString('vi-VN')}₫
                        </Text>
                        <Text style={styles.priceInterval}>
                          {plan.interval === 'MONTHLY' ? '/Tháng' : 
                           plan.interval === 'YEARLY' ? '/Năm' : 
                           '/Vĩnh viễn'}
                        </Text>
                      </View>
                    </View>

                    <LinearGradient 
                      colors={isActive ? ['#E2E8F0', '#CBD5E1'] : Colors.primaryGradient} 
                      start={{ x: 0, y: 0 }} 
                      end={{ x: 1, y: 0 }} 
                      style={styles.subscribeBtn}
                    >
                      {isProcessing && !isActive ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={[
                          styles.subscribeBtnText,
                          isActive && { color: Colors.textSecondary }
                        ]}>
                          {isActive ? 'Gói hiện tại' : 'Đăng ký ngay'}
                        </Text>
                      )}
                    </LinearGradient>
                  </GlassCard>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Cancellation Section */}
        {subState.current && (subState.current.status === 'ACTIVE' || subState.current.status === 'active') && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={handleCancel}
          >
            <Text style={styles.cancelBtnText}>Quản lý hoặc hủy gói đăng ký</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  headerWrapper: {
    backgroundColor: Colors.primary,
  },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 16, 
    paddingHorizontal: Spacing.md, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    ...Shadow.md,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.2)' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#FFF',
    letterSpacing: 0.5,
  },
  scrollContent: { 
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  heroBackground: {
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    ...Shadow.soft,
  },
  crownCircle: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: Spacing.md,
    ...Shadow.glow,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  heroTitle: { 
    ...Typography.h2,
    color: Colors.textPrimary, 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  heroSubtitle: { 
    ...Typography.body,
    textAlign: 'center', 
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  sectionContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: { 
    ...Typography.h4,
    color: Colors.textPrimary, 
    marginBottom: Spacing.md,
    marginLeft: 4,
  },
  featuresGrid: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
  },
  featureIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  featureText: { 
    ...Typography.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  plansSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  planCardWrapper: {
    marginBottom: Spacing.md,
  },
  planCard: { 
    padding: Spacing.lg, 
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Shadow.md,
  },
  activePlanCard: { 
    borderColor: Colors.accent, 
    borderWidth: 2, 
    backgroundColor: 'rgba(245, 158, 11, 0.03)' 
  },
  activeBadge: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    backgroundColor: Colors.accent, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.sm,
  },
  activeBadgeText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#FFF' 
  },
  planInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: 8,
  },
  planName: { 
    ...Typography.h3,
    color: Colors.textPrimary, 
  },
  planInterval: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  planPrice: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: Colors.primary 
  },
  priceInterval: { 
    fontSize: 12, 
    color: Colors.textMuted,
    fontWeight: '600',
  },
  subscribeBtn: { 
    paddingVertical: 14, 
    borderRadius: Radius.lg, 
    alignItems: 'center',
    ...Shadow.glow,
  },
  subscribeBtnText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#FFF' 
  },
  emptyPlans: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyText: {
    marginTop: Spacing.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  cancelBtn: { 
    alignSelf: 'center', 
    padding: Spacing.md,
    marginTop: -Spacing.md,
  },
  cancelBtnText: { 
    ...Typography.captionBold,
    color: Colors.textMuted, 
    textDecorationLine: 'underline' 
  },
  footerSpacing: { 
    height: 60 
  },
});

export default PremiumScreen;
