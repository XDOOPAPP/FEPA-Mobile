import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  Alert,
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { useAuth } from '../../../common/hooks/useMVVM';
import { AuthContext } from '../../../store/AuthContext';

type EducationStackParamList = {
  EducationHome: undefined;
  Profile: undefined;
  Blog: undefined;
  Premium: undefined;
  SecuritySettings: undefined;
  TwoFA: { action: 'enable' | 'disable' };
};

type Props = NativeStackScreenProps<EducationStackParamList, 'TwoFA'>;

const TwoFAScreen: React.FC<Props> = ({ route, navigation }) => {
  const { requestTwoFactor, confirmTwoFactor } = useAuth();
  const authContext = useContext(AuthContext);
  const email = authContext?.user?.email || '';
  const action = route.params?.action ?? 'enable';
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const canSend = email.trim().length > 0 && countdown === 0 && !isLoading;

  const hint = useMemo(() => {
    return 'Email nhận OTP';
  }, []);

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    setIsLoading(true);
    try {
      await requestTwoFactor(action);
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      const errorMsg = typeof error === 'string' 
        ? error 
        : error?.message || error?.response?.data?.message || 'Không thể gửi OTP';
      Alert.alert('Lỗi', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [canSend, requestTwoFactor, action]);

  const handleVerify = useCallback(async () => {
    if (!/^[0-9]{6}$/.test(otp)) {
      Alert.alert('Lỗi', 'OTP phải gồm 6 chữ số');
      return;
    }

    setIsLoading(true);
    try {
      await confirmTwoFactor(action, otp);
      await authContext?.loadUserInfo();
      Alert.alert('Thành công', 'Cập nhật 2FA thành công', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      const errorMsg = typeof error === 'string' 
        ? error 
        : error?.message || error?.response?.data?.message || 'Không thể xác minh OTP';
      Alert.alert('Lỗi', errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [otp, confirmTwoFactor, action, authContext, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Xác thực 2FA</Text>
      <Text style={styles.subtitle}>
        {action === 'enable' ? 'Bật 2FA bằng OTP.' : 'Tắt 2FA bằng OTP.'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={hint}
        placeholderTextColor={Colors.textMuted}
        value={email}
        editable={false}
        keyboardType="email-address"
      />

      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.disabled]}
        onPress={handleSend}
        disabled={!canSend}
      >
        <Text style={styles.sendText}>
          {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi OTP'}
        </Text>
      </TouchableOpacity>

      <View style={styles.otpCard}>
        <Text style={styles.otpLabel}>Nhập mã OTP</Text>
        <TextInput
          style={styles.otpInput}
          placeholder="------"
          placeholderTextColor={Colors.textMuted}
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          inputMode="numeric"
          autoFocus
          maxLength={6}
        />
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerify}
          disabled={isLoading}
        >
          <Text style={styles.verifyText}>Xác minh</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>* OTP sẽ được gửi qua email đã đăng ký.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  methodRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  methodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.card,
  },
  methodActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  methodTextActive: {
    color: '#FFF',
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sendText: {
    color: '#FFF',
    fontWeight: '700',
  },
  otpCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  otpLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 6,
  },
  verifyButton: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  verifyText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  note: {
    marginTop: Spacing.md,
    fontSize: 12,
    color: Colors.textMuted,
  },
  disabled: {
    opacity: 0.7,
  },
});

export default TwoFAScreen;
