import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../../common/hooks/useMVVM';

type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

interface ChartData {
  label: string;
  value: number;
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const { authState } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for chart
  const [chartData] = useState<ChartData[]>([
    { label: 'Thứ 2', value: 800000 },
    { label: 'Thứ 3', value: 1200000 },
    { label: 'Thứ 4', value: 950000 },
    { label: 'Thứ 5', value: 1500000 },
    { label: 'Thứ 6', value: 1100000 },
    { label: 'Thứ 7', value: 1300000 },
    { label: 'CN', value: 1550000 },
  ]);

  const [categoryData] = useState<CategoryData[]>([
    {
      category: '🍔 Ăn uống',
      amount: 3200000,
      percentage: 38,
      color: '#FF6B6B',
    },
    {
      category: '🚗 Giao thông',
      amount: 1800000,
      percentage: 21,
      color: '#4ECDC4',
    },
    {
      category: '🏠 Nhà cửa',
      amount: 2000000,
      percentage: 24,
      color: '#45B7D1',
    },
    {
      category: '👗 Quần áo',
      amount: 800000,
      percentage: 9,
      color: '#FFA07A',
    },
    {
      category: '🎮 Giải trí',
      amount: 700000,
      percentage: 8,
      color: '#98D8C8',
    },
  ]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Giả lập API call
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [timePeriod, loadAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }, [loadAnalytics]);

  // Calculate max value for chart scaling
  const maxValue = Math.max(...chartData.map(d => d.value));
  const maxHeight = 200;

  // Calculate chart bar height
  const getBarHeight = (value: number) => {
    return (value / maxValue) * maxHeight;
  };

  // Calculate total
  const totalExpenses = chartData.reduce((sum, item) => sum + item.value, 0);
  const averageExpenses = Math.round(totalExpenses / chartData.length);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Phân tích chi tiêu</Text>
        <Text style={styles.subtitle}>
          {timePeriod === 'day' && 'Theo ngày'}
          {timePeriod === 'week' && 'Theo tuần'}
          {timePeriod === 'month' && 'Theo tháng'}
          {timePeriod === 'quarter' && 'Theo quý'}
          {timePeriod === 'year' && 'Theo năm'}
        </Text>
      </View>

      {/* Time Period Selector */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {(['day', 'week', 'month', 'quarter', 'year'] as TimePeriod[]).map(
            period => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.filterButton,
                  timePeriod === period && styles.filterButtonActive,
                ]}
                onPress={() => setTimePeriod(period)}
              >
                <Text
                  style={[
                    styles.filterText,
                    timePeriod === period && styles.filterTextActive,
                  ]}
                >
                  {period === 'day' && 'Ngày'}
                  {period === 'week' && 'Tuần'}
                  {period === 'month' && 'Tháng'}
                  {period === 'quarter' && 'Quý'}
                  {period === 'year' && 'Năm'}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      </View>

      {/* Bar Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Biểu đồ chi tiêu hàng ngày</Text>

        <View style={styles.chartContainer}>
          <View style={styles.chartBars}>
            {chartData.map((item, index) => (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: getBarHeight(item.value),
                        backgroundColor: '#2196F3',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Chart Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tổng</Text>
            <Text style={styles.statValue}>
              ₫{totalExpenses.toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Trung bình</Text>
            <Text style={styles.statValue}>
              ₫{averageExpenses.toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cao nhất</Text>
            <Text style={styles.statValue}>
              ₫
              {Math.max(...chartData.map(d => d.value)).toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💹 Chi tiêu theo danh mục</Text>

        {categoryData.map((item, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.category}</Text>
              <Text style={styles.categoryAmount}>
                ₫{item.amount.toLocaleString('vi-VN')}
              </Text>
            </View>

            <View style={styles.categoryProgressContainer}>
              <View
                style={[
                  styles.categoryProgress,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  },
                ]}
              />
            </View>

            <Text style={styles.categoryPercentage}>{item.percentage}%</Text>
          </View>
        ))}
      </View>

      {/* Pie Chart (Legend) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Phân bố chi tiêu</Text>

        {categoryData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText}>{item.category}</Text>
            <Text style={styles.legendPercentage}>{item.percentage}%</Text>
          </View>
        ))}
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  filterContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filterScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  filterButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: '70%',
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  categoryInfo: {
    width: 120,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  categoryProgressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#EEE',
    marginHorizontal: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgress: {
    height: '100%',
    borderRadius: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    width: 30,
    textAlign: 'right',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  legendPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
});

export default AnalyticsScreen;
