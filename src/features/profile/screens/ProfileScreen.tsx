import React, { useCallback, useContext } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../store/AuthContext';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import { useAuth } from '../../../common/hooks/useMVVM';

const ProfileScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const { authState } = useAuth();

  const loadProfile = useCallback(async () => {
    if (!authContext) return;
    try {
      await authContext.loadUserInfo();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải hồ sơ');
    }
  }, [authContext]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  if (!authContext) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const { user, isLoading, logout } = authContext;

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.nameText}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.subText}>{user?.email || '--'}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Họ và tên</Text>
          <Text style={styles.value}>{user?.fullName || '--'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || '--'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Số điện thoại</Text>
          <Text style={styles.value}>{user?.phone || '--'}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Bảo mật</Text>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('ChangePassword')}
          disabled={authState.isLoading}
        >
          <Text style={styles.menuLabel}>Đổi mật khẩu</Text>
          <Text style={styles.menuHint}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, isLoading && styles.disabled]}
        onPress={loadProfile}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.actionText}>Làm mới</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subText: {
    marginTop: 4,
    color: Colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.soft,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  row: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  value: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  actionText: {
    color: '#FFF',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: Colors.danger,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  menuLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  menuHint: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  logoutText: {
    color: '#FFF',
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
});

export default ProfileScreen;
