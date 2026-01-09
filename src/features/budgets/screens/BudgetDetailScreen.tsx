import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBudget, useExpense } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { Budget } from '../../../core/models/Budget';
import { Expense } from '../../../core/models/Expense';

type RootStackParamList = {
  BudgetDetail: { id: string };
  BudgetList: undefined;
  EditBudget: { id: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetDetail'>;

const BudgetDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const authContext = useContext(AuthContext);
  const { getBudgetById, deleteBudget } = useBudget(
    authContext?.userToken || '',
  );
  const { getExpenses } = useExpense(authContext?.userToken || '');

  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBudgetDetail();
  }, [id]);

  const loadBudgetDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load budget detail từ API
      const budgetData = await getBudgetById(id);
      setBudget(budgetData);

      // Load expenses từ API
      const expensesData = await getExpenses({
        category: budgetData.category as any,
      });
      setExpenses(expensesData || []);
    } catch (error: any) {
      Alert.alert(
        '❌ Lỗi',
        error.message || 'Không thể tải chi tiết ngân sách',
      );
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [id, getBudgetById, getExpenses, navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!budget) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có dữ liệu</Text>
      </View>
    );
  }

  const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = budget.limit - spent;
  const percentage = (spent / budget.limit) * 100;
  const isOverBudget = spent > budget.limit;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{budget.category}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Budget Info Card */}
      <View style={styles.card}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetTitle}>{budget.month}</Text>
          <Text style={styles.budgetLimit}>
            Giới hạn: {budget.limit.toLocaleString('vi-VN')}₫
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: isOverBudget
                    ? '#F44336'
                    : percentage > 80
                    ? '#FF9800'
                    : '#4CAF50',
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.percentageText,
              { color: isOverBudget ? '#F44336' : '#666' },
            ]}
          >
            {percentage.toFixed(1)}% đã sử dụng
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Đã chi</Text>
            <Text
              style={[
                styles.statValue,
                { color: isOverBudget ? '#F44336' : '#2196F3' },
              ]}
            >
              {spent.toLocaleString('vi-VN')}₫
            </Text>
          </View>

          <View style={[styles.statBox, styles.statBoxBorder]}>
            <Text style={styles.statLabel}>Còn lại</Text>
            <Text
              style={[
                styles.statValue,
                { color: remaining > 0 ? '#4CAF50' : '#F44336' },
              ]}
            >
              {remaining.toLocaleString('vi-VN')}₫
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Tổng giới hạn</Text>
            <Text style={styles.statValue}>
              {budget.limit.toLocaleString('vi-VN')}₫
            </Text>
          </View>
        </View>

        {/* Warning Message */}
        {isOverBudget && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Bạn đã vượt quá giới hạn ngân sách!
            </Text>
          </View>
        )}
        {percentage > 80 && percentage <= 100 && (
          <View style={[styles.warningBox, styles.cautionBox]}>
            <Text style={styles.cautionText}>
              ⚡ Cảnh báo: Bạn sắp hết ngân sách
            </Text>
          </View>
        )}
      </View>

      {/* Expenses List */}
      <View style={styles.expensesSection}>
        <Text style={styles.sectionTitle}>
          Chi tiêu ({expenses.length} giao dịch)
        </Text>

        {expenses.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>Chưa có chi tiêu nào</Text>
          </View>
        ) : (
          expenses.map((expense, index) => (
            <View
              key={expense.id}
              style={[
                styles.expenseItem,
                index !== expenses.length - 1 && styles.expenseItemBorder,
              ]}
            >
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDescription}>
                  {expense.description}
                </Text>
                <Text style={styles.expenseDate}>
                  {new Date(expense.date).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>
                -{expense.amount.toLocaleString('vi-VN')}₫
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditBudget', { id: budget.id })}
        >
          <Text style={styles.editButtonText}>✏️ Chỉnh sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              '🗑️ Xác nhận',
              'Bạn chắc chắn muốn xóa ngân sách này?',
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Xóa',
                  onPress: async () => {
                    try {
                      await deleteBudget(id);
                      Alert.alert('✅ Thành công', 'Ngân sách đã được xóa!', [
                        {
                          text: 'OK',
                          onPress: () => navigation.goBack(),
                        },
                      ]);
                    } catch (error: any) {
                      Alert.alert(
                        '❌ Lỗi',
                        error.message || 'Lỗi xóa ngân sách',
                      );
                    }
                  },
                  style: 'destructive',
                },
              ],
            );
          }}
        >
          <Text style={styles.deleteButtonText}>🗑️ Xóa</Text>
        </TouchableOpacity>
      </View>

      {/* Spacing */}
      <View style={styles.spacing} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetHeader: {
    marginBottom: 16,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  budgetLimit: {
    fontSize: 14,
    color: '#999',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statBoxBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#EEE',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  warningBox: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  warningText: {
    color: '#F44336',
    fontSize: 13,
    fontWeight: '500',
  },
  cautionBox: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9800',
  },
  cautionText: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '500',
  },
  expensesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyList: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: '#999',
  },
  expenseItem: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  actionSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  spacing: {
    height: 32,
  },
});

export default BudgetDetailScreen;
