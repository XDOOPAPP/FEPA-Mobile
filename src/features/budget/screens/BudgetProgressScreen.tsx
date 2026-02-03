import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../../store/AuthContext';
import { useBudget, useExpense } from '../../../common/hooks/useMVVM';
import { BudgetWithProgress } from '../../../core/models/Budget';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant-outline',
  transport: 'car-outline',
  shopping: 'cart-outline',
  utilities: 'flash-outline',
  entertainment: 'film-outline',
  healthcare: 'medkit-outline',
  other: 'grid-outline',
};

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống',
  transport: 'Đi lại',
  shopping: 'Mua sắm',
  utilities: 'Hóa đơn',
  entertainment: 'Giải trí',
  healthcare: 'Sức khỏe',
  other: 'Khác',
};

const normalizeCategory = (value?: string) => {
  if (!value) return 'other';
  const v = value.toLowerCase();
  
  // Directly check if it's already a key
  if (['food', 'transport', 'shopping', 'utilities', 'entertainment', 'healthcare', 'other'].includes(v)) {
    return v;
  }
  
  // Map Vietnamese and variations to keys
  if (v.includes('ăn') || v.includes('uống') || v.includes('thực phẩm') || v.includes('food')) return 'food';
  if (v.includes('đi') || v.includes('chuyển') || v.includes('xe') || v.includes('transport')) return 'transport';
  if (v.includes('mua') || v.includes('sắm') || v.includes('shopping')) return 'shopping';
  if (v.includes('hóa đơn') || v.includes('tiện ích') || v.includes('utilities')) return 'utilities';
  if (v.includes('giải trí') || v.includes('chơi')) return 'entertainment';
  if (v.includes('sức khỏe') || v.includes('y tế') || v.includes('thuốc')) return 'healthcare';
  
  return 'other';
};

const formatDescription = (desc?: string, category?: string) => {
  if (!desc) return '';
  const catKey = normalizeCategory(category);
  const label = CATEGORY_LABELS[catKey] || 'chi tiêu';
  const d = desc.toLowerCase();
  
  // If it's a generic unaccented description from AI, fix it
  if (d.includes('chi tieu') || d.includes('an uong') || d.includes('mua sam') || d.includes('di chuyen')) {
     return `Chi tiêu ${label.toLowerCase()}`;
  }
  return desc;
};

interface RouteParams {
  budgetId: string;
  name?: string;
  budgetData?: BudgetWithProgress;
}

const BudgetProgressScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { budgetId, name: initialName, budgetData: passedBudget } = route.params as RouteParams;
  const authContext = useContext(AuthContext);
  const { getBudgetProgress, deleteBudget, budgetState } = useBudget(
    authContext?.userToken || null,
  );
  const { getExpensesFiltered } = useExpense(authContext?.userToken || null);

  // Use passed budget data as initial state for immediate display
  const [budget, setBudget] = useState<BudgetWithProgress | null>(passedBudget || null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      let data = await getBudgetProgress(budgetId);
      
      // Fallback 1: If API returns null, use passed budget data
      if (!data && passedBudget) {
        data = passedBudget;
      }
      
      // Fallback 2: If still null, try to find budget from cached list
      if (!data && budgetState.budgets.length > 0) {
        const foundBudget = budgetState.budgets.find((b: any) => b.id === budgetId);
        if (foundBudget) {
          data = foundBudget as BudgetWithProgress;
        }
      }
      
      // If we still have no data, create a minimal object
      if (!data) {
        console.log('No budget data found for ID:', budgetId);
        setBudget(null);
        return;
      }
      
      // If we got budget data, try to fetch transactions
      if (data?.category) {
        try {
          const catKey = normalizeCategory(data.category);
          const expenses = await getExpensesFiltered({ 
            category: catKey,
            fromDate: data.startDate,
            toDate: data.endDate
          });
          // Extra safety: double check category locally if backend returned everything
          const expenseList = (expenses.data || []).filter((e: any) => 
            normalizeCategory(e.category) === catKey
          );
          setTransactions(expenseList);
          
          // FE Fallback: If progress is 0 but we have transactions, calculate manually
          if ((!data.progress || data.progress.totalSpent === 0) && expenseList.length > 0) {
            const manualSpent = expenseList.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            const limit = Number(data.limitAmount);
            const percentage = limit > 0 ? (manualSpent / limit) * 100 : 0;
            
            data = {
              ...data,
              progress: {
                totalSpent: manualSpent,
                remaining: limit - manualSpent,
                percentage: parseFloat(percentage.toFixed(2)),
                status: manualSpent > limit ? 'EXCEEDED' : manualSpent > limit * 0.8 ? 'WARNING' : 'SAFE'
              }
            };
          }
        } catch (expError) {
          console.log('Error fetching expenses for budget:', expError);
        }
      }
      
      // Use progress from cached data if available
      if (!data.progress && (data as any).progress) {
        data.progress = (data as any).progress;
      }
      
      setBudget(data);
    } catch (error: any) {
      console.log('Error loading budget details:', error);
      
      // Last resort: use passed data or cached state
      if (passedBudget) {
        setBudget(passedBudget);
      } else {
        const cachedBudget = budgetState.budgets.find((b: any) => b.id === budgetId);
        if (cachedBudget) {
          setBudget(cachedBudget as BudgetWithProgress);
        }
      }
    }
  }, [budgetId, getBudgetProgress, getExpensesFiltered, budgetState.budgets, passedBudget]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa ngân sách này không? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
             try {
               await deleteBudget(budgetId);
               navigation.goBack();
             } catch (error: any) {
               Alert.alert('Lỗi', error.message || 'Không thể xóa ngân sách');
             }
          }
        },
      ]
    );
  };

  const progressLine = budget?.progress;
  // Always calculate total spent locally from transactions for visual consistency
  const localSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const localLimit = budget?.limitAmount || 0;
  const localPercent = localLimit > 0 ? (localSpent / localLimit) * 100 : 0;
  
  // Use locally calculated values for the UI
  const spent = localSpent;
  const percent = Math.max(localPercent, 0);

  const renderTransaction = (item: any) => {
    const catKey = normalizeCategory(item.category);
    return (
      <View style={styles.transactionCard} key={item.id || Math.random().toString()}>
        <View style={styles.transactionIconBox}>
          <Ionicons name={CATEGORY_ICONS[catKey] || 'receipt-outline'} size={20} color={Colors.primary} />
        </View>
        <View style={styles.transactionMain}>
           <Text style={styles.transactionTitle}>{CATEGORY_LABELS[catKey] || 'Chi tiêu'}</Text>
           <Text style={styles.transactionTime}>
             {(() => {
                const desc = formatDescription(item.description, item.category);
                return desc ? `${desc} • ` : '';
             })()}
             {new Date(item.spentAt || item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.spentAt || item.date).toLocaleDateString('vi-VN')}
           </Text>
        </View>
        <Text style={styles.transactionAmount}>- {item.amount.toLocaleString()}₫</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
           <Text style={styles.headerTitle}>{budget?.name || initialName || 'Chi tiết'}</Text>
           <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }).toUpperCase()}</Text>
        </View>

        <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButtonSmall}
              onPress={() => navigation.navigate('CreateBudget', { budget })}
            >
              <Ionicons name="pencil-outline" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButtonSmall}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Balance Info */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>
            {percent > 100 ? 'Đã vượt ngân sách' : 'Số dư còn lại'}
          </Text>
          <Text style={[
            styles.balanceValue, 
            percent > 100 && { color: '#EF4444' }
          ]}>
            {(() => {
              if (percent > 100) {
                return `${(spent - localLimit).toLocaleString()}₫`;
              }
              return `${(localLimit - spent).toLocaleString()}₫`;
            })()}
          </Text>
          
          <View style={styles.progressRow}>
             <Text style={styles.progressLabel}>Tiến độ chi tiêu</Text>
             <Text style={[
               styles.progressLabel, 
               percent > 100 && { color: '#EF4444', fontWeight: '700' }
             ]}>{Math.round(percent)}%</Text>
          </View>
          <View style={styles.progressBar}>
             <View style={[
               styles.progressFill, 
               { 
                 width: `${Math.min(percent, 100)}%`,
                 backgroundColor: percent > 100 ? '#EF4444' : percent > 80 ? '#F59E0B' : Colors.primary
               }
             ]} />
          </View>
          
          <Text style={[styles.adviceText, percent > 100 && { color: '#EF4444' }]}>
            {percent > 100 
              ? '⚠️ Bạn đã vượt hạn mức ngân sách!' 
              : percent > 80 
                ? '⚡ Sắp chạm ngưỡng, hãy cân nhắc chi tiêu!'
                : 'Bạn đang duy trì chi tiêu khá tốt.'
            }
          </Text>

          <View style={styles.metricGrid}>
              <View style={[styles.metricCard, percent > 100 && { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
                <Text style={styles.metricLabel}>ĐÃ TIÊU</Text>
                <Text style={[styles.metricValue, percent > 100 && { color: '#EF4444' }]}>
                  {spent.toLocaleString()}₫
                </Text>
              </View>
             <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>HẠN MỨC</Text>
                <Text style={styles.metricValue}>{(budget?.limitAmount || 0).toLocaleString()}₫</Text>
             </View>
          </View>
        </View>

        {/* Quick Settings */}
        <TouchableOpacity 
           style={styles.alertOption}
           onPress={() => navigation.navigate('BudgetAlertSettings', { 
            budgetId, 
            budgetName: budget?.name || initialName,
            currentLimit: (budget?.limitAmount || 0).toLocaleString() + '₫',
            remaining: (progressLine?.remaining || 0).toLocaleString() + '₫',
            spent: (progressLine?.totalSpent || 0).toLocaleString() + '₫',
            percentage: percent
          })}
        >
           <View style={styles.alertOptionMain}>
              <View style={styles.alertIconBox}>
                 <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
              </View>
              <View>
                 <Text style={styles.alertTitle}>Cấu hình thông báo</Text>
                 <Text style={styles.alertSubtitle}>Tùy chỉnh ngưỡng cảnh báo chi tiêu</Text>
              </View>
           </View>
           <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* History Section */}
        <View style={styles.historySection}>
            <View style={styles.historyHeader}>
               <Text style={styles.historyTitle}>Lịch sử chi tiêu</Text>
               <TouchableOpacity 
                 onPress={() => navigation.navigate('Transactions', { 
                   screen: 'ExpenseList', 
                   params: { category: normalizeCategory(budget?.category) } 
                 })}
               >
                  <Text style={styles.seeAllText}>Xem tất cả</Text>
               </TouchableOpacity>
            </View>

            <View style={styles.transactionList}>
               {transactions.length > 0 ? (
                 transactions.map(renderTransaction)
               ) : (
                 <View style={styles.emptyHistory}>
                   <Ionicons name="receipt-outline" size={48} color={Colors.border} />
                   <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
                 </View>
               )}
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButtonSmall: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 1,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  balanceSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 24,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    width: '100%',
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  adviceText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  alertOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  alertOptionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  alertSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  historySection: {
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  transactionList: {
    gap: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  transactionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionMain: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyHistory: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});

export default BudgetProgressScreen;
