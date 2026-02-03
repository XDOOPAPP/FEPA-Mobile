import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useBudget } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const CATEGORIES = [
  { label: 'Ăn uống', slug: 'food', icon: 'restaurant' },
  { label: 'Đi lại', slug: 'transport', icon: 'car' },
  { label: 'Mua sắm', slug: 'shopping', icon: 'cart' },
  { label: 'Nhà cửa', slug: 'utilities', icon: 'home' },
  { label: 'Sức khỏe', slug: 'healthcare', icon: 'medical' },
  { label: 'Giải trí', slug: 'entertainment', icon: 'game-controller' },
  { label: 'Giáo dục', slug: 'school', icon: 'school' },
  { label: 'Thêm', slug: 'other', icon: 'ellipsis-horizontal' },
];

const CreateBudgetScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingBudget = route.params?.budget;
  const isEditing = !!editingBudget;

  const authContext = useContext(AuthContext);
  const { createBudget, updateBudget, budgetState } = useBudget(
    authContext?.userToken || null,
  );

  const [name, setName] = useState(editingBudget?.name || '');
  const [limitAmount, setLimitAmount] = useState(editingBudget?.limitAmount?.toString() || '');
  const [category, setCategory] = useState(editingBudget?.category || CATEGORIES[0].slug);
  const [alertEnabled, setAlertEnabled] = useState(true);

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
      if (isEditing) {
        await updateBudget(editingBudget.id, {
          name: name.trim(),
          limitAmount: parsedAmount,
          category,
        });
        Alert.alert('Thành công', 'Đã cập nhật ngân sách', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        await createBudget({
          name: name.trim(),
          limitAmount: parsedAmount,
          category,
          startDate: todayStart.toISOString(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        });
        Alert.alert('Thành công', 'Đã tạo ngân sách', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể thực hiện thao tác');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
           <Text style={styles.backLinkText}>Hủy</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Chỉnh sửa Ngân sách' : 'Tạo Ngân sách Mới'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>{isEditing ? 'Cập nhật mục tiêu' : 'Thiết lập mục tiêu'}</Text>
          <Text style={styles.introSubtitle}>
            {isEditing 
                ? 'Bạn có thể thay đổi tên hoặc hạn mức chi tiêu để phù hợp với tình hình hiện tại.' 
                : 'Hãy đặt tên và giới hạn chi tiêu để bắt đầu quản lý tài chính thông minh hơn.'}
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>TÊN NGÂN SÁCH</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: Ăn uống, Di chuyển..."
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>SỐ TIỀN MỤC TIÊU</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              keyboardType="numeric"
              value={limitAmount}
              onChangeText={setLimitAmount}
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.currencyLabel}>₫</Text>
          </View>
        </View>

        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Chọn Danh mục</Text>
          </View>
          
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(item => (
              <TouchableOpacity
                key={item.slug}
                style={styles.categoryItem}
                onPress={() => setCategory(item.slug)}
              >
                <View style={[
                  styles.categoryIconBox,
                  category === item.slug && styles.categoryIconBoxActive
                ]}>
                  <Ionicons 
                    name={item.icon} 
                    size={22} 
                    color={category === item.slug ? '#FFFFFF' : Colors.textSecondary} 
                  />
                </View>
                <Text style={[
                  styles.categoryText,
                  category === item.slug && styles.categoryTextActive
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.settingRow}>
           <View style={styles.settingIconLabel}>
             <Ionicons name="calendar-outline" size={20} color={Colors.info} />
             <View style={styles.settingLabelContainer}>
                <Text style={styles.settingTitle}>Chu kỳ</Text>
                <Text style={styles.settingValue}>Hàng tháng</Text>
             </View>
           </View>
           <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.settingRow}>
           <View style={styles.settingIconLabel}>
             <View style={styles.alertIconBox}>
                <Ionicons name="notifications" size={16} color="#FFFFFF" />
             </View>
             <View style={styles.settingLabelContainer}>
                <Text style={styles.settingTitle}>Cảnh báo chi tiêu</Text>
                <Text style={styles.settingValue}>Khi đạt 80% hạn mức</Text>
             </View>
           </View>
           <Switch 
             value={alertEnabled} 
             onValueChange={setAlertEnabled}
             trackColor={{ false: '#E2E8F0', true: Colors.primary }}
             thumbColor="#FFFFFF"
           />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, budgetState.isLoading && styles.disabled]}
          onPress={handleSubmit}
          disabled={budgetState.isLoading}
        >
          {budgetState.isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <LinearGradient
              colors={Colors.primaryGradient}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>{isEditing ? 'Cập nhật' : 'Xác nhận'}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          )}
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backLink: {
    padding: 8,
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: {
    padding: 24,
  },
  introSection: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  introSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    paddingVertical: 16,
  },
  currencyLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 8,
  },
  categorySection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryIconBoxActive: {
    backgroundColor: Colors.primary,
    ...Shadow.glow,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: Colors.textPrimary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  settingIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabelContainer: {
    marginLeft: 4,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settingValue: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  alertIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    marginTop: 24,
    overflow: 'hidden',
    ...Shadow.md,
  },
  submitGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
});

export default CreateBudgetScreen;
