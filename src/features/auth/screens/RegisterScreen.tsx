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
} from 'react-native';
import { useAuth } from '../../../common/hooks/useMVVM';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FieldValidators } from '../../../utils/FormValidation';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
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

  // Xác thực form
  const validateForm = useCallback(() => {
    const newErrors: Partial<RegisterFormData> = {};

    const fullNameError = ErrorHandler.validateFullName(formData.fullName);
    if (fullNameError) {
      newErrors.fullName = fullNameError;
    }

    const emailError = ErrorHandler.validateEmail(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    const passwordError = ErrorHandler.validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (
      formData.phone &&
      !/^[0-9]{10,}$/.test(formData.phone.replace(/\D/g, ''))
    ) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Xử lý đăng ký - Step 1: Gửi OTP
  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;

    try {
      await register(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
      );

      Alert.alert(
        '📧 OTP đã được gửi',
        `Mã OTP đã được gửi đến ${formData.email.trim()}. Vui lòng nhập mã để tiếp tục.`,
      );
      setStep('otp');
    } catch (error: any) {
      const errorMessage = ErrorHandler.parseApiError(error);
      const errorTitle = ErrorHandler.getErrorTitle(error);
      Alert.alert(errorTitle, errorMessage);
    }
  }, [formData, validateForm, register]);

  // Xác thực OTP - Step 2
  const validateOTP = useCallback(() => {
    setOtpError('');
    if (!otp.trim()) {
      setOtpError('Vui lòng nhập mã OTP');
      return false;
    }
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('Mã OTP phải là 6 chữ số');
      return false;
    }
    return true;
  }, [otp]);

  // Xử lý verify OTP và tạo tài khoản
  const handleVerifyOTP = useCallback(async () => {
    if (!validateOTP()) return;

    try {
      // Call backend để verify OTP
      await verifyOtp(formData.email.trim(), otp);

      Alert.alert('✅ Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
        {
          text: 'OK',
          onPress: () => {
            clearMessages();
            navigation.navigate('Login');
          },
        },
      ]);
    } catch (error: any) {
      const errorMessage = ErrorHandler.parseApiError(error);
      const errorTitle = ErrorHandler.getErrorTitle(error);
      Alert.alert(errorTitle, errorMessage);
    }
  }, [otp, formData, verifyOtp, validateOTP, clearMessages, navigation]);

  // Hiển thị thông báo lỗi
  useEffect(() => {
    if (authState.error) {
      Alert.alert('Lỗi', authState.error);
    }
  }, [authState.error]);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Xóa lỗi khi người dùng nhập dữ liệu
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tiêu đề */}
        <View style={styles.headerContainer}>
          <Text style={styles.logo}>FEPA</Text>
          {step === 'info' ? (
            <Text style={styles.subtitle}>Tạo tài khoản của bạn</Text>
          ) : (
            <Text style={styles.subtitle}>Xác thực OTP</Text>
          )}
        </View>

        {/* Bộ chứa form */}
        <View style={styles.formContainer}>
          {step === 'info' ? (
            <>
              {/* Nhập tên đầy đủ */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Tên đầy đủ</Text>
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="Nhập tên đầy đủ"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  editable={!authState.isLoading}
                  value={formData.fullName}
                  onChangeText={value => handleInputChange('fullName', value)}
                />
                {errors.fullName && (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                )}
              </View>

              {/* Nhập Email */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Địa chỉ Email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Nhập email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!authState.isLoading}
                  value={formData.email}
                  onChangeText={value => handleInputChange('email', value)}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Nhập Số điện thoại (Tùy chọn) */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Số điện thoại (Tùy chọn)</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  editable={!authState.isLoading}
                  value={formData.phone}
                  onChangeText={value => handleInputChange('phone', value)}
                />
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              {/* Nhập Mật khẩu */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#999"
                  secureTextEntry
                  editable={!authState.isLoading}
                  value={formData.password}
                  onChangeText={value => handleInputChange('password', value)}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Xác nhận Mật khẩu */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  placeholder="Xác nhận mật khẩu"
                  placeholderTextColor="#999"
                  secureTextEntry
                  editable={!authState.isLoading}
                  value={formData.confirmPassword}
                  onChangeText={value =>
                    handleInputChange('confirmPassword', value)
                  }
                />
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              {/* Nút Tạo tài khoản */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  authState.isLoading && styles.buttonDisabled,
                ]}
                onPress={handleRegister}
                disabled={authState.isLoading}
              >
                {authState.isLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Tạo tài khoản</Text>
                )}
              </TouchableOpacity>

              {/* Liên kết Đăng nhập */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // OTP Verification Step
            <>
              <Text style={styles.otpInstruction}>
                Nhập mã OTP 6 chữ số được gửi đến {formData.email}
              </Text>

              {/* OTP Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Mã OTP</Text>
                <TextInput
                  style={[styles.input, otpError && styles.inputError]}
                  placeholder="000000"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!authState.isLoading}
                  value={otp}
                  onChangeText={setOtp}
                />
                {otpError && <Text style={styles.errorText}>{otpError}</Text>}
              </View>

              {/* Nút Xác thực OTP */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  authState.isLoading && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOTP}
                disabled={authState.isLoading}
              >
                {authState.isLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Xác thực OTP</Text>
                )}
              </TouchableOpacity>

              {/* Nút Quay lại */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setStep('info');
                  setOtp('');
                  setOtpError('');
                }}
                disabled={authState.isLoading}
              >
                <Text style={styles.cancelButtonText}>Quay lại</Text>
              </TouchableOpacity>

              {/* Resend OTP */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Không nhận được mã? </Text>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await resendOtp(formData.email.trim());
                      Alert.alert(
                        'Thành công',
                        'OTP đã được gửi lại đến email của bạn',
                      );
                    } catch (error: any) {
                      Alert.alert(
                        'Lỗi',
                        error.message || 'Không thể gửi lại OTP',
                      );
                    }
                  }}
                  disabled={authState.isLoading}
                >
                  <Text style={styles.resendLink}>Gửi lại</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Chân trang */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 FEPA. Bảo lưu mọi quyền.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 13,
  },
  loginLink: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
  otpInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  resendText: {
    color: '#666',
    fontSize: 13,
  },
  resendLink: {
    color: '#2196F3',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default RegisterScreen;
