import React, { useContext, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import DatePicker from 'react-native-date-picker';
import { useExpense } from '../../../common/hooks/useMVVM';
import { useAI } from '../../../common/hooks/useAI';
import { AuthContext } from '../../../store/AuthContext';
import { Colors, Radius, Spacing, Shadow, Typography } from '../../../constants/theme';
import { saveReceipt } from '../../../utils/receiptStorage';
import { GlassCard } from '../../../components/design-system/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { label: 'Ăn uống', slug: 'food', icon: 'restaurant-outline', color: '#F59E0B' },
  { label: 'Di chuyển', slug: 'transport', icon: 'car-outline', color: '#3B82F6' },
  { label: 'Mua sắm', slug: 'shopping', icon: 'cart-outline', color: '#EC4899' },
  { label: 'Giải trí', slug: 'entertainment', icon: 'film-outline', color: '#10B981' },
  { label: 'Sức khỏe', slug: 'health', icon: 'medkit-outline', color: '#EF4444' },
  { label: 'Tiện ích', slug: 'utilities', icon: 'flash-outline', color: '#8B5CF6' },
  { label: 'Khác', slug: 'other', icon: 'grid-outline', color: '#64748B' },
];

const DATE_CONFIG = [
  { id: 'today', label: 'Hôm nay', icon: '☀️', color: '#FEF3C7', textColor: '#92400E' },
  { id: 'yesterday', label: 'Hôm qua', icon: '🌙', color: '#E0F2FE', textColor: '#075985' },
  { id: 'custom', label: 'Chọn ngày', icon: '📅', color: '#F3E8FF', textColor: '#6B21A8' },
];

const CreateExpenseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { createExpense, expenseState } = useExpense(
    authContext?.userToken || null,
  );
  const { categorizeExpense, loading: aiLoading } = useAI(authContext?.userToken || null);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateType, setDateType] = useState('today');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formattedAmount = useMemo(() => {
    if (!amount) return '';
    const numericValue = amount.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return Number(numericValue).toLocaleString('vi-VN');
  }, [amount]);

  const handleDateSelect = (type: string) => {
    setDateType(type);
    const now = new Date();
    if (type === 'today') {
      setDate(now);
    } else if (type === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      setDate(yesterday);
    } else if (type === 'custom') {
      setShowDatePicker(true);
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      const categoryLabel = CATEGORIES.find(item => item.slug === category)?.label || 'Chi tiêu';
      const description = note.trim() || `Chi tiêu ${categoryLabel}`;

      await createExpense({
        amount: parsedAmount,
        category,
        description,
        spentAt: date.toISOString(),
      });

      Alert.alert('Thành công', 'Đã thêm giao dịch', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo chi tiêu');
    }
  };

  // AI Auto-categorize logic
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger categorizing even without amount
      if (note.trim().length > 2) {
        handleAiCategorize();
      }
    }, 1200); // Slightly faster debounce
    return () => clearTimeout(timer);
  }, [note]);

  const handleAiCategorize = async () => {
    if (!note.trim()) return;
    try {
      const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));
      console.log('[AI Debug] Requesting categorization for:', note);
      
      const res = await categorizeExpense({
        description: note,
        amount: parsedAmount || 1000,
      });

      console.log('[AI Debug] Received response:', res);

      if (res) {
        // Handle both possible structures: res.category or res.data.category
        const aiCat = (res as any).category || (res as any).data?.category;
        
        if (aiCat) {
          console.log('[AI Debug] Detected Category:', aiCat);
          const aiCatLower = aiCat.toLowerCase();
          
          // Tìm slug tương ứng trong CATEGORIES
          const matched = CATEGORIES.find(c => 
            c.slug.toLowerCase() === aiCatLower || 
            c.label.toLowerCase() === aiCatLower ||
            (aiCatLower === 'health' && c.slug === 'health') ||
            (aiCatLower === 'transport' && c.slug === 'transport')
          );

          if (matched) {
            console.log('[AI Debug] Matching found:', matched.slug);
            setCategory(matched.slug);
          } else {
            console.log('[AI Debug] No matching category for:', aiCat);
          }
        }
      }
    } catch (e: any) {
      console.log('[AI Debug] Categorization Error:', e.message);
    }
  };

  const currentCategoryColor = CATEGORIES.find(c => c.slug === category)?.color || Colors.primary;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Background Glow */}
      <View style={[styles.bgGlow, { backgroundColor: currentCategoryColor }]} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giao dịch mới</Text>
        <TouchableOpacity 
            style={[styles.headerBtn, aiLoading && { opacity: 0.5 }]}
            onPress={handleAiCategorize}
            disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="sparkles" size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Amount Input */}
        <View style={styles.amountContainer}>
          <Text style={styles.sectionLabel}>SỐ TIỀN CHI TIÊU</Text>
          <View style={styles.amountInputRow}>
            <TextInput
              style={styles.amountInput}
              value={formattedAmount}
              onChangeText={(val) => setAmount(val.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#CBD5E1"
              autoFocus
            />
            <Text style={[styles.currencySymbol, { color: currentCategoryColor }]}>đ</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THỜI GIAN</Text>
          <View style={styles.chipRow}>
            {DATE_CONFIG.map((config) => {
              const active = dateType === config.id;
              return (
                <TouchableOpacity 
                  key={config.id}
                  onPress={() => handleDateSelect(config.id)}
                  style={[
                    styles.dateChip, 
                    { backgroundColor: active ? (config.id === 'today' ? '#F59E0B' : config.id === 'yesterday' ? '#0EA5E9' : '#8B5CF6') : '#FFF' },
                    active && { shadowColor: config.id === 'today' ? '#F59E0B' : config.id === 'yesterday' ? '#0EA5E9' : '#8B5CF6', elevation: 8 }
                  ]}
                >
                  <Text style={{fontSize: 14, marginRight: 6}}>{config.icon}</Text>
                  <Text style={[styles.dateChipText, active && styles.dateChipTextActive]}>
                    {config.id === 'custom' && dateType === 'custom' ? date.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}) : config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DANH MỤC</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((item) => {
              const active = category === item.slug;
              return (
                <TouchableOpacity
                  key={item.slug}
                  style={[styles.categoryCard, active && { borderColor: item.color, backgroundColor: '#FFF' }]}
                  onPress={() => setCategory(item.slug)}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <Text style={[styles.categoryLabel, active && { color: '#1E293B', fontWeight: '800' }]}>
                    {item.label}
                  </Text>
                  {active && <View style={[styles.activeDot, { backgroundColor: item.color }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Note / Details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GHI CHÚ {aiLoading && <ActivityIndicator size="small" style={{ marginLeft: 8 }} />}</Text>
          <GlassCard style={styles.noteCard}>
             <TextInput 
                style={styles.noteInput}
                placeholder="Mua sắm tại Winmart, ăn tối..."
                placeholderTextColor="#94A3B8"
                value={note}
                onChangeText={setNote}
                multiline
             />
             <TouchableOpacity style={styles.micBtn} onPress={handleAiCategorize}>
                <Ionicons name="sparkles-outline" size={20} color={aiLoading ? Colors.textMuted : Colors.primary} />
             </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Submit Button */}
        <View style={styles.footer}>
            <TouchableOpacity 
                onPress={handleSubmit}
                disabled={expenseState.isLoading}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#0EA5E9', '#0284C7']}
                    style={styles.submitBtn}
                    start={{x: 0, y: 0}} end={{x: 1, y: 1}}
                >
                    {expenseState.isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.submitBtnText}>Xác nhận giao dịch</Text>
                            <View style={styles.submitBtnIcon}>
                                <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
                            </View>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={date}
        mode="date"
        onConfirm={(d) => {
          setShowDatePicker(false);
          setDate(d);
          setDateType('custom');
        }}
        onCancel={() => {
          setShowDatePicker(false);
          if (dateType === 'custom') setDateType('today');
        }}
        confirmText="Xác nhận"
        cancelText="Hủy"
        title="Chọn ngày giao dịch"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bgGlow: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.soft,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Tăng padding bottom để không bị TabBar che khuất
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  amountInput: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    padding: 0,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 8,
    marginTop: 8,
  },
  section: {
    marginTop: 24,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadow.soft,
  },
  dateChipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  dateChipTextActive: {
    color: '#FFF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 64) / 3,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadow.soft,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 60,
  },
  noteInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  micBtn: {
    padding: 8,
  },
  footer: {
    marginTop: 40,
    marginBottom: 60, // Thêm margin bottom cho nút xác nhận
  },
  submitBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glow,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginRight: 10,
  },
  submitBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreateExpenseScreen;
