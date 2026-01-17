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
import { useExpense } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { Expense } from '../../../core/models/Expense';
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

const ExpenseListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { expenseState, getExpenses, deleteExpense } = useExpense(
    authContext?.userToken || null,
  );

  const loadExpenses = useCallback(async () => {
    try {
      await getExpenses();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải chi tiêu');
    }
  }, [getExpenses]);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses]),
  );

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn muốn xóa chi tiêu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(id);
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể xóa chi tiêu');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.amountText}>{item.amount.toLocaleString()}₫</Text>
        <Text style={styles.categoryText}>
          {item.category
            ? CATEGORY_LABELS[item.category] || item.category
            : 'Khác'}
        </Text>
        {item.description ? (
          <Text style={styles.noteText}>{item.description}</Text>
        ) : null}
        <Text style={styles.dateText}>
          {new Date(item.spentAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Danh sách chi tiêu</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => navigation.navigate('ExpenseStats')}
          >
            <Text style={styles.statsButtonText}>Thống kê</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateExpense')}
          >
            <Text style={styles.addButtonText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {expenseState.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={expenseState.expenses}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có chi tiêu nào.</Text>
          }
        />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statsButton: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  statsButtonText: {
    color: Colors.textPrimary,
    fontWeight: '600',
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
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  noteText: {
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

export default ExpenseListScreen;
