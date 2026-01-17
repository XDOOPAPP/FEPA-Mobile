import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../../../store/AuthContext';
import { useAuth } from '../../../common/hooks/useMVVM';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';

const ChangePasswordScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const { forgotPassword, resetPassword, authState } = useAuth();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const userEmail = authContext?.user?.email;

  const handleSendOtp = async () => {
    if (!userEmail) {
      Alert.alert('Lỗi', 'Không có email để gửi OTP');
      return;
    }
    try {
      await forgotPassword(userEmail);
      Alert.alert('Thành công', 'Đã gửi OTP về email');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi OTP');
    }
  };

  const handleChangePassword = async () => {
    if (!userEmail) {
      Alert.alert('Lỗi', 'Không có email để đổi mật khẩu');
      return;
    }
    if (!otp.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập OTP');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp');
      return;
    }

    try {
      await resetPassword(userEmail, otp.trim(), newPassword);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Thành công', 'Đã đổi mật khẩu');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Đổi mật khẩu</Text>
      <Text style={styles.helperText}>
        Gửi OTP đến email rồi nhập OTP để đổi mật khẩu.
      </Text>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleSendOtp}
        disabled={authState.isLoading}
      >
        {authState.isLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={styles.secondaryText}>Gửi OTP</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.inputLabel}>OTP</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập OTP"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
      />

      <Text style={styles.inputLabel}>Mật khẩu mới</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập mật khẩu mới"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập lại mật khẩu"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleChangePassword}
      >
        <Text style={styles.actionText}>Cập nhật mật khẩu</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    backgroundColor: Colors.primarySoft,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  secondaryText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.soft,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  actionText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default ChangePasswordScreen;
