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
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { ModernInput } from '../../../components/design-system/ModernInput';
import { GradientButton } from '../../../components/design-system/GradientButton';

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
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerGradient}>
          <TouchableOpacity 
            style={styles.backButtonTop}
            onPress={() => navigation.replace('Login')}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.logo}>FEPA</Text>
            <Text style={styles.subtitle}>Bảo mật 2 lớp (2FA)</Text>
          </View>
        </View>

        <GlassCard style={styles.formCard}>
          <View style={styles.emailBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.emailValue}>{email}</Text>
          </View>

          <Text style={styles.helperText}>
            Vui lòng nhập mã xác thực 6 chữ số đã được gửi đến email của bạn để tiếp tục.
          </Text>

          <ModernInput
            label="Mã xác thực"
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            style={{ textAlign: 'center', letterSpacing: 8, fontSize: 20 }}
          />

          <GradientButton
            title="Xác nhận đăng nhập"
            onPress={handleVerify}
            loading={isLoading}
            style={{ marginTop: Spacing.xl }}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Bạn vẫn chưa nhận được? </Text>
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text style={[styles.resendLink, isLoading && { opacity: 0.5 }]}>Gửi lại mã</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 FEPA. Bảo mật thông tin của bạn là ưu tiên hàng đầu.</Text>
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
  logo: {
    ...Typography.h1,
    color: '#FFF',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.8)',
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
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailValue: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  helperText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
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
    paddingHorizontal: Spacing.xl,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

export default TwoFactorLoginScreen;
