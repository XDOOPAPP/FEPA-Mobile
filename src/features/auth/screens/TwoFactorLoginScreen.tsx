import React, { useCallback, useContext, useState } from 'react';
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
import { AuthContext } from '../../../store/AuthContext';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  TwoFactorLogin: { email: string; tempToken: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'TwoFactorLogin'>;

const TwoFactorLoginScreen: React.FC<Props> = ({ route, navigation }) => {
  const { verifyTwoFactorLogin, resendTwoFactorLogin, authState } = useAuth();
  const authContext = useContext(AuthContext);
  const { email, tempToken } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = useCallback(async () => {
    if (!/^[0-9]{6}$/.test(otp)) {
      Alert.alert('Lỗi', 'OTP phải gồm 6 chữ số');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyTwoFactorLogin(tempToken, otp);
      const authToken =
        response?.token ?? response?.accessToken ?? authState?.token ?? '';
      if (authToken && authContext) {
        await authContext.login(authToken, response?.refreshToken, undefined);
      }
    } catch (error: any) {
      Alert.alert('Xác thực thất bại', error.message || 'Vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  }, [otp, verifyTwoFactorLogin, tempToken, authContext, authState?.token]);

  const handleResend = useCallback(async () => {
    setIsLoading(true);
    try {
      await resendTwoFactorLogin(tempToken);
      Alert.alert('Thành công', 'OTP đã được gửi lại');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi lại OTP');
    } finally {
      setIsLoading(false);
    }
  }, [resendTwoFactorLogin, tempToken]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.logo}>FEPA</Text>
          <Text style={styles.subtitle}>Xác thực đăng nhập</Text>
          <Text style={styles.helperText}>Mã OTP đã gửi tới {email}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mã OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#999"
              keyboardType="numeric"
              inputMode="numeric"
              maxLength={6}
              editable={!isLoading}
              value={otp}
              onChangeText={setOtp}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Xác thực</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleResend}
            disabled={isLoading}
          >
            <Text style={styles.secondaryText}>Gửi lại OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.replace('Login')}
            disabled={isLoading}
          >
            <Text style={styles.backText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
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
    color: '#333',
    fontWeight: '600',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
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
  primaryButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backText: {
    color: '#666',
    fontSize: 13,
  },
});

export default TwoFactorLoginScreen;
