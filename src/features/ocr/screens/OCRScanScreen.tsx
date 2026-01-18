import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  TextInput,
  NativeModules,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { AuthContext } from '../../../store/AuthContext';
import { useOcr } from '../../../common/hooks/useMVVM';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const OCRScanScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { scanInvoice, getJob, ocrState } = useOcr(
    authContext?.userToken || null,
  );

  const [fileUrl, setFileUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isScanning) {
      scanAnim.stopAnimation();
      scanAnim.setValue(0);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [isScanning, scanAnim]);

  const pickImage = useCallback(async (source: 'camera' | 'gallery') => {
    try {
      const options: any = {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.8,
      };

      const result =
        source === 'camera'
          ? await launchCamera(options)
          : await launchImageLibrary(options);

      if (result.didCancel) return;

      if (result.errorCode) {
        if (result.errorCode === 'camera_unavailable') {
          Alert.alert('Lỗi', 'Máy ảnh không khả dụng trên thiết bị này.');
        } else if (result.errorCode === 'permission') {
          Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền máy ảnh/thư viện trong cài đặt.');
        } else {
          Alert.alert('Lỗi', result.errorMessage || 'Không thể lấy ảnh');
        }
        return;
      }

      const asset = result.assets && result.assets[0];
      if (asset?.uri) {
        if (asset.base64) {
          const mime = asset.type || 'image/jpeg';
          setFileUrl(`data:${mime};base64,${asset.base64}`);
        } else {
          setFileUrl(asset.uri);
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chọn ảnh.');
    }
  }, []);

  const clearImage = () => {
    setFileUrl('');
  };

  const handleScan = useCallback(async () => {
    if (!fileUrl.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chụp/chọn ảnh hoặc nhập URL/Base64');
      return;
    }

    try {
      setIsScanning(true);
      const job = await scanInvoice(fileUrl.trim());

      let attempts = 0;
      let currentJob = job;
      while (attempts < 20) {
        if (currentJob.status === 'completed') {
          setIsScanning(false);
          navigation.navigate('OCRResult', { job: currentJob });
          return;
        }

        if (currentJob.status === 'failed') {
          throw new Error('OCR thất bại, vui lòng thử lại');
        }

        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), 2000);
        });
        currentJob = await getJob(job.id);
        attempts += 1;
      }

      throw new Error('OCR đang xử lý lâu hơn dự kiến');
    } catch (error: any) {
      setIsScanning(false);
      Alert.alert('Lỗi', error.message || 'Không thể quét hóa đơn');
    }
  }, [fileUrl, scanInvoice, getJob, navigation]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Quét hóa đơn thông minh</Text>
      <Text style={styles.subtitle}>
        Chụp ảnh hóa đơn của bạn, AI sẽ tự động phân tích và lưu chi tiêu.
      </Text>

      <View style={styles.previewCard}>
        {fileUrl ? (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: fileUrl }} style={styles.imagePreview} />
            {isScanning && (
              <View style={styles.scanningOverlay}>
                <Animated.View
                  style={[styles.scanLineAnim, { transform: [{ translateY }] }]}
                />
              </View>
            )}
            <TouchableOpacity style={styles.clearBtn} onPress={clearImage}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderWrap}>
            <Text style={styles.placeholderText}>Chưa có ảnh hóa đơn</Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => pickImage('camera')}
          >
            <Text style={styles.secondaryText}>Chụp ảnh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryButton,
              styles.lastAction,
            ]}
            onPress={() => pickImage('gallery')}
          >
            <Text style={styles.secondaryText}>Thư viện</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Hoặc dán URL/Base64:</Text>
        <TextInput
          style={styles.input}
          placeholder="https://... hoặc data:image/jpeg;base64,..."
          value={fileUrl}
          onChangeText={setFileUrl}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[
          styles.scanButton,
          (ocrState.isLoading || isScanning || !fileUrl) && styles.disabled,
        ]}
        onPress={handleScan}
        disabled={ocrState.isLoading || isScanning || !fileUrl}
      >
        {ocrState.isLoading || isScanning ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.scanText}>Bắt đầu quét</Text>
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
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  imagePreviewWrap: {
    width: '100%',
    height: 300,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderWrap: {
    width: '100%',
    height: 120,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  scanLineAnim: {
    height: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  clearBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  lastAction: {
    marginRight: 0,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    minHeight: 80,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  scanButton: {
    marginTop: Spacing.xl,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    ...Shadow.soft,
  },
  scanText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default OCRScanScreen;
