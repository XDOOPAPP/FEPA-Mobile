import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useExpense } from '../../../common/hooks/useMVVM';
import { useAI } from '../../../common/hooks/useAI';
import { AuthContext } from '../../../store/AuthContext';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const CATEGORIES = [
  { label: 'Ăn uống', slug: 'food' },
  { label: 'Đi lại', slug: 'transport' },
  { label: 'Mua sắm', slug: 'shopping' },
  { label: 'Hóa đơn', slug: 'utilities' },
  { label: 'Giải trí', slug: 'entertainment' },
  { label: 'Sức khỏe', slug: 'healthcare' },
  { label: 'Khác', slug: 'other' },
];

type EditExpenseRouteParams = {
  expenseId: string;
};

const EditExpenseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: EditExpenseRouteParams }, 'params'>>();
  const { expenseId } = route.params;
  
  const authContext = useContext(AuthContext);
  const { getExpenseById, updateExpense, expenseState } = useExpense(
    authContext?.userToken || null,
  );
  const { categorizeExpense, loading: aiLoading } = useAI(authContext?.userToken || null);

  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  // Load expense data on mount
  useEffect(() => {
    const loadExpense = async () => {
      try {
        const expense = await getExpenseById(expenseId);
        if (expense) {
          setAmount(expense.amount.toString());
          setCategory(expense.category || 'other');
          setNote(expense.description || '');
          setDate(expense.spentAt?.split('T')[0] || new Date().toISOString().split('T')[0]);
          setReceiptUrl(expense.receiptUrl || '');
        }
      } catch (error: any) {
        Alert.alert('Lỗi', error.message || 'Không thể tải chi tiêu');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    loadExpense();
  }, [expenseId, getExpenseById, navigation]);

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

      await updateExpense(expenseId, {
        amount: parsedAmount,
        category,
        description,
        spentAt: new Date(date).toISOString(),
        receiptUrl: receiptUrl.trim() || undefined,
      });

      Alert.alert('Thành công', 'Đã cập nhật chi tiêu', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật chi tiêu');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Chỉnh sửa chi tiêu</Text>
      
      <Text style={styles.label}>Số tiền (VND)</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập số tiền"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.categoryWrap}>
        {CATEGORIES.map(item => (
          <TouchableOpacity
            key={item.slug}
            style={[
              styles.categoryChip,
              category === item.slug && styles.categoryChipActive,
            ]}
            onPress={() => setCategory(item.slug)}
          >
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
      
      <TouchableOpacity
        style={[
          styles.suggestButton,
          (aiSuggesting || aiLoading) && styles.disabled,
        ]}
        onPress={handleAISuggest}
        disabled={aiSuggesting || aiLoading}
      >
        {aiSuggesting || aiLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.suggestText}>Gợi ý danh mục (AI)</Text>
        )}
      </TouchableOpacity>
      
      {aiSuggestion && (
        <View style={styles.suggestResultWrap}>
          <Text style={styles.suggestResultText}>
            Gợi ý: {aiSuggestion}
          </Text>
          {aiSuggestion !== 'Không thể gợi ý' && aiSuggestion !== 'Không có gợi ý' && (
            <TouchableOpacity
              style={styles.suggestApplyButton}
              onPress={() => {
                const found = CATEGORIES.find(c => c.label === aiSuggestion);
                if (found) setCategory(found.slug);
              }}
            >
              <Text style={styles.suggestApplyText}>Áp dụng</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text style={styles.label}>Ghi chú</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        placeholder="Ghi chú (tuỳ chọn)"
        value={note}
        onChangeText={setNote}
        multiline
      />

      <Text style={styles.label}>Ngày</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
      />

      <Text style={styles.label}>Hóa đơn (URL ảnh)</Text>
      <TextInput
        style={styles.input}
        placeholder="Dán URL ảnh hóa đơn"
        value={receiptUrl}
        onChangeText={setReceiptUrl}
      />
      {receiptUrl ? (
        <View style={styles.previewCard}>
          <Image source={{ uri: receiptUrl }} style={styles.previewImage} />
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, expenseState.isLoading && styles.disabled]}
          onPress={handleSubmit}
          disabled={expenseState.isLoading}
        >
          {expenseState.isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Cập nhật</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
    ...Shadow.soft,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: '#FFF',
  },
  suggestButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  suggestText: {
    color: '#FFF',
    fontWeight: '600',
  },
  suggestResultWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  suggestResultText: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginRight: 10,
  },
  suggestApplyButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  suggestApplyText: {
    color: '#FFF',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  cancelText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.lg,
    marginLeft: Spacing.sm,
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    backgroundColor: Colors.border,
  },
  submitText: {
    color: '#FFF',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
});

export default EditExpenseScreen;
