import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

interface CategoryData {
  category: string;
  label: string;
  total: number;
  percentage: number;
  color: string;
}

interface Props {
  data: CategoryData[];
  isLoading?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#FF6B6B',
  transport: '#4ECDC4',
  shopping: '#FFE66D',
  utilities: '#95E1D3',
  entertainment: '#A8E6CF',
  healthcare: '#DCD6F7',
  other: '#B8B8B8',
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

const CategoryBreakdownChart: React.FC<Props> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Chi tiêu theo danh mục</Text>
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonBar} />
          <View style={styles.skeletonBar} />
          <View style={styles.skeletonBar} />
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Chi tiêu theo danh mục</Text>
        <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu</Text>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chi tiêu theo danh mục</Text>
      
      {/* Stacked bar */}
      <View style={styles.stackedBar}>
        {data.map((item, index) => (
          <View
            key={item.category}
            style={[
              styles.barSegment,
              {
                width: `${item.percentage}%`,
                backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other,
                borderTopLeftRadius: index === 0 ? Radius.md : 0,
                borderBottomLeftRadius: index === 0 ? Radius.md : 0,
                borderTopRightRadius: index === data.length - 1 ? Radius.md : 0,
                borderBottomRightRadius: index === data.length - 1 ? Radius.md : 0,
              },
            ]}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {data.map((item) => (
          <View key={item.category} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other },
              ]}
            />
            <View style={styles.legendInfo}>
              <Text style={styles.legendLabel}>
                {CATEGORY_LABELS[item.category] || item.category}
              </Text>
              <Text style={styles.legendValue}>
                {item.total.toLocaleString()}₫ ({Math.round(item.percentage)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng cộng</Text>
        <Text style={styles.totalValue}>{total.toLocaleString()}₫</Text>
      </View>
    </View>
  );
};

// Helper function to process expense data
export const processExpensesByCategory = (
  expenses: Array<{ category?: string; amount: number }>
): CategoryData[] => {
  const categoryTotals: Record<string, number> = {};
  
  expenses.forEach((expense) => {
    const cat = expense.category?.toLowerCase() || 'other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + expense.amount;
  });

  const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  
  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      label: CATEGORY_LABELS[category] || category,
      total: amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
    }))
    .sort((a, b) => b.total - a.total);
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadow.soft,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    gap: Spacing.sm,
  },
  skeletonBar: {
    height: 24,
    backgroundColor: Colors.border,
    borderRadius: Radius.sm,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  stackedBar: {
    height: 24,
    flexDirection: 'row',
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  barSegment: {
    height: '100%',
  },
  legendContainer: {
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  legendInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
  },
});

export default CategoryBreakdownChart;
