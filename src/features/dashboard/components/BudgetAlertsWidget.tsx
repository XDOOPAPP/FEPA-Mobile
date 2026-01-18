import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { BudgetWithProgress } from '../../../core/models/Budget';

interface Props {
  alerts: BudgetWithProgress[];
  onViewBudget?: (budgetId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Ăn uống',
  transport: 'Đi lại',
  shopping: 'Mua sắm',
  utilities: 'Hóa đơn',
  entertainment: 'Giải trí',
  healthcare: 'Sức khỏe',
  other: 'Khác',
};

const BudgetAlertsWidget: React.FC<Props> = ({ alerts, onViewBudget }) => {
  if (!alerts || alerts.length === 0) {
    return null; // Don't show widget if no alerts
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>⚠️ Cảnh báo ngân sách</Text>
        <Text style={styles.badge}>{alerts.length}</Text>
      </View>

      {alerts.map((budget) => {
        const isExceeded = budget.progress?.status === 'EXCEEDED';
        const percentage = Math.round(budget.progress?.percentage || 0);

        return (
          <TouchableOpacity
            key={budget.id}
            style={[
              styles.alertItem,
              isExceeded ? styles.alertItemDanger : styles.alertItemWarning,
            ]}
            onPress={() => onViewBudget?.(budget.id)}
            activeOpacity={0.85}
          >
            <View style={styles.alertInfo}>
              <Text style={styles.alertName}>{budget.name}</Text>
              <Text style={styles.alertCategory}>
                {budget.category
                  ? CATEGORY_LABELS[budget.category] || budget.category
                  : 'Chung'}
              </Text>
            </View>

            <View style={styles.alertStats}>
              <Text
                style={[
                  styles.alertPercentage,
                  isExceeded ? styles.textDanger : styles.textWarning,
                ]}
              >
                {percentage}%
              </Text>
              <Text style={styles.alertAmount}>
                {(budget.progress?.totalSpent || 0).toLocaleString()}₫ /{' '}
                {budget.limitAmount.toLocaleString()}₫
              </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(percentage, 100)}%`,
                    backgroundColor: isExceeded ? Colors.danger : Colors.accent,
                  },
                ]}
              />
            </View>

            <Text
              style={[
                styles.statusText,
                isExceeded ? styles.textDanger : styles.textWarning,
              ]}
            >
              {isExceeded
                ? `Vượt ${(
                    (budget.progress?.totalSpent || 0) - budget.limitAmount
                  ).toLocaleString()}₫`
                : `Còn ${(budget.progress?.remaining || 0).toLocaleString()}₫`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...Shadow.soft,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.danger,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  alertItem: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  alertItemWarning: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  alertItemDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  alertInfo: {
    marginBottom: Spacing.xs,
  },
  alertName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  alertCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  alertStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  alertPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  alertAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textWarning: {
    color: Colors.accent,
  },
  textDanger: {
    color: Colors.danger,
  },
});

export default BudgetAlertsWidget;
