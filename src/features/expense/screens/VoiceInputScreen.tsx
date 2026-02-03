import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
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
  StatusBar,
  Animated,
  Easing,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { useExpense } from '../../../common/hooks/useMVVM';
import { aiRepository } from '../../../core/repositories/AiRepository';
import { AuthContext } from '../../../store/AuthContext';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

const VoiceModule = NativeModules.Voice || NativeModules.RCTVoice;

// Hard Patch: Inject native module directly into the library's internal reference
if (Voice && VoiceModule) {
  const v = Voice as any;
  if (!v._nativeModule || v._nativeModule === null) {
    v._nativeModule = VoiceModule;
    console.log('[Voice] Hard patch applied: Native module injected.');
  }
}

console.log('[Voice] Bridge Status:', {
  moduleFound: !!VoiceModule,
  internalBound: !!(Voice as any)._nativeModule
});

const CATEGORIES: Record<string, string> = {
  food: 'Ăn uống',
  transport: 'Đi lại',
  shopping: 'Mua sắm',
  utilities: 'Hóa đơn',
  entertainment: 'Giải trí',
  healthcare: 'Sức khỏe',
  other: 'Khác',
};

const VoiceInputScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { createExpense, expenseState } = useExpense(authContext?.userToken || null);
  
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<{ amount: number; category: string; description: string } | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const transcriptRef = useRef('');

  // Custom emitter to bypass the broken library internal event system
  const [voiceEmitter] = useState(() => new NativeEventEmitter(VoiceModule));

  useEffect(() => {
    return () => {
      callNative('destroySpeech');
    };
  }, []);

  // Pulse animation loop
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const processWithAI = async (text: string) => {
    if (!text || text.length < 3) return;
    
    setIsAiProcessing(true);
    setParsedData(null);
    try {
      const prompt = `Bạn là trợ lý tài chính FEPA. Hãy phân tích câu nói chi tiêu tiếng Việt sau và trích xuất thông tin. 
      CHỈ TRẢ VỀ JSON hợp lệ theo format này: {"amount": number, "category": "food|transport|shopping|utilities|entertainment|healthcare|other", "description": "tóm tắt ngắn"}. 
      Câu nói: "${text}"`;

      const result = await aiRepository.assistantChat({ message: prompt });
      
      const jsonMatch = result.reply.match(/\{.*\}/s);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        setParsedData(data);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1)),
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('[AI Voice] Parsing error:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  // Helper to call native methods safely with Promises
  const callNative = (method: string, ...args: any[]): Promise<any> => {
    return new Promise((resolve) => {
      if (!VoiceModule || !VoiceModule[method]) {
        console.warn(`[Voice] Method ${method} not found`);
        return resolve(null);
      }
      
      VoiceModule[method](...args, (err: any, out: any) => {
        if (err) console.log(`[Voice] ${method} error:`, err);
        resolve(out || err);
      });
    });
  };

  const handleToggleTranscription = async () => {
    if (isRecording) {
      console.log('[Voice] Manual stop requested');
      setIsRecording(false);
      await callNative('stopSpeech');
      
      // Force AI processing on manual stop if we have enough text
      if (transcriptRef.current.length > 3) {
        console.log('[Voice] Triggering AI processing immediately after manual stop...');
        processWithAI(transcriptRef.current);
      }
    } else {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

      console.log('[Voice] Starting new recording session...');
      setIsRecording(true);
      setTranscript('');
      transcriptRef.current = '';
      setParsedData(null);
      
      if (!VoiceModule) {
        setIsRecording(false);
        Alert.alert('Lỗi', 'Không tìm thấy driver Microphone.');
        return;
      }
      
      try {
        await callNative('destroySpeech');
        
        // Direct event registration to the bridge
        voiceEmitter.removeAllListeners('onSpeechPartialResults');
        voiceEmitter.removeAllListeners('onSpeechResults');
        voiceEmitter.removeAllListeners('onSpeechEnd');
        voiceEmitter.removeAllListeners('onSpeechError');

        voiceEmitter.addListener('onSpeechPartialResults', (e: any) => {
          if (e.value && e.value[0]) {
            setTranscript(e.value[0]);
            transcriptRef.current = e.value[0];
          }
        });

        voiceEmitter.addListener('onSpeechResults', (e: any) => {
          if (e.value && e.value[0]) {
            const result = e.value[0];
            console.log('[Voice] Final result received:', result);
            setTranscript(result);
            transcriptRef.current = result;
          }
        });
        
        voiceEmitter.addListener('onSpeechEnd', () => {
          console.log('[Voice] onSpeechEnd fired. Current text:', transcriptRef.current);
          setIsRecording(false);
          if (transcriptRef.current.length > 3 && !isAiProcessing && !parsedData) {
            console.log('[Voice] Triggering AI processing from onSpeechEnd...');
            processWithAI(transcriptRef.current);
          }
        });

        voiceEmitter.addListener('onSpeechError', (e: any) => {
          console.log('[Voice] Speech error code:', e.error?.code || e.code);
          setIsRecording(false);
        });

        const options = {
          EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
          EXTRA_MAX_RESULTS: 1,
          EXTRA_PARTIAL_RESULTS: true,
          REQUEST_PERMISSIONS_AUTO: true,
        };

        VoiceModule.startSpeech('vi-VN', options, (err: any) => {
          if (err) {
            console.error('[Voice] Native start error:', err);
            setIsRecording(false);
          }
        });
      } catch (error: any) {
        console.error('[Voice] Setup crash:', error);
        setIsRecording(false);
      }
    }
  };

  const handleConfirm = async () => {
    if (!parsedData || parsedData.amount <= 0) return;

    try {
      await createExpense({
        amount: parsedData.amount,
        category: parsedData.category,
        description: parsedData.description || transcript,
        spentAt: new Date().toISOString(),
      });
      navigation.goBack();
      Alert.alert('Thành công', 'Đã lưu chi tiêu bằng giọng nói!');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu chi tiêu');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1A1C1E', '#121416']} style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nhập giọng nói AI</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.micContainer}>
            <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }]} />
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleToggleTranscription} 
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
            >
              <Ionicons name={isRecording ? "stop" : "mic"} size={40} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.statusText}>
              {isRecording ? 'Đang nghe bạn nói...' : 'Nhấn vào mic để bắt đầu'}
            </Text>
          </View>

          {/* Transcript View */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>Văn bản nhận diện:</Text>
            <Text style={styles.transcriptText}>
              {transcript || (isRecording ? 'Đang lắng nghe...' : 'Sẵn sàng nhận lệnh')}
            </Text>
          </View>

          {/* AI Result Card */}
          {(isAiProcessing || parsedData) && (
            <Animated.View style={[styles.resultCard, { transform: [{ translateY: slideAnim }] }]}>
              {isAiProcessing ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={Colors.primary} size="large" />
                  <Text style={styles.aiLoadingText}>AI đang phân tích chi tiêu...</Text>
                </View>
              ) : (
                <View>
                  <View style={styles.resultHeader}>
                     <Ionicons name="sparkles" size={20} color={Colors.primary} />
                     <Text style={styles.resultTitle}>Kết quả phân tích AI</Text>
                  </View>
                  
                  <View style={styles.dataRow}>
                    <View style={styles.dataItem}>
                      <Text style={styles.dataLabel}>Số tiền</Text>
                      <Text style={styles.dataValue}>{parsedData?.amount.toLocaleString()}₫</Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Text style={styles.dataLabel}>Danh mục</Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{CATEGORIES[parsedData?.category || 'other']}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.descBox}>
                    <Text style={styles.dataLabel}>Ghi chú</Text>
                    <Text style={styles.descValue}>{parsedData?.description}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.confirmBtn} 
                    onPress={handleConfirm}
                    disabled={expenseState.isLoading}
                  >
                    {expenseState.isLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Text style={styles.confirmText}>Xác nhận & Lưu</Text>
                        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          )}

        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  micContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  micBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 5,
  },
  micBtnActive: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
  },
  pulseCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
    zIndex: 1,
  },
  statusText: {
    marginTop: 20,
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  transcriptBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  transcriptLabel: {
    ...Typography.captionBold,
    color: Colors.primary,
    marginBottom: 8,
  },
  transcriptText: {
    ...Typography.body,
    color: '#FFF',
    fontSize: 18,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  resultCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadow.glow,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aiLoadingText: {
    marginTop: 16,
    ...Typography.body,
    color: Colors.textSecondary,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  resultTitle: {
    ...Typography.h4,
    color: '#FFF',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dataItem: {
    flex: 1,
  },
  dataLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  dataValue: {
    ...Typography.h2,
    color: '#FFF',
    fontSize: 24,
  },
  categoryBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  categoryText: {
    color: Colors.primaryLight,
    fontWeight: '700',
    fontSize: 12,
  },
  descBox: {
    marginBottom: 24,
  },
  descValue: {
    ...Typography.body,
    color: '#FFF',
    lineHeight: 22,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  confirmText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default VoiceInputScreen;
