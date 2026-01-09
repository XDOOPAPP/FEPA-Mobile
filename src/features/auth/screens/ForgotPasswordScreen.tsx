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
import ErrorHandler from '../../../utils/ErrorHandler';

type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate email
  const validateEmail = useCallback(() => {
    const emailError = ErrorHandler.validateEmail(email);
    if (emailError) {
      setError(emailError);
      return false;
    }
    setError('');
    return true;
  }, [email]);

  // Handle send OTP
  const handleSendOTP = useCallback(async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      Alert.alert(
        '📧 Thành công',
        `OTP đã được gửi đến ${email}. Vui lòng kiểm tra email của bạn.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ResetPassword', { email: email.trim() });
            },
          },
        ],
      );
    } catch (err: any) {
      const errorMessage = ErrorHandler.parseApiError(err);
      const errorTitle = ErrorHandler.getErrorTitle(err);
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, validateEmail, navigation, forgotPassword]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.logo}>FEPA</Text>
          <Text style={styles.subtitle}>Quên mật khẩu</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Instructions */}
          <Text style={styles.instruction}>
            Nhập địa chỉ email của bạn. Chúng tôi sẽ gửi mã OTP để đặt lại mật
            khẩu.
          </Text>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Địa chỉ Email</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Nhập email của bạn"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
              value={email}
              onChangeText={value => {
                setEmail(value);
                if (error) setError('');
              }}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* Send OTP Button */}
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Gửi OTP</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.backContainer}>
            <Text style={styles.backText}>Nhớ mật khẩu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backLink}>Đăng nhập</Text>
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
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
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
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  sendButton: {
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
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#666',
    fontSize: 13,
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

export default ForgotPasswordScreen;
