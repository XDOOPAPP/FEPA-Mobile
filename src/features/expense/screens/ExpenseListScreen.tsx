import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useExpense } from '../../../common/hooks/useMVVM';
import { useAI } from '../../../common/hooks/useAI';
import { AuthContext } from '../../../store/AuthContext';
import { Expense } from '../../../core/models/Expense';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { GlassCard } from '../../../components/design-system/GlassCard';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống',
  transport: 'Đi lại',
  shopping: 'Mua sắm',
  utilities: 'Hóa đơn',
  entertainment: 'Giải trí',
  healthcare: 'Sức khỏe',
  other: 'Khác',
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;

const normalizeCategory = (value?: string) => {
  if (!value) return 'other';
  const lower = value.toLowerCase();
  const keyMatch = CATEGORY_KEYS.find(key => key.toLowerCase() === lower);
  if (keyMatch) return keyMatch;
  const labelMatch = CATEGORY_KEYS.find(key => CATEGORY_LABELS[key].toLowerCase() === lower);
  if (labelMatch) return labelMatch;
  return value;
};

type DateFilter = 'all' | 'today' | '7d' | '30d';

type ListRow =
  | { type: 'header'; id: string; title: string }
  | { type: 'item'; id: string; expense: Expense };

const ExpenseListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { 
    expenseState, 
    deleteExpense, 
    loadMoreExpenses, 
    getExpensesFiltered 
  } = useExpense(authContext?.userToken || null);
  
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  
  const {
    detectAnomalies,
    loading: aiLoading,
    detectAnomaliesResult: aiResult,
  } = useAI(authContext?.userToken || null);

  const [detecting, setDetecting] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState<any>(null);

  const loadExpenses = useCallback(async () => {
    try {
      await getExpensesFiltered({ page: 1, limit: 20 });
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải chi tiêu');
    }
  }, [getExpensesFiltered]);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses]),
  );

  const handleDetectAnomalies = async () => {
    setDetecting(true);
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];
      const res = await detectAnomalies({ from, to });
      setAnomalyResult(res);
      if (res?.anomalies?.length === 0) {
        Alert.alert('AI Thông báo', 'Không có chi tiêu bất thường nào trong tháng này!');
      }
    } catch (err) {
      // Ignore
    } finally {
      setDetecting(false);
    }
  };

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
            Alert.alert('Lỗi', error.message || 'Không thể xóa');
          }
        },
      },
    ]);
  };

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const normalizedQuery = query.trim().toLowerCase();

    const inRange = (date: Date) => {
      if (dateFilter === 'all') return true;
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (dateFilter === 'today') return date >= startOfToday;
      const days = dateFilter === '7d' ? 7 : 30;
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - (days - 1));
      return date >= start;
    };

    return (expenseState.expenses || [])
      .filter(expense => {
        const spentAt = new Date(expense.spentAt);
        if (!inRange(spentAt)) return false;
        
        const normalizedCat = normalizeCategory(expense.category);
        if (category !== 'all' && normalizedCat !== category) return false;
        
        if (!normalizedQuery) return true;
        const amountText = expense.amount.toString();
        const categoryText = CATEGORY_LABELS[normalizedCat] || expense.category || '';
        const descriptionText = expense.description || '';
        const haystack = `${amountText} ${categoryText} ${descriptionText}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime());
  }, [expenseState.expenses, query, category, dateFilter]);

  const listRows = useMemo<ListRow[]>(() => {
    const rows: ListRow[] = [];
    let lastDate = '';
    filteredExpenses.forEach(expense => {
      const dateKey = new Date(expense.spentAt).toLocaleDateString('vi-VN');
      if (dateKey !== lastDate) {
        rows.push({ type: 'header', id: `header-${dateKey}`, title: dateKey });
        lastDate = dateKey;
      }
      rows.push({ type: 'item', id: expense.id, expense });
    });
    return rows;
  }, [filteredExpenses]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredExpenses]);

  const renderItem = ({ item }: { item: ListRow }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.groupHeaderContainer}>
           <View style={styles.groupHeaderLine} />
           <Text style={styles.groupHeader}>{item.title}</Text>
        </View>
      );
    }

    const expense = item.expense;
    const normalizedCat = normalizeCategory(expense.category);
    
    return (
      <GlassCard style={styles.itemCard}>
        <TouchableOpacity 
          style={styles.itemContent}
          onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
             <Text style={styles.iconText}>{expense.category ? expense.category[0].toUpperCase() : '?'}</Text>
          </View>
          
          <View style={styles.itemInfo}>
            <Text style={styles.itemCategory}>
              {CATEGORY_LABELS[normalizedCat] || expense.category || 'Khác'}
            </Text>
            {expense.description ? (
              <Text style={styles.itemDesc} numberOfLines={1}>{expense.description}</Text>
            ) : null}
          </View>
          
          <View style={styles.itemAmountContainer}>
            <Text style={styles.itemAmount}>
              {expense.amount.toLocaleString()}₫
            </Text>
            <View style={styles.actionRow}>
               <TouchableOpacity 
                 onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })}
                 hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
               >
                  <Text style={styles.actionText}>Sửa</Text>
               </TouchableOpacity>
               <View style={styles.vDivider} />
               <TouchableOpacity 
                 onPress={() => handleDelete(expense.id)}
                 hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
               >
                  <Text style={[styles.actionText, {color: Colors.danger}]}>Xóa</Text>
               </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </GlassCard>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      {/* Search & Header */}
      <View style={styles.header}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
             <Text style={styles.screenTitle}>Lịch sử chi tiêu</Text>
             <TouchableOpacity 
                style={{marginLeft: 12, padding: 4}}
                onPress={() => navigation.navigate('ExpenseStats')}
             >
                <Ionicons name="stats-chart" size={24} color={Colors.primary} />
             </TouchableOpacity>
         </View>
         
         <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateExpense')}
          >
            <LinearGradient
               colors={Colors.primaryGradient}
               style={styles.addButtonGradient}
            >
               <Text style={styles.addButtonText}>+ Thêm mới</Text>
            </LinearGradient>
          </TouchableOpacity>
      </View>

      <GlassCard style={styles.searchContainer}>
         <TextInput
           placeholder="Tìm kiếm giao dịch..."
           placeholderTextColor={Colors.textMuted}
           style={styles.searchInput}
           value={query}
           onChangeText={setQuery}
         />
         <TouchableOpacity 
            onPress={handleDetectAnomalies}
            disabled={detecting || aiLoading}
            style={styles.aiButton}
         >
            {detecting ? <ActivityIndicator color={Colors.primary} size="small"/> : <Text>🤖</Text>}
         </TouchableOpacity>
      </GlassCard>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
           {['all', 'today', '7d', '30d'].map((key) => (
              <TouchableOpacity
                 key={key}
                 style={[styles.chip, dateFilter === key && styles.chipActive]}
                 onPress={() => setDateFilter(key as DateFilter)}
              >
                 <Text style={[styles.chipText, dateFilter === key && styles.chipTextActive]}>
                    {key === 'all' ? 'Tất cả' : key === 'today' ? 'Hôm nay' : key === '7d' ? '7 ngày' : '30 ngày'}
                 </Text>
              </TouchableOpacity>
           ))}
           <View style={styles.vDividerLarge} />
           {CATEGORY_KEYS.map((key) => (
              <TouchableOpacity
                 key={key}
                 style={[styles.chip, category === key && styles.chipActive]}
                 onPress={() => setCategory(category === key ? 'all' : key)}
              >
                 <Text style={[styles.chipText, category === key && styles.chipTextActive]}>
                    {CATEGORY_LABELS[key]}
                 </Text>
              </TouchableOpacity>
           ))}
        </ScrollView>
      </View>

      {/* Summary Filter Bar */}
      <View style={styles.summaryBar}>
         <Text style={styles.summaryText}>
            Tổng cộng: <Text style={styles.summaryValue}>{totalAmount.toLocaleString()}₫</Text>
         </Text>
         <Text style={styles.summaryCount}>{filteredExpenses.length} giao dịch</Text>
      </View>
      
      {/* Anomalies Alert */}
      {anomalyResult && anomalyResult.anomalies && anomalyResult.anomalies.length > 0 && (
         <View style={styles.anomalyAlert}>
            <Text style={styles.anomalyTitle}>⚠️ Phát hiện {anomalyResult.anomalies.length} bất thường</Text>
            {anomalyResult.anomalies.map((item: any, idx: number) => (
               <Text key={idx} style={styles.anomalyText}>
                  • {CATEGORY_LABELS[item.category] || item.category}: {item.amount.toLocaleString()}₫ (Cao hơn dự kiến)
               </Text>
            ))}
         </View>
      )}

      {/* List */}
      <FlatList
        data={listRows}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReached={() => !expenseState.isLoading && loadMoreExpenses()}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
           <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
           </View>
        }
        ListFooterComponent={expenseState.isLoading ? <ActivityIndicator color={Colors.primary} style={{margin: 20}} /> : <View style={{height: 100}} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  screenTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  addButton: {
    ...Shadow.glow,
  },
  addButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  addButtonText: {
    ...Typography.bodyBold,
    color: '#FFF',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    paddingHorizontal: 12,
    marginBottom: Spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    height: '100%',
    ...Typography.body,
  },
  aiButton: {
    padding: 8,
  },
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterContent: {
    paddingRight: Spacing.lg,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.cardElevated,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  vDividerLarge: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  summaryText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  summaryValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  summaryCount: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  anomalyAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: Spacing.md,
  },
  anomalyTitle: {
    ...Typography.captionBold,
    color: Colors.danger,
    marginBottom: 4,
  },
  anomalyText: {
    ...Typography.caption,
    color: Colors.danger,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 40,
  },
  groupHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  groupHeaderLine: {
    width: 20,
    height: 1,
    backgroundColor: Colors.border,
    marginRight: 8,
  },
  groupHeader: {
    ...Typography.captionBold,
    color: Colors.textMuted,
  },
  itemCard: {
    marginBottom: 8,
    padding: 12,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    ...Typography.h3,
    color: Colors.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemCategory: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  itemDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemAmountContainer: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  vDivider: {
    width: 1,
    height: 10,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
});

export default ExpenseListScreen;
