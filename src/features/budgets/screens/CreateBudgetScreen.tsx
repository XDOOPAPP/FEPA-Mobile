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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBudget } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { FieldValidators } from '../../../utils/FormValidation';
import {
  ExpenseCategory,
  EXPENSE_CATEGORIES,
} from '../../../core/models/Expense';
import { useFeatureGate } from '../../../core/viewmodels/FeatureGateViewModel';

type RootStackParamList = {
  CreateBudget: undefined;
  BudgetList: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'CreateBudget'>;

interface CreateBudgetForm {
  category: ExpenseCategory;
  limit: string;
  month: string;
}

const CreateBudgetScreen: React.FC<Props> = ({ navigation }) => {
  const authContext = useContext(AuthContext);
  const { createBudget, isLoading } = useBudget(authContext?.userToken || '');
  const { canCreateBudget, getBudgetQuota, isPremium } = useFeatureGate();

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      '0',
    )}`;
  };

  const [formData, setFormData] = useState<CreateBudgetForm>({
    category: 'food',
    limit: '',
    month: getCurrentMonth(),
  });

  const [errors, setErrors] = useState<Partial<CreateBudgetForm>>({});

  // Xác thực form
  const validateForm = useCallback(() => {
    const newErrors: Partial<CreateBudgetForm> = {};

    const limitError = FieldValidators.validateBudgetLimit(formData.limit);
    if (limitError) {
      newErrors.limit = limitError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Xử lý tạo ngân sách từ API
  const handleCreateBudget = useCallback(async () => {
    // Check premium feature
    if (!canCreateBudget()) {
      const quota = getBudgetQuota();
      Alert.alert(
        '📊 Nâng cấp Premium',
        `Bạn đã đạt tới giới hạn ${quota.total} ngân sách trong gói Free.\n\nNâng cấp lên Premium để tạo ngân sách không giới hạn.`,
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Nâng cấp',
            onPress: () => {
              // Navigate to subscription plans
              navigation.getParent()?.navigate('Profile', { screen: 'Subscription' });
            },
          },
        ]
      );
      return;
    }

    if (!validateForm()) return;

    try {
      await createBudget({
        category: formData.category,
        limit: Number(formData.limit),
        month: formData.month,
      });

      Alert.alert('✅ Thành công', 'Tạo ngân sách thành công!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('BudgetList');
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        '❌ Lỗi',
        error.message || 'Lỗi tạo ngân sách. Vui lòng thử lại.',
      );
    }
  }, [formData, validateForm, navigation, createBudget, canCreateBudget, getBudgetQuota]);

  const handleInputChange = (field: keyof CreateBudgetForm, value: string) => {
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
          <Text style={styles.title}>Tạo ngân sách mới</Text>
          <Text style={styles.subtitle}>
            Đặt giới hạn chi tiêu cho danh mục
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
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

          {/* Giới hạn ngân sách */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Giới hạn ngân sách (VNĐ)</Text>
            <TextInput
              style={[styles.input, errors.limit && styles.inputError]}
              placeholder="Ví dụ: 5000000"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              editable={!isLoading}
              value={formData.limit}
              onChangeText={value => handleInputChange('limit', value)}
            />
            {errors.limit && (
              <Text style={styles.errorText}>{errors.limit}</Text>
            )}
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💡 Bạn sẽ nhận được cảnh báo khi chi tiêu vượt quá 80% giới hạn
            </Text>
          </View>

          {/* Nút Tạo */}
          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.buttonDisabled]}
            onPress={handleCreateBudget}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Tạo ngân sách</Text>
            )}
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.navigate('BudgetList')}
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
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
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

export default CreateBudgetScreen;
