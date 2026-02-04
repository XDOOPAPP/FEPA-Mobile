import React, { useCallback, useContext, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DatePicker from 'react-native-date-picker';
import { useBudget, useAI, useExpense } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { BudgetWithProgress } from '../../../core/models/Budget';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

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
  if (v.includes('sức khỏe') || v.includes('y tế') || v.includes('thuốc') || v === 'health') return 'healthcare';
  
  return 'other';
};



const BudgetListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { budgetState, getAllBudgetsWithProgress } =
    useBudget(authContext?.userToken || null);
  const { getExpensesFiltered } = useExpense(authContext?.userToken || null);
  const { getBudgetAlerts, loading: aiLoading } = useAI(authContext?.userToken || null);
  
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);
  const [processedBudgets, setProcessedBudgets] = useState<BudgetWithProgress[]>([]);
  const [totals, setTotals] = useState({ budget: 0, spent: 0 });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const totalBudget = totals.budget;
  const totalSpent = totals.spent;
  const remaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const loadData = useCallback(async () => {
    try {
      const budgets = await getAllBudgetsWithProgress();
      
      // Also fetch all expenses for this month to fix the server discrepancy
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59).toISOString().split('T')[0];
      
      const expenseRes = await getExpensesFiltered({ fromDate: firstDay, toDate: lastDay });
      const expenses = expenseRes.data || [];
      
      // Manually calculate progress for each budget
      const budgetsList = budgets || budgetState.budgets;
      const budgetsWithFix = (budgetsList || []).map(b => {
        const catKey = normalizeCategory(b.category);
        const relevantExpenses = expenses.filter((e: any) => normalizeCategory(e.category) === catKey);
        const spent = relevantExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const limit = b.limitAmount || 1;
        
        return {
          ...b,
          progress: {
            totalSpent: spent,
            remaining: limit - spent,
            percentage: (spent / limit) * 100,
            status: spent > limit ? 'EXCEEDED' : spent > limit * 0.8 ? 'WARNING' : 'SAFE'
          }
        } as BudgetWithProgress;
      });
      
      setProcessedBudgets(budgetsWithFix);
      
      const tBudget = budgetsWithFix.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
      const tSpent = budgetsWithFix.reduce((sum, b) => sum + (b.progress?.totalSpent || 0), 0);
      setTotals({ budget: tBudget, spent: tSpent });

      // --- AI Alerts Section (Inside same scope) ---
      const monthStr = currentMonth.toISOString().substring(0, 7);
      try {
        const res = await getBudgetAlerts({ month: monthStr });
        if (res && res.alerts && res.alerts.length > 0) {
          setAiAlerts(res.alerts);
        } else {
          generateLocalAlerts(budgetsWithFix);
        }
      } catch (aiErr) {
        console.log('AI Service unreachable, using local analytics fallback');
        generateLocalAlerts(budgetsWithFix);
      }
    } catch (error: any) {
      console.log('Error loading budget data:', error.message || error);
      if (error.response) {
        console.log('Server responded with:', error.response.status, error.response.data);
      }
    }
  }, [getAllBudgetsWithProgress, getExpensesFiltered, getBudgetAlerts, budgetState.budgets, currentMonth]);

  const generateLocalAlerts = (budgets: BudgetWithProgress[]) => {
    const localAlerts = budgets
      .filter(b => b.progress && (b.progress.percentage > 80))
      .map(b => {
        const isExceeded = b.progress!.percentage > 100;
        return {
          category: b.category,
          budget: b.limitAmount,
          spent: b.progress!.totalSpent,
          alertLevel: isExceeded ? 'danger' : 'warning',
          message: isExceeded 
            ? `Cảnh báo! Bạn đã vượt giới hạn ngân sách ${b.name} tháng này.`
            : `Bạn đã dùng ${Math.round(b.progress!.percentage)}% ngân sách ${b.name}. Hãy cân nhắc trước khi chi tiêu thêm.`
        };
      });
    setAiAlerts(localAlerts);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const renderBudgetCard = ({ item }: { item: BudgetWithProgress }) => {
    const progress = item.progress;
    const percentage = progress?.percentage || 0;
    const status = progress?.status || 'SAFE';
    
    // Determine colors based on status
    const isExceeded = percentage > 100 || status === 'EXCEEDED';
    const isWarning = percentage > 80 || status === 'WARNING';
    
    const progressColor = isExceeded ? '#EF4444' : isWarning ? '#F59E0B' : Colors.primary;
    const cardBorderColor = isExceeded ? '#FEE2E2' : isWarning ? '#FEF3C7' : 'transparent';
    const cardBgColor = isExceeded ? '#FEF2F2' : isWarning ? '#FFFBEB' : Colors.card;
    
    return (
      <TouchableOpacity
        style={[
          styles.budgetListItem, 
          { backgroundColor: cardBgColor, borderWidth: isExceeded || isWarning ? 1 : 0, borderColor: cardBorderColor }
        ]}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('BudgetProgress', {
            budgetId: item.id,
            name: item.name,
            budgetData: item, // Pass full budget data for immediate display
          })
        }
      >
        <View style={styles.progressCircleContainer}>
          <View style={[styles.progressCirclePlaceholder, { borderColor: progressColor + '30' }]}>
             <View style={[styles.progressCircleFill, { height: `${Math.min(percentage, 100)}%`, backgroundColor: progressColor + '25' }]} />
             <Text style={[styles.progressCircleText, { color: progressColor }]}>{Math.round(percentage)}%</Text>
          </View>
        </View>
        
        <View style={styles.itemContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            {isExceeded && (
              <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>VƯỢT MỨC</Text>
              </View>
            )}
            {!isExceeded && isWarning && (
              <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>SẮP HẾT</Text>
              </View>
            )}
          </View>
          <Text style={[styles.itemSubtitle, isExceeded && { color: '#EF4444' }]}>
            {isExceeded ? `Vượt: ${Math.abs(progress?.remaining || 0).toLocaleString()}₫` : `Còn: ${(progress?.remaining || 0).toLocaleString()}₫`}
          </Text>
          <View style={styles.limitRow}>
            <Ionicons name="wallet-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.limitText}>HẠN MỨC: {(item.limitAmount / 1000000).toFixed(1)}M</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <View style={styles.topRow}>
        <View style={styles.profileBadge}>
           <Ionicons name="person-circle" size={44} color={Colors.primary} />
        </View>
        <View style={styles.headerTextContainer}>
           <Text style={styles.headerTitle}>Tổng quan Ngân sách</Text>
           <Text style={styles.headerSubtitle}>
             {currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear() ? 'Tháng này' : 'Thời gian'} • {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
           </Text>
        </View>
        <TouchableOpacity style={styles.calendarButton} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Budget Card */}
      <LinearGradient
        colors={Colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mainCard}
      >
        <Text style={styles.mainCardLabel}>Tổng ngân sách còn lại</Text>
        <Text style={styles.mainCardValue}>{remaining.toLocaleString()} <Text style={styles.currency}>₫</Text></Text>
        
        <View style={styles.cardStatsRow}>
          <View style={styles.cardStatItem}>
            <Text style={styles.cardStatLabel}>Đã chi: {totalSpent.toLocaleString()} ₫</Text>
          </View>
          <View style={styles.cardStatItem}>
            <Text style={styles.cardStatLabel}>Hạn mức: {totalBudget.toLocaleString()} ₫</Text>
          </View>
        </View>

        <View style={styles.mainProgressBar}>
          <View style={[styles.mainProgressFill, { width: `${Math.min(overallPercentage, 100)}%` }]} />
        </View>

        <Text style={styles.motivationalText}>
          {overallPercentage > 100 ? "Bạn đã vượt hạn mức chi tiêu!" : overallPercentage > 80 ? "Sắp chạm ngưỡng ngân sách!" : "Bạn đang quản lý chi tiêu rất tốt!"}
        </Text>
      </LinearGradient>

      {/* AI Insights Section */}
      {aiAlerts.length > 0 && (
        <View style={styles.aiSection}>
           <View style={styles.aiHeader}>
              <View style={styles.aiTitleRow}>
                <Ionicons name="sparkles" size={16} color={Colors.primary} />
                <Text style={styles.aiTitle}>Phân tích từ FEPA AI+</Text>
              </View>
              {aiLoading && <ActivityIndicator size="small" color={Colors.primary} />}
           </View>
           
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.aiScroll}>
              {aiAlerts.map((alert, index) => (
                <View key={index} style={[styles.aiCard, alert.alertLevel === 'danger' ? styles.aiCardDanger : styles.aiCardWarning]}>
                   <Ionicons 
                    name={alert.alertLevel === 'danger' ? 'alert-circle' : 'warning'} 
                    size={20} 
                    color={alert.alertLevel === 'danger' ? '#EF4444' : '#F59E0B'} 
                   />
                   <Text style={styles.aiCardText} numberOfLines={2}>{alert.message}</Text>
                </View>
              ))}
           </ScrollView>
        </View>
      )}

      <View style={styles.listHeaderRow}>
        <Text style={styles.listSectionTitle}>Ngân sách theo mục</Text>
        <TouchableOpacity>
           <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {budgetState.isLoading && budgetState.budgets.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={processedBudgets}
            keyExtractor={item => item.id}
            renderItem={renderBudgetCard}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={() => (
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.demoButton}
                  onPress={() => {
                    DeviceEventEmitter.emit('notification_received', {
                      title: "⚠️ Cảnh báo ngân sách Ăn uống",
                      message: "Bạn đã tiêu xài 1.700.000₫, chạm ngưỡng 85% hạn mức của tháng này rồi nhé!",
                      type: "BUDGET_WARNING"
                    });
                  }}
                >
                  <Ionicons name="flask-outline" size={16} color="#64748B" />
                  <Text style={styles.demoButtonText}>Kiểm tra thông báo cảnh báo (Demo)</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => navigation.navigate('CreateBudget', { currentMonth })}
          >
            <LinearGradient
              colors={Colors.primaryGradient}
              style={styles.fabGradient}
            >
               <Ionicons name="add" size={32} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <DatePicker
        modal
        open={showDatePicker}
        date={currentMonth}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setCurrentMonth(date);
        }}
        onCancel={() => {
          setShowDatePicker(false);
        }}
        confirmText="Xác nhận"
        cancelText="Hủy"
        title="Chọn tháng"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 120, 
  },
  headerSection: {
    padding: Spacing.lg,
    paddingTop: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileBadge: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCard: {
    borderRadius: Radius.xl,
    padding: 24,
    ...Shadow.glow,
  },
  mainCardLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '600',
  },
  mainCardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  currency: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  mainProgressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mainProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  motivationalText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aiSection: {
    marginTop: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  aiScroll: {
    paddingLeft: 0,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginRight: 12,
    width: 250,
    gap: 10,
    borderWidth: 1,
  },
  aiCardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  aiCardDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  aiCardText: {
    fontSize: 11,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 16,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.primary,
  },
  budgetListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginBottom: 12,
    padding: 16,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  progressCircleContainer: {
    width: 54,
    height: 54,
    marginRight: 16,
  },
  progressCirclePlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 4,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  progressCircleFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  progressCircleText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  limitText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...Shadow.lg,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  demoButtonText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default BudgetListScreen;
