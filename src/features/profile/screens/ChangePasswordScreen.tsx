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
  Profile: undefined;
  ChangePassword: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Mật khẩu hiện tại không được bỏ trống';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Mật khẩu mới không được bỏ trống';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được bỏ trống';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentPassword, newPassword, confirmPassword]);

  // Handle change password
  const handleChangePassword = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được cập nhật.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  }, [currentPassword, newPassword, validateForm, navigation, changePassword]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>‹ Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Đổi mật khẩu</Text>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Current Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <View
              style={[
                styles.passwordContainer,
                errors.currentPassword && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#999"
                secureTextEntry={!showCurrentPassword}
                editable={!isLoading}
                value={currentPassword}
                onChangeText={value => {
                  setCurrentPassword(value);
                  if (errors.currentPassword)
                    setErrors({ ...errors, currentPassword: '' });
                }}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeIcon}>
                  {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.currentPassword && (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            )}
          </View>

          {/* New Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View
              style={[
                styles.passwordContainer,
                errors.newPassword && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor="#999"
                secureTextEntry={!showNewPassword}
                editable={!isLoading}
                value={newPassword}
                onChangeText={value => {
                  setNewPassword(value);
                  if (errors.newPassword)
                    setErrors({ ...errors, newPassword: '' });
                }}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
              >
                <Text style={styles.eyeIcon}>
                  {showNewPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.newPassword && (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            )}
          </View>

          {/* Confirm Password */}
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
                placeholder="Nhập lại mật khẩu mới"
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

          {/* Change Password Button */}
          <TouchableOpacity
            style={[styles.changeButton, isLoading && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Cập nhật mật khẩu</Text>
            )}
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
    paddingVertical: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingRight: 12,
    backgroundColor: '#FFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
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
  changeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;
