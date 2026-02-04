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
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
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
  health: 'Sức khỏe',
  other: 'Khác',
};

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant-outline',
  transport: 'car-outline',
  shopping: 'cart-outline',
  utilities: 'flash-outline',
  entertainment: 'film-outline',
  health: 'medkit-outline',
  other: 'grid-outline',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',        // Amber
  transport: '#3B82F6',   // Blue
  shopping: '#EC4899',    // Pink
  utilities: '#8B5CF6',   // Violet
  entertainment: '#10B981', // Emerald
  health: '#EF4444',  // Red
  other: '#64748B',       // Slate
};

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const normalizeCategory = (value?: string) => {
  if (!value) return 'other';
  const v = value.toLowerCase();
  
  // Directly check if it's already a key
  if (CATEGORY_KEYS.includes(v as any)) {
    return v;
  }
  
  // Map Vietnamese and variations to keys
  if (v.includes('ăn') || v.includes('uống') || v.includes('thực phẩm') || v.includes('food')) return 'food';
  if (v.includes('đi') || v.includes('chuyển') || v.includes('xe') || v.includes('transport')) return 'transport';
  if (v.includes('mua') || v.includes('sắm') || v.includes('shopping')) return 'shopping';
  if (v.includes('hóa đơn') || v.includes('tiện ích') || v.includes('utilities')) return 'utilities';
  if (v.includes('giải trí') || v.includes('chơi')) return 'entertainment';
  if (v.includes('sức khỏe') || v.includes('y tế') || v.includes('thuốc')) return 'health';
  
  return 'other';
};

