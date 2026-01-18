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

type DebtType = 'owe' | 'owed';

type Debt = {
  id: string;
  person: string;
  amount: number;
  note?: string;
  type: DebtType;
};

const DebtsScreen: React.FC = () => {
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<DebtType>('owe');
  const [debts, setDebts] = useState<Debt[]>([]);

  const totals = useMemo(() => {
    return debts.reduce(
      (acc, item) => {
        if (item.type === 'owe') acc.owe += item.amount;
        else acc.owed += item.amount;
        return acc;
      },
      { owe: 0, owed: 0 },
    );
  }, [debts]);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_debts');
      if (stored) {
        setDebts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load debts');
    }
  };

  const saveDebts = async (newDebts: Debt[]) => {
    try {
      await AsyncStorage.setItem('user_debts', JSON.stringify(newDebts));
    } catch (e) {
      console.error('Failed to save debts');
    }
  };

  const handleAdd = () => {
    if (!person.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập người liên quan.');
      return;
    }
    const amountValue = Number(amount);
    if (!amountValue || Number.isNaN(amountValue)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền.');
      return;
    }
    const newDebt: Debt = {
      id: `${Date.now()}`,
      person: person.trim(),
      amount: amountValue,
      note: note.trim(),
      type,
    };
    const updatedDebts = [newDebt, ...debts];
    setDebts(updatedDebts);
    saveDebts(updatedDebts);
    
    setPerson('');
    setAmount('');
    setNote('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nợ</Text>
      <Text style={styles.subtitle}>Quản lý các khoản phải trả/phải thu.</Text>

      <View style={styles.formCard}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, type === 'owe' && styles.toggleActive]}
            onPress={() => setType('owe')}
          >
            <Text
              style={[
                styles.toggleText,
                type === 'owe' && styles.toggleTextActive,
              ]}
            >
              Tôi nợ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              type === 'owed' && styles.toggleActive,
              styles.toggleButtonLast,
            ]}
            onPress={() => setType('owed')}
          >
            <Text
              style={[
                styles.toggleText,
                type === 'owed' && styles.toggleTextActive,
              ]}
            >
              Người khác nợ
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder="Người liên quan"
          placeholderTextColor={Colors.textMuted}
          value={person}
          onChangeText={setPerson}
          style={styles.input}
        />
        <TextInput
          placeholder="Số tiền"
          placeholderTextColor={Colors.textMuted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          placeholder="Ghi chú (tuỳ chọn)"
          placeholderTextColor={Colors.textMuted}
          value={note}
          onChangeText={setNote}
          style={styles.input}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Thêm khoản nợ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Tôi nợ</Text>
          <Text style={styles.summaryValue}>
            {totals.owe.toLocaleString()}₫
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View>
          <Text style={styles.summaryLabel}>Người khác nợ</Text>
          <Text style={styles.summaryValue}>
            {totals.owed.toLocaleString()}₫
          </Text>
        </View>
      </View>

      <FlatList
        data={debts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có khoản nợ nào.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.person}</Text>
              <Text
                style={[
                  styles.typeBadge,
                  item.type === 'owe'
                    ? styles.badgeDanger
                    : styles.badgeSuccess,
                ]}
              >
                {item.type === 'owe' ? 'Tôi nợ' : 'Người khác nợ'}
              </Text>
            </View>
            <Text style={styles.cardValue}>
              {item.amount.toLocaleString()}₫
            </Text>
            {item.note ? (
              <Text style={styles.cardNote}>{item.note}</Text>
            ) : null}
          </View>
        )}
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
    marginBottom: Spacing.xs,
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
  toggleRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  toggleButtonLast: {
    marginRight: 0,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleTextActive: {
    color: '#FFF',
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
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  cardNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeDanger: {
    backgroundColor: Colors.danger,
  },
  badgeSuccess: {
    backgroundColor: Colors.success,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
});

export default DebtsScreen;
