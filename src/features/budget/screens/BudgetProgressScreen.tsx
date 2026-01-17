import React, { useCallback, useContext, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { AuthContext } from '../../../store/AuthContext';
import { useBudget } from '../../../common/hooks/useMVVM';
import {
  BudgetWithProgress,
  BudgetProgress,
} from '../../../core/models/Budget';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

interface RouteParams {
  budgetId: string;
  name?: string;
}

const BudgetProgressScreen: React.FC = () => {
  const route = useRoute<any>();
  const { budgetId, name } = route.params as RouteParams;
  const authContext = useContext(AuthContext);
  const { getBudgetProgress, budgetState } = useBudget(
    authContext?.userToken || null,
  );
  const [budget, setBudget] = useState<BudgetWithProgress | null>(null);

  const loadProgress = useCallback(async () => {
    try {
      const data = await getBudgetProgress(budgetId);
      setBudget(data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải tiến độ ngân sách');
    }
  }, [budgetId, getBudgetProgress]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress]),
  );

  const progress: BudgetProgress | undefined = budget?.progress;
  const percent = Math.min(Math.max(progress?.percentage ?? 0, 0), 100);

  return (
    <View style={styles.container}>
      {budgetState.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          <Text style={styles.title}>
            {name || budget?.name || 'Ngân sách'}
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Giới hạn</Text>
            <Text style={styles.amount}>
              {(budget?.limitAmount ?? 0).toLocaleString()}₫
            </Text>

            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
              </View>
              <Text style={styles.progressText}>{percent.toFixed(0)}%</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Đã chi</Text>
                <Text style={styles.metricValue}>
                  {(progress?.totalSpent ?? 0).toLocaleString()}₫
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Còn lại</Text>
                <Text style={styles.metricValue}>
                  {(progress?.remaining ?? 0).toLocaleString()}₫
                </Text>
              </View>
            </View>

            <Text
              style={
                progress?.status === 'EXCEEDED'
                  ? styles.statusExceeded
                  : styles.statusSafe
              }
            >
              {progress?.status === 'EXCEEDED'
                ? 'Vượt ngân sách'
                : 'Trong giới hạn'}
            </Text>
          </View>
        </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  label: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  progressWrap: {
    marginTop: Spacing.lg,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    marginTop: Spacing.xs,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  statusSafe: {
    marginTop: Spacing.lg,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  statusExceeded: {
    marginTop: Spacing.lg,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
});

export default BudgetProgressScreen;
