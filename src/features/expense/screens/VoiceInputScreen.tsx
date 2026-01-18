import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { useExpense } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';

const CATEGORY_HINTS: Array<{
  slug: string;
  keywords: string[];
  label: string;
}> = [
  { slug: 'food', label: 'Ăn uống', keywords: ['ăn', 'cafe', 'uống'] },
  { slug: 'transport', label: 'Đi lại', keywords: ['xe', 'xăng', 'grab'] },
  { slug: 'shopping', label: 'Mua sắm', keywords: ['mua', 'shop'] },
  { slug: 'utilities', label: 'Hóa đơn', keywords: ['điện', 'nước'] },
  { slug: 'entertainment', label: 'Giải trí', keywords: ['phim', 'game'] },
  { slug: 'healthcare', label: 'Sức khỏe', keywords: ['thuốc', 'bệnh'] },
];

const parseAmount = (text: string) => {
  const normalized = text.toLowerCase();
  const match = normalized.match(/(\d+[.,]?\d*)\s*(k|nghìn|tr|triệu)?/);
  if (!match) return 0;
  const raw = Number(match[1].replace(',', '.'));
  const unit = match[2];
  if (!unit) return raw;
  if (unit === 'k' || unit === 'nghìn') return raw * 1000;
  if (unit === 'tr' || unit === 'triệu') return raw * 1000000;
  return raw;
};

const detectCategory = (text: string) => {
  const normalized = text.toLowerCase();
  const hit = CATEGORY_HINTS.find(item =>
    item.keywords.some(keyword => normalized.includes(keyword)),
  );
  return hit?.slug || 'other';
};

const VoiceInputScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { createExpense, expenseState } = useExpense(
    authContext?.userToken || null,
  );
  const [transcript, setTranscript] = useState('');
  const [partial, setPartial] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(
    Platform.OS !== 'android',
  );

  useEffect(() => {
    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const result = event.value?.[0] || '';
      if (result) {
        setTranscript(result);
        setPartial('');
      }
    };
    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      const result = event.value?.[0] || '';
      setPartial(result);
    };
    Voice.onSpeechError = () => {
      setIsRecording(false);
    };
    Voice.onSpeechEnd = () => {
      setIsRecording(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const requestPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Cho phép ghi âm',
        message: 'Ứng dụng cần quyền ghi âm để nhận giọng nói.',
        buttonPositive: 'Cho phép',
        buttonNegative: 'Từ chối',
      },
    );
    const granted = result === PermissionsAndroid.RESULTS.GRANTED;
    setPermissionGranted(granted);
    return granted;
  };

  const handleStart = async () => {
    const granted = permissionGranted || (await requestPermission());
    if (!granted) {
      Alert.alert('Thiếu quyền', 'Vui lòng cấp quyền ghi âm.');
      return;
    }
    setPartial('');
    setTranscript('');
    setIsRecording(true);
    await Voice.start('vi-VN');
  };

  const handleStop = async () => {
    setIsRecording(false);
    await Voice.stop();
  };

  const preview = useMemo(() => {
    const amount = parseAmount(transcript);
    const category = detectCategory(transcript);
    return { amount, category };
  }, [transcript]);

  const handleSave = async () => {
    if (!transcript.trim()) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng nhập câu nói.');
      return;
    }
    if (!preview.amount || preview.amount <= 0) {
      Alert.alert('Thiếu dữ liệu', 'Không nhận diện được số tiền.');
      return;
    }
    try {
      await createExpense({
        amount: preview.amount,
        category: preview.category,
        description: transcript.trim(),
        spentAt: new Date().toISOString(),
      });
      Alert.alert('Thành công', 'Đã thêm chi tiêu', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo chi tiêu');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ghi âm giọng nói</Text>
      <Text style={styles.subtitle}>
        Bấm mic và nói, ví dụ: “Ăn sáng 30 nghìn”.
      </Text>

      <TouchableOpacity
        style={[styles.micButton, isRecording && styles.micButtonActive]}
        onPress={isRecording ? handleStop : handleStart}
      >
        <Text style={[styles.micText, isRecording && styles.micTextActive]}>
          {isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
        </Text>
      </TouchableOpacity>

      {partial ? (
        <Text style={styles.partialText}>Đang nghe: {partial}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Nhập nội dung..."
        placeholderTextColor={Colors.textMuted}
        value={transcript}
        onChangeText={setTranscript}
      />

      <View style={styles.previewCard}>
        <Text style={styles.previewLabel}>Tạm nhận diện</Text>
        <Text style={styles.previewValue}>
          {preview.amount ? `${preview.amount.toLocaleString()}₫` : '--'}
        </Text>
        <Text style={styles.previewHint}>Danh mục: {preview.category}</Text>
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  micButton: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  micButtonActive: {
    backgroundColor: Colors.primary,
  },
  micText: {
    fontWeight: '700',
    color: Colors.primary,
  },
  micTextActive: {
    color: '#FFF',
  },
  partialText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  previewLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  previewHint: {
    marginTop: Spacing.xs,
    fontSize: 12,
    color: Colors.textMuted,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
});

export default VoiceInputScreen;
