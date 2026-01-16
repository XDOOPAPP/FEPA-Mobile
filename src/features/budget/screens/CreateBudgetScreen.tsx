import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axiosInstance from '../../../api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/api';

type RootStackParamList = {
  CreateBudget: { budgetId?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'CreateBudget'>;

interface BudgetFormData {
  name: string;
  limitAmount: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
}

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
}

const categories: BudgetCategory[] = [
  { id: 'food', name: 'Ăn uống', icon: '🍔' },
  { id: 'transport', name: 'Giao thông', icon: '🚗' },
  { id: 'housing', name: 'Nhà cửa', icon: '🏠' },
  { id: 'shopping', name: 'Mua sắm', icon: '👗' },
  { id: 'entertainment', name: 'Giải trí', icon: '🎮' },
  { id: 'utilities', name: 'Tiện ích', icon: '💡' },
  { id: 'healthcare', name: 'Sức khỏe', icon: '🏥' },
  { id: 'education', name: 'Giáo dục', icon: '📚' },
];

const CreateBudgetScreen: React.FC<Props> = ({ navigation, route }) => {
  const budgetId = route.params?.budgetId;
  const isEditing = !!budgetId;

  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    limitAmount: '',
    category: categories[0].id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
  });

  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<BudgetFormData>>({});

  // Load budget if editing
  useEffect(() => {
    if (isEditing) {
      loadBudget();
    }
  }, [budgetId]);

  const loadBudget = async () => {
    if (!budgetId) return;
    try {
      const response = await axiosInstance.get(
        API_ENDPOINTS.GET_BUDGET(budgetId),
      );
      const budget = response.data;
      setFormData({
        name: budget.name,
        limitAmount: budget.limitAmount.toString(),
        category: budget.category || categories[0].id,
        startDate: new Date(budget.startDate || Date.now()),
        endDate: new Date(
          budget.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000,
        ),
      });
      setSelectedCategory(budget.category || categories[0].id);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể tải thông tin ngân sách');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = useCallback(() => {
    const newErrors: Partial<BudgetFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên ngân sách không được bỏ trống';
    }

    if (!formData.limitAmount.trim()) {
      newErrors.limitAmount = 'Hạn mức không được bỏ trống';
    } else if (
      isNaN(parseFloat(formData.limitAmount)) ||
      parseFloat(formData.limitAmount) <= 0
    ) {
      newErrors.limitAmount = 'Hạn mức phải là số dương';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        limitAmount: parseFloat(formData.limitAmount),
        category: selectedCategory,
        startDate: formData.startDate?.toISOString(),
        endDate: formData.endDate?.toISOString(),
      };

      if (isEditing && budgetId) {
        await axiosInstance.put(API_ENDPOINTS.UPDATE_BUDGET(budgetId), payload);
        Alert.alert('Thành công', 'Cập nhật ngân sách thành công');
      } else {
        await axiosInstance.post(API_ENDPOINTS.CREATE_BUDGET, payload);
        Alert.alert('Thành công', 'Tạo ngân sách thành công');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể lưu ngân sách',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (
    event: any,
    date: Date | undefined,
    type: 'start' | 'end',
  ) => {
    if (type === 'start') {
      setShowStartDatePicker(false);
      if (date) setFormData(prev => ({ ...prev, startDate: date }));
    } else {
      setShowEndDatePicker(false);
      if (date) setFormData(prev => ({ ...prev, endDate: date }));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Cập Nhật Ngân Sách' : 'Tạo Ngân Sách Mới'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tên ngân sách</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="VD: Chi tiêu hàng tháng"
              value={formData.name}
              onChangeText={text => {
                setFormData(prev => ({ ...prev, name: text }));
                if (errors.name)
                  setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholderTextColor="#999999"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Limit Amount Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Hạn mức chi tiêu (VND)</Text>
            <TextInput
              style={[styles.input, errors.limitAmount && styles.inputError]}
              placeholder="VD: 5000000"
              value={formData.limitAmount}
              onChangeText={text => {
                setFormData(prev => ({ ...prev, limitAmount: text }));
                if (errors.limitAmount)
                  setErrors(prev => ({ ...prev, limitAmount: undefined }));
              }}
              keyboardType="numeric"
              placeholderTextColor="#999999"
            />
            {errors.limitAmount && (
              <Text style={styles.errorText}>{errors.limitAmount}</Text>
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Danh mục (tùy chọn)</Text>
            <View style={styles.categoryGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id &&
                      styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.categoryName,
                      selectedCategory === category.id &&
                        styles.categoryNameActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Khoảng thời gian</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Ngày bắt đầu</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.startDate?.toLocaleDateString('vi-VN')}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Ngày kết thúc</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formData.endDate?.toLocaleDateString('vi-VN')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Danh mục chọn:</Text>
              <View style={styles.summaryValue}>
                <Text style={styles.summaryIcon}>
                  {selectedCategoryData?.icon}
                </Text>
                <Text style={styles.summaryText}>
                  {selectedCategoryData?.name}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hạn mức:</Text>
              <Text style={styles.summaryAmount}>
                ₫{parseInt(formData.limitAmount || '0').toLocaleString('vi-VN')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thời gian:</Text>
              <Text style={styles.summaryDuration}>
                {Math.ceil(
                  ((formData.endDate?.getTime() || 0) -
                    (formData.startDate?.getTime() || 0)) /
                    (1000 * 60 * 60 * 24),
                )}{' '}
                ngày
              </Text>
            </View>
          </View>

          {/* Submit Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Cập Nhật' : 'Tạo Mới'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={formData.startDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => handleDateChange(e, date, 'start')}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={formData.endDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => handleDateChange(e, date, 'end')}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  form: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
  },
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: '31%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  dateButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
  },
  summaryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  summaryDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default CreateBudgetScreen;
