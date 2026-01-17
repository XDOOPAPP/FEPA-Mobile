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
import { AuthContext } from '../../../store/AuthContext';
import { Budget } from '../../../core/models/Budget';
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

const BudgetListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { budgetState, getBudgets, deleteBudget } = useBudget(
    authContext?.userToken || null,
  );

  const loadBudgets = useCallback(async () => {
    try {
      await getBudgets();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải ngân sách');
    }
  }, [getBudgets]);

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

  const renderItem = ({ item }: { item: Budget }) => (
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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ngân sách</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateBudget')}
        >
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {budgetState.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={budgetState.budgets}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có ngân sách nào.</Text>
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
