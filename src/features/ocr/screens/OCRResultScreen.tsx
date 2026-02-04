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
  Image,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../store/AuthContext';
import { useExpense } from '../../../common/hooks/useMVVM';
import { useOCR } from '../../../store/OCRContext';
import { OcrJob } from '../../../core/models/Ocr';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { saveReceipt } from '../../../utils/receiptStorage';
import { GlassCard } from '../../../components/design-system/GlassCard';

const CATEGORIES = [
  { label: 'Ăn uống', slug: 'food' },
  { label: 'Đi lại', slug: 'transport' },
  { label: 'Mua sắm', slug: 'shopping' },
  { label: 'Giải trí', slug: 'entertainment' },
  { label: 'Y tế', slug: 'health' },
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
  // CHỈ TẬP TRUNG LẤY EXPENSE DATA THEO YÊU CẦU
  const expenseData = job?.resultJson?.expenseData;

  const defaultCategory = useMemo(() => {
    const category = expenseData?.category || 'other';
    return CATEGORIES.find(item => item.slug === category)?.slug || 'other';
  }, [expenseData?.category]);

  const [amount, setAmount] = useState(
    expenseData?.amount ? expenseData.amount.toString() : '',
  );
  const [description, setDescription] = useState(
    expenseData?.description || 'Chi tiêu mới',
  );
  const [category, setCategory] = useState(defaultCategory);
  const [date, setDate] = useState(
    expenseData?.spentAt
      ? expenseData.spentAt.split('T')[0]
      : new Date().toISOString().split('T')[0],
  );

  // Tên đơn vị bán hàng/Mô tả - Lấy trực tiếp từ expenseData
  const merchantName = useMemo(() => {
    return expenseData?.description || 'Hóa đơn mới';
  }, [expenseData]);

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
      // 1. Chuẩn bị payload để tạo Expense mới
      // Ưu tiên sử dụng dữ liệu từ form (người dùng có thể đã sửa)
      const spentAt = new Date(date).toISOString();
      const expensePayload = {
        amount: parsedAmount,
        description: description.trim(),
        category: category,
        spentAt: spentAt,
        receiptUrl: job.fileUrl,
        ocrJobId: job.id, // Gắn ID job để backend biết nguồn gốc
        notes: `Quét từ OCR ${job.id}`
      };

      // 2. Gọi API tạo Expense
      console.log('[OCR Result] Calling API to create expense...');
      const newExpense = await createExpense(expensePayload);
      console.log('[OCR Result] Expense created successfully:', newExpense.id);

      // 3. Lưu hóa đơn vào bộ sưu tập nội bộ để truy cập offline nhanh
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

      // 4. Thêm vào lịch sử quét địa phương (OCR Logs)
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

      // 5. Thông báo và chuyển hướng
      Alert.alert('Thành công', 'Chi tiêu đã được lưu vào hệ thống.', [
        { text: 'Xem chi tiêu', onPress: () => navigation.navigate('Transactions') },
      ]);
    } catch (error: any) {
      console.error('[OCR Result] handleSave Error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tạo chi tiêu. Vui lòng thử lại.');
    }
  };

  if (!job) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
           </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
           <Ionicons name="alert-circle-outline" size={64} color={Colors.border} />
           <Text style={styles.emptyText}>Không tìm thấy dữ liệu hóa đơn</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Xác nhận hóa đơn</Text>
         <View style={{width: 40}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Receipt Image Preview */}
        {job.fileUrl && (
           <View style={styles.imageSection}>
              <Image source={{ uri: job.fileUrl }} style={styles.previewImage} resizeMode="contain" />
              <View style={styles.imageOverlay}>
                 <LinearGradient 
                   colors={['transparent', 'rgba(0,0,0,0.6)']}
                   style={styles.gradientOverlay}
                 />
                 <Text style={styles.confidenceToast}>
                    Độ tin cậy AI: {expenseData?.confidence ? `${expenseData.confidence}%` : '85%'}
                 </Text>
              </View>
           </View>
        )}

        <View style={styles.formContainer}>
           <GlassCard style={styles.mainCard}>
              <Text style={styles.fieldLabel}>SỐ TIỀN CHI TIÊU</Text>
              <View style={styles.amountInputRow}>
                 <Text style={styles.currencySymbol}>₫</Text>
                 <TextInput
                   style={styles.amountInput}
                   value={amount}
                   onChangeText={setAmount}
                   keyboardType="numeric"
                   placeholder="0"
                   placeholderTextColor={Colors.border}
                 />
              </View>

              <View style={styles.divider} />

              <Text style={styles.fieldLabel}>DANH MỤC</Text>
              <View style={styles.categoryGrid}>
                 {CATEGORIES.map(item => (
                   <TouchableOpacity
                     key={item.slug}
                     style={[
                       styles.catChip,
                       category === item.slug && styles.catChipActive,
                       category === item.slug && { backgroundColor: Colors.primary }
                     ]}
                     onPress={() => setCategory(item.slug)}
                   >
                     <Text style={[styles.catChipText, category === item.slug && styles.catChipTextActive]}>
                       {item.label}
                     </Text>
                   </TouchableOpacity>
                 ))}
              </View>
           </GlassCard>

           <View style={{height: 20}} />

           <View style={styles.secondaryForm}>
              <Text style={styles.fieldLabel}>GHI CHÚ / MÔ TẢ</Text>
              <View style={styles.inputBox}>
                 <Ionicons name="create-outline" size={20} color={Colors.textMuted} style={{marginRight: 10}} />
                 <TextInput
                   style={styles.textInput}
                   value={description}
                   onChangeText={setDescription}
                   placeholder="Nhập tên cửa hàng hoặc món đồ..."
                   placeholderTextColor={Colors.textMuted}
                 />
              </View>

              <Text style={styles.fieldLabel}>NGÀY CHI TIÊU</Text>
              <View style={styles.inputBox}>
                 <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} style={{marginRight: 10}} />
                 <TextInput 
                   style={styles.textInput} 
                   value={date} 
                   onChangeText={setDate}
                   placeholder="YYYY-MM-DD"
                   placeholderTextColor={Colors.textMuted}
                 />
              </View>
           </View>

           <TouchableOpacity
              style={[styles.saveBtn, expenseState.isLoading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={expenseState.isLoading}
           >
              <LinearGradient
                 colors={['#0EA5E9', '#0284C7']}
                 start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                 style={styles.btnGradient}
              >
                 {expenseState.isLoading ? (
                   <ActivityIndicator color="#FFF" />
                 ) : (
                   <>
                     <Ionicons name="checkmark-circle" size={24} color="#FFF" style={{marginRight: 10}} />
                     <Text style={styles.saveBtnText}>Lưu giao dịch</Text>
                   </>
                 )}
              </LinearGradient>
           </TouchableOpacity>
           
           <TouchableOpacity 
              style={styles.cancelLink}
              onPress={() => navigation.goBack()}
              disabled={expenseState.isLoading}
           >
              <Text style={styles.cancelLinkText}>Chụp lại hóa đơn khác</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
    marginTop: Platform.OS === 'ios' ? 40 : 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
  scrollContent: {
    paddingBottom: 40,
  },
  imageSection: {
    height: 260,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 24,
    backgroundColor: '#000',
    overflow: 'hidden',
    ...Shadow.lg,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  confidenceToast: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  mainCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFF',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0EA5E9',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    borderColor: 'transparent',
  },
  catChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFF',
  },
  secondaryForm: {
    marginBottom: 30,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...Shadow.soft,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  saveBtn: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadow.glow,
  },
  btnGradient: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  cancelLink: {
    alignItems: 'center',
    padding: 10,
  },
  cancelLinkText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '600',
  }
});

export default OCRResultScreen;
