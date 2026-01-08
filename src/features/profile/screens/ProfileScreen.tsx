import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthContext } from '../../../store/AuthContext';
import { ProfileStackParamList } from '../navigation/ProfileNavigator';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const authContext = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Đăng xuất',
        onPress: async () => {
          try {
            if (authContext?.logout) {
              await authContext.logout();
            }
          } catch {
            Alert.alert('Lỗi', 'Không thể đăng xuất');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (!authContext) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const user = authContext.user;
  const isLoggingOut = authContext.isLoading;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName || 'Người dùng'}</Text>
        <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
      </View>

      {/* Profile Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || '-'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tên đầy đủ</Text>
          <Text style={styles.infoValue}>{user?.fullName || '-'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Trạng thái</Text>
          <Text style={styles.infoValue}>✅ Đã xác thực</Text>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Text style={styles.settingLabel}>🔐 Đổi mật khẩu</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('ThemeSettings')}
        >
          <Text style={styles.settingLabel}>🌙 Giao diện</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#F44336" size="small" />
          ) : (
            <Text style={styles.logoutText}>🚪 Đăng xuất</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 FEPA</Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#2196F3',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  settingLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 18,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  versionText: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 4,
  },
});

export default ProfileScreen;
