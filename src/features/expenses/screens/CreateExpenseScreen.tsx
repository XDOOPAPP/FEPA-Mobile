import React, { useState, useCallback, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpense, useAuth } from '../../../common/hooks/useMVVM';
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

    if (!formData.amount.trim()) {
      newErrors.amount = 'Số tiền không được bỏ trống';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Số tiền phải lớn hơn 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Ghi chú không được bỏ trống';
    } else if (formData.description.length < 3) {
      newErrors.description = 'Ghi chú phải có ít nhất 3 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Xử lý tạo chi tiêu
  const handleCreateExpense = useCallback(async () => {
    if (!validateForm()) return;

    try {
      // Gửi yêu cầu tạo chi tiêu
      await createExpense({
        amount: Number(formData.amount),
        category: formData.category.split(' ')[1], // Lấy tên danh mục (bỏ emoji)
        description: formData.description.trim(),
        date: formData.date.toISOString(),
      });

      Alert.alert('Thành công', 'Thêm chi tiêu thành công!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('ExpenseList');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo chi tiêu');
    }
  }, [formData, createExpense, validateForm, navigation]);

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
