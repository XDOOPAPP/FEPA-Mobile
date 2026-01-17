import React, { useState, useCallback } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../../common/hooks/useMVVM';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<Props> = ({ route, navigation }) => {
  const { resetPassword, resendOtp } = useAuth();
  const email = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!otp.trim()) {
      newErrors.otp = 'Mã OTP không được bỏ trống';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'Mã OTP phải là 6 chữ số';
    }

    if (!newPassword.trim()) {
      newErrors.password = 'Mật khẩu mới không được bỏ trống';
    } else if (newPassword.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được bỏ trống';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [otp, newPassword, confirmPassword]);

  // Handle reset password
  const handleResetPassword = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      Alert.alert(
        'Thành công',
        'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Login');
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  }, [email, otp, newPassword, validateForm, navigation, resetPassword]);

  const handleResendOTP = useCallback(async () => {
    setIsLoading(true);
    try {
      await resendOtp(email);
      Alert.alert('Thành công', 'OTP mới đã được gửi đến email của bạn.');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi lại OTP');
    } finally {
      setIsLoading(false);
    }
  }, [email, resendOtp]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.logo}>FEPA</Text>
          <Text style={styles.subtitle}>Đặt lại mật khẩu</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Email Display */}
          <View style={styles.emailBox}>
            <Text style={styles.emailLabel}>Email</Text>
            <Text style={styles.emailValue}>{email}</Text>
          </View>

          {/* OTP Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mã OTP</Text>
            <TextInput
              style={[styles.input, errors.otp && styles.inputError]}
              placeholder="Nhập 6 chữ số OTP"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
              value={otp}
              onChangeText={value => {
                setOtp(value);
                if (errors.otp) setErrors({ ...errors, otp: '' });
              }}
            />
            {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
          </View>

          {/* New Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View
              style={[
                styles.passwordContainer,
                errors.password && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                editable={!isLoading}
                value={newPassword}
                onChangeText={value => {
                  setNewPassword(value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View
              style={[
                styles.passwordContainer,
                errors.confirmPassword && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập lại mật khẩu"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
                value={confirmPassword}
                onChangeText={value => {
                  setConfirmPassword(value);
                  if (errors.confirmPassword)
                    setErrors({ ...errors, confirmPassword: '' });
                }}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Reset Password Button */}
          <TouchableOpacity
            style={[styles.resetButton, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Không nhận được OTP? </Text>
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text
                style={[styles.resendLink, isLoading && styles.resendDisabled]}
              >
                Gửi lại
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back to Login */}
          <View style={styles.backContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backLink}>← Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
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
    marginBottom: 40,
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emailBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  emailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  emailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingRight: 12,
    backgroundColor: '#FAFAFA',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: '#2196F3',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  resendDisabled: {
    opacity: 0.5,
  },
  backContainer: {
    alignItems: 'center',
  },
  backLink: {
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
});

export default ResetPasswordScreen;
