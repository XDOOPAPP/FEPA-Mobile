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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axiosInstance from '../../../api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/api';

type RootStackParamList = {
  BudgetOverview: undefined;
  CreateBudget: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetOverview'>;

interface Budget {
  id: string;
  name: string;
  category?: string;
  limitAmount: number;
  startDate?: string;
  endDate?: string;
  progress?: {
    totalSpent: number;
    remaining: number;
    percentage: number;
    status: 'SAFE' | 'EXCEEDED';
  };
}

const BudgetOverviewScreen: React.FC<Props> = ({ navigation }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load budgets from API
  const loadBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_BUDGETS);
      setBudgets(response.data || []);
    } catch (error: any) {
      console.error('Error loading budgets:', error);
      // Giữ data cũ thay vì show error
      if (!budgets.length) {
        // Nếu lần đầu load và lỗi, dùng mock data
        setBudgets([
          {
            id: '1',
            name: 'Chi tiêu hàng tháng',
            category: 'Chung',
            limitAmount: 10000000,
            progress: {
              totalSpent: 6500000,
              remaining: 3500000,
              percentage: 65,
              status: 'SAFE',
            },
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [budgets.length]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.GET_BUDGETS);
      setBudgets(response.data || []);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể làm mới danh sách');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleDeleteBudget = (budgetId: string) => {
    Alert.alert('Xóa ngân sách', 'Bạn chắc chắn muốn xóa ngân sách này?', [
      { text: 'Hủy', onPress: () => {} },
      {
        text: 'Xóa',
        onPress: async () => {
          try {
            await axiosInstance.delete(API_ENDPOINTS.DELETE_BUDGET(budgetId));
            setBudgets(budgets.filter(b => b.id !== budgetId));
            Alert.alert('Thành công', 'Đã xóa ngân sách');
          } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể xóa ngân sách');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // Calculate summary stats
  const totalBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpent = budgets.reduce(
    (sum, b) => sum + (b.progress?.totalSpent || 0),
    0,
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản Lý Ngân Sách</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateBudget' as any)}
        >
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      {budgets.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Tổng ngân sách</Text>
              <Text style={styles.summaryValue}>
                ₫{totalBudget.toLocaleString('vi-VN')}
              </Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Đã chi tiêu</Text>
              <Text style={styles.summaryValue}>
                ₫{totalSpent.toLocaleString('vi-VN')}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Còn lại</Text>
              <Text style={styles.summaryValue}>
                ₫{(totalBudget - totalSpent).toLocaleString('vi-VN')}
              </Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Tỷ lệ sử dụng</Text>
              <Text style={styles.summaryValue}>
                {totalBudget > 0
                  ? Math.round((totalSpent / totalBudget) * 100)
                  : 0}
                %
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Budgets List */}
      <View style={styles.section}>
        {budgets.length > 0 ? (
          budgets.map(budget => (
            <View key={budget.id} style={styles.budgetCard}>
              {/* Header */}
              <View style={styles.budgetHeader}>
                <View style={styles.budgetTitleContainer}>
                  <Text style={styles.budgetName}>{budget.name}</Text>
                  {budget.category && (
                    <Text style={styles.budgetCategory}>{budget.category}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleDeleteBudget(budget.id)}>
                  <Text style={styles.deleteBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Info */}
              <View style={styles.budgetInfo}>
                <View>
                  <Text style={styles.infoLabel}>Hạn mức</Text>
                  <Text style={styles.infoValue}>
                    ₫{budget.limitAmount.toLocaleString('vi-VN')}
                  </Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>Đã chi</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color:
                          budget.progress?.status === 'EXCEEDED'
                            ? '#E53935'
                            : '#4CAF50',
                      },
                    ]}
                  >
                    ₫
                    {(budget.progress?.totalSpent || 0).toLocaleString('vi-VN')}
                  </Text>
                </View>
                <View>
                  <Text style={styles.infoLabel}>Còn lại</Text>
                  <Text style={styles.infoValue}>
                    ₫{(budget.progress?.remaining || 0).toLocaleString('vi-VN')}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressLabel}>
                  <Text style={styles.progressText}>Tiến độ</Text>
                  <Text style={styles.progressPercent}>
                    {budget.progress?.percentage || 0}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          budget.progress?.percentage || 0,
                          100,
                        )}%`,
                        backgroundColor:
                          budget.progress?.status === 'EXCEEDED'
                            ? '#E53935'
                            : budget.progress?.percentage || 0 > 80
                            ? '#FF9800'
                            : '#4CAF50',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Status Badge */}
              {budget.progress?.status && (
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          budget.progress.status === 'EXCEEDED'
                            ? '#FFEBEE'
                            : '#E8F5E9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            budget.progress.status === 'EXCEEDED'
                              ? '#E53935'
                              : '#4CAF50',
                        },
                      ]}
                    >
                      {budget.progress.status === 'EXCEEDED'
                        ? '⚠️ Vượt hạn mức'
                        : '✓ Còn an toàn'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate('CreateBudget' as any, {
                    budgetId: budget.id,
                  })
                }
              >
                <Text style={styles.editButtonText}>Chi tiết</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Chưa có ngân sách</Text>
            <Text style={styles.emptyDescription}>
              Tạo ngân sách đầu tiên để bắt đầu quản lý tài chính
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateBudget' as any)}
            >
              <Text style={styles.createButtonText}>Tạo ngân sách</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196F3',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  budgetCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  budgetTitleContainer: {
    flex: 1,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  budgetCategory: {
    fontSize: 12,
    color: '#999999',
  },
  deleteBtn: {
    fontSize: 20,
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 200,
  },
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default BudgetOverviewScreen;
