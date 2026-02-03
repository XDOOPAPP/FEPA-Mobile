import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    const checkOnboarding = async () => {
      // Animate progress bar
      Animated.timing(progress, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }).start(async () => {
        try {
          const hasSeenOnboarding = await AsyncStorage.getItem('HAS_SEEN_ONBOARDING');
          if (hasSeenOnboarding === 'true') {
            navigation.replace('Welcome');
          } else {
            navigation.replace('Onboarding');
          }
        } catch (e) {
          navigation.replace('Onboarding');
        }
      });
    };

    checkOnboarding();
  }, [progress, navigation]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.logoContainer}>
        {/* Logo Placeholder - In a real app, use an SVG or Image */}
        <View style={styles.logoBox}>
          <View style={styles.logoInner}>
             <Text style={styles.logoText}>C</Text>
          </View>
        </View>
        
        <Text style={styles.brandTitle}>FEPA</Text>
        <Text style={styles.brandSubtitle}>Cố vấn tài chính AI của bạn</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.loadingContainer}>
           <View style={styles.loadingInfo}>
              <View style={styles.dot} />
              <Text style={styles.loadingText}>Đang khởi tạo AI...</Text>
           </View>
           <View style={styles.progressBarBg}>
             <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
           </View>
        </View>

        <View style={styles.securityInfo}>
           <View style={styles.securityRow}>
              <View style={styles.securityIconContainer}>
                {/* Security icon placeholder */}
                <View style={styles.greenCircle} />
              </View>
              <Text style={styles.securityText}>Bảo mật & Mã hóa</Text>
           </View>
           <Text style={styles.versionText}>Phiên bản 1.0.0 (Beta)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  logoInner: {
    width: 60,
    height: 60,
    backgroundColor: '#0EA5E9', // Revert to Blue
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    marginBottom: 40,
  },
  loadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0EA5E9',
    marginRight: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
  },
  securityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityIconContainer: {
    marginRight: 8,
  },
  greenCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0EA5E9',
  },
  securityText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 10,
    color: '#94A3B8',
  },
});

export default SplashScreen;
