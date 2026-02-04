import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
  Platform,
  Switch,
  StatusBar,
  Modal,
  Dimensions,
  RefreshControl,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../../store/AuthContext';
import { Colors, Radius, Shadow, Spacing } from '../../../constants/theme';
import RNFS from 'react-native-fs';
import { axiosInstance } from '../../../api/axiosInstance';
import { API_ENDPOINTS } from '../../../constants/api';
import { expenseRepository } from '../../../core/repositories/ExpenseRepository';
import { useAuth, useSubscription } from '../../../common/hooks/useMVVM';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { notificationService } from '../../../core/services/NotificationService';

const { width } = Dimensions.get('window');

interface MenuItem {
  icon: string;
  label: string;
  value?: any;
  onPress?: () => void;
  disabled?: boolean;
  isSwitch?: boolean;
  onValueChange?: (value: boolean) => void;
  highlight?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const ProfileScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const { authState, forgotPassword, resetPassword, updateAvatar, updateProfile } = useAuth();
  const { subState: subscriptionState, getCurrent } = useSubscription();
  
  const scrollRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editIncome, setEditIncome] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editStyle, setEditStyle] = useState<'frugal' | 'balanced' | 'relaxed'>('balanced');

  // Local AI Profile State
  const [localAiProfile, setLocalAiProfile] = useState<{
    monthlyIncome: number | null;
    savingsGoal: number | null;
    spendingStyle: 'frugal' | 'balanced' | 'relaxed';
  }>({ monthlyIncome: null, savingsGoal: null, spendingStyle: 'balanced' });

  // Settings States
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Change Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Computed values from API
  const user = authContext?.user;
  // Check both server status AND demo premium mode
  const isPremiumServer = subscriptionState.current?.status === 'active' || subscriptionState.current?.status === 'ACTIVE';
  const isPremium = isPremiumServer || authContext?.isPremium || false;
  const subscription = subscriptionState.current;
  const memberSince = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
    : '--';

  // Load profile from API
  const loadProfile = useCallback(async () => {
    // Skip if no auth context or no token (user is logging out)
    if (!authContext || !authContext.userToken) return;
    try {
      await authContext.loadUserInfo();
      await getCurrent();
    } catch (error: any) {
      // Ignore Unauthorized errors during logout
      if (error.message?.includes('Unauthorized')) return;
      console.log('Profile load error', error);
    }
  }, [authContext, getCurrent]);

  // Load settings and AI profile from AsyncStorage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const notif = await AsyncStorage.getItem('settings_notifications');
      const bio = await AsyncStorage.getItem('settings_biometrics');
      const aiProfile = await AsyncStorage.getItem('ai_financial_profile');
      
      if (isMounted) {
        if (notif !== null) setNotificationsEnabled(JSON.parse(notif));
        if (bio !== null) setBiometricsEnabled(JSON.parse(bio));
        if (aiProfile !== null) {
          setLocalAiProfile(JSON.parse(aiProfile));
        }
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, [loadProfile]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  // Avatar upload handler - Tạm thời bỏ qua theo yêu cầu
  const handleAvatarPress = () => {
    Alert.alert('Thông báo', 'Tính năng cập nhật ảnh đại diện đang được bảo trì.');
  };

  // Settings handlers
  const handleToggleNotification = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      await AsyncStorage.setItem('settings_notifications', JSON.stringify(value));
      
      if (value) {
        // User turned ON notifications
        const hasPermission = await notificationService.requestUserPermission();
        if (hasPermission) {
           await notificationService.init();
           Alert.alert('Thông báo', 'Đã bật nhận thông báo từ FEPA.');
        } else {
           Alert.alert(
             'Cần cấp quyền thủ công',
             'Ứng dụng không thể tự bật thông báo do quyền bị hạn chế. Vui lòng vào Cài đặt > Ứng dụng > FEPA > Thông báo để bật thủ công.',
             [{ text: 'Đã hiểu' }]
           );
           setNotificationsEnabled(false); // Revert switch
        }
      } else {
        // User turned OFF notifications
        Alert.alert('Thông báo', 'Đã tắt thông báo.');
      }
    } catch (error) {
      console.log('Toggle notification error:', error);
      setNotificationsEnabled(!value); // Revert on error
    }
  };

  const handleToggleBiometrics = async (value: boolean) => {
    setBiometricsEnabled(value);
    await AsyncStorage.setItem('settings_biometrics', JSON.stringify(value));
  };

  // Export data
  const handleExportCsv = async () => {
    try {
      // 1. Fetch data directly via Repository
      // Note: limit=1000 caused 500 Error. Switched to getExpenses() (default params) for stability.
      const data = await expenseRepository.getExpenses();

      if (!data || data.length === 0) {
        Alert.alert('Thông báo', 'Không có dữ liệu chi tiêu để xuất.');
        return;
      }

      // 2. Convert to CSV
      const header = ['Ngày', 'Số tiền', 'Danh mục', 'Ghi chú'];
      const rows = data.map((e: any) => [
        new Date(e.spentAt || e.createdAt).toLocaleDateString('vi-VN'),
        e.amount,
        e.category?.name || e.category || 'Khác',
        `"${(e.note || '').replace(/"/g, '""')}"`
      ]);
      
      const csvContent = [
        header.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');

      // 3. Permission check for Android <= 28
      if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version <= 28) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Quyền lưu file',
            message: 'Ứng dụng cần quyền lưu file để xuất dữ liệu chi tiêu.',
            buttonNeutral: 'Để sau',
            buttonNegative: 'Hủy',
            buttonPositive: 'Đồng ý',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Lỗi', 'Quyền lưu file bị từ chối.');
          return;
        }
      }

      // 4. Write File
      const fileName = `FEPA_Expenses_${Date.now()}.csv`;
      const path = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(path, csvContent, 'utf8');
      
      Alert.alert(
        'Xuất dữ liệu thành công', 
        `File đã được lưu tại:\n${path}\n\nBạn có thể tìm trong thư mục Tải xuống (Downloads).`
      );

    } catch (error: any) {
      console.log('Export error:', error);
      Alert.alert('Lỗi', `Không thể xuất dữ liệu: ${error.message}`);
    }
  };

  // Password change handlers
  const handleSendOtp = async () => {
    if (!user?.email) return;
    try {
      await forgotPassword(user.email);
      Alert.alert('Đã gửi', 'OTP đã được gửi đến email của bạn');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi OTP');
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    try {
      await resetPassword(user.email, otp, newPassword);
      Alert.alert('Thành công', 'Đã đổi mật khẩu thành công');
      setShowPasswordModal(false);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu');
    }
  };

  // Edit profile
  const handleStartEdit = async () => {
    console.log('[Profile] handleStartEdit called');
    setEditFullName(user?.fullName || '');
    
    // Load AI profile from local storage
    try {
      const savedProfile = await AsyncStorage.getItem('ai_financial_profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        setEditIncome(profile.monthlyIncome?.toString() || '');
        setEditGoal(profile.savingsGoal?.toString() || '');
        setEditStyle(profile.spendingStyle || 'balanced');
      } else {
        setEditIncome('');
        setEditGoal('');
        setEditStyle('balanced');
      }
    } catch (e) {
      console.log('[Profile] Failed to load local AI profile');
    }
    
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      // Save AI profile locally (không cần backend)
      const aiProfile = {
        monthlyIncome: editIncome ? Number(editIncome) : null,
        savingsGoal: editGoal ? Number(editGoal) : null,
        spendingStyle: editStyle,
      };
      await AsyncStorage.setItem('ai_financial_profile', JSON.stringify(aiProfile));
      setLocalAiProfile(aiProfile); // Update state to reflect changes immediately
      console.log('[Profile] AI Profile saved locally:', aiProfile);
      
      // Only update fullName to backend if it changed
      if (editFullName !== user?.fullName) {
        try {
          await updateProfile({ fullName: editFullName });
          if (authContext?.loadUserInfo) {
            await authContext.loadUserInfo();
          }
        } catch (e) {
          console.log('[Profile] Backend update failed, but local save succeeded');
        }
      }
      
      setIsEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ tài chính');
    } catch (error: any) {
      console.log('[Profile] Save error:', error);
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ');
    }
  };

  // Logout
  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: authContext?.logout },
    ]);
  };

  if (!authContext) return null;

  // Stats are now simplified or removed for a cleaner look as requested by user
  const statsData: any[] = [];

  // Menu items
  const menuSections: MenuSection[] = [
    {
      title: 'Tài khoản',
      items: [
        { 
          icon: 'person-outline', 
          label: 'Thông tin cá nhân', 
          value: user?.fullName || '--',
          onPress: handleStartEdit
        },
        { 
          icon: isPremium ? 'diamond-outline' : 'ribbon-outline', 
          label: 'Gói dịch vụ', 
          value: isPremium ? 'Premium' : 'Miễn phí',
          onPress: () => navigation.navigate('Premium'),
          highlight: !isPremium
        },
      ]
    },
    {
      title: 'AI & Tài chính',
      items: [
        { 
          icon: 'sparkles-outline', 
          label: 'Hồ sơ AI & Tài chính', 
          value: localAiProfile.monthlyIncome 
            ? `${(localAiProfile.monthlyIncome / 1000000).toFixed(0)}tr • ${localAiProfile.savingsGoal || 0}% • ${localAiProfile.spendingStyle === 'frugal' ? 'Tiết kiệm' : localAiProfile.spendingStyle === 'relaxed' ? 'Thoải mái' : 'Cân bằng'}`
            : 'Chưa thiết lập',
          onPress: handleStartEdit
        },
      ]
    },
    {
      title: 'Bảo mật',
      items: [
        { 
          icon: 'lock-closed-outline', 
          label: 'Đổi mật khẩu', 
          onPress: () => setShowPasswordModal(true)
        },
        { 
          icon: 'finger-print-outline', 
          label: 'Sinh trắc học', 
          isSwitch: true,
          value: biometricsEnabled,
          onValueChange: handleToggleBiometrics
        },
        { 
          icon: 'shield-checkmark-outline', 
          label: 'Xác thực 2 bước', 
          value: 'Đang phát triển',
          onPress: () => Alert.alert('Thông báo', 'Tính năng xác thực 2 bước đang được phát triển. Vui lòng quay lại sau!')
        },
      ]
    },
    {
      title: 'Ứng dụng',
      items: [
        { 
          icon: 'notifications-outline', 
          label: 'Thông báo', 
          isSwitch: true,
          value: notificationsEnabled,
          onValueChange: handleToggleNotification
        },
        { 
          icon: 'download-outline', 
          label: 'Xuất dữ liệu', 
          onPress: handleExportCsv
        },
      ]
    },
    {
      title: 'Hỗ trợ',
      items: [
        { 
          icon: 'newspaper-outline', 
          label: 'Blog & Tin tức', 
          onPress: () => navigation.navigate('Blog')
        },
        { 
          icon: 'document-text-outline', 
          label: 'Bài viết của tôi', 
          onPress: () => navigation.navigate('MyBlogs')
        },
        { 
          icon: 'diamond-outline', 
          label: 'Nâng cấp Premium', 
          highlight: !isPremium,
          onPress: () => navigation.navigate('Premium')
        },
        { 
          icon: 'help-circle-outline', 
          label: 'Trợ giúp & FAQ', 
          onPress: () => navigation.navigate('Help')
        },
      ]
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={isPremium ? ['#F59E0B', '#D97706', '#B45309'] : Colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            {/* Settings button */}
            <TouchableOpacity 
              style={styles.headerBtn} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Hồ sơ</Text>
            
            <TouchableOpacity 
              style={styles.headerBtn}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={[styles.avatarContainer, isPremium && styles.premiumBorder]}
              onPress={handleAvatarPress}
              disabled={uploading}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={isPremium ? ['#FCD34D', '#F59E0B'] : ['#60A5FA', '#3B82F6']}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
              )}
              
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#FFF" size="small" />
                </View>
              )}
              
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            
            {/* Badge */}
            <View style={[styles.badge, isPremium && styles.premiumBadge]}>
              <Ionicons 
                name={isPremium ? "diamond" : "person"} 
                size={12} 
                color="#FFF" 
                style={{marginRight: 6}} 
              />
              <Text style={styles.badgeText}>
                {isPremium ? 'HỘI VIÊN PREMIUM' : 'THÀNH VIÊN'}
              </Text>
            </View>
          </View>

          {/* Stats row removed for cleaner UI */}
        </LinearGradient>

        {/* Menu sections */}
        <View style={styles.menuContainer}>
          {menuSections.map((section, sIndex) => (
            <View key={sIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, iIndex) => (
                  <TouchableOpacity
                    key={iIndex}
                    style={[
                      styles.menuItem,
                      iIndex < section.items.length - 1 && styles.menuItemBorder,
                      item.highlight && styles.menuItemHighlight
                    ]}
                    onPress={item.onPress}
                    disabled={item.disabled || item.isSwitch}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[
                        styles.menuIcon,
                        item.highlight && styles.menuIconHighlight
                      ]}>
                        <Ionicons 
                          name={item.icon as any} 
                          size={20} 
                          color={item.highlight ? '#F59E0B' : Colors.textSecondary} 
                        />
                      </View>
                      <View>
                        <Text style={[
                          styles.menuLabel,
                          item.highlight && styles.menuLabelHighlight
                        ]}>
                          {item.label}
                        </Text>
                        {item.value && !item.isSwitch && (
                          <Text style={styles.menuValue}>{item.value}</Text>
                        )}
                      </View>
                    </View>
                    
                    {item.isSwitch ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: '#E5E7EB', true: isPremium ? '#FCD34D' : '#93C5FD' }}
                        thumbColor={item.value ? (isPremium ? '#F59E0B' : Colors.primary) : '#F3F4F6'}
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.version}>FEPA v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Nhập họ và tên"
              />
              
              <Text style={styles.inputLabel}>Thu nhập hàng tháng (VNĐ)</Text>
              <TextInput
                style={styles.input}
                value={editIncome}
                onChangeText={setEditIncome}
                placeholder="Ví dụ: 20000000"
                keyboardType="number-pad"
              />

              <Text style={styles.inputLabel}>Mục tiêu tiết kiệm (%)</Text>
              <TextInput
                style={styles.input}
                value={editGoal}
                onChangeText={setEditGoal}
                placeholder="Ví dụ: 20"
                keyboardType="number-pad"
              />

              <Text style={styles.inputLabel}>Phong cách chi tiêu</Text>
              <View style={styles.styleSelector}>
                {(['frugal', 'balanced', 'relaxed'] as const).map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.styleOption,
                      editStyle === style && styles.styleOptionActive
                    ]}
                    onPress={() => setEditStyle(style)}
                  >
                    <Text style={[
                      styles.styleOptionText,
                      editStyle === style && styles.styleOptionTextActive
                    ]}>
                      {style === 'frugal' ? 'Tiết kiệm' : style === 'relaxed' ? 'Thoải mái' : 'Cân bằng'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={authState.isLoading}
              >
                {authState.isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Lưu tất cả thay đổi</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity 
                style={styles.otpBtn}
                onPress={handleSendOtp}
                disabled={authState.isLoading}
              >
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                <Text style={styles.otpBtnText}>Gửi mã OTP đến email</Text>
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Mã OTP</Text>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                placeholder="Nhập mã OTP"
                keyboardType="number-pad"
              />
              
              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
              />
              
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Xác nhận mật khẩu mới"
                secureTextEntry
              />
              
              <TouchableOpacity 
                style={styles.saveBtn}
                onPress={handleChangePassword}
                disabled={authState.isLoading}
              >
                {authState.isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Xác nhận đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  
  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
    position: 'relative',
  },
  premiumBorder: {
    borderColor: '#FCD34D',
    borderWidth: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: 'rgba(251,191,36,0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  
  // Menu
  menuContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    ...Shadow.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemHighlight: {
    backgroundColor: '#FFFBEB',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconHighlight: {
    backgroundColor: '#FEF3C7',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  menuLabelHighlight: {
    color: '#D97706',
    fontWeight: '600',
  },
  menuValue: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  
  // Version
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 20,
    marginBottom: 20,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: Colors.textMuted,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  styleSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    marginTop: 8,
  },
  styleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  styleOptionActive: {
    backgroundColor: '#FFF',
    ...Shadow.sm,
  },
  styleOptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  styleOptionTextActive: {
    color: Colors.primary,
  },
  otpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  otpBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
});

export default ProfileScreen;
