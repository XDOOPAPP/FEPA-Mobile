import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../store/AuthContext';
import { useExpense } from '../../../common/hooks/useMVVM';
import { useOCR } from '../../../store/OCRContext';
import { OcrJob } from '../../../core/models/Ocr';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { saveReceipt } from '../../../utils/receiptStorage';

const CATEGORIES = [
  { label: 'Ăn uống', slug: 'food' },
  { label: 'Đi lại', slug: 'transport' },
  { label: 'Mua sắm', slug: 'shopping' },
  { label: 'Hóa đơn', slug: 'utilities' },
  { label: 'Khác', slug: 'other' },
];

const OCRResultScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { createExpense, expenseState } = useExpense(
    authContext?.userToken || null,
  );
  const { addScan, currentOcrResult } = useOCR();

  // Get job from context
  const job = currentOcrResult;
  const expenseData = job?.resultJson?.expenseData;

  const defaultCategory = useMemo(() => {
    const category = expenseData?.category || 'other';
    return CATEGORIES.find(item => item.slug === category)?.slug || 'other';
  }, [expenseData?.category]);

  const [amount, setAmount] = useState(
    expenseData?.amount ? expenseData.amount.toString() : '',
  );
  const [description, setDescription] = useState(
    expenseData?.description || 'Chi tiêu từ OCR',
  );
  const [category, setCategory] = useState(defaultCategory);
  const [date, setDate] = useState(
    expenseData?.spentAt
      ? expenseData.spentAt.split('T')[0]
      : new Date().toISOString().split('T')[0],
  );

  const merchantName =
    job?.resultJson?.qrData &&
    typeof job.resultJson.qrData === 'object' &&
    'sellerName' in job.resultJson.qrData
      ? String((job.resultJson.qrData as any).sellerName)
      : 'Hóa đơn';

  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!job) {
       Alert.alert('Lỗi', 'Dữ liệu không hợp lệ');
       return;
    }

    try {
      const spentAt = new Date(date).toISOString();
      
      // 1. Create Expense (History)
      const newExpense = await createExpense({
        amount: parsedAmount,
        category,
        description: description.trim(),
        spentAt,
        receiptUrl: job.fileUrl || undefined, // Link for future reference
        ocrJobId: job.id, // Pass job ID to link/update auto-created expense
        location: merchantName, // Store merchant name as location
      });

      // 2. Save Receipt to Gallery (Local Storage)
      if (job.fileUrl) {
         try {
           await saveReceipt({
              id: Date.now().toString(),
              expenseId: newExpense.id,
              uri: job.fileUrl,
              amount: parsedAmount,
              category: category,
              createdAt: spentAt
           });
         } catch(e) {
           console.warn('Failed to save receipt gallery image', e);
         }
      }

      // 3. Add to Scan History (OCR Logs)
      await addScan({
        id: job.id,
        timestamp: Date.now(),
        date: spentAt,
        amount: parsedAmount,
        merchant: merchantName,
        category: category as any,
        description: description.trim(),
        items: [],
        confidence: expenseData?.confidence,
        source: expenseData?.source === 'qr' ? 'qr' : 'ocr',
        syncedToBackend: true,
        syncedAt: Date.now(),
      });

      Alert.alert('Thành công', 'Đã lưu chi tiêu và hóa đơn', [
        { text: 'OK', onPress: () => navigation.navigate('Transactions') },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu chi tiêu');
    }
  };

  if (!job) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Không có dữ liệu OCR</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Kết quả OCR</Text>
      <Text style={styles.subtitle}>Bạn có thể chỉnh sửa trước khi lưu</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Độ tin cậy</Text>
        <Text style={styles.infoValue}>
          {expenseData?.confidence ? `${expenseData.confidence}%` : 'N/A'}
        </Text>
      </View>

      <Text style={styles.label}>Số tiền (VND)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="Nhập số tiền"
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

      <Text style={styles.label}>Mô tả</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Nhập mô tả"
      />

      <Text style={styles.label}>Ngày</Text>
      <TextInput 
        style={styles.input} 
        value={date} 
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />

      <TouchableOpacity
        style={[styles.saveButton, expenseState.isLoading && styles.disabled]}
        onPress={handleSave}
        disabled={expenseState.isLoading}
      >
        {expenseState.isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveText}>Lưu chi tiêu</Text>
        )}
      </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.soft,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md, // Tăng padding
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.soft,
    color: Colors.textPrimary,
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
  saveButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadow.glow,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.7,
  },
});

export default OCRResultScreen;
