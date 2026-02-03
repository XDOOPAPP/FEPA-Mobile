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
  Dimensions,
  StatusBar,
  ImageBackground,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { 
  Camera, 
  useCameraDevice, 
  useCameraPermission,
  useCameraFormat,
  useCodeScanner,
} from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { AuthContext } from '../../../store/AuthContext';
import { useOcr } from '../../../common/hooks/useMVVM';
import { useOCR } from '../../../store/OCRContext';
import { Colors } from '../../../constants/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';


const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.75;

const OCRScanScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const authContext = useContext(AuthContext);
  const { scanInvoice, refreshJobStatus } = useOcr(authContext?.userToken || null);
  const { setCurrentOcrResult } = useOCR();

  // Camera State
  const device = useCameraDevice('back');
  
  // Simpler format selection to avoid hardware issues on some Android devices
  const format = useCameraFormat(device, [
    { photoResolution: 'max' },
    { fps: 30 }
  ]);

  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isActive, setIsActive] = useState(true);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const isTakingPhotoRef = useRef(false);

  // App State
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // QR Code Scanner Logic
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && !isScanning && !capturedImage) {
        const value = codes[0].value;
        if (value) {
          console.log('[QR] Scanned code:', value);
          handleQRCode(value);
        }
      }
    }
  });

  const handleQRCode = async (data: string) => {
    // If it looks like a financial QR (VietQR / VNPay), auto-capture
    if (data.startsWith('000201') || data.includes('|')) {
      console.log('[QR] Detected financial QR, auto-capturing...');
      takePhoto();
    }
  };

  // Hide TabBar when focused
  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        parent.setOptions({
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            elevation: 0,
            borderTopWidth: 0,
          }
        });
      };
    }
  }, [navigation]);

  // Request Permission
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // Animation Ref
  const scanAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const startScanAnimation = useCallback(() => {
    if (isScanning || !capturedImage) {
      if (scanAnimRef.current) scanAnimRef.current.stop();

      scanAnimRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: SCAN_SIZE,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      scanAnimRef.current.start();
    } else {
      if (scanAnimRef.current) {
        scanAnimRef.current.stop();
        scanAnimRef.current = null;
      }
      scanLineAnim.setValue(0);
    }
  }, [isScanning, capturedImage]);

  // Animation Control
  useEffect(() => {
    startScanAnimation();
    return () => {
      if (scanAnimRef.current) scanAnimRef.current.stop();
    };
  }, [startScanAnimation]);

  // Active state management: Keep camera alive while focused 
  // to avoid "Camera is closed" errors during capture transitions.
  useEffect(() => {
    setIsActive(isFocused);
  }, [isFocused]);


  const takePhoto = async () => {
    if (camera.current && isCameraReady && isActive && !isTakingPhotoRef.current) {
      try {
        isTakingPhotoRef.current = true;
        console.log('[OCR] Taking photo...');
        
        const photo = await camera.current.takePhoto({
          flash: device?.hasFlash ? flash : 'off',
          enableShutterSound: false,
        });
        
        const path = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
        console.log('[OCR] Photo captured successfully:', path);
        
        setCapturedImage(path);
        // We handleScan AFTER setting captured image to let UI update
        setTimeout(() => handleScan(path), 100);
      } catch (e: any) {
        console.error('Failed to take photo:', e);
        Alert.alert('Lỗi', `Không thể chụp ảnh: ${e.message || 'vui lòng thử lại'}`);
      } finally {
        isTakingPhotoRef.current = false;
      }
    } else {
      console.warn('[OCR] Camera not ready or active, or already taking photo', { 
        isCameraReady, isActive, isTakingPhoto: isTakingPhotoRef.current 
      });
    }
  };

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        const uri = result.assets[0].uri || '';
        console.log('[OCR Screen] Picked image URI:', uri);
        setCapturedImage(uri);
        handleScan(uri);
      }
    } catch (error) {
       Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện');
    }
  };

  const takePhotoNew = takePhoto; // Alias for internal usage if needed

  const handleScan = async (uri: string) => {
    try {
      setIsScanning(true);
      console.log('[OCR Screen] Starting scan...');
      
      const job = await scanInvoice(uri);
      
      // Nếu job null, lấy lỗi từ state của ViewModel hoặc báo lỗi mặc định
      if (!job || !job.id) {
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra địa chỉ IP.');
      }

      let attempts = 0;
      let currentJob = job;
      
      // Polling Logic: Kiểm tra trạng thái mỗi 2 giây
      while (attempts < 20) {
        if (currentJob.status === 'completed') {
          console.log('[OCR Screen] Scan completed successfully');
          setIsScanning(false);
          
          const result = currentJob.resultJson as any;
          const expenseData = result?.expenseData || {};
          
          const jobData = {
            id: String(currentJob.id || ''),
            status: 'completed',
            fileUrl: currentJob.fileUrl,
            resultJson: {
              expenseData: {
                amount: Number(expenseData.amount) || 0,
                category: String(expenseData.category || 'other'),
                description: String(expenseData.description || 'Hóa đơn OCR').substring(0, 100),
                spentAt: expenseData.spentAt || new Date().toISOString(),
                confidence: Number(expenseData.confidence) || 0,
                source: expenseData.source === 'qr' ? 'qr' : 'ocr',
                ocrJobId: currentJob.id,
              },
            },
          };
          
          setCurrentOcrResult(jobData as any);
          navigation.navigate('OCRResult');
          return;
        }

        if (currentJob.status === 'failed') throw new Error('Hệ thống không nhận diện được hóa đơn này');

        // Chờ 2 giây
        await new Promise<void>(resolve => setTimeout(resolve, 2000));
        
        const updated = await refreshJobStatus(job.id);
        if (!updated) continue;
        currentJob = updated;

        console.log(`[OCR Screen] Polling: ${currentJob.status}`);
        attempts++;
      }
      throw new Error('Hết thời gian chờ. Bạn có thể kiểm tra kết quả trong lịch sử sau.');
      
    } catch (error: any) {
      setIsScanning(false);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra trong quá trình quét');
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setIsScanning(false);
  };

  if (!hasPermission) {
      return (
         <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>Vui lòng cấp quyền Camera</Text>
            <TouchableOpacity onPress={Linking.openSettings} style={styles.permButton}>
                <Text style={styles.permBtnText}>Mở Cài đặt</Text>
            </TouchableOpacity>
         </View>
      );
  }

  if (!device) {
      return <View style={styles.permissionContainer}><Text style={{color:'#FFF'}}>Không tìm thấy Camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.cameraWrapper}>
         <Camera
            ref={camera}
            style={styles.FullScreen}
            device={device}
            format={format}
            isActive={isActive}
            photo={true}
            enableZoomGesture
            codeScanner={codeScanner}
            onInitialized={() => {
               console.log('[Camera] Initialized');
               setIsCameraReady(true);
            }}
            onError={(e) => {
               console.error('[Camera] Session Error:', e);
               // Handle session closure by attempting to restart
               if (e.message.includes('closed')) {
                  setIsActive(false);
                  setTimeout(() => setIsActive(true), 1000);
               }
            }}
         />
         
         {capturedImage && (
            <ImageBackground source={{uri: capturedImage}} style={[styles.FullScreen, { zIndex: 5 }]} resizeMode="cover">
               <View style={styles.overlay} />
            </ImageBackground>
         )}
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Quét hóa đơn</Text>
        
        {!capturedImage && (
           <TouchableOpacity onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')} style={styles.iconBtn}>
             <Ionicons name={flash === 'on' ? "flash" : "flash-off"} size={24} color="#FFF" />
           </TouchableOpacity>
        )}
        {capturedImage && <View style={{width: 40}} />}
      </View>

      <View style={styles.scannerContainer}>
        <View style={styles.scannerFrame}>
           <View style={[styles.corner, styles.tl]} />
           <View style={[styles.corner, styles.tr]} />
           <View style={[styles.corner, styles.bl]} />
           <View style={[styles.corner, styles.br]} />
           
           <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineAnim }] },
              ]}
            >
               <LinearGradient
                  colors={['rgba(255, 66, 137, 0)', 'rgba(255, 66, 137, 1)', 'rgba(255, 66, 137, 0)']}
                  start={{x:0, y:0}} end={{x:1, y:0}}
                  style={{flex:1}}
               />
            </Animated.View>

            {isScanning && (
               <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#FF4289" />
                  <Text style={styles.loadingText}>Đang xử lý...</Text>
               </View>
            )}
        </View>
        <Text style={styles.guideText}>
           {isScanning ? 'Vui lòng đợi giây lát...' : 'Di chuyển hóa đơn/QR vào khung'}
        </Text>
      </View>

      <View style={styles.bottomBar}>
         {!capturedImage ? (
            <View style={styles.captureControls}>
               <TouchableOpacity onPress={pickImage} style={styles.smallBtn}>
                  <Ionicons name="images" size={24} color="#FFF" />
               </TouchableOpacity>

               <TouchableOpacity onPress={takePhoto} style={styles.shutterBtn}>
                  <View style={styles.shutterInner} />
               </TouchableOpacity>

               <View style={{width: 40}} /> 
            </View>
         ) : (
             <View style={styles.resultControls}>
                {!isScanning && (
                   <TouchableOpacity onPress={retake} style={styles.retakeBtn}>
                      <Ionicons name="refresh" size={20} color="#FFF" />
                      <Text style={styles.retakeText}>Chụp lại</Text>
                   </TouchableOpacity>
                )}
             </View>
         )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
     flex: 1, 
     backgroundColor: '#000',
     justifyContent: 'center',
     alignItems: 'center'
  },
  permissionText: {
     color: '#FFF',
     marginBottom: 20
  },
  permButton: {
     padding: 10,
     backgroundColor: Colors.primary,
     borderRadius: 8
  },
  permBtnText: {
     color: '#FFF', 
     fontWeight: 'bold'
  },
  cameraWrapper: {
     flex: 1,
     ...StyleSheet.absoluteFillObject,
  },
  FullScreen: {
     ...StyleSheet.absoluteFillObject,
     backgroundColor: '#000'
  },
  overlay: {
     ...StyleSheet.absoluteFillObject,
     backgroundColor: 'rgba(0,0,0,0.3)'
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0, 
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10
  },
  headerTitle: {
     color: '#FFF',
     fontSize: 18,
     fontWeight: '600'
  },
  iconBtn: {
     padding: 8,
     backgroundColor: 'rgba(0,0,0,0.3)',
     borderRadius: 20
  },
  scannerContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center'
  },
  scannerFrame: {
     width: SCAN_SIZE,
     height: SCAN_SIZE * 1.4,
     position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30, 
    height: 30,
    borderColor: '#FF4289',
    borderWidth: 4,
    borderRadius: 4
  },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  
  scanLine: {
     width: '100%',
     height: 4,
     opacity: 0.8
  },
  guideText: {
     color: '#FFF',
     marginTop: 20,
     fontSize: 14,
     opacity: 0.8,
     backgroundColor: 'rgba(0,0,0,0.5)',
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 16
  },
  loadingOverlay: {
     ...StyleSheet.absoluteFillObject,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: 'rgba(0,0,0,0.4)',
     borderRadius: 10
  },
  loadingText: {
     color: '#FF4289',
     marginTop: 10,
     fontWeight: 'bold'
  },
  bottomBar: {
     position: 'absolute',
     bottom: 0,
     left: 0, 
     right: 0,
     height: 150,
     backgroundColor: 'rgba(0,0,0,0.6)',
     justifyContent: 'center',
     paddingBottom: 40,
     zIndex: 99999,
  },
  captureControls: {
     flexDirection: 'row',
     justifyContent: 'space-around',
     alignItems: 'center'
  },
  shutterBtn: {
     width: 72, 
     height: 72,
     borderRadius: 36,
     backgroundColor: '#FFF',
     justifyContent: 'center',
     alignItems: 'center'
  },
  shutterInner: {
     width: 64,
     height: 64,
     borderRadius: 32,
     borderWidth: 2,
     borderColor: '#000',
     backgroundColor: '#FFF'
  },
  smallBtn: {
     padding: 12,
  },
  resultControls: {
     alignItems: 'center',
  },
  retakeBtn: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255,255,255,0.2)',
     paddingHorizontal: 20,
     paddingVertical: 10,
     borderRadius: 20
  },
  retakeText: {
     color: '#FFF',
     marginLeft: 8,
     fontWeight: '600'
  }
});

export default OCRScanScreen;
