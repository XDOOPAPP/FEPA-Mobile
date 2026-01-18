import React, { useState, useEffect, useCallback } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Spacing, Typography } from '../../../constants/theme';
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
  const [step, setStep] = useState<RegisterStep>('info');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  // Validate Form
  const validateForm = useCallback(() => {
    const newErrors: Partial<RegisterFormData> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Tên đầy đủ không được bỏ trống';
    if (!formData.email.trim()) newErrors.email = 'Email không được bỏ trống';
    if (!formData.password) newErrors.password = 'Mật khẩu không được bỏ trống';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mật khẩu không khớp';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle Register
  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;
    try {
      await register(formData.email.trim(), formData.password, formData.fullName.trim());
      Alert.alert('OTP đã gửi', `Kiểm tra email ${formData.email.trim()} để lấy mã OTP.`);
      setStep('otp');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Đăng ký thất bại');
    }
  }, [formData, validateForm, register]);

  // Handle Verify OTP
  const handleVerifyOTP = useCallback(async () => {
    if (!otp.trim()) return setOtpError('Nhập OTP');
    try {
      await verifyOtp(formData.email.trim(), otp);
      Alert.alert('Thành công', 'Đăng ký hoàn tất!', [
        { text: 'Đăng nhập ngay', onPress: () => { clearMessages(); navigation.navigate('Login'); } }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Xác thực thất bại');
    }
  }, [otp, formData, verifyOtp, clearMessages, navigation]);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.logo}>FEPA</Text>
          <Text style={styles.subtitle}>
            {step === 'info' ? 'Tạo tài khoản mới' : 'Xác thực Email'}
          </Text>
        </View>

        <GlassCard style={styles.formCard}>
          {step === 'info' ? (
            <>
              <ModernInput
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChangeText={v => handleInputChange('fullName', v)}
                error={errors.fullName}
              />
              <ModernInput
                label="Email"
                placeholder="email@example.com"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={v => handleInputChange('email', v)}
                error={errors.email}
              />
              <ModernInput
                label="Số điện thoại (Tuỳ chọn)"
                placeholder="0912..."
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={v => handleInputChange('phone', v)}
              />
              <ModernInput
                label="Mật khẩu"
                placeholder="******"
                secureTextEntry
                value={formData.password}
                onChangeText={v => handleInputChange('password', v)}
                error={errors.password}
              />
              <ModernInput
                label="Xác nhận mật khẩu"
                placeholder="******"
                secureTextEntry
                value={formData.confirmPassword}
                onChangeText={v => handleInputChange('confirmPassword', v)}
                error={errors.confirmPassword}
              />

              <GradientButton
                title="Đăng Ký"
                onPress={handleRegister}
                loading={authState.isLoading}
                style={{ marginTop: Spacing.md }}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.otpInstruction}>
                Nhập mã OTP 6 số đã gửi tới {formData.email}
              </Text>
               <ModernInput
                label="Mã OTP"
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                error={otpError}
                style={{ textAlign: 'center', letterSpacing: 5, fontSize: 18 }}
              />
              <GradientButton
                title="Xác Thực"
                onPress={handleVerifyOTP}
                loading={authState.isLoading}
                style={{ marginTop: Spacing.md }}
              />
              <TouchableOpacity
                onPress={() => setStep('info')}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Quay lại</Text>
              </TouchableOpacity>
            </>
          )}
        </GlassCard>
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
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 18,
    color: Colors.textSecondary,
  },
  formCard: {
    padding: Spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  loginText: {
    color: Colors.textSecondary,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  otpInstruction: {
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textMuted,
  }
});

export default RegisterScreen;
