import React, { useState, useCallback, useEffect, useContext } from 'react';
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
import { useExpense } from '../../../common/hooks/useMVVM';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FieldValidators } from '../../../utils/FormValidation';
import { AuthContext } from '../../../store/AuthContext';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '../../../core/models/Expense';

type RootStackParamList = {
  EditExpense: { id: string };
  ExpenseList: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'EditExpense'>;

interface EditExpenseForm {
  amount: string;
  category: ExpenseCategory;
  description: string;
  date: Date;
}

const EditExpenseScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const authContext = useContext(AuthContext);
  const { updateExpense, getExpenseById, isLoading } = useExpense(
    authContext?.userToken || '',
  );

  const [formData, setFormData] = useState<EditExpenseForm>({
    amount: '',
    category: 'food',
    description: '',
    date: new Date(),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Partial<EditExpenseForm>>({});
  const [isApiLoading, setIsApiLoading] = useState(true);

  const loadExpenseDetail = useCallback(async () => {
    setIsApiLoading(true);
    try {
      const expense = await getExpenseById(id);
      if (expense) {
        setFormData({
          amount: expense.amount.toString(),
          category: expense.category as ExpenseCategory,
          description: expense.description || '',
          date: new Date(expense.date),
        });
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể tải chi tiêu', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ExpenseList'),
        },
      ]);
    } finally {
      setIsApiLoading(false);
    }
  }, [id, getExpenseById, navigation]);

  // Lấy thông tin chi tiêu khi load
  useEffect(() => {
    loadExpenseDetail();
  }, [loadExpenseDetail]);

  // Xác thực form
  const validateForm = useCallback(() => {
    const newErrors: Partial<EditExpenseForm> = {};

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

  // Xử lý cập nhật chi tiêu
  const handleUpdateExpense = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await updateExpense(id, {
        title: formData.description.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description.trim(),
        date: formData.date.toISOString(),
      });

      Alert.alert('✅ Thành công', 'Cập nhật chi tiêu thành công!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('ExpenseList');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật chi tiêu');
    }
  }, [formData, id, updateExpense, validateForm, navigation]);

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
    field: keyof EditExpenseForm,
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

  if (isApiLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Sửa chi tiêu</Text>
          <Text style={styles.subtitle}>Cập nhật thông tin chi tiêu</Text>
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
              editable={!isLoading}
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
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    formData.category === cat.value &&
                      styles.categoryButtonActive,
                  ]}
                  onPress={() => handleInputChange('category', cat.value)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.category === cat.value &&
                        styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.label}
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
              editable={!isLoading}
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

          {/* Nút Cập nhật */}
          <TouchableOpacity
            style={[styles.updateButton, isLoading && styles.buttonDisabled]}
            onPress={handleUpdateExpense}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Cập nhật chi tiêu</Text>
            )}
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.navigate('ExpenseList')}
            disabled={isLoading}
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
  updateButton: {
    backgroundColor: '#2196F3',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
});

export default EditExpenseScreen;
