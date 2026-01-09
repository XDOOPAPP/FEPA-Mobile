import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpense, useAuth } from '../../../common/hooks/useMVVM';
import { FieldValidators } from '../../../utils/FormValidation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  CreateExpense: undefined;
  ExpenseList: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'CreateExpense'>;

interface CreateExpenseForm {
  amount: string;
  category: string;
  description: string;
  date: Date;
}

const EXPENSE_CATEGORIES = [
  '🍔 Ăn uống',
  '🚗 Giao thông',
  '🏠 Nhà cửa',
  '🎓 Giáo dục',
  '👗 Quần áo',
  '💊 Sức khỏe',
  '🎮 Giải trí',
  '📱 Công nghệ',
  '💳 Tài chính',
  '🛒 Mua sắm',
  '✈️ Du lịch',
  '🎁 Quà tặng',
];

const CreateExpenseScreen: React.FC<Props> = ({ navigation }) => {
  const { authState } = useAuth();
  const { createExpense, expenseState } = useExpense(authState.token || '');

  const [formData, setFormData] = useState<CreateExpenseForm>({
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
    date: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateExpenseForm>>({});

  // Xác thực form
  const validateForm = useCallback(() => {
    const newErrors: Partial<CreateExpenseForm> = {};

    const amountError = FieldValidators.validateAmount(formData.amount);
    if (amountError) {
      newErrors.amount = amountError;
    }

    const descError = FieldValidators.validateDescription(formData.description);
    if (descError) {
      newErrors.description = descError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Xử lý tạo chi tiêu
  const handleCreateExpense = useCallback(async () => {
    if (!validateForm()) return;

    // Mock budget data - sẽ replace bằng real API sau
    const mockBudgets = [
      { category: '🍔 Ăn uống', limit: 5000000 },
      { category: '🚗 Giao thông', limit: 2000000 },
      { category: '🏠 Nhà cửa', limit: 10000000 },
      { category: '🎓 Giáo dục', limit: 3000000 },
      { category: '👗 Quần áo', limit: 3000000 },
      { category: '💊 Sức khỏe', limit: 2000000 },
      { category: '🎮 Giải trí', limit: 1500000 },
    ];

    // Mock expense data để tính spent
    const mockExpenses = [
      { category: '🍔 Ăn uống', amount: 3200000 },
      { category: '🚗 Giao thông', amount: 1800000 },
    ];

    const doSubmit = async () => {
      try {
        const categoryName = formData.category.split(' ')[1];
        await createExpense({
          title: formData.description.trim(),
          amount: Number(formData.amount),
          category: categoryName as any,
          description: formData.description.trim(),
          date: formData.date.toISOString(),
        });

        Alert.alert('✅ Thành công', 'Thêm chi tiêu thành công!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ExpenseList');
            },
          },
        ]);
      } catch (error: any) {
        const errorMessage = ErrorHandler.parseApiError(error);
        const errorTitle = ErrorHandler.getErrorTitle(error);
        Alert.alert(errorTitle, errorMessage);
      }
    };

    try {
      const expenseCategory = formData.category;
      const expenseAmount = Number(formData.amount);

      // Check budget
      const budget = mockBudgets.find(b => b.category === expenseCategory);
      if (budget) {
        const currentSpent = mockExpenses
          .filter(e => e.category === expenseCategory)
          .reduce((sum, e) => sum + e.amount, 0);

        const totalSpent = currentSpent + expenseAmount;
        const percentage = (totalSpent / budget.limit) * 100;

        if (percentage > 100) {
          // Vượt budget - alert warning
          Alert.alert(
            '⚠️ Cảnh báo ngân sách',
            `Chi tiêu này sẽ vượt quá ngân sách cho "${expenseCategory}"!\n\nNgân sách: ${budget.limit.toLocaleString(
              'vi-VN',
            )}₫\nSẽ chi: ${totalSpent.toLocaleString('vi-VN')}₫\nVượt: ${(
              totalSpent - budget.limit
            ).toLocaleString('vi-VN')}₫\n\nBạn vẫn muốn tiếp tục?`,
            [
              { text: 'Hủy', onPress: () => {}, style: 'cancel' },
              {
                text: 'Tiếp tục',
                onPress: doSubmit,
                style: 'destructive',
              },
            ],
          );
          return;
        } else if (percentage > 80) {
          // Cảnh báo khi sắp hết ngân sách
          Alert.alert(
            '🔔 Cảnh báo ngân sách',
            `Chi tiêu của bạn sẽ sử dụng ${Math.round(
              percentage,
            )}% ngân sách cho "${expenseCategory}".`,
            [
              { text: 'Hủy', onPress: () => {}, style: 'cancel' },
              {
                text: 'Tiếp tục',
                onPress: doSubmit,
              },
            ],
          );
          return;
        }
      }

      // Nếu ok, submit
      await doSubmit();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo chi tiêu');
    }
  }, [formData, validateForm, createExpense, navigation]);

  // Xử lý thay đổi ngày
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate,
      }));
    }
  };

  const handleInputChange = (
    field: keyof CreateExpenseForm,
    value: string | Date,
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Thêm chi tiêu mới</Text>
          <Text style={styles.subtitle}>Ghi lại chi tiêu của bạn</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Số tiền */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Số tiền (VNĐ)</Text>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              placeholder="Nhập số tiền"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              editable={!expenseState.isLoading}
              value={formData.amount}
              onChangeText={value => handleInputChange('amount', value)}
            />
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
          </View>

          {/* Danh mục */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Danh mục</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    formData.category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => handleInputChange('category', cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === cat &&
                        styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Ghi chú */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, errors.description && styles.inputError]}
              placeholder="Ví dụ: Cơm trưa tại nhà hàng XYZ"
              placeholderTextColor="#999"
              editable={!expenseState.isLoading}
              value={formData.description}
              onChangeText={value => handleInputChange('description', value)}
              multiline
              numberOfLines={3}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Ngày */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Ngày</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formData.date.toLocaleDateString('vi-VN')}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
            />
          )}

          {/* Nút Tạo */}
          <TouchableOpacity
            style={[
              styles.createButton,
              expenseState.isLoading && styles.buttonDisabled,
            ]}
            onPress={handleCreateExpense}
            disabled={expenseState.isLoading}
          >
            {expenseState.isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Lưu chi tiêu</Text>
            )}
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.navigate('ExpenseList')}
            disabled={expenseState.isLoading}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  inputError: {
    borderColor: '#E53935',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  categoryScroll: {
    marginHorizontal: -5,
    paddingHorizontal: 5,
  },
  categoryButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  categoryButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateExpenseScreen;
