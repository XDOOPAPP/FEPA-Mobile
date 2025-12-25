import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { AuthContext } from '../../../store/AuthContext';

export const HomeScreen = ({ navigation }: any) => {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const { user, isAuthenticated, logout, loadUserInfo, isLoading } = authContext;

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleRefreshUserInfo = async () => {
    try {
      await loadUserInfo();
      Alert.alert('Thành công', 'Đã cập nhật thông tin người dùng');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin người dùng');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Chào mừng trở lại!</Text>
        <Text style={styles.subtitle}>Thông tin người dùng đã đăng nhập</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trạng thái đăng nhập</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Đã đăng nhập:</Text>
          <View style={[styles.statusBadge, isAuthenticated && styles.statusBadgeActive]}>
            <Text style={[styles.statusText, isAuthenticated && styles.statusTextActive]}>
              {isAuthenticated ? '✓ Có' : '✗ Không'}
            </Text>
          </View>
        </View>
      </View>

      {user ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin người dùng</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.value}>{user.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Họ và tên:</Text>
            <Text style={styles.value}>{user.fullName}</Text>
          </View>

          {user.avatar && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Avatar:</Text>
              <Text style={styles.value}>{user.avatar}</Text>
            </View>
          )}

          {user.createdAt && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ngày tạo:</Text>
              <Text style={styles.value}>
                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin người dùng</Text>
          <Text style={styles.emptyText}>
            {isLoading ? 'Đang tải thông tin...' : 'Chưa có thông tin người dùng'}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Làm mới thông tin"
          onPress={handleRefreshUserInfo}
          color="#6200ee"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Đăng xuất"
          onPress={handleLogout}
          color="#d32f2f"
        />
      </View>

      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Debug Info</Text>
        <Text style={styles.debugText}>
          isAuthenticated: {isAuthenticated ? 'true' : 'false'}
        </Text>
        <Text style={styles.debugText}>
          isLoading: {isLoading ? 'true' : 'false'}
        </Text>
        <Text style={styles.debugText}>
          User: {user ? 'Có' : 'Không'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeActive: {
    backgroundColor: '#4caf50',
  },
  statusText: {
    color: '#666',
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  debugSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 4,
  },
});

export default HomeScreen;
