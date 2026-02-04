import React, { useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Image, TouchableOpacity, StatusBar, DeviceEventEmitter, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getUnreadCountApi } from '../../notification/services/NotificationService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { AuthContext } from '../../../store/AuthContext';
import { useExpense, useBudget, useBlog } from '../../../common/hooks/useMVVM';
import { useAI } from '../../../common/hooks/useAI';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../../constants/theme';
import { ExpenseSummaryPeriod } from '../../../core/models/ExpenseSummary';
import CategoryBreakdownChart, { processExpensesByCategory } from '../components/CategoryBreakdownChart';
import BudgetAlertsWidget from '../components/BudgetAlertsWidget';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { StatCard } from '../../../components/design-system/StatCard';
import FinancialTipsWidget from '../components/FinancialTipsWidget';
import AnomalyDetectionWidget from '../components/AnomalyDetectionWidget';

const CHART_HEIGHT = 140;

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const getLastNDaysRange = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { getExpenseSummary, getExpenses, expenseState } = useExpense(
    authContext?.userToken || null,
  );
  const { getAllBudgetsWithProgress, getAlerts } = useBudget(
    authContext?.userToken || null,
  );
  const {
    predictSpending,
    loading: aiLoading,
    error: aiError,
    result: aiResult,
  } = useAI(authContext?.userToken || null);
  const { blogState, getBlogs } = useBlog();

  const [predictMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [predictResult, setPredictResult] = useState<{
    predictions?: Array<{
      category: string;
      amount: number;
      confidence: number;
    }>;
  } | null>(null);
  const [periods, setPeriods] = useState<ExpenseSummaryPeriod[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
        const res = await getUnreadCountApi();
        setUnreadCount(res.count || 0);
    } catch {}
  }, []);

  useEffect(() => {
      const sub = DeviceEventEmitter.addListener('notification_received', () => {
           setUnreadCount(prev => prev + 1);
      });
      return () => sub.remove();
  }, []);

  const handlePredict = async () => {
    setPredictResult(null);
    try {
      console.log('[Dashboard] Running AI Predict for:', predictMonth);
      const res = await predictSpending({ month: predictMonth });
      setPredictResult(res);
      if (!res?.predictions || res.predictions.length === 0) {
        Alert.alert('Thông báo', 'AI chưa có đủ dữ liệu chi tiêu các tháng trước để đưa ra dự báo chính xác cho tháng này.');
      }
    } catch (err: any) {
      console.error('[Dashboard] AI Predict Error:', err);
      setPredictResult(null);
      
      const status = err.response?.status;
      if (status === 403 || err.message?.includes('Premium')) {
         Alert.alert(
           'Yêu cầu Premium', 
           'Tính năng dự báo chi tiêu bằng AI chỉ dành cho thành viên Premium.',
           [
             { text: 'Để sau', style: 'cancel' },
             { text: 'Nâng cấp ngay', onPress: () => navigation.navigate('Profile', { screen: 'Premium' }) }
           ]
         );
      } else {
        Alert.alert('Lỗi AI', 'Không thể kết nối với dịch vụ dự báo AI. Vui lòng thử lại sau.');
      }
    }
  };

  const loadSummary = useCallback(async () => {
    try {
      const range = getLastNDaysRange(7);
      const summary = await getExpenseSummary({
        from: range.from,
        to: range.to,
        groupBy: 'day',
      });
      setPeriods(summary.byTimePeriod || []);
    } catch {
      setPeriods([]);
    }
  }, [getExpenseSummary]);

  const loadBudgets = useCallback(async () => {
    try {
      await getAllBudgetsWithProgress();
    } catch {}
  }, [getAllBudgetsWithProgress]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
      loadBudgets();
      loadUnreadCount();
      getExpenses(); 
      // Fetch blogs and handle error to avoid "Uncaught in promise" alert
      getBlogs(true).catch(e => console.error('Dashboard getBlogs error:', e));
    }, [loadSummary, loadBudgets, loadUnreadCount, getExpenses, getBlogs]),
  );

  const budgetAlerts = getAlerts();

  const categoryData = useMemo(() => {
    return processExpensesByCategory(expenseState.expenses || []);
  }, [expenseState.expenses]);

  // Chart Logic
  const points = useMemo(() => {
    if (!Array.isArray(periods) || periods.length === 0) return [];
    
    // Normalize logic for simplified chart
    const values = periods.map(p => p?.total || 0);
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    
    return values.map((val) => ({
      val,
      ratio: (val - min) / (max - min || 1)
    }));
  }, [periods]);

  const latest = Array.isArray(periods) && periods.length > 0 ? periods[periods.length - 1]?.total || 0 : 0;
  const prev = Array.isArray(periods) && periods.length > 1 ? periods[periods.length - 2]?.total : 0;
  const diff = latest - prev;

  const greetingName = authContext?.user?.fullName?.split(' ')[0] || 'Member';

  // Helper check
  const hasPredictions = aiResult && 'predictions' in aiResult && Array.isArray(aiResult.predictions) && aiResult.predictions.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      {/* Background Gradient Mesh */}
      <View style={styles.bgGlow} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSub}>Chào buổi tối,</Text>
            <Text style={styles.greetingTitle}>{greetingName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity 
              style={[styles.bellButton, { padding: 12 }]}
              onPress={() => {
                console.log('[Dashboard] Bell pressed, navigating to Notifications');
                navigation.navigate('Notifications');
              }}
              activeOpacity={0.5}
            >
               <View style={styles.notificationIconWrapper}>
                 <Ionicons name="notifications" size={24} color={Colors.primary} />
                 {unreadCount > 0 && (
                    <View style={styles.badge}>
                       <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                    </View>
                 )}
               </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => navigation.navigate('Profile')}
            >
               {authContext?.user?.avatar ? (
                 <Image 
                   source={{ uri: authContext.user.avatar }} 
                   style={styles.avatarImage}
                 />
               ) : (
                 <LinearGradient
                    colors={['#E0F2FE', '#BAE6FD']}
                    style={styles.avatarGradient}
                 >
                    <Text style={styles.avatarInitial}>{greetingName[0]}</Text>
                 </LinearGradient>
               )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        <GlassCard variant="featured" style={styles.heroCard}>
          <Text style={styles.heroLabel}>Tổng chi tiêu (7 ngày)</Text>
          <Text style={styles.heroAmount}>
            {formatCurrency(periods.reduce((acc, curr) => acc + curr.total, 0))}
          </Text>
          
          <View style={styles.heroTrend}>
             <View style={[styles.trendBadge, diff > 0 ? styles.trendUp : styles.trendDown]}>
                <Text style={styles.trendText}>
                  {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                </Text>
             </View>
             <Text style={styles.heroSubText}>so với hôm qua</Text>
          </View>
        </GlassCard>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <StatCard 
            label="Hôm nay" 
            amount={formatCurrency(latest)} 
            type="neutral" 
          />
          <View style={{ width: 12 }} />
          <StatCard 
            label="Trung bình" 
            amount={formatCurrency(latest / (periods.length || 1))} 
            type="info" 
          />
        </View>

        {/* Alerts Widget */}
        {budgetAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cảnh báo</Text>
            <BudgetAlertsWidget 
              alerts={budgetAlerts} 
              onViewBudget={() => navigation.navigate('Planning', { screen: 'BudgetList' })}
            />
          </View>
        )}

        {/* AI Anomaly Detection */}
        <View style={styles.section}>
          <AnomalyDetectionWidget />
        </View>

        {/* Chart Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phân tích chi tiêu</Text>
          <GlassCard>
             <CategoryBreakdownChart 
               data={categoryData} 
               isLoading={expenseState.isLoading}
             />
          </GlassCard>
        </View>

        {/* AI Prediction Section */}
        <View style={styles.section}>
           <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>AI Dự báo</Text>
                <TouchableOpacity 
                   style={{ marginLeft: 6 }} 
                   onPress={() => navigation.navigate('AiInsights')}
                >
                   <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handlePredict} disabled={aiLoading}>
                 <Text style={styles.linkText}>
                    {aiLoading ? 'Đang chạy...' : 'Chạy dự báo'}
                 </Text>
              </TouchableOpacity>
           </View>
           
           <GlassCard style={styles.aiCard}>
              <Text style={styles.aiMonth}>Tháng {predictMonth}</Text>
              
              {hasPredictions ? (
                 <View style={styles.aiResult}>
                    {(aiResult as any).predictions.map((p: any, i: number) => (
                       <View key={i} style={styles.aiRow}>
                          <Text style={styles.aiCat}>{p.category}</Text>
                          <Text style={styles.aiVal}>{formatCurrency(p.amount)}</Text>
                          <View style={styles.confidenceBadge}>
                             <Text style={styles.confidenceText}>{(p.confidence * 100).toFixed(0)}%</Text>
                          </View>
                       </View>
                    ))}
                 </View>
              ) : (
                <View style={styles.aiPlaceholder}>
                    <View style={styles.chartIconContainer}>
                        <Ionicons name="stats-chart" size={40} color={Colors.primaryLight} />
                        <View style={styles.chartDot1} />
                        <View style={styles.chartDot2} />
                    </View>
                    <Text style={styles.placeholderText}>
                       Nhấn "Chạy dự báo" để xem AI phân tích xu hướng chi tiêu tháng này của bạn.
                    </Text>
                </View>
              )}
              {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}
           </GlassCard>
        </View>

        {/* AI Financial Advice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lời khuyên cá nhân</Text>
          <FinancialTipsWidget />
        </View>

        {/* Latest Blog Post */}
        {(() => {
          const publishedBlogs = blogState.blogs.filter(b => b.status?.toString().toLowerCase() === 'published');
          if (publishedBlogs.length === 0) return null;
          const latestBlog = publishedBlogs[0];
          
          return (
            <View style={styles.section}>
               <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Kiến thức tài chính</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'Blog' })}>
                     <Text style={styles.linkText}>Xem tất cả</Text>
                  </TouchableOpacity>
               </View>
               <TouchableOpacity 
                 activeOpacity={0.9}
                 onPress={() => navigation.navigate('Profile', { screen: 'BlogDetail', params: { slug: latestBlog.slug } })}
               >
                  <GlassCard style={styles.blogCard}>
                     {latestBlog.thumbnailUrl ? (
                        <Image 
                          source={{ uri: latestBlog.thumbnailUrl }} 
                          style={styles.blogThumb} 
                          resizeMode="cover"
                        />
                     ) : (
                        <View style={styles.blogThumbPlaceholder}>
                           <Ionicons name="newspaper-outline" size={32} color={Colors.primaryLight} />
                        </View>
                     )}
                     <View style={styles.blogInfo}>
                        <View style={styles.blogMeta}>
                           <View style={styles.blogBadge}>
                              <Text style={styles.blogBadgeText}>{latestBlog.category || 'Kiến thức'}</Text>
                           </View>
                           <Text style={styles.blogDate}>
                              {new Date(latestBlog.createdAt).toLocaleDateString('vi-VN')}
                           </Text>
                        </View>
                        <Text style={styles.blogTitle} numberOfLines={2}>
                           {latestBlog.title}
                        </Text>
                     </View>
                  </GlassCard>
               </TouchableOpacity>
            </View>
          );
        })()}

        <View style={{ height: 100 }} />
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // ... (keep existing styles)
  floatingHub: {
    position: 'absolute',
    bottom: 110, // Above TabBar
    right: 20,
    alignItems: 'center',
  },
  fabMain: {
    width: 64,
    height: 64,
    borderRadius: 32,
    ...Shadow.glow,
    zIndex: 10,
    marginTop: 12,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  fabOptions: {
    alignItems: 'center',
    gap: 12,
  },
  fabMini: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  bgGlow: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    borderRadius: 150,
    transform: [{ scaleX: 1.5 }],
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greetingSub: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  greetingTitle: {
    ...Typography.h1,
    fontSize: 28,
  },
  bellButton: {
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  avatarContainer: {
    ...Shadow.glow,
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h3,
    color: '#FFF',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: Radius.round,
  },
  heroCard: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  heroLabel: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  heroAmount: {
    ...Typography.h1,
    color: '#FFF',
    fontSize: 36,
    letterSpacing: -1,
    marginBottom: Spacing.md,
  },
  heroTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    marginRight: 8,
  },
  trendUp: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  trendDown: {
     backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendText: {
    ...Typography.captionBold,
    color: '#FFF',
  },
  heroSubText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  linkText: {
    ...Typography.captionBold,
    color: Colors.primary,
    fontSize: 14,
  },
  aiMonth: {
    ...Typography.h4,
    marginBottom: Spacing.md,
    color: '#F97316', // Orange 500
    fontSize: 18,
  },
  aiCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadow.sm,
  },
  aiPlaceholder: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartIconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartDot1: {
    position: 'absolute',
    top: 5,
    right: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryLight,
  },
  chartDot2: {
    position: 'absolute',
    bottom: 5,
    left: -5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  notificationIconWrapper: {
    backgroundColor: '#F0F9FF',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  avatarInitial: {
    ...Typography.h3,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  aiResult: {
    gap: 12,
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  aiCat: {
    ...Typography.body,
    flex: 1,
  },
  aiVal: {
    ...Typography.bodyBold,
    marginRight: 10,
  },
  confidenceBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    ...Typography.smallBold,
    color: Colors.textSecondary,
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.textSecondary, 
    textAlign: 'center',
    marginHorizontal: 30,
    lineHeight: 22,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 8,
  },
  blogCard: {
    padding: 0,
    overflow: 'hidden',
  },
  blogThumb: {
    width: '100%',
    height: 160,
  },
  blogThumbPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blogInfo: {
    padding: 16,
  },
  blogMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  blogBadge: {
    backgroundColor: Colors.primaryHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  blogBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  blogDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  blogTitle: {
    ...Typography.bodyBold,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
  },
  blogSummary: {
    ...Typography.caption,
    lineHeight: 18,
    color: Colors.textSecondary,
  }
});

export default DashboardScreen;
