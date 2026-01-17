import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useExpense } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const CATEGORIES = [
  { label: 'Ăn uống', slug: 'food' },
  { label: 'Đi lại', slug: 'transport' },
  { label: 'Mua sắm', slug: 'shopping' },
  { label: 'Hóa đơn', slug: 'utilities' },
  { label: 'Giải trí', slug: 'entertainment' },
  { label: 'Sức khỏe', slug: 'healthcare' },
  { label: 'Khác', slug: 'other' },
];

const CreateExpenseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { createExpense, expenseState } = useExpense(
    authContext?.userToken || null,
  );

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async () => {
    const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      const categoryLabel =
        CATEGORIES.find(item => item.slug === category)?.label || 'Chi tiêu';
      const description = note.trim() || `Chi tiêu ${categoryLabel}`;

      await createExpense({
        amount: parsedAmount,
        category,
        description,
        spentAt: new Date(date).toISOString(),
      });
      Alert.alert('Thành công', 'Đã thêm chi tiêu', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo chi tiêu');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Số tiền (VND)</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập số tiền"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.categoryWrap}>
        {CATEGORIES.map(item => (
          <TouchableOpacity
            key={item.slug}
            style={[
              styles.categoryChip,
              category === item.slug && styles.categoryChipActive,
            ]}
            onPress={() => setCategory(item.slug)}
          >
            <Text
              style={[
                styles.categoryText,
                category === item.slug && styles.categoryTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Ghi chú</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Ghi chú (tuỳ chọn)"
        value={note}
        onChangeText={setNote}
        multiline
      />

      <Text style={styles.label}>Ngày</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
      />

      <TouchableOpacity
        style={[styles.submitButton, expenseState.isLoading && styles.disabled]}
        onPress={handleSubmit}
        disabled={expenseState.isLoading}
      >
        {expenseState.isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Lưu chi tiêu</Text>
        )}
      </TouchableOpacity>
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
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.soft,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: '#FFF',
  },
  submitButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  submitText: {
    color: '#FFF',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
});

export default CreateExpenseScreen;
