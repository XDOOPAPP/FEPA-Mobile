import React, { useCallback, useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

const CATEGORY_ICONS: Record<string, string> = {
  food: 'restaurant',
  transport: 'car',
  shopping: 'cart',
  utilities: 'flash',
  entertainment: 'game-controller',
  healthcare: 'medical',
  other: 'ellipsis-horizontal',
};

const CATEGORY_COLORS: Record<string, string> = {
  food: '#F59E0B',
  transport: '#3B82F6',
  shopping: '#EC4899',
  utilities: '#8B5CF6',
  entertainment: '#10B981',
  healthcare: '#EF4444',
  other: '#6B7280',
};

// Get status color based on progress
const getStatusColor = (status?: 'SAFE' | 'WARNING' | 'EXCEEDED') => {
  switch (status) {
    case 'EXCEEDED':
      return Colors.danger;
    case 'WARNING':
      return Colors.warning;
    default:
      return Colors.success;
  }
};

const BudgetListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { budgetState, getAllBudgetsWithProgress, deleteBudget } =
    useBudget(authContext?.userToken || null);
  const {
    assistantChat,
    loading: aiLoading,
  } = useAI(authContext?.userToken || null);
  
  const [aiInsight, setAiInsight] = React.useState('');
  const [analyzing, setAnalyzing] = React.useState(false);

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

  // Calculate summary stats
  const totalBudget = budgetState.budgets.reduce(
    (sum, b) => sum + (b.limitAmount || 0),
    0,
  );
  const totalSpent = budgetState.budgets.reduce(
    (sum, b) => sum + (b.progress?.totalSpent || 0),
    0,
  );
  const remaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleAnalyzeBudget = async () => {
    setAnalyzing(true);
    setAiInsight('');
    try {
      const budgetDetails = budgetState.budgets.map(b => 
        `${b.name} (${CATEGORY_LABELS[b.category] || b.category}): ${b.progress?.totalSpent}/${b.limitAmount}`
      ).join(', ');

      const prompt = `Phân tích tình hình tài chính của tôi:
Tổng ngân sách: ${totalBudget.toLocaleString()}đ
Đã chi tiêu: ${totalSpent.toLocaleString()}đ (chiếm ${overallPercentage.toFixed(1)}%)
Chi tiết các khoản: ${budgetDetails}

Hãy đóng vai chuyên gia tài chính, đưa ra nhận xét ngắn gọn, cảnh báo rủi ro nếu có và cho 1 lời khuyên hữu ích bằng tiếng Việt. Trả lời dưới 100 từ.`;

      const res = await assistantChat({ message: prompt });
      if (res && res.reply) {
        setAiInsight(res.reply);
      } else {
        setAiInsight('Hiện tại AI chưa đưa ra được nhận xét. Bạn hãy thử lại sau nhé.');
      }
    } catch (error) {
       setAiInsight('Không thể kết nối với chuyên gia AI lúc này. Vui lòng kiểm tra mạng.');
    } finally {
      setAnalyzing(false);
    }
  };

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

  const renderBudgetCard = ({ item }: { item: BudgetWithProgress }) => {
    const progress = item.progress;
    const percentage = progress?.percentage || 0;
    const statusColor = getStatusColor(progress?.status);
    const categoryIcon = CATEGORY_ICONS[item.category || 'other'] || 'ellipsis-horizontal';
    const categoryColor = CATEGORY_COLORS[item.category || 'other'] || Colors.textMuted;

    return (
      <TouchableOpacity
        style={styles.budgetCard}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('BudgetProgress', {
            budgetId: item.id,
            name: item.name,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
            <Ionicons name={categoryIcon} size={24} color={categoryColor} />
          </View>
          
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.budgetName}>{item.name}</Text>
            <Text style={styles.budgetCategory}>
              {item.category ? CATEGORY_LABELS[item.category] || item.category : 'Khác'}
            </Text>
          </View>

          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteIcon}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {/* Progress Section */}
        {progress && (
          <View style={styles.progressSection}>
            <View style={styles.amountRow}>
              <View>
                <Text style={styles.amountLabel}>Đã chi</Text>
                <Text style={[styles.amountValue, { color: statusColor }]}>
                  {progress.totalSpent.toLocaleString()}₫
                </Text>
              </View>
              <View style={styles.amountDivider} />
              <View>
                <Text style={styles.amountLabel}>Hạn mức</Text>
                <Text style={styles.amountValue}>
                  {item.limitAmount.toLocaleString()}₫
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={
                    progress.status === 'EXCEEDED'
                      ? ['#EF4444', '#DC2626']
                      : progress.status === 'WARNING'
                      ? ['#F59E0B', '#D97706']
                      : ['#10B981', '#059669']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(percentage, 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.percentageText, { color: statusColor }]}>
                {Math.round(percentage)}%
              </Text>
            </View>

            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <Ionicons
                name={
                  progress.status === 'EXCEEDED'
                    ? 'alert-circle'
                    : progress.status === 'WARNING'
                    ? 'warning'
                    : 'checkmark-circle'
                }
                size={14}
                color={statusColor}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {progress.status === 'EXCEEDED'
                  ? 'Vượt mức'
                  : progress.status === 'WARNING'
                  ? 'Cảnh báo'
                  : 'An toàn'}
              </Text>
            </View>
          </View>
        )}

        {/* Date Range */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.dateText}>
            {item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '--'}
            {' → '}
            {item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '--'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <LinearGradient
          colors={Colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryGradient}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tổng ngân sách</Text>
              <Text style={styles.summaryValue}>{totalBudget.toLocaleString()}₫</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Còn lại</Text>
              <Text style={styles.summaryValue}>{remaining.toLocaleString()}₫</Text>
            </View>
          </View>
          
          <View style={styles.overallProgressBar}>
            <View
              style={[
                styles.overallProgressFill,
                {
                  width: `${Math.min(overallPercentage, 100)}%`,
                  backgroundColor: overallPercentage > 80 ? '#EF4444' : '#FFF',
                },
              ]}
            />
          </View>
          <Text style={styles.overallPercentage}>
            {Math.round(overallPercentage)}% đã sử dụng
          </Text>
        </LinearGradient>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => navigation.navigate('CreateBudget')}
        >
          <Ionicons name="add-circle" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Tạo ngân sách</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={handleAnalyzeBudget}
          disabled={analyzing || aiLoading}
        >
          <Ionicons
            name={analyzing || aiLoading ? 'hourglass' : 'analytics'}
            size={20}
            color={Colors.primary}
          />
          <Text style={[styles.actionButtonText, { color: Colors.primary }]}>
            {analyzing || aiLoading ? 'Đang phân tích...' : 'Phân tích AI'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* AI Insight Result */}
      {aiInsight ? (
        <View style={styles.aiInsightCard}>
            <View style={styles.aiHeader}>
                <LinearGradient colors={['#7C3AED', '#A78BFA']} style={styles.aiIconBg}>
                   <Ionicons name="sparkles" size={16} color="#FFF" />
                </LinearGradient>
                <Text style={styles.aiTitle}>Góc nhìn chuyên gia AI</Text>
            </View>
            <Text style={styles.aiText}>{aiInsight}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Danh sách ngân sách</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {budgetState.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={budgetState.budgets}
          keyExtractor={item => item.id}
          renderItem={renderBudgetCard}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyText}>Chưa có ngân sách nào</Text>
              <Text style={styles.emptySubText}>
                Tạo ngân sách để theo dõi chi tiêu
              </Text>
            </View>
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
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  summaryContainer: {
    marginBottom: Spacing.lg,
  },
  summaryGradient: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overallPercentage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
  },
  secondaryAction: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadow.soft,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  aiInsightCard: {
    backgroundColor: '#F5F3FF', // Very light violet
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  aiIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
  },
  aiText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  budgetCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  budgetCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  deleteIcon: {
    padding: Spacing.xs,
  },
  progressSection: {
    marginBottom: Spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  amountDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: Spacing.xs,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
  },
});

export default BudgetListScreen;
