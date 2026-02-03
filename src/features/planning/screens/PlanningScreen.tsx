import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { AuthContext } from '../../../store/AuthContext';
import { budgetRepository } from '../../../core/repositories/BudgetRepository';
import { useExpense } from '../../../common/hooks/useMVVM';
import { PieChart, BarChart, LineChart } from 'react-native-gifted-charts';
import { ExpenseGroupBy, ExpenseSummary } from '../../../core/models/ExpenseSummary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF8B8B',       // Soft Coral
  transport: '#64D2FF',  // Sky Blue
  shopping: '#FFABFA',   // Soft Pink
  utilities: '#AC92FF',  // Lavender
  entertainment: '#6EE7B7', // Soft Emerald
  healthcare: '#FFD166',  // Sunny Yellow
  other: '#CBD5E1',       // Light Slate
};

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant-outline',
  transport: 'car-outline',
  shopping: 'cart-outline',
  utilities: 'flash-outline',
  entertainment: 'film-outline',
  healthcare: 'medkit-outline',
  other: 'grid-outline',
};

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống',
  transport: 'Đi lại',
  shopping: 'Mua sắm',
  utilities: 'Hóa đơn',
  entertainment: 'Giải trí',
  healthcare: 'Sức khỏe',
  other: 'Khác',
};

const normalizeCategory = (value?: string) => {
  if (!value) return 'other';
  const v = value.toLowerCase();
  if (CATEGORY_ICONS[v]) return v;
  
  // Map Vietnamese labels to keys
  if (v.includes('ăn') || v.includes('uống') || v.includes('thực phẩm') || v.includes('food')) return 'food';
  if (v.includes('đi') || v.includes('chuyển') || v.includes('xe') || v.includes('transport')) return 'transport';
  if (v.includes('mua') || v.includes('sắm') || v.includes('shopping')) return 'shopping';
  if (v.includes('hóa đơn') || v.includes('tiện ích') || v.includes('utilities')) return 'utilities';
  if (v.includes('giải trí') || v.includes('chơi')) return 'entertainment';
  if (v.includes('sức khỏe') || v.includes('y tế') || v.includes('thuốc')) return 'healthcare';
  
  return 'other';
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return `${value}`;
};

interface PlanningFeature {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  route: string;
  stats?: {
    value: string;
    label: string;
  };
}

const PLANNING_FEATURES: PlanningFeature[] = [
  {
    id: 'budgets',
    title: 'Ngân sách',
    subtitle: 'Quản lý ngân sách theo danh mục',
    icon: 'wallet',
    gradient: ['#667eea', '#764ba2'],
    route: 'Budgets',
  },
];

const FINANCE_TIPS = [
  "Quy tắc 50/30/20: 50% cho nhu cầu, 30% cho sở thích, 20% để tiết kiệm và trả nợ.",
  "Đừng mua sắm khi cảm xúc đang không ổn định (quá vui hoặc quá buồn).",
  "Quy tắc 24h: Với món đồ đắt tiền, hãy đợi 1 ngày rồi mới quyết định mua.",
  "Luôn ưu tiên trả các khoản nợ có lãi suất cao trước.",
  "Hãy 'trả cho mình trước': Trích một khoản tiết kiệm ngay khi vừa nhận lương.",
  "Kiểm tra lại các gói đăng ký hàng tháng (Netflix, Spotify...) và hủy nếu ít dùng.",
  "Mang cơm đi làm có thể giúp bạn tiết kiệm hàng triệu đồng mỗi tháng.",
  "Thiết lập ngân sách cụ thể cho từng danh mục giúp bạn tránh vung tay quá trán.",
  "Đừng để tiền nằm im. Khi đã có quỹ dự phòng, hãy tìm hiểu về đầu tư.",
  "Ghi chép chi tiêu hàng ngày giúp bạn nhận ra những khoản lãng phí nhỏ nhặt.",
  "So sánh giá ở ít nhất 3 nơi trước khi mua một món đồ giá trị lớn.",
  "Tận dụng thẻ thành viên và mã giảm giá, nhưng đừng mua chỉ vì nó đang giảm giá.",
  "Đặt mục tiêu tài chính cụ thể (số tiền, thời hạn) để có động lực phấn đấu.",
  "Quỹ dự phòng khẩn cấp nên đủ chi tiêu cho 3-6 tháng sinh hoạt.",
  "Tự nấu ăn tại nhà không chỉ tiết kiệm mà còn tốt cho sức khỏe hơn.",
];

const PlanningScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { getExpenseSummary, getExpensesFiltered, expenseState } = useExpense(authContext?.userToken || null);
  
  const [budgetStats, setBudgetStats] = useState({
    totalBudget: 0,
    totalSpent: 0,
    activeBudgets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentTip, setCurrentTip] = useState(FINANCE_TIPS[0]);

  // Chart states
  const [tab, setTab] = useState<'pie' | 'bar' | 'line'>('pie');
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const now = new Date();
      let from, to, groupBy: ExpenseGroupBy;

      if (tab === 'pie') {
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        to = now.toISOString();
        groupBy = 'day';
      } else if (tab === 'bar') {
        from = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
        to = now.toISOString();
        groupBy = 'month';
      } else {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        from = d.toISOString();
        to = new Date().toISOString();
        groupBy = 'day';
      }

      const data = await getExpenseSummary({ from, to, groupBy });
      setSummary(data);
    } catch (error: any) {
      console.error('Error loading summary:', error);
    }
  }, [getExpenseSummary, tab]);

  const pieData = useMemo(() => {
    if (!summary?.byCategory) return [];
    return summary.byCategory.map(item => ({
      value: item.total,
      color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other,
      text: `${((item.total / (summary.total || 1)) * 100).toFixed(0)}%`,
    }));
  }, [summary]);

  const barData = useMemo(() => {
    if (!summary?.byTimePeriod) return [];
    return summary.byTimePeriod.map(item => ({
      value: item.total,
      label: item.period.split('-').slice(1).join('/'),
      frontColor: Colors.primary,
    }));
  }, [summary]);

  const lineData = useMemo(() => {
    if (!summary?.byTimePeriod) return [];
    return summary.byTimePeriod.map(item => ({
      value: item.total,
      label: item.period.split('-').pop(),
    }));
  }, [summary]);

  const renderLegend = () => {
    return (
      <View style={styles.legendContainer}>
        {summary?.byCategory.map((item, index) => (
           <View key={index} style={styles.legendItem}>
             <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other }]} />
             <Text style={styles.legendText}>{CATEGORY_LABELS[item.category] || item.category}</Text>
             <Text style={styles.legendValue}>{formatCurrency(item.total)}</Text>
           </View>
        ))}
      </View>
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadBudgetStats();
      loadSummary();
      changeTip();
    }, [loadSummary])
  );

  const changeTip = () => {
    const randomIndex = Math.floor(Math.random() * FINANCE_TIPS.length);
    setCurrentTip(FINANCE_TIPS[randomIndex]);
  };

  const loadBudgetStats = async () => {
    try {
      setLoading(true);
      const budgets = await budgetRepository.getAllBudgetsWithProgress();
      
      // Also fetch all expenses for this month to fix the server discrepancy
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      
      const expenseRes = await getExpensesFiltered({ fromDate: firstDay, toDate: lastDay });
      const expenses = expenseRes.data || [];

      // Calculate totals with local correction
      let totalLimit = 0;
      let totalSpentFixed = 0;

      budgets.forEach(b => {
        totalLimit += (b.limitAmount || 0);
        
        // Recalculate spent for this specific budget category
        const catKey = normalizeCategory(b.category);
        const relevantExpenses = expenses.filter((e: any) => normalizeCategory(e.category) === catKey);
        const actualSpent = relevantExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        
        totalSpentFixed += actualSpent;
      });
      
      setBudgetStats({
        totalBudget: totalLimit,
        totalSpent: totalSpentFixed,
        activeBudgets: budgets.filter(b => b.isActive !== false).length,
      });
    } catch (error) {
      console.error('Error loading budget stats:', error);
      setBudgetStats({
        totalBudget: 0,
        totalSpent: 0,
        activeBudgets: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureCard = (feature: PlanningFeature) => {
    const percentage = budgetStats.totalBudget > 0 
      ? Math.round((budgetStats.totalSpent / budgetStats.totalBudget) * 100)
      : 0;

    return (
      <TouchableOpacity
        key={feature.id}
        style={styles.featureCard}
        onPress={() => navigation.navigate(feature.route)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={feature.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureGradient}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={feature.icon} size={32} color="#FFF" />
          </View>
          
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
            
            {feature.id === 'budgets' && !loading && (
              <View style={styles.statsRow}>
                <Text style={styles.statsValue}>
                  {budgetStats.activeBudgets} ngân sách
                </Text>
                <Text style={styles.statsPercentage}>
                  {percentage}% đã dùng
                </Text>
              </View>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderQuickStats = () => {
    const remaining = budgetStats.totalBudget - budgetStats.totalSpent;

    return (
      <View style={styles.quickStatsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color={Colors.success} />
          <Text style={styles.statValue}>
            {budgetStats.totalBudget.toLocaleString()}₫
          </Text>
          <Text style={styles.statLabel}>Tổng ngân sách</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trending-down" size={24} color={Colors.danger} />
          <Text style={styles.statValue}>
            {budgetStats.totalSpent.toLocaleString()}₫
          </Text>
          <Text style={styles.statLabel}>Đã chi tiêu</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
          <Text style={styles.statValue}>
            {remaining.toLocaleString()}₫
          </Text>
          <Text style={styles.statLabel}>Còn lại</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={Colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Kế hoạch</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý và theo dõi mục tiêu của bạn
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        {!loading && renderQuickStats()}

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Các tính năng</Text>
          {PLANNING_FEATURES.map(renderFeatureCard)}
        </View>

        {/* Analytics Section - New Home for Charts */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>Phân tích chi tiêu</Text>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, tab === 'pie' && styles.activeTab]}
              onPress={() => setTab('pie')}
            >
              <Text style={[styles.tabText, tab === 'pie' && styles.activeTabText]}>Cơ cấu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'bar' && styles.activeTab]}
              onPress={() => setTab('bar')}
            >
              <Text style={[styles.tabText, tab === 'bar' && styles.activeTabText]}>Tháng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'line' && styles.activeTab]}
              onPress={() => setTab('line')}
            >
              <Text style={[styles.tabText, tab === 'line' && styles.activeTabText]}>Xu hướng</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartCard}>
            {expenseState.isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
            ) : (
              <>
                {tab === 'pie' && pieData.length > 0 && (
                  <View style={{ alignItems: 'center' }}>
                    <PieChart
                      data={pieData}
                      donut
                      showText
                      textColor="white"
                      radius={110}
                      innerRadius={65}
                      textSize={12}
                      fontWeight="bold"
                      focusOnPress
                      backgroundColor={Colors.card}
                      isAnimated
                      animationDuration={1000}
                      centerLabelComponent={() => (
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.primary }}>
                            {(summary?.total || 0) > 1000000 ? `${((summary?.total || 0)/1000000).toFixed(1)}M` : `${((summary?.total || 0)/1000).toFixed(0)}K`}
                          </Text>
                          <Text style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: '600' }}>Tổng chi</Text>
                        </View>
                      )}
                    />
                    <Text style={[styles.chartTitleTag, {marginTop: 20}]}>Cơ cấu chi tiêu tháng này</Text>
                    {renderLegend()}
                  </View>
                )}

                {tab === 'bar' && barData.length > 0 && (
                  <View>
                    <BarChart
                      data={barData.map(d => ({
                        ...d,
                        frontColor: Colors.primary,
                        gradientColor: '#7DD3FC',
                        showGradient: true,
                        topLabelComponent: () => (
                          <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.primary, marginBottom: 4 }}>
                            {d.value >= 1000 ? `${(d.value/1000).toFixed(0)}K` : d.value}
                          </Text>
                        ),
                      }))}
                      barWidth={32}
                      spacing={25}
                      roundedTop
                      roundedBottom
                      hideRules
                      xAxisThickness={0}
                      yAxisThickness={0}
                      yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
                      noOfSections={4}
                      formatYLabel={(label) => {
                        const val = Number(label);
                        if (val >= 1000000) return `${(val/1000000).toFixed(1)}M`;
                        if (val >= 1000) return `${(val/1000).toFixed(0)}K`;
                        return label;
                      }}
                      maxValue={Math.max(...barData.map(d => d.value)) * 1.4}
                      width={SCREEN_WIDTH - 90}
                      barBorderRadius={10}
                      isAnimated
                      animationDuration={800}
                    />
                    <Text style={styles.chartTitleTag}>Xu hướng chi tiêu 6 tháng</Text>
                  </View>
                )}

                {tab === 'line' && lineData.length > 0 && (
                   <View>
                    <LineChart
                      key={`line-chart-${tab}-${lineData.length}`}
                      areaChart
                      data={lineData}
                      color={Colors.primary}
                      thickness={6}
                      curved
                      hideRules
                      hideYAxisText
                      xAxisColor={Colors.border}
                      width={SCREEN_WIDTH - 80}
                      initialSpacing={20}
                      startFillColor={Colors.primary}
                      startOpacity={0.4}
                      endFillColor={Colors.primary}
                      endOpacity={0.05}
                      dataPointsColor={Colors.primary}
                      dataPointsRadius={7}
                      isAnimated
                      animationDuration={1500}
                      pointerConfig={{
                        pointerStripHeight: 160,
                        pointerStripColor: '#CBD5E1',
                        pointerStripWidth: 2,
                        pointerColor: Colors.primary,
                        radius: 10,
                        pointerLabelComponent: (items: any) => (
                          <View style={{
                            padding: 10,
                            backgroundColor: Colors.card,
                            borderRadius: 15,
                            borderWidth: 3,
                            borderColor: Colors.primary,
                            ...Shadow.soft,
                          }}>
                            <Text style={{fontWeight: '900', fontSize: 14, color: Colors.primary}}>{items[0].value.toLocaleString()}₫</Text>
                          </View>
                        )
                      }}
                    />
                    <Text style={styles.chartTitleTag}>Biến động chi tiêu hàng ngày</Text>
                  </View>
                )}

                {(!summary || (tab === 'pie' && pieData.length === 0)) && (
                   <View style={styles.emptyChart}>
                      <Ionicons name="stats-chart-outline" size={40} color={Colors.textMuted} />
                      <Text style={styles.emptyText}>Chưa có dữ liệu thống kê</Text>
                   </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <TouchableOpacity 
            style={styles.tipCard} 
            onPress={changeTip}
            activeOpacity={0.7}
          >
            <Ionicons name="bulb" size={24} color={Colors.warning} />
            <View style={styles.tipContent}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={styles.tipTitle}>Mẹo tài chính mỗi ngày</Text>
                <Ionicons name="refresh" size={16} color={Colors.textMuted} />
              </View>
              <Text style={styles.tipText}>
                {currentTip}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 10,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: 4,
    alignItems: 'center',
    ...Shadow.card,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  featureCard: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  featureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statsValue: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginRight: Spacing.sm,
  },
  statsPercentage: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  tipsSection: {
    marginBottom: Spacing.lg,
  },
  tipCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    ...Shadow.soft,
  },
  tipContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  analyticsSection: {
    marginBottom: Spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 4,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    ...Shadow.soft,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.card,
  },
  chartTitleTag: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 15,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textPrimary,
    marginRight: 4,
  },
  legendValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  emptyChart: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: Colors.textMuted,
    fontSize: 12,
  },
});

export default PlanningScreen;
