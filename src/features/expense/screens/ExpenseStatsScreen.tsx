import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../../store/AuthContext';
import { useExpense } from '../../../common/hooks/useMVVM';
import {
  ExpenseGroupBy,
  ExpenseSummary,
} from '../../../core/models/ExpenseSummary';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { PieChart, BarChart, LineChart } from 'react-native-gifted-charts';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF6B6B',
  transport: '#4ECDC4',
  shopping: '#FFE66D',
  utilities: '#95E1D3',
  entertainment: '#A8E6CF',
  healthcare: '#DCD6F7',
  other: '#B8B8B8',
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

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return `${value}`;
};

const ExpenseStatsScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const { getExpenseSummary, expenseState } = useExpense(
    authContext?.userToken || null,
  );

  const [tab, setTab] = useState<'pie' | 'bar' | 'line'>('pie');
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const now = new Date();
      let from, to, groupBy: ExpenseGroupBy;

      if (tab === 'pie') {
        // This month for Pie
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        to = now.toISOString();
        groupBy = 'day';
      } else if (tab === 'bar') {
        // Last 6 months for Bar
        from = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
        to = now.toISOString();
        groupBy = 'month';
      } else {
        // Last 30 days for Line
        from = new Date(now.setDate(now.getDate() - 30)).toISOString();
        to = new Date().toISOString();
        groupBy = 'day';
      }

      const data = await getExpenseSummary({ from, to, groupBy });
      setSummary(data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải thống kê');
    }
  }, [getExpenseSummary, tab]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary]),
  );

  const pieData = useMemo(() => {
    if (!summary?.byCategory) return [];
    return summary.byCategory.map(item => ({
      value: item.total,
      color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other,
      text: `${((item.total / (summary.total || 1)) * 100).toFixed(0)}%`,
      plan: item.category, // Storing category key
    }));
  }, [summary]);

  const barData = useMemo(() => {
    if (!summary?.byTimePeriod) return [];
    return summary.byTimePeriod.map(item => ({
      value: item.total,
      label: item.period.split('-').slice(1).join('/'), // Show MM or DD
      topLabelComponent: () => (
        <Text style={{ fontSize: 10, color: Colors.textSecondary, marginBottom: 4 }}>
          {formatCurrency(item.total)}
        </Text>
      ),
      frontColor: Colors.primary,
    }));
  }, [summary]);

  const lineData = useMemo(() => {
    if (!summary?.byTimePeriod) return [];
    return summary.byTimePeriod.map(item => ({
      value: item.total,
      label: item.period.split('-').pop(), // Show DD
      dataPointText: formatCurrency(item.total),
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Phân tích chi tiêu</Text>
      </View>

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

      {expenseState.isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <View style={styles.chartCard}>
          {tab === 'pie' && (
            <View style={{ alignItems: 'center' }}>
              <PieChart
                data={pieData}
                donut
                showText
                textColor="white"
                radius={120}
                innerRadius={60}
                textSize={12}
                focusOnPress
                backgroundColor={Colors.card}
              />
              <Text style={{ marginTop: 20, ...styles.chartTitle }}>Phân bổ chi tiêu tháng này</Text>
              {renderLegend()}
            </View>
          )}

          {tab === 'bar' && (
            <View>
              <BarChart
                data={barData}
                barWidth={32}
                spacing={24}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
                noOfSections={4}
                maxValue={Math.max(...barData.map(d => d.value)) * 1.2}
                initialSpacing={20}
                width={SCREEN_WIDTH - 80}
              />
              <Text style={styles.chartTitle}>So sánh 6 tháng gần nhất</Text>
            </View>
          )}

          {tab === 'line' && (
             <View>
              <LineChart
                data={lineData}
                color={Colors.primary}
                thickness={3}
                curved
                hideRules
                hideYAxisText
                xAxisColor={Colors.border}
                pointerConfig={{
                  pointerStripHeight: 160,
                  pointerStripColor: 'lightgray',
                  pointerStripWidth: 2,
                  pointerColor: 'lightgray',
                  radius: 6,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 90,
                  activatePointersOnLongPress: true,
                  autoAdjustPointerLabelPosition: false,
                }}
                width={SCREEN_WIDTH - 60}
                initialSpacing={20}
              />
              <Text style={styles.chartTitle}>Biến động chi tiêu 30 ngày</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 4,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
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
  chartTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginRight: 4,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
});

export default ExpenseStatsScreen;
