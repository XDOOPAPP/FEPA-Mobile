import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { AuthContext } from '../../../store/AuthContext';
import { budgetRepository } from '../../../core/repositories/BudgetRepository';

const { width } = Dimensions.get('window');

interface PlanningFeature {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  route: string;
  stats?: {
    value: string;
    label: string;
  };
}

const PLANNING_FEATURES: PlanningFeature[] = [
  {
    id: 'budgets',
    title: 'Ngân sách',
    subtitle: 'Quản lý ngân sách theo danh mục',
    icon: 'wallet',
    gradient: ['#667eea', '#764ba2'],
    route: 'Budgets',
  },
  {
    id: 'goals',
    title: 'Mục tiêu tiết kiệm',
    subtitle: 'Theo dõi tiến độ mục tiêu tài chính',
    icon: 'trophy',
    gradient: ['#f093fb', '#f5576c'],
    route: 'SavingGoals',
  },
  {
    id: 'debts',
    title: 'Quản lý nợ',
    subtitle: 'Theo dõi khoản nợ phải thu/trả',
    icon: 'card',
    gradient: ['#4facfe', '#00f2fe'],
    route: 'Debts',
  },
];

const FINANCE_TIPS = [
  "Quy tắc 50/30/20: 50% cho nhu cầu, 30% cho sở thích, 20% để tiết kiệm và trả nợ.",
  "Đừng mua sắm khi cảm xúc đang không ổn định (quá vui hoặc quá buồn).",
  "Quy tắc 24h: Với món đồ đắt tiền, hãy đợi 1 ngày rồi mới quyết định mua.",
  "Luôn ưu tiên trả các khoản nợ có lãi suất cao trước.",
  "Hãy 'trả cho mình trước': Trích một khoản tiết kiệm ngay khi vừa nhận lương.",
  "Kiểm tra lại các gói đăng ký hàng tháng (Netflix, Spotify...) và hủy nếu ít dùng.",
  "Mang cơm đi làm có thể giúp bạn tiết kiệm hàng triệu đồng mỗi tháng.",
  "Thiết lập ngân sách cụ thể cho từng danh mục giúp bạn tránh vung tay quá trán.",
  "Đừng để tiền nằm im. Khi đã có quỹ dự phòng, hãy tìm hiểu về đầu tư.",
  "Ghi chép chi tiêu hàng ngày giúp bạn nhận ra những khoản lãng phí nhỏ nhặt.",
  "So sánh giá ở ít nhất 3 nơi trước khi mua một món đồ giá trị lớn.",
  "Tận dụng thẻ thành viên và mã giảm giá, nhưng đừng mua chỉ vì nó đang giảm giá.",
  "Đặt mục tiêu tài chính cụ thể (số tiền, thời hạn) để có động lực phấn đấu.",
  "Quỹ dự phòng khẩn cấp nên đủ chi tiêu cho 3-6 tháng sinh hoạt.",
  "Tự nấu ăn tại nhà không chỉ tiết kiệm mà còn tốt cho sức khỏe hơn.",
];

const PlanningScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const [budgetStats, setBudgetStats] = useState({
    totalBudget: 0,
    totalSpent: 0,
    activeBudgets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentTip, setCurrentTip] = useState(FINANCE_TIPS[0]);

  useEffect(() => {
    loadBudgetStats();
    changeTip();
  }, []);

  const changeTip = () => {
    const randomIndex = Math.floor(Math.random() * FINANCE_TIPS.length);
    setCurrentTip(FINANCE_TIPS[randomIndex]);
  };

  const loadBudgetStats = async () => {
    try {
      setLoading(true);
      const budgets = await budgetRepository.getAllBudgetsWithProgress();
      
      const total = budgets.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
      const spent = budgets.reduce((sum, b: any) => sum + (b.progress?.totalSpent || 0), 0);
      
      setBudgetStats({
        totalBudget: total,
        totalSpent: spent,
        activeBudgets: budgets.filter(b => b.isActive !== false).length,
      });
    } catch (error) {
      console.error('Error loading budget stats:', error);
      setBudgetStats({
        totalBudget: 0,
        totalSpent: 0,
        activeBudgets: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderFeatureCard = (feature: PlanningFeature) => {
    const percentage = budgetStats.totalBudget > 0 
      ? Math.round((budgetStats.totalSpent / budgetStats.totalBudget) * 100)
      : 0;

    return (
      <TouchableOpacity
        key={feature.id}
        style={styles.featureCard}
        onPress={() => navigation.navigate(feature.route)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={feature.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureGradient}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={feature.icon} size={32} color="#FFF" />
          </View>
          
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
            
            {feature.id === 'budgets' && !loading && (
              <View style={styles.statsRow}>
                <Text style={styles.statsValue}>
                  {budgetStats.activeBudgets} ngân sách
                </Text>
                <Text style={styles.statsPercentage}>
                  {percentage}% đã dùng
                </Text>
              </View>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderQuickStats = () => {
    const remaining = budgetStats.totalBudget - budgetStats.totalSpent;

    return (
      <View style={styles.quickStatsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color={Colors.success} />
          <Text style={styles.statValue}>
            {budgetStats.totalBudget.toLocaleString()}₫
          </Text>
          <Text style={styles.statLabel}>Tổng ngân sách</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trending-down" size={24} color={Colors.danger} />
          <Text style={styles.statValue}>
            {budgetStats.totalSpent.toLocaleString()}₫
          </Text>
          <Text style={styles.statLabel}>Đã chi tiêu</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
          <Text style={styles.statValue}>
            {remaining.toLocaleString()}₫
          </Text>
          <Text style={styles.statLabel}>Còn lại</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={Colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Kế hoạch</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý và theo dõi mục tiêu của bạn
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        {!loading && renderQuickStats()}

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Các tính năng</Text>
          {PLANNING_FEATURES.map(renderFeatureCard)}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <TouchableOpacity 
            style={styles.tipCard} 
            onPress={changeTip}
            activeOpacity={0.7}
          >
            <Ionicons name="bulb" size={24} color={Colors.warning} />
            <View style={styles.tipContent}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={styles.tipTitle}>Mẹo tài chính mỗi ngày</Text>
                <Ionicons name="refresh" size={16} color={Colors.textMuted} />
              </View>
              <Text style={styles.tipText}>
                {currentTip}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 10,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: 4,
    alignItems: 'center',
    ...Shadow.card,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  featureCard: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  featureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statsValue: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginRight: Spacing.sm,
  },
  statsPercentage: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  tipsSection: {
    marginBottom: Spacing.lg,
  },
  tipCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    ...Shadow.soft,
  },
  tipContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14, // Increased size for readability
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

export default PlanningScreen;
