import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

type DebtType = 'owe' | 'owed';

type Debt = {
  id: string;
  person: string;
  amount: number;
  note?: string;
  type: DebtType;
  dueDate?: string;
  createdAt: string;
};

const DebtsScreen: React.FC = () => {
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<DebtType>('owe');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

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

  const netBalance = totals.owed - totals.owe;

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

    if (editingDebt) {
      // Update existing debt
      const updatedDebts = debts.map(d =>
        d.id === editingDebt.id
          ? { ...d, person: person.trim(), amount: amountValue, note: note.trim(), type }
          : d
      );
      setDebts(updatedDebts);
      saveDebts(updatedDebts);
    } else {
      // Add new debt
      const newDebt: Debt = {
        id: `${Date.now()}`,
        person: person.trim(),
        amount: amountValue,
        note: note.trim(),
        type,
        createdAt: new Date().toISOString(),
      };
      const updatedDebts = [newDebt, ...debts];
      setDebts(updatedDebts);
      saveDebts(updatedDebts);
    }

    resetForm();
    setModalVisible(false);
  };

  const resetForm = () => {
    setPerson('');
    setAmount('');
    setNote('');
    setType('owe');
    setEditingDebt(null);
  };

  const handleEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setPerson(debt.person);
    setAmount(debt.amount.toString());
    setNote(debt.note || '');
    setType(debt.type);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn muốn xóa khoản nợ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          const updatedDebts = debts.filter(d => d.id !== id);
          setDebts(updatedDebts);
          saveDebts(updatedDebts);
        },
      },
    ]);
  };

  const handleMarkPaid = (id: string) => {
    Alert.alert('Xác nhận', 'Đánh dấu khoản nợ này là đã thanh toán?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đã thanh toán',
        onPress: () => {
          const updatedDebts = debts.filter(d => d.id !== id);
          setDebts(updatedDebts);
          saveDebts(updatedDebts);
        },
      },
    ]);
  };

  const renderDebtCard = ({ item }: { item: Debt }) => {
    const isOwe = item.type === 'owe';
    const cardGradient = isOwe ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669'];

    return (
      <TouchableOpacity
        style={styles.debtCard}
        activeOpacity={0.8}
        onPress={() => handleEdit(item)}
      >
        <LinearGradient
          colors={cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.debtGradient}
        >
          <View style={styles.debtHeader}>
            <View style={styles.debtIcon}>
              <Ionicons
                name={isOwe ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={32}
                color="#FFF"
              />
            </View>
            
            <View style={styles.debtInfo}>
              <Text style={styles.debtPerson}>{item.person}</Text>
              <Text style={styles.debtType}>
                {isOwe ? 'Tôi nợ' : 'Người khác nợ'}
              </Text>
            </View>

            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteIconButton}>
              <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          <View style={styles.debtAmount}>
            <Text style={styles.amountLabel}>Số tiền</Text>
            <Text style={styles.amountValue}>{item.amount.toLocaleString()}₫</Text>
          </View>

          {item.note && (
            <View style={styles.noteContainer}>
              <Ionicons name="document-text" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.noteText}>{item.note}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.markPaidButton}
            onPress={() => handleMarkPaid(item.id)}
          >
            <Ionicons name="checkmark-circle" size={16} color="#FFF" />
            <Text style={styles.markPaidText}>Đánh dấu đã thanh toán</Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        resetForm();
        setModalVisible(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingDebt ? 'Chỉnh sửa khoản nợ' : 'Thêm khoản nợ mới'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setModalVisible(false);
              }}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Type Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, type === 'owe' && styles.toggleActive]}
              onPress={() => setType('owe')}
            >
              <Ionicons
                name="arrow-up-circle"
                size={20}
                color={type === 'owe' ? '#FFF' : Colors.textMuted}
              />
              <Text style={[styles.toggleText, type === 'owe' && styles.toggleTextActive]}>
                Tôi nợ
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.toggleButton, type === 'owed' && styles.toggleActiveOwed]}
              onPress={() => setType('owed')}
            >
              <Ionicons
                name="arrow-down-circle"
                size={20}
                color={type === 'owed' ? '#FFF' : Colors.textMuted}
              />
              <Text style={[styles.toggleText, type === 'owed' && styles.toggleTextActive]}>
                Người khác nợ
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Người liên quan (VD: Nguyễn Văn A)"
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
            placeholder="Ghi chú (tùy chọn)"
            placeholderTextColor={Colors.textMuted}
            value={note}
            onChangeText={setNote}
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
            <Text style={styles.saveButtonText}>
              {editingDebt ? 'Cập nhật' : 'Thêm khoản nợ'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <Ionicons name="arrow-up-circle" size={28} color="#FFF" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Tôi nợ</Text>
              <Text style={styles.summaryValue}>{totals.owe.toLocaleString()}₫</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <Ionicons name="arrow-down-circle" size={28} color="#FFF" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Người khác nợ</Text>
              <Text style={styles.summaryValue}>{totals.owed.toLocaleString()}₫</Text>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Net Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Số dư ròng</Text>
        <Text
          style={[
            styles.balanceValue,
            { color: netBalance >= 0 ? Colors.success : Colors.danger },
          ]}
        >
          {netBalance >= 0 ? '+' : ''}{netBalance.toLocaleString()}₫
        </Text>
        <Text style={styles.balanceHint}>
          {netBalance > 0
            ? 'Bạn được người khác nợ nhiều hơn'
            : netBalance < 0
            ? 'Bạn nợ người khác nhiều hơn'
            : 'Cân bằng'}
        </Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle" size={20} color="#FFF" />
        <Text style={styles.addButtonText}>Thêm khoản nợ</Text>
      </TouchableOpacity>

      {/* Debts List */}
      <FlatList
        data={debts}
        keyExtractor={item => item.id}
        renderItem={renderDebtCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyText}>Chưa có khoản nợ nào</Text>
            <Text style={styles.emptySubText}>
              Thêm khoản nợ để quản lý dễ dàng
            </Text>
          </View>
        }
      />

      {renderCreateModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.card,
  },
  summaryGradient: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  balanceCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  listContent: {
    paddingBottom: 100,
  },
  debtCard: {
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  debtGradient: {
    padding: Spacing.lg,
  },
  debtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  debtIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  debtInfo: {
    flex: 1,
  },
  debtPerson: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  debtType: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  deleteIconButton: {
    padding: Spacing.xs,
  },
  debtAmount: {
    marginBottom: Spacing.sm,
  },
  amountLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  markPaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    gap: 4,
  },
  markPaidText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: Spacing.xs,
  },
  toggleActive: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  toggleActiveOwed: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  toggleText: {
    fontSize: 14,
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
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    marginBottom: Spacing.sm,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default DebtsScreen;