const formatDescription = (desc?: string, category?: string) => {
  if (!desc) return 'Không có ghi chú';
  const catKey = normalizeCategory(category);
  const label = CATEGORY_LABELS[catKey] || 'chi tiêu';
  const d = desc.toLowerCase();
  
  // If it's a generic unaccented description from AI, fix it
  if (d.includes('chi tieu') || d.includes('an uong') || d.includes('mua sam') || d.includes('di chuyen')) {
     return `Chi tiêu ${label.toLowerCase()}`;
  }
  return desc;
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
    getExpensesFiltered,
    getExpenses
  } = useExpense(authContext?.userToken || null);
  
  const route = useRoute<any>();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(route.params?.category || 'all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Update category if route params change
  React.useEffect(() => {
    if (route.params?.category) {
      setCategory(route.params.category);
    }
  }, [route.params?.category]);
  
  const {
    detectAnomalies,
    loading: aiLoading,
  } = useAI(authContext?.userToken || null);

  const [detecting, setDetecting] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState<any>(null);

  const loadExpenses = useCallback(async () => {
    try {
      // Use getExpenses to get both local and server data immediately
      await getExpenses();
    } catch (error: any) {
      console.log('Load error:', error);
    }
  }, [getExpenses]);

  // Debounce Search
  React.useEffect(() => {
     const timer = setTimeout(() => {
         loadExpenses();
     }, 500);
     return () => clearTimeout(timer);
  }, [loadExpenses]);

  // Refresh when screen focus (e.g. returning from CreateExpense)
  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
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

  const removeVietnameseTones = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  };

  const filteredExpenses = useMemo(() => {
    let list = [...(expenseState.expenses || [])];

    // 1. Filter by Date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') {
      list = list.filter(e => {
        const spentAt = new Date(e.spentAt);
        return spentAt >= today;
      });
    } else if (dateFilter === '7d') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      list = list.filter(e => new Date(e.spentAt) >= sevenDaysAgo);
    } else if (dateFilter === '30d') {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      list = list.filter(e => new Date(e.spentAt) >= thirtyDaysAgo);
    }

    // 2. Filter by Category
    if (category !== 'all') {
      list = list.filter(e => normalizeCategory(e.category) === category);
    }

    // 3. Filter by Search Query (with Vietnamese tone removal)
    if (query.trim()) {
      const q = removeVietnameseTones(query.toLowerCase());
      list = list.filter(e => {
        const desc = removeVietnameseTones((e.description || '').toLowerCase());
        const catLabel = removeVietnameseTones((CATEGORY_LABELS[normalizeCategory(e.category)] || '').toLowerCase());
        return desc.includes(q) || catLabel.includes(q);
      });
    }

    // 4. Sort by date descending
    return list.sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime());
  }, [expenseState.expenses, dateFilter, category, query]);

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
        activeOpacity={0.8}
        style={styles.itemWrapper}
      >
        <View style={styles.itemCard}>
            <View style={[styles.iconBox, { backgroundColor: `${categoryColor}15` }]}>
               <Ionicons name={CATEGORY_ICONS[normalizedCat] || 'receipt'} size={22} color={categoryColor} />
            </View>
            
            <View style={styles.itemInfo}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemCategory}>
                  {CATEGORY_LABELS[normalizedCat] || expense.category || 'Khác'}
                </Text>
                <Text style={[styles.itemAmount, { color: categoryColor }]}>
                  - {expense.amount?.toLocaleString()}₫
                </Text>
              </View>
              
              <View style={styles.itemBottomRow}>
                <Text style={styles.itemDesc} numberOfLines={1}>
                  {formatDescription(expense.description, expense.category)}
                </Text>
                
                <View style={styles.itemDateBox}>
                   <Ionicons name="time-outline" size={10} color={Colors.textMuted} />
                   <Text style={styles.itemDateText}>
                      {new Date(expense.spentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                   </Text>
                </View>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={16} color={Colors.border} style={{marginLeft: 8}} />
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = useMemo(() => (
    <>
      {/* Background Mesh */}
      <View style={styles.bgGlow} />

      {/* Header Area */}
      <View style={styles.header}>
         <View>
            <Text style={styles.screenTitle}>Lịch sử chi tiêu</Text>
            <Text style={styles.screenSubtitle}>Quản lý tài chính cá nhân</Text>
         </View>
         <View style={styles.headerActions}>
             <TouchableOpacity 
                style={styles.headerIconBtn}
                onPress={handleExport}
             >
                <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
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
             autoCorrect={false}
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

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
         <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('VoiceInput')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}>
               <Ionicons name="mic" size={26} color="#0EA5E9" />
            </View>
            <Text style={styles.quickActionLabel}>Giọng nói</Text>
         </TouchableOpacity>
         
         <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('OCRScan')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
               <Ionicons name="scan" size={26} color="#8B5CF6" />
            </View>
            <Text style={styles.quickActionLabel}>Scan HĐ</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('AssistantChat')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
               <Ionicons name="sparkles" size={26} color="#10B981" />
            </View>
            <Text style={styles.quickActionLabel}>Trợ lý AI</Text>
         </TouchableOpacity>

         <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('ReceiptGallery')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFEDD5' }]}>
               <Ionicons name="images" size={26} color="#F59E0B" />
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

      {/* Summary Card */}
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.summaryCard}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
         <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>TỔNG CHI TIÊU</Text>
            <Text style={styles.summaryValue}>{totalAmount.toLocaleString()}₫</Text>
         </View>
         <View style={styles.summaryBadge}>
            <Text style={styles.summaryCount}>{filteredExpenses.length} giao dịch</Text>
         </View>
      </LinearGradient>
      
      {/* Anomalies Alert */}
      {anomalyResult && anomalyResult.anomalies && anomalyResult.anomalies.length > 0 && (
         <GlassCard style={styles.anomalyAlert}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
               <Ionicons name="alert-circle" size={20} color={Colors.danger} />
               <Text style={styles.anomalyTitle}>Chi tiêu bất thường</Text>
            </View>
            {anomalyResult.anomalies.slice(0, 2).map((item: any, idx: number) => {
               const expense = item.expense || {};
               return (
               <View key={idx} style={styles.anomalyItem}>
                  <Text style={styles.anomalyText}>
                     {CATEGORY_LABELS[normalizeCategory(expense.category)] || expense.category || 'Khác'}
                  </Text>
                  <Text style={styles.anomalyAmount}>{expense.amount?.toLocaleString()}₫</Text>
               </View>
               );
            })}
         </GlassCard>
      )}
    </>
  ), [query, dateFilter, category, totalAmount, filteredExpenses.length, anomalyResult, detecting, aiLoading, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <FlatList
        data={listRows}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateExpense')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#0EA5E9', '#0284C7']}
          style={styles.fabGradient}
          start={{x: 0.2, y: 0.2}} end={{x: 0.8, y: 0.8}}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bgGlow: {
    position: 'absolute',
    top: -150,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: '#0EA5E9',
    opacity: 0.1,
    borderRadius: SCREEN_WIDTH,
    transform: [{ scale: 1.5 }],
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    flex: 1,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },
  addButtonGradient: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Increased to avoid being hidden by the TabBar
    right: 20,
    ...Shadow.glow,
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 999,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    ...Shadow.soft,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  aiButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionBtn: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 60) / 4,
  },
  quickActionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#FFF',
    ...Shadow.soft,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterContainer: {
    marginBottom: 24,
  },
  filterContent: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },
  chipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFF',
  },
  summaryCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    ...Shadow.glow,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  itemWrapper: {
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    ...Shadow.soft,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.4)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDesc: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  itemDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  itemDateText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  groupHeaderContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  groupHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  anomalyAlert: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    padding: 16,
    marginBottom: 24,
    borderRadius: 16,
  },
  anomalyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E11D48',
    marginLeft: 8,
  },
  anomalyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 28,
    marginBottom: 4,
  },
  anomalyText: {
    fontSize: 12,
    color: '#9F1239',
    fontWeight: '600',
  },
  anomalyAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  vDividerLarge: {
     width: 1,
     height: 24,
     backgroundColor: '#E2E8F0',
     marginHorizontal: 4,
  },
});

export default ExpenseListScreen;
