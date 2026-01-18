import React, { useCallback, useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useBudget } from '../../../common/hooks/useMVVM';
import { useAI } from '../../../common/hooks/useAI';
import { AuthContext } from '../../../store/AuthContext';
import { BudgetWithProgress } from '../../../core/models/Budget';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống',
  transport: 'Đi lại',
  shopping: 'Mua sắm',
  utilities: 'Hóa đơn',
  entertainment: 'Giải trí',
  healthcare: 'Sức khỏe',
  other: 'Khác',
};

// Get status color based on progress
const getStatusColor = (status?: 'SAFE' | 'WARNING' | 'EXCEEDED') => {
  switch (status) {
    case 'EXCEEDED':
      return Colors.danger;
    case 'WARNING':
      return Colors.accent;
    default:
      return Colors.success;
  }
};

const BudgetListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { budgetState, getAllBudgetsWithProgress, deleteBudget, getAlerts } =
    useBudget(authContext?.userToken || null);
  const {
    getBudgetAlerts,
    loading: aiLoading,
    error: aiError,
    result: aiResult,
  } = useAI(authContext?.userToken || null);
  const [alertMonth, setAlertMonth] = React.useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
  });
  const [alertResult, setAlertResult] = React.useState<{
    alerts?: Array<{
      category: string;
      message: string;
      spent: number;
      budget: number;
      alertLevel: 'warning' | 'danger';
    }>;
  } | null>(null);
  const [alerting, setAlerting] = React.useState(false);

  const handleBudgetAlerts = async () => {
    setAlerting(true);
    setAlertResult(null);
    try {
      const res = await getBudgetAlerts({ month: alertMonth });
      setAlertResult(res);
    } catch (err) {
      setAlertResult(null);
    } finally {
      setAlerting(false);
    }
  };

  // Load budgets with progress using new function
  const loadBudgets = useCallback(async () => {
    try {
      await getAllBudgetsWithProgress();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải ngân sách');
    }
  }, [getAllBudgetsWithProgress]);

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [loadBudgets]),
  );

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn muốn xóa ngân sách này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudget(id);
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể xóa ngân sách');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: BudgetWithProgress }) => {
    const progress = item.progress;
    const percentage = progress?.percentage || 0;
    const statusColor = getStatusColor(progress?.status);
    
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('BudgetProgress', {
            budgetId: item.id,
            name: item.name,
          })
        }
      >
        <View style={styles.itemInfo}>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.amountText}>
            {item.limitAmount.toLocaleString()}₫
          </Text>
          <Text style={styles.categoryText}>
            {item.category
              ? CATEGORY_LABELS[item.category] || item.category
              : 'Khác'}
          </Text>
          
          {/* Progress Bar */}
          {progress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: statusColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: statusColor }]}>
                {progress.totalSpent.toLocaleString()}₫ / {item.limitAmount.toLocaleString()}₫ ({Math.round(percentage)}%)
              </Text>
            </View>
          )}
          
          <Text style={styles.dateText}>
            {item.startDate
              ? new Date(item.startDate).toLocaleDateString('vi-VN')
              : '--'}
            {'  →  '}
            {item.endDate
              ? new Date(item.endDate).toLocaleDateString('vi-VN')
              : '--'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteText}>Xóa</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ngân sách</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleBudgetAlerts}
          >
            <Text style={styles.addButtonText}>
              {alerting || aiLoading ? 'Đang kiểm tra...' : 'Cảnh báo AI'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { marginLeft: 8 }]}
            onPress={() => navigation.navigate('CreateBudget')}
          >
            <Text style={styles.addButtonText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {budgetState.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={budgetState.budgets}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Chưa có ngân sách nào.</Text>
            }
          />
          {/* Kết quả cảnh báo ngân sách AI */}
          {alertResult && alertResult.alerts && (
            <View
              style={{
                marginTop: 16,
                backgroundColor: '#fffbe6',
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                style={{ color: '#b26a00', fontWeight: '700', marginBottom: 6 }}
              >
                Cảnh báo ngân sách (AI):
              </Text>
              {alertResult.alerts.length === 0 ? (
                <Text style={{ color: '#b26a00' }}>
                  Không có cảnh báo nào trong tháng này.
                </Text>
              ) : (
                alertResult.alerts.map((item, idx) => (
                  <View key={idx} style={{ marginBottom: 6 }}>
                    <Text
                      style={{
                        color: item.alertLevel === 'danger' ? 'red' : '#b26a00',
                        fontWeight: '600',
                      }}
                    >
                      {CATEGORY_LABELS[item.category] || item.category}:{' '}
                      {item.message} (Đã chi: {item.spent.toLocaleString()}₫ /
                      Ngân sách: {item.budget.toLocaleString()}₫)
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
          {aiError && (
            <Text style={{ color: 'red', marginTop: 8 }}>{aiError}</Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  itemContainer: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadow.soft,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  deleteButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.danger,
    borderRadius: Radius.md,
  },
  deleteText: {
    color: '#FFF',
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: Colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default BudgetListScreen;
