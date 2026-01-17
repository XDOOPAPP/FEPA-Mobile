import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../../store/AuthContext';
import { useExpense } from '../../../common/hooks/useMVVM';
import {
  ExpenseGroupBy,
  ExpenseSummary,
} from '../../../core/models/ExpenseSummary';
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

type RangeKey = 'this_month' | 'last_month' | 'all';

const formatCurrency = (value: number) => `${value.toLocaleString()}₫`;

const toIso = (date: Date) => date.toISOString();

const getRangeParams = (range: RangeKey) => {
  const now = new Date();

  if (range === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toIso(from), to: toIso(now) };
  }

  if (range === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from: toIso(from), to: toIso(to) };
  }

  return {};
};

const ExpenseStatsScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const { getExpenseSummary, expenseState } = useExpense(
    authContext?.userToken || null,
  );

  const [range, setRange] = useState<RangeKey>('this_month');
  const [groupBy, setGroupBy] = useState<ExpenseGroupBy>('day');
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  const effectiveGroupBy = useMemo<ExpenseGroupBy>(() => {
    if (range === 'all' && groupBy === 'day') {
      return 'month';
    }
    return groupBy;
  }, [range, groupBy]);

  const loadSummary = useCallback(async () => {
    try {
      const params = getRangeParams(range);
      const data = await getExpenseSummary({
        ...params,
        groupBy: effectiveGroupBy,
      });
      setSummary(data);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải thống kê');
    }
  }, [getExpenseSummary, range, effectiveGroupBy]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary]),
  );

  const maxCategory = Math.max(
    1,
    ...(summary?.byCategory.map(item => item.total) || [1]),
  );
  const maxPeriod = Math.max(
    1,
    ...(summary?.byTimePeriod?.map(item => item.total) || [1]),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.sectionHeader}>
        <Text style={styles.title}>Thống kê chi tiêu</Text>
      </View>

      <View style={styles.filterRow}>
        {(
          [
            { key: 'this_month', label: 'Tháng này' },
            { key: 'last_month', label: 'Tháng trước' },
            { key: 'all', label: 'Tất cả' },
          ] as Array<{ key: RangeKey; label: string }>
        ).map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.chip, range === item.key && styles.chipActive]}
            onPress={() => {
              setRange(item.key);
              if (item.key === 'all') {
                setGroupBy('month');
              }
            }}
          >
            <Text
              style={[
                styles.chipText,
                range === item.key && styles.chipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {(
          [
            { key: 'day', label: 'Ngày' },
            { key: 'week', label: 'Tuần' },
            { key: 'month', label: 'Tháng' },
          ] as Array<{ key: ExpenseGroupBy; label: string }>
        ).map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.chip,
              effectiveGroupBy === item.key && styles.chipActive,
            ]}
            onPress={() => setGroupBy(item.key)}
          >
            <Text
              style={[
                styles.chipText,
                effectiveGroupBy === item.key && styles.chipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {expenseState.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tổng chi</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(summary?.total ?? 0)}
            </Text>
            <Text style={styles.summarySub}>
              {summary?.count ?? 0} giao dịch
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Theo danh mục</Text>
            {summary?.byCategory?.length ? (
              summary.byCategory.map(item => {
                const ratio = item.total / maxCategory;
                const safeRatio = Math.max(0, Math.min(1, ratio));
                return (
                  <View key={item.category} style={styles.metricRow}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>
                        {CATEGORY_LABELS[item.category] || item.category}
                      </Text>
                      <Text style={styles.metricValue}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, { flex: safeRatio }]}
                      />
                      <View style={{ flex: 1 - safeRatio }} />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Chưa có dữ liệu.</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Theo thời gian</Text>
            {summary?.byTimePeriod?.length ? (
              summary.byTimePeriod.map(item => {
                const ratio = item.total / maxPeriod;
                const safeRatio = Math.max(0, Math.min(1, ratio));
                return (
                  <View key={item.period} style={styles.metricRow}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>{item.period}</Text>
                      <Text style={styles.metricValue}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressFill, { flex: safeRatio }]}
                      />
                      <View style={{ flex: 1 - safeRatio }} />
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Chưa có dữ liệu.</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  summarySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  metricRow: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.soft,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metricValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
});

export default ExpenseStatsScreen;
