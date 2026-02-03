import React, { useState, useEffect, useCallback, useContext } from 'react';
import LinearGradient from 'react-native-linear-gradient';
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
  StatusBar,
} from 'react-native';
import { useAuth } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { GradientButton } from '../../../components/design-system/GradientButton'; // Assuming we have this
import { ModernInput } from '../../../components/design-system/ModernInput'; // Assuming we have this
import { GlassCard } from '../../../components/design-system/GlassCard';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

type RegisterStep = 'info' | 'otp';

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { authState, register, verifyOtp, resendOtp, clearMessages } =
    useAuth();
  const authContext = useContext(AuthContext);
  const [step, setStep] = useState<RegisterStep>('info');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const validateForm = useCallback(() => {
    const newErrors: Partial<RegisterFormData> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Tên đầy đủ không được bỏ trống';
    if (!formData.email.trim()) newErrors.email = 'Email không được bỏ trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    
    if (!formData.password) newErrors.password = 'Mật khẩu không được bỏ trống';
    else if (formData.password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;
    try {
      await register(formData.email.trim(), formData.password, formData.fullName.trim());
      Alert.alert('OTP đã gửi', `Kiểm tra email ${formData.email.trim()} để lấy mã OTP.`);
      setStep('otp');
    } catch (error: any) {
      const errorMsg = typeof error === 'string' 
        ? error 
        : error?.message || error?.response?.data?.message || 'Đăng ký thất bại';
      Alert.alert('Lỗi', errorMsg);
    }
  }, [formData, validateForm, register]);

  const handleVerifyOTP = useCallback(async () => {
    if (!otp.trim()) return setOtpError('Vui lòng nhập mã OTP');
    try {
      const response = await verifyOtp(formData.email.trim(), otp);
      // Lưu token vào AsyncStorage thông qua AuthContext
      if (authContext && response?.accessToken) {
        await authContext.login(response.accessToken, response.refreshToken);
      }
      Alert.alert('Thành công', 'Đăng ký hoàn tất! Bạn đã được đăng nhập tự động.');
      clearMessages();
      // Navigation sẽ tự động chuyển sang màn hình chính do AuthContext đã cập nhật isAuthenticated
    } catch (error: any) {
      setOtpError(error.message || 'Xác thực thất bại');
    }
  }, [otp, formData, verifyOtp, clearMessages, authContext]);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
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
        <LinearGradient
          colors={Colors.primaryGradient}
          style={styles.headerGradient}
        >
          <TouchableOpacity 
            style={styles.backButtonTop}
            onPress={() => step === 'otp' ? setStep('info') : navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.logoBox}>
               <View style={styles.logoInner}>
                  <Text style={styles.logoText}>FE</Text>
               </View>
            </View>
            <Text style={styles.logo}>FEPA</Text>
            <Text style={styles.subtitle}>
              {step === 'info' ? 'Bắt đầu hành trình tài chính' : 'Xác thực tài khoản'}
            </Text>
          </View>
        </LinearGradient>

        <GlassCard style={styles.formCard}>
          {step === 'info' ? (
            <>
              <Text style={styles.formTitle}>Đăng ký thành viên</Text>
              
              <ModernInput
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChangeText={v => handleInputChange('fullName', v)}
                error={errors.fullName}
                leftIcon={<Ionicons name="person-outline" size={20} color={Colors.textMuted} />}
              />
              
              <ModernInput
                label="Email"
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={v => handleInputChange('email', v)}
                error={errors.email}
                leftIcon={<Ionicons name="mail-outline" size={20} color={Colors.textMuted} />}
              />
              
              <ModernInput
                label="Mật khẩu"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={v => handleInputChange('password', v)}
                error={errors.password}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                }
              />
              
              <ModernInput
                label="Xác nhận mật khẩu"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={formData.confirmPassword}
                onChangeText={v => handleInputChange('confirmPassword', v)}
                error={errors.confirmPassword}
                leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={Colors.textMuted} />}
              />

              <GradientButton
                title="Đăng Ký Ngay"
                onPress={handleRegister}
                loading={authState.isLoading}
                style={{ marginTop: Spacing.xl }}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.emailBadge}>
                <Ionicons name="mail" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.emailValue}>{formData.email}</Text>
              </View>
              
              <Text style={styles.otpInstruction}>
                Vui lòng nhập mã OTP 6 số đã được gửi tới địa chỉ email của bạn để kích hoạt tài khoản.
              </Text>
              
               <ModernInput
                label="Mã xác thực OTP"
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                error={otpError}
                style={{ textAlign: 'center', letterSpacing: 8, fontSize: 22 }}
              />
              
              <GradientButton
                title="Xác thực & Hoàn tất"
                onPress={handleVerifyOTP}
                loading={authState.isLoading}
                style={{ marginTop: Spacing.xl }}
              />
              
              <TouchableOpacity
                onPress={() => setStep('info')}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Quay lại chỉnh sửa thông tin</Text>
              </TouchableOpacity>
            </>
          )}
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Bằng cách đăng ký, bạn đồng ý với Điều khoản & Chính sách của FEPA.</Text>
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
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.xxl + 20,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  backButtonTop: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: Spacing.sm,
  },
  logoInner: {
    width: 36,
    height: 36,
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  logo: {
    ...Typography.h1,
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  formCard: {
    marginTop: -Spacing.xxl,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  loginText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  loginLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  otpInstruction: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  cancelButton: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

export default RegisterScreen;
