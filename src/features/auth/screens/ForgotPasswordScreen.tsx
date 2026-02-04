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

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = useCallback(() => {
    setError('');
    if (!email.trim()) {
      setError('Email không được bỏ trống');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ');
      return false;
    }
    return true;
  }, [email]);

  const handleSendOTP = useCallback(async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      Alert.alert(
        'Thành công',
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
      // Extract readable error message using AGGRESSIVE EXTRACTION
      let rawMsg = 
        err?.response?.data?.message || 
        err?.response?.data?.error?.message || 
        err?.response?.data?.error ||
        err?.response?.data ||
        err?.message || 
        'Đã xảy ra lỗi';
      
      // If rawMsg is an object, try to find a message field
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
      
      let errorMsg = String(rawMsg);
      
      // Friendly messages for common errors
      if (errorMsg.includes('400') || errorMsg.includes('not found') || errorMsg.includes('Not Found') || errorMsg.toLowerCase().includes('user not found')) {
        errorMsg = 'Email chưa được đăng ký trong hệ thống';
      } else if (errorMsg.toLowerCase().includes('email')) {
        errorMsg = 'Vui lòng nhập đúng định dạng email';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [email, validateEmail, navigation, forgotPassword]);

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
            <Text style={styles.subtitle}>Cố vấn tài chính AI của bạn</Text>
          </View>
        </LinearGradient>

        <GlassCard style={styles.formCard}>
          <Text style={styles.formTitle}>Quên mật khẩu</Text>
          <Text style={styles.instruction}>
            Nhập địa chỉ email của bạn. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
          </Text>

          <ModernInput
            label="Địa chỉ Email"
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError('');
            }}
            error={error}
          />

          <GradientButton
            title="Gửi mã OTP"
            onPress={handleSendOTP}
            loading={isLoading}
            style={{ marginTop: Spacing.xl }}
          />

          <View style={styles.backContainer}>
            <Text style={styles.backText}>Nhớ mật khẩu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backLink}>Đăng nhập ngay</Text>
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
  formTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  instruction: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  backContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  backText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  backLink: {
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

export default ForgotPasswordScreen;
