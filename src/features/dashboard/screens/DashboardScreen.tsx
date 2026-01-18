import React, { useCallback, useContext, useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { AuthContext } from '../../../store/AuthContext';
import { useExpense, useBudget } from '../../../common/hooks/useMVVM';
import { useAI } from '../../../common/hooks/useAI';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../../constants/theme';
import { ExpenseSummaryPeriod } from '../../../core/models/ExpenseSummary';
import CategoryBreakdownChart, { processExpensesByCategory } from '../components/CategoryBreakdownChart';
import BudgetAlertsWidget from '../components/BudgetAlertsWidget';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { StatCard } from '../../../components/design-system/StatCard';
import FinancialTipsWidget from '../components/FinancialTipsWidget';

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
  const { getExpenseSummary, expenseState } = useExpense(
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
  const [predicting, setPredicting] = useState(false);
  const [periods, setPeriods] = useState<ExpenseSummaryPeriod[]>([]);

  const handlePredict = async () => {
    setPredicting(true);
    setPredictResult(null);
    try {
      const res = await predictSpending({ month: predictMonth });
      setPredictResult(res);
    } catch (err) {
      setPredictResult(null);
    } finally {
      setPredicting(false);
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
    }, [loadSummary, loadBudgets]),
  );

  const budgetAlerts = getAlerts();

  const categoryData = useMemo(() => {
    return processExpensesByCategory(expenseState.expenses || []);
  }, [expenseState.expenses]);

  // Chart Logic
  const points = useMemo(() => {
    if (periods.length === 0) return [];
    
    // Normalize logic for simplified chart
    const values = periods.map(p => p.total);
    const max = Math.max(...values, 1);
    const min = Math.min(...values);
    
    return values.map((val, idx) => ({
      val,
      ratio: (val - min) / (max - min || 1)
    }));
  }, [periods]);

  const latest = periods[periods.length - 1]?.total || 0;
  const prev = periods.length > 1 ? periods[periods.length - 2].total : 0;
  const diff = latest - prev;

  const greetingName = authContext?.user?.fullName?.split(' ')[0] || 'Member';

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
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('Profile')}
          >
             <LinearGradient
                colors={Colors.primaryGradient}
                style={styles.avatarGradient}
             >
                <Text style={styles.avatarText}>{greetingName[0]}</Text>
             </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hero Card - Total Balance (Simulated as Total Expenses for now) */}
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
              <Text style={styles.sectionTitle}>AI Dự báo</Text>
              <TouchableOpacity onPress={handlePredict} disabled={predicting}>
                 <Text style={styles.linkText}>
                    {predicting ? 'Đang chạy...' : 'Chạy dự báo'}
                 </Text>
              </TouchableOpacity>
           </View>
           
           <GlassCard>
              <Text style={styles.aiMonth}>Tháng {predictMonth}</Text>
              
              {aiResult ? (
                 <View style={styles.aiResult}>
                    {aiResult.predictions?.map((p, i) => (
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
                <Text style={styles.placeholderText}>
                   Nhấn "Chạy dự báo" để xem AI phân tích xu hướng chi tiêu tháng này của bạn.
                </Text>
              )}
              {aiError ? <Text style={styles.errorText}>{aiError}</Text> : null}
           </GlassCard>
        </View>

        {/* AI Financial Advice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lời khuyên cá nhân</Text>
          <FinancialTipsWidget />
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
    blurRadius: 50, // Note: blurRadius specific to Image, simple View specific support varies
    // Alternative approach for glow in RN requires ImageBackground or SVG
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
  },
  aiMonth: {
    ...Typography.h4,
    marginBottom: Spacing.md,
    color: Colors.accent,
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
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 8,
  }
});

export default DashboardScreen;
