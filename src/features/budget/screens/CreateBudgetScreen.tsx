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
import { useBudget } from '../../../common/hooks/useMVVM';
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

const CreateBudgetScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { createBudget, budgetState } = useBudget(
    authContext?.userToken || null,
  );

  const [name, setName] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0],
  );

  const handleSubmit = async () => {
    const parsedAmount = Number(limitAmount.replace(/[^0-9]/g, ''));
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên ngân sách');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      await createBudget({
        name: name.trim(),
        limitAmount: parsedAmount,
        category,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      Alert.alert('Thành công', 'Đã tạo ngân sách', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo ngân sách');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Tên ngân sách</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: Ngân sách tháng 1"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Giới hạn (VND)</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập số tiền"
        keyboardType="numeric"
        value={limitAmount}
        onChangeText={setLimitAmount}
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

      <Text style={styles.label}>Ngày bắt đầu</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={startDate}
        onChangeText={setStartDate}
      />

      <Text style={styles.label}>Ngày kết thúc</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={endDate}
        onChangeText={setEndDate}
      />

      <TouchableOpacity
        style={[styles.submitButton, budgetState.isLoading && styles.disabled]}
        onPress={handleSubmit}
        disabled={budgetState.isLoading}
      >
        {budgetState.isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitText}>Lưu ngân sách</Text>
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

export default CreateBudgetScreen;
