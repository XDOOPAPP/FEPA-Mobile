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
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { useSubscription } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { SubscriptionPlan } from '../../../core/models/Subscription';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const PREMIUM_FEATURES = [
  { id: 1, text: 'Ngân sách không giới hạn', free: false, premium: true, icon: 'wallet-outline' },
  { id: 2, text: 'Trợ lý AI Phân tích chuyên sâu', free: false, premium: true, icon: 'sparkles-outline' },
  { id: 3, text: 'Dự báo chi tiêu tương lai', free: false, premium: true, icon: 'trending-up-outline' },
  { id: 4, text: 'Xuất báo cáo Excel/PDF', free: false, premium: true, icon: 'document-text-outline' },
  { id: 5, text: 'Quét QR & OCR không giới hạn', free: '10 lần/tháng', premium: 'Vô tận', icon: 'scan-outline' },
  { id: 6, text: 'Không quảng cáo', free: true, premium: true, icon: 'shield-outline' },
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
      console.log('[Premium] Subscribe Error:', error);
      const errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('409') || errorMessage.includes('hoạt động')) {
         Alert.alert(
           'Yêu cầu đang kẹt', 
           'Hệ thống ghi nhận bạn đang có một yêu cầu cũ chưa được dọn dẹp.',
           [
             { text: 'Để sau', style: 'cancel' },
             { 
               text: 'Dọn dẹp & Thử lại', 
               onPress: async () => {
                 try {
                   setIsProcessing(true);
                   await cancel(); 
                   getCurrent();
                 } catch (e: any) {} finally {
                   setIsProcessing(false);
                 }
               }
             }
           ]
         );
      } else {
         Alert.alert('Lỗi', errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isAuthenticated, subscribe, createPayment, cancel, getCurrent]);

  const handleCancel = useCallback(async () => {
    Alert.alert(
      'Hủy đăng ký', 
      'Bạn có chắc chắn muốn hủy gói Premium hiện tại?',
      [
        { text: 'Giữ lại', style: 'cancel' },
        { 
          text: 'Xác nhận hủy', 
          style: 'destructive', 
          onPress: async () => {
            try { 
              await cancel(); 
              await getCurrent(); 
              Alert.alert('Đã hủy', 'Gói đăng ký của bạn đã được hủy.'); 
            } catch (error: any) { 
              Alert.alert('Lỗi', error.message || 'Không thể hủy gói.'); 
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Hero Section */}
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          style={styles.heroSection}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerBrand}>FEPA PREMIUM</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.heroBody}>
              <View style={styles.diamondContainer}>
                <LinearGradient 
                  colors={['#FCD34D', '#F59E0B']}
                  style={styles.diamondGradient}
                >
                  <Ionicons name="diamond" size={44} color="#FFF" />
                </LinearGradient>
                <View style={styles.diamondGlow} />
              </View>
              
              <Text style={styles.title}>Làm chủ tài chính cùng AI</Text>
              <Text style={styles.subtitle}>
                Nâng tầm trải nghiệm với những tính năng độc quyền giúp bạn tiết kiệm thông minh hơn.
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          {/* Comparison Table */}
          <GlassCard style={styles.comparisonCard}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableTitle}>So sánh đặc quyền</Text>
              <View style={styles.tableLabels}>
                <Text style={styles.tableLabel}>MEMBER</Text>
                <Text style={[styles.tableLabel, { color: '#F59E0B' }]}>PREMIUM</Text>
              </View>
            </View>

            {PREMIUM_FEATURES.map((feature, index) => (
              <View 
                key={feature.id} 
                style={[
                  styles.tableRow, 
                  index === PREMIUM_FEATURES.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={styles.featureNameBox}>
                  <Ionicons name={feature.icon as any} size={18} color={Colors.textSecondary} style={{marginRight: 8}} />
                  <Text style={styles.featureName}>{feature.text}</Text>
                </View>
                <View style={styles.featureValues}>
                  {typeof feature.free === 'boolean' ? (
                    <Ionicons 
                      name={feature.free ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={feature.free ? Colors.success : Colors.textMuted} 
                    />
                  ) : (
                    <Text style={styles.valueText}>{feature.free}</Text>
                  )}
                  
                  {typeof feature.premium === 'boolean' ? (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color="#F59E0B" 
                    />
                  ) : (
                    <Text style={[styles.valueText, { color: '#F59E0B', fontWeight: '700' }]}>{feature.premium}</Text>
                  )}
                </View>
              </View>
            ))}
          </GlassCard>

          {/* AI Settings Shortcut - ONLY FOR PREMIUM */}
          {(!isAuthenticated || !authContext?.isPremium) ? null : (
            <TouchableOpacity 
              style={styles.aiSetupBox}
              onPress={() => navigation.navigate('Profile')}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{x:0, y:0}}
                end={{x:1, y:0}}
                style={styles.aiSetupGradient}
              >
                <Ionicons name="sparkles" size={24} color="#FFF" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.aiSetupTitle}>Thiết lập Hồ sơ AI</Text>
                  <Text style={styles.aiSetupDesc}>Cung cấp thu nhập để AI tư vấn chuẩn xác nhất</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Plan Selection */}
          <Text style={styles.plansTitle}>Sẵn sàng nâng cấp?</Text>
          
          <View style={styles.plansContainer}>
            {subState.plans.map((plan) => {
              const isActive = activePlanId === plan._id && 
                              (subState.current?.status === 'ACTIVE' || subState.current?.status === 'active');
              const isYearly = plan.interval === 'YEARLY';
              
              return (
                <TouchableOpacity
                  key={plan._id}
                  onPress={() => !isActive && handleSubscribe(plan)}
                  disabled={isActive || isProcessing}
                  style={[
                    styles.planCard,
                    isActive && styles.planCardActive,
                    isYearly && styles.planCardYearly
                  ]}
                >
                  {isYearly && (
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      style={styles.popularBadge}
                    >
                      <Text style={styles.popularText}>TIẾT KIỆM 20%</Text>
                    </LinearGradient>
                  )}

                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planInterval}>
                      Thanh toán theo {plan.interval === 'MONTHLY' ? 'tháng' : 'năm'}
                    </Text>
                  </View>

                  <View style={styles.planPriceBox}>
                    <Text style={styles.planPrice}>
                      {Number(plan.price).toLocaleString()}₫
                    </Text>
                    {isActive ? (
                      <View style={styles.activeLabel}>
                        <Ionicons name="checkmark-sharp" size={14} color="#FFF" />
                        <Text style={styles.activeText}>Đang sài</Text>
                      </View>
                    ) : (
                      <Text style={styles.btnAction}>Chọn ngay</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
             <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
             <Text style={styles.footerText}>Thanh toán an toàn & Bảo mật tuyệt đối</Text>
          </View>
          
          {subState.current && (subState.current.status === 'ACTIVE' || subState.current.status === 'active') && (
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Quản lý gói cước</Text>
            </TouchableOpacity>
          )}


          
          {isProcessing && (
            <View style={styles.globalLoader}>
              <ActivityIndicator size="large" color="#F59E0B" />
              <Text style={styles.loaderText}>Đang xử lý giao dịch...</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    paddingBottom: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safeArea: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    marginBottom: 40,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 2,
  },
  heroBody: {
    alignItems: 'center',
  },
  diamondContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  diamondGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  diamondGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F59E0B',
    opacity: 0.15,
    top: -20,
    left: -20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 30,
  },
  content: {
    marginTop: -40,
    paddingHorizontal: 20,
  },
  comparisonCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFF',
    ...Shadow.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tableLabels: {
    flexDirection: 'row',
    gap: 12,
  },
  tableLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  featureNameBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureName: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  featureValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 35,
    paddingRight: 10,
  },
  valueText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  aiSetupBox: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadow.md,
  },
  aiSetupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  aiSetupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  aiSetupDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 32,
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    ...Shadow.sm,
  },
  planCardYearly: {
    borderColor: '#FEF3C7',
    backgroundColor: '#FFFDF9',
  },
  planCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  planInterval: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  planPriceBox: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  btnAction: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  activeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  cancelText: {
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  globalLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
    color: '#D97706',
  },

});

export default PremiumScreen;
