import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
};

const SavingGoalsScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);

  const totals = useMemo(() => {
    return goals.reduce(
      (acc, item) => {
        acc.target += item.target;
        acc.current += item.current;
        return acc;
      },
      { target: 0, current: 0 },
    );
  }, [goals]);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_goals');
      if (stored) {
        setGoals(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load goals');
    }
  };

  const saveGoals = async (newGoals: Goal[]) => {
    try {
      await AsyncStorage.setItem('user_goals', JSON.stringify(newGoals));
    } catch (e) {
      console.error('Failed to save goals');
    }
  };

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên mục tiêu.');
      return;
    }
    const targetValue = Number(target);
    const currentValue = Number(current) || 0;
    if (!targetValue || Number.isNaN(targetValue)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền mục tiêu.');
      return;
    }
    const newGoal: Goal = {
      id: `${Date.now()}`,
      name: name.trim(),
      target: targetValue,
      current: currentValue,
    };
    const updatedGoals = [newGoal, ...goals];
    setGoals(updatedGoals);
    saveGoals(updatedGoals);
    
    setName('');
    setTarget('');
    setCurrent('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mục tiêu tiết kiệm</Text>
      <Text style={styles.subtitle}>Theo dõi tiến độ từng mục tiêu.</Text>

      <View style={styles.formCard}>
        <TextInput
          placeholder="Tên mục tiêu"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <View style={styles.row}>
          <TextInput
            placeholder="Mục tiêu"
            placeholderTextColor={Colors.textMuted}
            value={target}
            onChangeText={setTarget}
            keyboardType="numeric"
            style={[styles.input, styles.inputHalf]}
          />
          <TextInput
            placeholder="Đã có"
            placeholderTextColor={Colors.textMuted}
            value={current}
            onChangeText={setCurrent}
            keyboardType="numeric"
            style={[styles.input, styles.inputHalf, styles.inputHalfLast]}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Thêm mục tiêu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Tổng mục tiêu</Text>
          <Text style={styles.summaryValue}>
            {totals.current.toLocaleString()}₫ /{' '}
            {totals.target.toLocaleString()}₫
          </Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryCount}>{goals.length}</Text>
          <Text style={styles.summaryCountLabel}>mục tiêu</Text>
        </View>
      </View>

      <FlatList
        data={goals}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có mục tiêu nào.</Text>
        }
        renderItem={({ item }) => {
          const progress = Math.min(item.current / item.target, 1);
          const percent = Math.round(progress * 100);
          const remaining = Math.max(item.target - item.current, 0);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{percent}%</Text>
                </View>
              </View>
              <Text style={styles.cardValue}>
                {item.current.toLocaleString()}₫ /{' '}
                {item.target.toLocaleString()}₫
              </Text>
              <Text style={styles.cardHint}>
                Còn lại {remaining.toLocaleString()}₫
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.soft,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    backgroundColor: '#FFF',
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  inputHalfLast: {
    marginRight: 0,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryCount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryCountLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  cardHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.border,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },
});

export default SavingGoalsScreen;
