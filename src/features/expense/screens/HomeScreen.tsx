import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../../common/hooks/useMVVM';
import axiosInstance from '../../../api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/api';

type Props = any;

interface DashboardStats {
  totalExpenses: number;
  monthlyExpenses: number;
  budgetUsed: number;
  savingsGoal: number;
}

interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

const HomeScreen: React.FC<Props> = () => {
  const { authState } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 15200000,
    monthlyExpenses: 8500000,
    budgetUsed: 65,
    savingsGoal: 2000000,
  });

  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([
    { category: '🍔 Ăn uống', amount: 3200000, percentage: 38 },
    { category: '🚗 Giao thông', amount: 1800000, percentage: 21 },
    { category: '🏠 Nhà cửa', amount: 2000000, percentage: 24 },
    { category: '👗 Quần áo', amount: 800000, percentage: 9 },
    { category: '🎮 Giải trí', amount: 700000, percentage: 8 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Lấy thống kê từ API
  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_EXPENSE_STATS);
      if (response.data) {
        setStats({
          totalExpenses: response.data.totalExpenses || 0,
          monthlyExpenses: response.data.monthlyExpenses || 0,
          budgetUsed: Math.min(response.data.budgetPercentage || 0, 100),
          savingsGoal: response.data.savingsGoal || 2000000,
        });
      }

      // Get expenses for category breakdown
      const expensesResponse = await axiosInstance.get(
        API_ENDPOINTS.GET_EXPENSES,
      );
      if (expensesResponse.data && Array.isArray(expensesResponse.data)) {
        const categoryMap: { [key: string]: number } = {};
        expensesResponse.data.forEach((expense: any) => {
          const category = expense.category || 'Khác';
          categoryMap[category] = (categoryMap[category] || 0) + expense.amount;
        });

        const totalByCategory = Object.values(categoryMap).reduce(
          (sum, val) => sum + val,
          0,
        );
        const categoryExpenses = Object.entries(categoryMap).map(
          ([category, amount]) => ({
            category: category,
            amount: amount as number,
            percentage: Math.round(
              ((amount as number) / totalByCategory) * 100,
            ),
          }),
        );

        setCategoryExpenses(categoryExpenses);
      }
    } catch (error: any) {
      console.error('Error loading stats:', error);
      // Don't show alert, just keep mock data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

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
        <Text style={styles.greeting}>
          Xin chào, {authState.user?.fullName || 'Bạn'}!
        </Text>
        <Text style={styles.subtitle}>
          Hôm nay là một ngày tốt để quản lý tài chính
        </Text>
      </View>

      {/* Main Stats Card */}
      <View style={styles.mainStatsCard}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statsLabel}>Tổng chi tiêu tháng này</Text>
            <Text style={styles.statsValue}>
              ₫{stats.monthlyExpenses.toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.budgetIndicator}>
            <Text style={styles.budgetPercentage}>{stats.budgetUsed}%</Text>
            <Text style={styles.budgetLabel}>Ngân sách</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${stats.budgetUsed}%`,
                backgroundColor: stats.budgetUsed > 80 ? '#E53935' : '#4CAF50',
              },
            ]}
          />
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatIcon}>💰</Text>
          <Text style={styles.quickStatLabel}>Tiết kiệm lũy tích</Text>
          <Text style={styles.quickStatValue}>
            ₫{(stats.totalExpenses * 0.3).toLocaleString('vi-VN')}
          </Text>
        </View>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatIcon}>🎯</Text>
          <Text style={styles.quickStatLabel}>Mục tiêu tháng này</Text>
          <Text style={styles.quickStatValue}>
            ₫{stats.savingsGoal.toLocaleString('vi-VN')}
          </Text>
        </View>
      </View>

      {/* Top Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
          <TouchableOpacity>
            <Text style={styles.seeMoreText}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        {categoryExpenses.map((cat, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{cat.category}</Text>
              <Text style={styles.categoryAmount}>
                ₫{cat.amount.toLocaleString('vi-VN')}
              </Text>
            </View>
            <View style={styles.categoryProgressContainer}>
              <View
                style={[
                  styles.categoryProgress,
                  {
                    width: `${cat.percentage}%`,
                    backgroundColor: '#2196F3',
                  },
                ]}
              />
            </View>
            <Text style={styles.categoryPercentage}>{cat.percentage}%</Text>
          </View>
        ))}
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Mẹo tiết kiệm</Text>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Giảm chi tiêu ăn uống</Text>
          <Text style={styles.tipText}>
            Chuẩn bị đồ ăn ở nhà có thể giúp bạn tiết kiệm tới 30% hàng tháng
          </Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Theo dõi ghi chú hóa đơn</Text>
          <Text style={styles.tipText}>
            Quét hóa đơn để tự động ghi lại chi tiêu, không bỏ sót khoản nào
          </Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Đặt mục tiêu hàng tháng</Text>
          <Text style={styles.tipText}>
            Lập ngân sách cho từng danh mục để kiểm soát chi tiêu tốt hơn
          </Text>
        </View>
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
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  mainStatsCard: {
    marginHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  statsLabel: {
    fontSize: 13,
    color: '#B3E5FC',
    marginBottom: 8,
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  budgetIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetPercentage: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#B3E5FC',
    fontWeight: '500',
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickStatIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  seeMoreText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
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
  tipCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default HomeScreen;
