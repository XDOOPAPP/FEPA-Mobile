import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { ModernInput } from '../../../components/design-system/ModernInput';
import { GradientButton } from '../../../components/design-system/GradientButton';
import { GlassCard } from '../../../components/design-system/GlassCard';

type RootStackParamList = {
  Login: undefined;
  Register: { email?: string; step?: 'info' | 'otp' } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  TwoFactorLogin: { email: string; tempToken: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

interface LoginFormData {
  email: string;
  password: string;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, authState } = useAuth();
  const authContext = useContext(AuthContext);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được bỏ trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được bỏ trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle login
  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response?.twoFactorRequired && response?.tempToken) {
        navigation.navigate('TwoFactorLogin', {
          email: formData.email.trim(),
          tempToken: response.tempToken,
        });
        return;
      }

      const authToken =
        response?.token ?? response?.accessToken ?? authState?.token ?? '';
      if (authToken && authContext) {
        await authContext.login(
          authToken,
          response?.refreshToken,
          undefined,
        );
      }
    } catch (error: any) {
      // Extract readable error message
      let errorMsg = 'Đã xảy ra lỗi';
      
      // SUPER AGGRESSIVE EXTRACTION
      let rawMsg = 
        error?.response?.data?.message || 
        error?.response?.data?.error?.message || 
        error?.response?.data?.error ||
        error?.response?.data ||
        error?.message || 
        'Đã xảy ra lỗi';
      
      // If rawMsg is an object (common in some API responses), try to find a message field
      if (typeof rawMsg === 'object' && rawMsg !== null) {
        rawMsg = (rawMsg as any).message || (rawMsg as any).error || JSON.stringify(rawMsg);
      }
      
      // If rawMsg looks like JSON string, try to parse it
      if (typeof rawMsg === 'string' && (rawMsg.trim().startsWith('{') || rawMsg.trim().startsWith('['))) {
        try {
          const parsed = JSON.parse(rawMsg);
          if (Array.isArray(parsed)) {
            rawMsg = parsed.join(', ');
          } else if (typeof parsed === 'object') {
            rawMsg = parsed.message || (Array.isArray(parsed.message) ? parsed.message.join(', ') : JSON.stringify(parsed));
          }
        } catch (e) {}
      }
      
      errorMsg = String(rawMsg);
      
      // Show inline error instead of Alert popup
      if (errorMsg.includes('email must be') || errorMsg.toLowerCase().includes('email')) {
        setErrors({ email: 'Email không hợp lệ' });
      } else if (
        errorMsg.includes('verified') || 
        errorMsg.includes('chưa xác thực') ||
        (error?.response?.status === 400 && errorMsg.includes('Account'))
      ) {
        Alert.alert(
          'Tài khoản chưa xác thực',
          'Tài khoản này đã được đăng ký nhưng chưa được kích hoạt. Bạn cần xác thực mã OTP trước khi đăng nhập.',
          [
            { text: 'Để sau', style: 'cancel' },
            { 
              text: 'Xác thực ngay', 
              onPress: () => navigation.navigate('Register', { email: formData.email, step: 'otp' }) 
            }
          ]
        );
      } else if (
        errorMsg.includes('401') || 
        errorMsg.includes('Unauthorized') || 
        errorMsg.includes('Invalid') || 
        errorMsg.includes('credentials') ||
        errorMsg.includes('status code 400') ||
        (error?.response?.status === 400 && !errorMsg.toLowerCase().includes('verified'))
      ) {
        setErrors({ password: 'Email hoặc mật khẩu không đúng' });
      } else {
        setErrors({ password: errorMsg });
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    formData,
    login,
    validateForm,
    authContext,
    authState?.token,
    navigation,
  ]);

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Brand Identity */}
        <LinearGradient
          colors={Colors.primaryGradient}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoBox}>
               <View style={styles.logoInner}>
                  <Text style={styles.logoText}>FE</Text>
               </View>
            </View>
            <Text style={styles.logo}>FEPA</Text>
            <Text style={styles.subtitle}>Cố vấn tài chính AI của bạn</Text>
          </View>
        </LinearGradient>

        {/* Form Container */}
        <GlassCard style={styles.formCard}>
          <Text style={styles.formTitle}>Chào mừng trở lại</Text>
          
          <ModernInput
            label="Địa chỉ Email"
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={value => handleInputChange('email', value)}
            error={errors.email}
            leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textMuted} />}
          />

          <ModernInput
            label="Mật khẩu"
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={value => handleInputChange('password', value)}
            error={errors.password}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <GradientButton
            title="Đăng nhập"
            onPress={handleLogin}
            loading={isLoading}
            style={{ marginTop: Spacing.md }}
          />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 FEPA. Tất cả quyền được bảo lưu.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: Spacing.xxl + 40,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: Spacing.md,
  },
  logoInner: {
    width: 48,
    height: 48,
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  logo: {
    ...Typography.h1,
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyBold,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
  },
  formCard: {
    marginTop: -Spacing.xxl - 20,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    ...Shadow.lg,
  },
  formTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  registerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  registerLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});

export default LoginScreen;
