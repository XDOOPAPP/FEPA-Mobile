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
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { useExpense } from '../../../common/hooks/useMVVM';
import { aiRepository } from '../../../core/repositories/AiRepository';
import { AuthContext } from '../../../store/AuthContext';
import { GlassCard } from '../../../components/design-system/GlassCard';
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
  health: 'Sức khỏe',
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
            toValue: 1.15,
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
      console.log('[AI Voice] Processing text:', text);
      const prompt = `Bạn là trợ lý tài chính FEPA. Hãy phân tích câu nói chi tiêu tiếng Việt sau và trích xuất thông tin. 
      CHỈ TRẢ VỀ JSON hợp lệ theo format này: {"amount": number, "category": "food|transport|shopping|utilities|entertainment|healthcare|other", "description": "tóm tắt ngắn"}. 
      Câu nói: "${text}"`;

      const result = await aiRepository.assistantChat({ message: prompt });
      console.log('[AI Voice] AI Raw Response:', result.reply);
      
      const jsonMatch = result.reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          setParsedData(data);
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.back(1)),
            useNativeDriver: true,
          }).start();
        } catch (parseErr) {
          throw new Error('Dữ liệu AI trả về không đúng định dạng JSON.');
        }
      } else {
        throw new Error('AI không tìm thấy thông tin chi tiêu trong câu nói của bạn.');
      }
    } catch (error: any) {
      console.error('[AI Voice] Error:', error);
      Alert.alert('Lỗi AI', error.message || 'Không thể phân tích dữ liệu từ giọng nói. Vui lòng thử lại.');
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
      setIsRecording(false);
      await callNative('stopSpeech');
      if (transcriptRef.current.length > 3) {
        processWithAI(transcriptRef.current);
      }
    } else {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;

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
            setTranscript(result);
            transcriptRef.current = result;
          }
        });
        
        voiceEmitter.addListener('onSpeechEnd', () => {
          setIsRecording(false);
          if (transcriptRef.current.length > 3 && !isAiProcessing && !parsedData) {
            processWithAI(transcriptRef.current);
          }
        });

        voiceEmitter.addListener('onSpeechError', () => {
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
      Alert.alert('Thành công', 'Đã lưu chi tiêu!');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu chi tiêu');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.safeArea}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nhập giọng nói AI</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.micSection}>
             <View style={styles.micWrapper}>
                <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: isRecording ? 0.3 : 0 }]} />
                <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={handleToggleTranscription} 
                    style={[styles.micBtn, isRecording && styles.micBtnActive]}
                >
                    <LinearGradient
                        colors={isRecording ? [Colors.danger, '#EF4444'] : [Colors.primary, Colors.primaryDark]}
                        style={styles.micGradient}
                    >
                        <Ionicons name={isRecording ? "stop" : "mic"} size={36} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
             </View>
             <Text style={styles.statusText}>
                {isRecording ? 'Đang lắng nghe...' : 'Chạm để nói chi tiêu của bạn'}
             </Text>
             <Text style={styles.hintText}>
                Ví dụ: "Hôm nay tôi ăn phở hết 50 ngàn"
             </Text>
          </View>

          <View style={styles.transBox}>
             <View style={styles.transHeader}>
                <Text style={styles.transTitle}>VĂN BẢN NHẬN DIỆN</Text>
                {isRecording && <View style={styles.liveIndicator} />}
             </View>
             <Text style={[styles.transText, !transcript && styles.transPlaceholder]}>
                {transcript || "Đang chờ giọng nói của bạn..."}
             </Text>
          </View>

          {(isAiProcessing || parsedData) && (
            <Animated.View style={[styles.resultArea, { transform: [{ translateY: slideAnim }] }]}>
              {isAiProcessing ? (
                <View style={styles.aiLoadingBox}>
                   <ActivityIndicator color={Colors.primary} size="large" />
                   <Text style={styles.aiLoadingText}>AI đang phân tích dữ liệu...</Text>
                </View>
              ) : (
                <GlassCard style={styles.resCard}>
                   <View style={styles.resHeader}>
                      <View style={styles.aiIcon}>
                         <Ionicons name="sparkles" size={16} color="#FFF" />
                      </View>
                      <Text style={styles.resTitle}>Kết quả từ FEPA AI</Text>
                   </View>

                   <View style={styles.resBody}>
                      <View style={styles.resRow}>
                         <View style={styles.resCol}>
                            <Text style={styles.resLabel}>SỐ TIỀN</Text>
                            <Text style={styles.resAmount}>{parsedData?.amount.toLocaleString()}₫</Text>
                         </View>
                         <View style={styles.resCol}>
                            <Text style={styles.resLabel}>DANH MỤC</Text>
                            <View style={styles.tag}>
                               <Text style={styles.tagText}>{CATEGORIES[parsedData?.category || 'other']}</Text>
                            </View>
                         </View>
                      </View>

                      <View style={styles.resDesc}>
                         <Text style={styles.resLabel}>GHI CHÚ</Text>
                         <Text style={styles.resDescText}>{parsedData?.description}</Text>
                      </View>

                      <TouchableOpacity style={styles.saveBtn} onPress={handleConfirm}>
                         <Text style={styles.saveBtnText}>Xác nhận & Lưu chi tiêu</Text>
                         <Ionicons name="chevron-forward" size={18} color="#FFF" />
                      </TouchableOpacity>
                   </View>
                </GlassCard>
              )}
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  micSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  micWrapper: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    ...Shadow.md,
    zIndex: 5,
  },
  micGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: {
    shadowColor: Colors.danger,
  },
  pulseCircle: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: Colors.primary,
      zIndex: 1,
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hintText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  transBox: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: Radius.xl,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 25,
  },
  transHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  transTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  transText: {
    fontSize: 18,
    lineHeight: 28,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  transPlaceholder: {
    color: '#CBD5E1',
    fontStyle: 'italic',
  },
  resultArea: {
    marginTop: 10,
  },
  aiLoadingBox: {
    alignItems: 'center',
    padding: 30,
  },
  aiLoadingText: {
    marginTop: 15,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  resCard: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '20',
  },
  resHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  resTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resBody: {
    padding: 20,
  },
  resRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resCol: {
    flex: 1,
  },
  resLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    marginBottom: 6,
    letterSpacing: 1,
  },
  resAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tag: {
    backgroundColor: Colors.primaryLight + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  resDesc: {
    marginBottom: 25,
  },
  resDescText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  }
});

export default VoiceInputScreen;
