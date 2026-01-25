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
} from 'react-native';
import { useAuth } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
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
  const { login, authState, loginWithGoogle } = useAuth();
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
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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
      Alert.alert('Đăng nhập thất bại', error.message || 'Đã xảy ra lỗi');
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>FEPA</Text>
              <View style={styles.logoUnderline} />
            </View>
            <Text style={styles.subtitle}>Quản lý tài chính thông minh</Text>
            <Text style={styles.tagline}>Theo dõi chi tiêu, lập kế hoạch tương lai</Text>
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Đăng nhập</Text>
          
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email</Text>
            <View style={[
              styles.inputContainer,
              errors.email && styles.inputContainerError
            ]}>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                value={formData.email}
                onChangeText={value => handleInputChange('email', value)}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={[
              styles.inputContainer,
              errors.password && styles.inputContainerError
            ]}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                editable={!isLoading}
                value={formData.password}
                onChangeText={value => handleInputChange('password', value)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeButtonText}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={async () => {
              try {
                await loginWithGoogle();
              } catch (e: any) {
                Alert.alert('Lỗi', e.message);
              }
            }}
            disabled={isLoading}
          >
             <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    ...Typography.h1,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  logoUnderline: {
    width: 60,
    height: 4,
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.xs,
  },
  subtitle: {
    ...Typography.h3,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  tagline: {
    ...Typography.caption,
    color: Colors.primarySoft,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: Colors.card,
    marginTop: -Spacing.xl,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.lg,
  },
  formTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.captionBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputContainerError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  eyeButtonText: {
    fontSize: 20,
  },
  errorText: {
    ...Typography.small,
    color: Colors.danger,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotText: {
    ...Typography.captionBold,
    color: Colors.primary,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...Typography.bodyBold,
    color: Colors.textInverse,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.small,
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  registerLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  googleButton: {
    backgroundColor: '#FFF',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  googleButtonText: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
});

export default LoginScreen;
