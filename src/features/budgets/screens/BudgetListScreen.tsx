import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../../common/hooks/useMVVM';

type RootStackParamList = {
  BudgetList: undefined;
  CreateBudget: undefined;
  EditBudget: { id: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetList'>;

interface BudgetItem {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
}

const BudgetListScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Giả dữ liệu budget mẫu
  const mockBudgets: BudgetItem[] = [
    {
      id: '1',
      category: '🍔 Ăn uống',
      limit: 5000000,
      spent: 3200000,
      month: 'Tháng 1/2026',
    },
    {
      id: '2',
      category: '🚗 Giao thông',
      limit: 2000000,
      spent: 1800000,
      month: 'Tháng 1/2026',
    },
    {
      id: '3',
      category: '🏠 Nhà cửa',
      limit: 10000000,
      spent: 9500000,
      month: 'Tháng 1/2026',
    },
    {
      id: '4',
      category: '👗 Quần áo',
      limit: 3000000,
      spent: 1500000,
      month: 'Tháng 1/2026',
    },
  ];

  // Lấy danh sách ngân sách
  const loadBudgets = useCallback(async () => {
    setIsLoading(true);
    try {
      // Giả lập API call
      setTimeout(() => {
        setBudgets(mockBudgets);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải ngân sách');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBudgets();
    setRefreshing(false);
  }, [loadBudgets]);

  // Xóa ngân sách
  const handleDelete = useCallback(
    (id: string, category: string) => {
      Alert.alert(
        'Xác nhận xóa',
        `Bạn có chắc muốn xóa ngân sách "${category}" không?`,
        [
          { text: 'Hủy', onPress: () => {}, style: 'cancel' },
          {
            text: 'Xóa',
            onPress: () => {
              setBudgets(budgets.filter(b => b.id !== id));
            },
            style: 'destructive',
          },
        ],
      );
    },
    [budgets],
  );

  // Tính % chi tiêu
  const calculatePercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100);
  };

  // Lấy màu theo % chi tiêu
  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return '#4CAF50'; // Xanh
    if (percentage < 80) return '#FFC107'; // Vàng
    return '#E53935'; // Đỏ
  };

  // Render mỗi ngân sách
  const renderBudgetItem = ({ item }: { item: BudgetItem }) => {
    const percentage = calculatePercentage(item.spent, item.limit);
    const color = getProgressColor(percentage);
    const remaining = item.limit - item.spent;
    const isOverBudget = remaining < 0;

    return (
      <TouchableOpacity
        style={styles.budgetCard}
        onPress={() => navigation.navigate('EditBudget', { id: item.id })}
      >
        <View style={styles.budgetHeader}>
          <View>
            <Text style={styles.budgetCategory}>{item.category}</Text>
            <Text style={styles.budgetMonth}>{item.month}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.id, item.category)}
          >
            <Text style={styles.deleteBtnText}>Xóa</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Chi tiêu</Text>
            <Text style={styles.statValue}>
              ₫{item.spent.toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Giới hạn</Text>
            <Text style={styles.statValue}>
              ₫{item.limit.toLocaleString('vi-VN')}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text
              style={[styles.statLabel, isOverBudget && { color: '#E53935' }]}
            >
              Còn lại
            </Text>
            <Text
              style={[
                styles.statValue,
                isOverBudget && { color: '#E53935', fontWeight: '700' },
              ]}
            >
              {isOverBudget ? '-' : ''}₫
              {Math.abs(remaining).toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>

        {/* Warning */}
        {isOverBudget && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>⚠️ Bạn đã vượt quá ngân sách</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Empty state
  if (!isLoading && (!budgets || budgets.length === 0)) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📊 Chưa có ngân sách nào</Text>
          <Text style={styles.emptySubText}>
            Nhấn nút + để tạo ngân sách đầu tiên
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderBudgetItem}
          keyExtractor={(item: BudgetItem) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: 15,
  },
  budgetCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  budgetMonth: {
    fontSize: 12,
    color: '#999',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#E53935',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#EEE',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#EEE',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
});

export default BudgetListScreen;
