import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, Linking, ScrollView, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { useSubscription } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { SubscriptionPlan } from '../../../core/models/Subscription';
import { GlassCard } from '../../../components/design-system/GlassCard';

const FEATURES = [
  'Không giới hạn ngân sách',
  'Phân tích AI chuyên sâu',
  'Biểu đồ thống kê nâng cao',
  'Xuất báo cáo Excel/PDF',
  'Hỗ trợ 24/7',
  'Không quảng cáo',
];

const PremiumScreen: React.FC = ({ navigation }: any) => {
  const authContext = useContext(AuthContext);
  const { subState, getPlans, getCurrent, subscribe, createPayment, cancel } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const isAuthenticated = !!authContext?.userToken;

  useEffect(() => {
    getPlans();
    if (isAuthenticated) getCurrent();
  }, [getPlans, getCurrent, isAuthenticated]);

  const handleSubscribe = useCallback(async (plan: SubscriptionPlan) => {
      if (!isAuthenticated) return Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để thanh toán.');
      setIsProcessing(true);
      try {
        const subscription = await subscribe(plan._id);
        const subscriptionId = (subscription as any)?._id || (subscription as any)?.id;
        if (!subscriptionId) throw new Error('Không lấy được subscriptionId');
        const payment = await createPayment(subscriptionId, plan._id);
        if (!payment?.paymentUrl) throw new Error('Không tạo được link thanh toán');
        try { await Linking.openURL(payment.paymentUrl); } catch { Alert.alert('Không thể mở link thanh toán', payment.paymentUrl); }
      } catch (error: any) {
        Alert.alert('Lỗi', error.message || 'Thanh toán thất bại');
      } finally { setIsProcessing(false); }
    }, [isAuthenticated, subscribe, createPayment]);

  const handleCancel = useCallback(async () => {
    Alert.alert('Hủy gói', 'Bạn muốn hủy gói hiện tại?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Hủy', style: 'destructive', onPress: async () => {
          try { await cancel(); await getCurrent(); Alert.alert('Đã hủy', 'Gói đã được hủy.'); } 
          catch (error: any) { Alert.alert('Lỗi', error.message || 'Không thể hủy'); }
      }},
    ]);
  }, [cancel, getCurrent]);

  const currentPlanId = subState.current?.planId;
  const activePlanId = typeof currentPlanId === 'object' ? (currentPlanId as any)._id : currentPlanId;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <LinearGradient colors={Colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
           <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nâng cấp Premium</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         <View style={styles.heroSection}>
             <LinearGradient colors={Colors.goldGradient} style={styles.crownCircle}>
                <Ionicons name="diamond" size={40} color="#FFF" />
             </LinearGradient>
             <Text style={styles.heroTitle}>Mở khóa tiềm năng</Text>
             <Text style={styles.heroSubtitle}>Nâng cấp lên Premium để trải nghiệm toàn bộ tính năng vượt trội</Text>
         </View>
         <View style={styles.featuresContainer}>
            {FEATURES.map((feature, index) => (
               <View key={index} style={styles.featureRow}>
                  <View style={styles.checkCircle}><Ionicons name="checkmark" size={14} color="#FFF" /></View>
                  <Text style={styles.featureText}>{feature}</Text>
               </View>
            ))}
         </View>
         <Text style={styles.sectionTitle}>Chọn gói phù hợp</Text>
         {subState.isLoading ? ( <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} /> ) : (
            subState.plans.map((plan) => {
               const isActive = activePlanId === plan._id && subState.current?.status === 'ACTIVE';
               return (
                  <TouchableOpacity key={plan._id} activeOpacity={0.9} onPress={() => !isActive && handleSubscribe(plan)} disabled={isActive || isProcessing}>
                     <GlassCard style={{...styles.planCard, ...(isActive ? styles.activePlanCard : {}) }}>
                        {isActive && ( <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Đang sử dụng</Text></View> )}
                        <View style={styles.planHeader}>
                           <Text style={styles.planName}>{plan.name}</Text>
                           <View style={styles.priceContainer}>
                              <Text style={styles.planPrice}>{Number(plan.price).toLocaleString('vi-VN')}₫</Text>
                              <Text style={styles.planInterval}>
                                 /{plan.interval === 'monthly' || plan.interval === 'month' ? 'tháng' : 'năm'}
                              </Text>
                           </View>
                        </View>
                        <Text style={styles.planDesc}>Thanh toán {plan.interval === 'month' ? 'hàng tháng' : 'hàng năm'}. Hủy bất kỳ lúc nào.</Text>
                        <LinearGradient colors={isActive ? ['#E2E8F0', '#CBD5E1'] : Colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButton}>
                           <Text style={[ styles.actionText, isActive && { color: Colors.textSecondary } ]}>{isActive ? 'Gói hiện tại' : 'Đăng ký ngay'}</Text>
                        </LinearGradient>
                     </GlassCard>
                  </TouchableOpacity>
               );
            })
         )}
         {subState.current && (subState.current.status === 'ACTIVE' || subState.current.status === 'TRIAL') && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
               <Text style={styles.cancelText}>Hủy gói đăng ký hiện tại</Text>
            </TouchableOpacity>
         )}
         <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  scrollContent: { padding: Spacing.lg },
  heroSection: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.md },
  crownCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md, ...Shadow.glow },
  heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl, lineHeight: 20 },
  featuresContainer: { backgroundColor: '#FFF', borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.card },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  featureText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, marginLeft: 4 },
  planCard: { padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  activePlanCard: { borderColor: Colors.primary, borderWidth: 2, backgroundColor: 'rgba(56, 189, 248, 0.05)' },
  activeBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(56, 189, 248, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  planHeader: { marginBottom: Spacing.sm },
  planName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  planInterval: { fontSize: 14, color: Colors.textSecondary, marginLeft: 2 },
  planDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.lg },
  actionButton: { paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  actionText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cancelButton: { alignSelf: 'center', padding: Spacing.md },
  cancelText: { color: Colors.textMuted, fontSize: 14, textDecorationLine: 'underline' },
});

export default PremiumScreen;
