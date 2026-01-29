import React, { useContext, useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useExpense } from '../../../common/hooks/useMVVM';
import { useAI } from '../../../common/hooks/useAI';
import { AuthContext } from '../../../store/AuthContext';
import { Colors, Radius, Spacing, Typography, Shadow } from '../../../constants/theme';
import { saveReceipt } from '../../../utils/receiptStorage';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { ModernInput } from '../../../components/design-system/ModernInput';
import { GradientButton } from '../../../components/design-system/GradientButton';

const CATEGORIES = [
  { label: 'Ăn uống', slug: 'food', icon: '🍔' },
  { label: 'Đi lại', slug: 'transport', icon: '🚗' },
  { label: 'Mua sắm', slug: 'shopping', icon: '🛍️' },
  { label: 'Hóa đơn', slug: 'utilities', icon: '💡' },
  { label: 'Giải trí', slug: 'entertainment', icon: '🎬' },
  { label: 'Sức khỏe', slug: 'healthcare', icon: '💊' },
  { label: 'Giáo dục', slug: 'education', icon: '📚' },
  { label: 'Khác', slug: 'other', icon: '📦' },
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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const handleAISuggest = async () => {
    setAiSuggesting(true);
    setAiSuggestion(null);
    try {
      const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));
      if (!parsedAmount || parsedAmount <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ để gợi ý danh mục');
        setAiSuggesting(false);
        return;
      }
      const payload = {
        amount: parsedAmount,
        description: note,
        spentAt: new Date(date).toISOString(),
      };
      const res = await categorizeExpense(payload);
      if (res && res.category) {
        setAiSuggestion(res.category);
        const found = CATEGORIES.find(c => c.label === res.category || c.slug === res.category);
        if (found) {
            setCategory(found.slug);
            Alert.alert('AI Gợi ý', `Đã chọn danh mục: ${found.label} (Độ tin cậy: ${(res.confidence * 100).toFixed(0)}%)`);
        }
      } else {
        setAiSuggestion('Không có gợi ý');
      }
    } catch {
      setAiSuggestion('Không thể gợi ý');
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    try {
      const categoryLabel =
        CATEGORIES.find(item => item.slug === category)?.label || 'Chi tiêu';
      const description = note.trim() || `Chi tiêu ${categoryLabel}`;

      const created = await createExpense({
        amount: parsedAmount,
        category,
        description,
        spentAt: new Date(date).toISOString(),
      });

      if (receiptUrl.trim()) {
        await saveReceipt({
          id: `${created.id}-receipt`,
          expenseId: created.id,
          uri: receiptUrl.trim(),
          amount: parsedAmount,
          category,
          createdAt: new Date().toISOString(),
        });
      }
      Alert.alert('Thành công', 'Đã thêm chi tiêu', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo chi tiêu');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm chi tiêu</Text>
        <View style={{width: 40}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Money Input Section */}
        <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💰 Số tiền</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                    <ModernInput
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0"
                        keyboardType="numeric"
                        label="Nhập số tiền (VND)"
                    />
                </View>
                <TouchableOpacity 
                    style={styles.micInputButton}
                    onPress={() => navigation.navigate('VoiceInput')}
                >
                    <Ionicons name="mic-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
                style={styles.aiButton} 
                onPress={handleAISuggest}
                disabled={aiSuggesting || aiLoading}
            >
                {aiSuggesting ? <ActivityIndicator color={Colors.primary} size="small" /> : <Text style={styles.aiButtonText}>✨ AI Gợi ý danh mục</Text>}
            </TouchableOpacity>
        </GlassCard>

        {/* Category Section */}
        <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📂 Danh mục</Text>
            <View style={styles.categoryGrid}>
                {CATEGORIES.map(item => (
                <TouchableOpacity
                    key={item.slug}
                    style={[
                    styles.categoryItem,
                    category === item.slug && styles.categoryItemActive,
                    ]}
                    onPress={() => setCategory(item.slug)}
                >
                    <View style={[styles.iconCircle, category === item.slug && {backgroundColor: 'rgba(255,255,255,0.2)'}]}>
                        <Text style={{fontSize: 20}}>{item.icon}</Text>
                    </View>
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
        </GlassCard>

        {/* Details Section */}
        <GlassCard style={styles.sectionCard}>
             <Text style={styles.sectionTitle}>📝 Chi tiết</Text>
             <ModernInput
                value={note}
                onChangeText={setNote}
                placeholder="Mua sắm tại siêu thị..."
                label="Ghi chú"
                multiline
                numberOfLines={3}
                containerStyle={{marginBottom: 16}}
            />
             <ModernInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                label="Ngày giao dịch"
                containerStyle={{marginBottom: 16}}
            />
             <ModernInput
                value={receiptUrl}
                onChangeText={setReceiptUrl}
                placeholder="https://..."
                label="Link ảnh hóa đơn (tùy chọn)"
            />
             {receiptUrl ? (
                <View style={styles.previewContainer}>
                     <Image source={{ uri: receiptUrl }} style={styles.previewImage} resizeMode="cover" />
                </View>
             ) : null}
        </GlassCard>

        <View style={styles.footer}>
             <GradientButton 
                title="Lưu Chi Tiêu"
                onPress={handleSubmit}
                loading={expenseState.isLoading}
                icon={<Ionicons name="checkmark-circle" size={24} color="#FFF" />}
             />
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  sectionCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryHighlight,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  aiButtonText: {
    ...Typography.captionBold,
    color: Colors.primary,
  },
  previewContainer: {
    marginTop: Spacing.md,
    height: 150,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    marginBottom: Spacing.xl,
  },
  micInputButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.soft,
  },
});

export default CreateExpenseScreen;
