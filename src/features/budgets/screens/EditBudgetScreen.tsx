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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBudget } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { FieldValidators } from '../../../utils/FormValidation';
import {
  ExpenseCategory,
  EXPENSE_CATEGORIES,
} from '../../../core/models/Expense';

type RootStackParamList = {
  EditBudget: { id: string };
  BudgetList: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'EditBudget'>;

interface EditBudgetForm {
  category: ExpenseCategory;
  limit: string;
}

const EditBudgetScreen: React.FC<Props> = ({ navigation, route }) => {
  const { id } = route.params;
  const authContext = useContext(AuthContext);
  const {
    getBudgetById,
    updateBudget,
    isLoading: isApiLoading,
  } = useBudget(authContext?.userToken || '');

  const [formData, setFormData] = useState<EditBudgetForm>({
    category: 'food',
    limit: '',
  });

  const [errors, setErrors] = useState<Partial<EditBudgetForm>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load budget detail
  useEffect(() => {
    loadBudgetDetail();
  }, [id]);

  const loadBudgetDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const budget = await getBudgetById(id);
      if (budget) {
        setFormData({
          category: budget.category as ExpenseCategory,
          limit: budget.limit.toString(),
        });
      }
    } catch (error: any) {
      Alert.alert('❌ Lỗi', error.message || 'Không tìm thấy ngân sách', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('BudgetList'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [id, getBudgetById, navigation]);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors: Partial<EditBudgetForm> = {};

    const limitError = FieldValidators.validateBudgetLimit(formData.limit);
    if (limitError) {
      newErrors.limit = limitError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle update từ API
  const handleUpdateBudget = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await updateBudget(id, {
        limit: Number(formData.limit),
      });

      Alert.alert('✅ Thành công', 'Cập nhật ngân sách thành công!', [
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
        error.message || 'Lỗi cập nhật ngân sách. Vui lòng thử lại.',
      );
    }
  }, [formData, validateForm, navigation, id, updateBudget]);

  const handleInputChange = (field: keyof EditBudgetForm, value: string) => {
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
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
          <Text style={styles.title}>Chỉnh sửa ngân sách</Text>
          <Text style={styles.subtitle}>Cập nhật hạn mức chi tiêu</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Category */}
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

          {/* Limit */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Hạn mức (VNĐ)</Text>
            <TextInput
              style={[styles.input, errors.limit && styles.inputError]}
              placeholder="Nhập hạn mức"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              editable={!isApiLoading}
              value={formData.limit}
              onChangeText={value => handleInputChange('limit', value)}
            />
            {errors.limit && (
              <Text style={styles.errorText}>{errors.limit}</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          {/* Update Button */}
          <TouchableOpacity
            style={[styles.updateButton, isSaving && styles.buttonDisabled]}
            onPress={handleUpdateBudget}
            disabled={isSaving}
          >
            {isApiLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Cập nhật ngân sách</Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.navigate('BudgetList')}
            disabled={isApiLoading}
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
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  formContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
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
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  categoryScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryButton: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 13,
  },
  categoryButtonTextActive: {
    color: '#FFF',
  },
  actionContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditBudgetScreen;
