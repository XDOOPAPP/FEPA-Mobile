import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../../constants/theme';

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const onGetStarted = () => {
    // Navigate to Login or Register
    navigation.navigate('Auth');
  };

  const onLogin = () => {
    navigation.navigate('Auth', { screen: 'Login' });
  };

  const onRegister = () => {
    navigation.navigate('Auth', { screen: 'Register' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ImageBackground
        source={require('../../../assets/images/mountain_bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(11, 18, 21, 0.8)', '#0B1215']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.topInfo}>
               <View style={styles.badge}>
                  <Text style={styles.badgeText}>GIAI ĐOẠN CUỐI</Text>
               </View>
               <Text style={styles.title}>Bắt đầu với FEPA</Text>
               <Text style={styles.description}>
                  Làm chủ tài chính, chạm tới ước mơ cùng trợ lý thông minh của bạn. Tương lai thịnh vượng nằm trong tầm tay.
               </Text>
            </View>

            <View style={styles.footer}>
               <View style={styles.pagination}>
                 <View style={styles.dotInactive} />
                 <View style={styles.dotInactive} />
                 <View style={styles.dotActive} />
               </View>

               <TouchableOpacity style={styles.button} onPress={onGetStarted}>
                  <LinearGradient
                    colors={Colors.primaryGradient}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Bắt đầu ngay</Text>
                    <Text style={styles.buttonArrow}>→</Text>
                  </LinearGradient>
               </TouchableOpacity>

               <View style={styles.authLinks}>
                  <TouchableOpacity onPress={onLogin}>
                     <Text style={styles.authLinkText}>Đăng nhập</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity onPress={onRegister}>
                     <Text style={styles.authLinkText}>Đăng ký tài khoản</Text>
                  </TouchableOpacity>
               </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },
  content: {
    width: '100%',
  },
  topInfo: {
    marginBottom: 40,
  },
  badge: {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  badgeText: {
    color: '#0EA5E9',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
  footer: {
    width: '100%',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dotInactive: {
    width: 20,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginRight: 8,
  },
  dotActive: {
    width: 40,
    height: 4,
    backgroundColor: '#0EA5E9',
    borderRadius: 2,
    marginRight: 8,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  authLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authLinkText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
    marginHorizontal: 16,
  },
});

export default WelcomeScreen;
