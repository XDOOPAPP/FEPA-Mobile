import React, { useState, useCallback, useContext } from 'react';
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
import { FieldValidators } from '../../../utils/FormValidation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthContext } from '../../../store/AuthContext';
import {
  ExpenseCategory,
  EXPENSE_CATEGORIES,
} from '../../../core/models/Expense';
import { useFeatureGate } from '../../../core/viewmodels/FeatureGateViewModel';

type RootStackParamList = {
  CreateExpense: undefined;
  ExpenseList: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'CreateExpense'>;

interface CreateExpenseForm {
  amount: string;
  category: ExpenseCategory;
  description: string;
  date: Date;
}

const CreateExpenseScreen: React.FC<Props> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const { createExpense, isLoading } = useExpense(authContext?.userToken || '');
  const { canCreateExpense, getExpenseQuota } = useFeatureGate();

  const [formData, setFormData] = useState<CreateExpenseForm>({
    amount: '',
    category: 'food',
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

  // Xử lý tạo chi tiêu từ API
  const handleCreateExpense = useCallback(async () => {
    // Check premium feature
    if (!canCreateExpense()) {
      const quota = getExpenseQuota();
      Alert.alert(
        '💰 Nâng cấp Premium',
        `Bạn đã đạt tới giới hạn ${quota.total} chi tiêu trong gói Free.\n\nNâng cấp lên Premium để ghi chi tiêu không giới hạn.`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Nâng cấp',
            onPress: () => {
              // Navigate to subscription plans
              navigation
                .getParent()
                ?.navigate('Profile', { screen: 'Subscription' });
            },
          },
        ],
      );
      return;
    }

    if (!validateForm()) return;

    try {
      await createExpense({
        title: formData.description,
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date.toISOString(),
      });

      Alert.alert('✅ Thành công', 'Tạo chi tiêu thành công!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('ExpenseList');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        '❌ Lỗi',
        error.message || 'Lỗi tạo chi tiêu. Vui lòng thử lại.',
      );
    }
  }, [
    formData,
    validateForm,
    navigation,
    createExpense,
    canCreateExpense,
    getExpenseQuota,
  ]);

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

          {/* Nút Tạo */}
          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.buttonDisabled]}
            onPress={handleCreateExpense}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Lưu chi tiêu</Text>
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
