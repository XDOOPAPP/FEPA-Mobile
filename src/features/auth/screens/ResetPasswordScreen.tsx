import React, { useState, useCallback } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../common/hooks/useMVVM';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { ModernInput } from '../../../components/design-system/ModernInput';
import { GradientButton } from '../../../components/design-system/GradientButton';

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
            onPress={() => navigation.goBack()}
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
            <Text style={styles.subtitle}>Thiết lập lại mật khẩu</Text>
          </View>
        </LinearGradient>

        <GlassCard style={styles.formCard}>
          <View style={styles.emailBadge}>
            <Ionicons name="mail" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.emailValue}>{email}</Text>
          </View>

          <ModernInput
            label="Mã OTP"
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(v) => {
              setOtp(v);
              if (errors.otp) setErrors({ ...errors, otp: '' });
            }}
            error={errors.otp}
            style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20 }}
          />

          <ModernInput
            label="Mật khẩu mới"
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={(v) => {
              setNewPassword(v);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            error={errors.password}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            }
          />

          <ModernInput
            label="Xác nhận mật khẩu"
            placeholder="••••••••"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            error={errors.confirmPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            }
          />

          <GradientButton
            title="Đặt lại mật khẩu"
            onPress={handleResetPassword}
            loading={isLoading}
            style={{ marginTop: Spacing.xl }}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Không nhận được mã? </Text>
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text style={[styles.resendLink, isLoading && { opacity: 0.5 }]}>Gửi lại ngay</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

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
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  resendText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  resendLink: {
    ...Typography.bodyBold,
    color: Colors.primary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
});

export default ResetPasswordScreen;
