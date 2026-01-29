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
  const { scanInvoice, getJob } = useOcr(authContext?.userToken || null);
  const { setCurrentOcrResult } = useOCR();

  // Camera State
  const device = useCameraDevice('back');
  
  // Select High Quality format (720p - 1080p) for best OCR results
  // Server is now configured to accept 50MB payload, so we don't need to worry about size.
  const format = React.useMemo(() => {
     if (!device?.formats) return undefined;
     
     // Filter for 720p or 1080p formats (Width between 1080 and 1920)
     const candidates = device.formats.filter(f => 
       f.photoWidth >= 1080 && f.photoWidth <= 1920
     );
     
     if (candidates.length > 0) {
       // Pick the best quality among candidates (highest resolution)
       return candidates.sort((a, b) => (b.photoWidth * b.photoHeight) - (a.photoWidth * a.photoHeight))[0];
     }
     
     // Fallback: Pick the highest resolution available overall
     return [...device.formats].sort((a, b) => (b.photoWidth * b.photoHeight) - (a.photoWidth * a.photoHeight))[0];
  }, [device?.formats]);

  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isActive, setIsActive] = useState(true);

  // App State
  const [fileUrl, setFileUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Helper inside component
  const convertFileToBase64 = async (uri: string): Promise<string> => {
     if (uri.startsWith('data:')) return uri;
     
     try {
       // Use RNFS to read file as base64 directly
       const filePath = uri.replace('file://', ''); // RNFS usually needs path without schema on Android
       const base64 = await RNFS.readFile(filePath, 'base64');
       return `data:image/jpeg;base64,${base64}`;
     } catch (e) {
       console.error("Conversion error", e);
       // Fallback: try reading with file:// prefix if first attempt failed
       try {
          const base64 = await RNFS.readFile(uri, 'base64');
          return `data:image/jpeg;base64,${base64}`;
       } catch (e2) {
          throw new Error('Cannot convert image: ' + (e as any).message);
       }
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

  // Animation Loop
  useEffect(() => {
    startScanAnimation();
  }, [isScanning]);

  // Active state management
  useEffect(() => {
    setIsActive(isFocused && !capturedImage);
  }, [isFocused, capturedImage]);

  const startScanAnimation = () => {
    if (isScanning || !capturedImage) {
      Animated.loop(
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
      ).start();
    }
  };


  const takePhoto = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          flash: flash,
          enableShutterSound: true,
        });
        
        console.log(`[OCR] Captured photo: ${photo.width}x${photo.height}, path: ${photo.path}`);
        
        const path = `file://${photo.path}`;
        setCapturedImage(path);
        
        // Auto scan immediately
        handleScan(path);
      } catch (e) {
// ...
        console.error('Failed to take photo:', e);
        Alert.alert('Lỗi', 'Không thể chụp ảnh.');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.7,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        let uri = asset.uri || '';
        
        if (asset.base64) {
             uri = `data:${asset.type};base64,${asset.base64}`;
        }
        
        setCapturedImage(uri);
        handleScan(uri);
      }
    } catch (error) {
       Alert.alert('Lỗi', 'Không chọn được ảnh');
    }
  };

  const handleScan = async (uri: string) => {
    try {
      setIsScanning(true);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Kết nối quá thời gian.')), 60000)
      );
      
      const job = await Promise.race([
        scanInvoice(uri),
        timeoutPromise
      ]) as any;

      if (!job || !job.id) throw new Error('Không thể tạo công việc OCR');

      let attempts = 0;
      let currentJob = job;
      
      // Polling loop
      while (attempts < 20) {
        if (currentJob.status === 'completed') {
          setIsScanning(false);
          const expenseData = currentJob.resultJson?.expenseData || {};
          
          const jobData = {
            id: String(currentJob.id || ''),
            status: 'completed',
            fileUrl: uri, // Critical: Pass original image path to Result screen for saving
            resultJson: {
              expenseData: {
                amount: Number(expenseData.amount) || 0,
                category: String(expenseData.category || 'other'),
                description: String(expenseData.description || 'Chi tiêu OCR').substring(0, 100),
                spentAt: expenseData.spentAt || new Date().toISOString(),
                confidence: Number(expenseData.confidence) || 0,
                source: expenseData.source === 'qr' ? 'qr' : 'ocr',
              },
            },
          };
          
          setCurrentOcrResult(jobData);
          navigation.navigate('OCRResult');
          // Reset state after navigation
          setTimeout(() => {
             setCapturedImage(null);
          }, 1000);
          return;
        }

        if (currentJob.status === 'failed') throw new Error('OCR thất bại');

        await new Promise<void>(r => setTimeout(r, 2000));
        try {
          currentJob = await getJob(job.id);
        } catch (e) { }
        attempts++;
      }
      throw new Error('OCR timeout');
    } catch (error: any) {
      setIsScanning(false);
      Alert.alert('Lỗi', error.message || 'Thử lại sau');
      // Allow retry
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
      
      {/* Camera View or Captured Image */}
      {capturedImage ? (
         <ImageBackground source={{uri: capturedImage}} style={styles.FullScreen} resizeMode="cover">
            <View style={styles.overlay} />
         </ImageBackground>
      ) : (
         <Camera
            ref={camera}
            style={styles.FullScreen}
            device={device}
            format={format}
            isActive={isActive}
            photo={true}
            enableZoomGesture
         />
      )}

      {/* Header Controls */}
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

      {/* Scanner Overlay */}
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
           {isScanning ? 'Vui lòng đợi giây lát...' : 'Di chuyển hóa đơn vào khung'}
        </Text>
      </View>

      {/* Bottom Controls */}
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
  FullScreen: {
     ...StyleSheet.absoluteFillObject,
     backgroundColor: '#000'
  },
  overlay: {
     ...StyleSheet.absoluteFillObject,
     backgroundColor: 'rgba(0,0,0,0.5)'
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
     height: 150, // Increase height
     backgroundColor: 'rgba(0,0,0,0.6)',
     justifyContent: 'center',
     paddingBottom: 40, // Add padding bottom
     zIndex: 99999, // Force on top
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
