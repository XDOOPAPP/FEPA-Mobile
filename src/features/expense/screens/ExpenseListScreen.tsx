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
  Linking,
  Platform,
  Share,
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

const CATEGORY_ICONS: Record<string, string> = {
  food: 'fast-food',
  transport: 'car',
  shopping: 'cart',
  utilities: 'flash',
  entertainment: 'game-controller',
  healthcare: 'medkit',
  other: 'pricetag',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',        // Amber
  transport: '#3B82F6',   // Blue
  shopping: '#EC4899',    // Pink
  utilities: '#8B5CF6',   // Violet
  entertainment: '#10B981', // Emerald
  healthcare: '#EF4444',  // Red
  other: '#64748B',       // Slate
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;

const normalizeCategory = (value?: string) => {
  if (!value) return 'other';
  const lower = value.toLowerCase();
  const keyMatch = CATEGORY_KEYS.find(key => key.toLowerCase() === lower);
  if (keyMatch) return keyMatch;
  const labelMatch = CATEGORY_KEYS.find(key => CATEGORY_LABELS[key].toLowerCase() === lower);
  if (labelMatch) return labelMatch;
  return 'other';
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
  } = useAI(authContext?.userToken || null);

  const [detecting, setDetecting] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState<any>(null);

  const loadExpenses = useCallback(async () => {
    try {
      const filters: any = { page: 1, limit: 20 };
      if (query.trim()) filters.search = query.trim();
      if (category !== 'all') filters.category = category;
      
      const now = new Date();
      if (dateFilter === 'today') {
         filters.fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
      } else if (dateFilter === '7d') {
         const d = new Date(); d.setDate(d.getDate() - 7);
         filters.fromDate = d.toISOString().split('T')[0];
      } else if (dateFilter === '30d') {
         const d = new Date(); d.setDate(d.getDate() - 30);
         filters.fromDate = d.toISOString().split('T')[0];
      }

      await getExpensesFiltered(filters);
    } catch (error: any) {
      console.log('Load error:', error);
    }
  }, [category, query, dateFilter, getExpensesFiltered]);

  // Debounce Search
  React.useEffect(() => {
     const timer = setTimeout(() => {
         loadExpenses();
     }, 500);
     return () => clearTimeout(timer);
  }, [loadExpenses]);

  // Remove focus effect to avoid double loading on mount (useEffect above handles it)
  // useFocusEffect(useCallback(() => { loadExpenses(); }, []));

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
    return expenseState.expenses || [];
  }, [expenseState.expenses]);

  const listRows = useMemo<ListRow[]>(() => {
    const rows: ListRow[] = [];
    let lastDate = '';
    filteredExpenses.forEach(expense => {
      const dateKey = new Date(expense.spentAt).toLocaleDateString('vi-VN', {
        weekday: 'long', 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      });
      if (dateKey !== lastDate) {
        rows.push({ type: 'header', id: `header-${dateKey}`, title: dateKey });
        lastDate = dateKey;
      }
      rows.push({ type: 'item', id: expense.id, expense });
    });
    return rows;
  }, [filteredExpenses]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [filteredExpenses]);

  const handleExport = async () => {
    try {
       // Convert filteredExpenses to CSV
       const headers = 'Ngày,Danh mục,Số tiền,Mô tả\n';
       const rows = filteredExpenses.map(e => {
          const date = new Date(e.spentAt).toLocaleDateString('vi-VN');
          const cat = CATEGORY_LABELS[normalizeCategory(e.category)] || e.category;
          const amt = e.amount;
          const desc = (e.description || '').replace(/,/g, ' '); // simple escape
          return `${date},${cat},${amt},${desc}`;
       }).join('\n');
       
       const csvContent = headers + rows;
       
       // Use React Native Share which works on Emulator
       const result = await Share.share({
         title: 'Báo cáo chi tiêu FEPA',
         message: csvContent,
       });

       if (result.action === Share.sharedAction) {
         if (result.activityType) {
           // shared with activity type of result.activityType
         } else {
           // shared
         }
       } else if (result.action === Share.dismissedAction) {
         // dismissed
       }
    } catch (err: any) {
        Alert.alert('Lỗi', 'Không thể xuất báo cáo: ' + err.message);
    }
  };

  const renderItem = ({ item }: { item: ListRow }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.groupHeaderContainer}>
           <Text style={styles.groupHeader}>{item.title}</Text>
        </View>
      );
    }

    const expense = item.expense;
    const normalizedCat = normalizeCategory(expense.category);
    const categoryColor = CATEGORY_COLORS[normalizedCat] || Colors.primary;
    
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })}
        activeOpacity={0.9}
      >
        <GlassCard style={styles.itemCard}>
            <View style={[styles.iconBox, { backgroundColor: `${categoryColor}15` }]}>
               <Ionicons name={CATEGORY_ICONS[normalizedCat] || 'pricetag'} size={20} color={categoryColor} />
            </View>
            
            <View style={styles.itemInfo}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemCategory}>
                  {CATEGORY_LABELS[normalizedCat] || expense.category || 'Khác'}
                </Text>
                <Text style={[styles.itemAmount, { color: categoryColor }]}>
                  {expense.amount?.toLocaleString()}₫
                </Text>
              </View>
              
              <View style={styles.itemBottomRow}>
                <Text style={styles.itemDesc} numberOfLines={1}>
                  {expense.description ? expense.description : 'Không có ghi chú'}
                </Text>
                
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id })} style={styles.actionBtn}>
                    <Ionicons name="create-outline" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={styles.actionSpace} />
                  <TouchableOpacity onPress={() => handleDelete(expense.id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <>
      {/* Header Area */}
      <View style={styles.header}>
         <View>
            <Text style={styles.screenTitle}>Lịch sử chi tiêu</Text>
            <Text style={styles.screenSubtitle}>Quản lý chi tiêu cá nhân</Text>
         </View>
         <View style={{flexDirection: 'row'}}>
             <TouchableOpacity 
                style={[styles.headerIconBtn, { marginRight: 8 }]}
                onPress={handleExport}
             >
                <Ionicons name="download-outline" size={24} color={Colors.textPrimary} />
             </TouchableOpacity>

             <TouchableOpacity 
                style={[styles.headerIconBtn, { marginRight: 8 }]}
                onPress={() => navigation.navigate('ExpenseStats')}
             >
                <Ionicons name="pie-chart-outline" size={24} color={Colors.textPrimary} />
             </TouchableOpacity>
             <TouchableOpacity
              onPress={() => navigation.navigate('CreateExpense')}
            >
              <LinearGradient
                colors={Colors.primaryGradient}
                style={styles.addButtonGradient}
                start={{x: 0, y: 0}} end={{x: 1, y: 1}}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
         </View>
      </View>

      {/* Search & Actions */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
           <Ionicons name="search-outline" size={20} color={Colors.textMuted} style={{marginLeft: 12}}/>
           <TextInput
             placeholder="Tìm kiếm..."
             placeholderTextColor={Colors.textMuted}
             style={styles.searchInput}
             value={query}
             onChangeText={setQuery}
           />
        </View>
        <TouchableOpacity 
           onPress={handleDetectAnomalies}
           disabled={detecting || aiLoading}
           style={styles.aiButton}
        >
           {detecting ? <ActivityIndicator color="#FFF" size="small"/> : <Ionicons name="sparkles" size={20} color="#FFF" />}
        </TouchableOpacity>
      </View>

      {/* Quick Actions - Restored */}
      <View style={styles.quickActionsRow}>
         <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('VoiceInput')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}>
               <Ionicons name="mic" size={24} color="#0EA5E9" />
            </View>
            <Text style={styles.quickActionLabel}>Giọng nói</Text>
         </TouchableOpacity>
         
         <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('OCRScan')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
               <Ionicons name="scan" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.quickActionLabel}>Scan HĐ</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('AssistantChat')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
               <Ionicons name="chatbubbles" size={24} color="#10B981" />
            </View>
            <Text style={styles.quickActionLabel}>Trợ lý AI</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('ReceiptGallery')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFEDD5' }]}>
               <Ionicons name="images" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.quickActionLabel}>Hóa đơn</Text>
         </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
           {['all', 'today', '7d', '30d'].map((key) => (
              <TouchableOpacity
                 key={key}
                 style={[
                    styles.chip, 
                    dateFilter === key && styles.chipActive,
                    dateFilter === key && { borderColor: Colors.primary }
                 ]}
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
                 style={[
                    styles.chip, 
                    category === key && { backgroundColor: `${CATEGORY_COLORS[key]}15`, borderColor: CATEGORY_COLORS[key] }
                 ]}
                 onPress={() => setCategory(category === key ? 'all' : key)}
              >
                 <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {category === key && <Ionicons name={CATEGORY_ICONS[key]} size={14} color={CATEGORY_COLORS[key]} style={{marginRight: 4}} />}
                    <Text style={[
                      styles.chipText, 
                      category === key && { color: CATEGORY_COLORS[key], fontWeight: '700' }
                    ]}>
                        {CATEGORY_LABELS[key]}
                    </Text>
                 </View>
              </TouchableOpacity>
           ))}
        </ScrollView>
      </View>

      {/* Summary Filter Bar */}
      <View style={styles.summaryBar}>
         <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
            <Text style={styles.summaryValue}>{totalAmount.toLocaleString()}₫</Text>
         </View>
         <View style={styles.summaryBadge}>
            <Text style={styles.summaryCount}>{filteredExpenses.length} giao dịch</Text>
         </View>
      </View>
      
      {/* Anomalies Alert */}
      {anomalyResult && anomalyResult.anomalies && anomalyResult.anomalies.length > 0 && (
         <GlassCard style={styles.anomalyAlert}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
               <Ionicons name="warning" size={20} color={Colors.warning} />
               <Text style={styles.anomalyTitle}>Phát hiện bất thường</Text>
            </View>
            {anomalyResult.anomalies.slice(0, 3).map((item: any, idx: number) => {
               const expense = item.expense || {};
               return (
               <View key={idx} style={styles.anomalyItem}>
                  <Text style={styles.anomalyText}>
                     • {CATEGORY_LABELS[expense.category] || expense.category || 'Khác'}: 
                  </Text>
                  <Text style={styles.anomalyAmount}>{expense.amount?.toLocaleString()}₫</Text>
               </View>
               );
            })}
            {anomalyResult.anomalies.length > 3 && (
               <Text style={{ textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>
                  ...và {anomalyResult.anomalies.length - 3} giao dịch khác
               </Text>
            )}
         </GlassCard>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <FlatList
        data={listRows}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        onEndReached={() => !expenseState.isLoading && loadMoreExpenses()}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
           <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              <Text style={styles.emptySubText}>Hãy thêm chi tiêu đầu tiên của bạn</Text>
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
    marginTop: 10,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    // backgroundColor: '#FFF', // Remove white bg
    backgroundColor: 'rgba(0,0,0,0.03)', // Very subtle gray
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1, // Remove border
    // borderColor: Colors.border, 
    marginRight: 4, // Add clearer spacing
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },
  quickActionBtn: {
    alignItems: 'center',
    width: '22%',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...Shadow.soft,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterContent: {
    paddingRight: Spacing.lg,
    alignItems: 'center',
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
  },
  vDividerLarge: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  anomalyAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    marginBottom: Spacing.md,
  },
  anomalyTitle: {
    ...Typography.bodyBold,
    color: Colors.danger,
    marginLeft: 8,
  },
  anomalyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingLeft: 28,
  },
  anomalyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  anomalyAmount: {
    ...Typography.captionBold,
    color: Colors.danger,
  },
  listContent: {
    paddingBottom: 40,
  },
  groupHeaderContainer: {
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  groupHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    flex: 1,
    marginRight: 8,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 6,
    backgroundColor: Colors.background,
    borderRadius: 8,
  },
  actionSpace: {
    width: 2, 
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
});

export default ExpenseListScreen;
