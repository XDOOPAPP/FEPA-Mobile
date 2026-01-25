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
import { useAuth, useSubscription } from '../../../common/hooks/useMVVM';
import {
  getProfileExtras,
  saveProfileExtras,
  ProfileExtras,
} from '../../../utils/profileExtrasStorage';
import { GlassCard } from '../../../components/design-system/GlassCard';

const ProfileScreen: React.FC = () => {
  const authContext = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const { authState, forgotPassword, resetPassword } = useAuth();
  const { subState: subscriptionState, getCurrent } = useSubscription();
  
  const scrollRef = useRef<ScrollView>(null);
  const [extras, setExtras] = useState<ProfileExtras>({});
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Settings States
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Change Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isPremium = subscriptionState.current?.status === 'active';

  const loadProfile = useCallback(async () => {
    if (!authContext) return;
    try {
      await authContext.loadUserInfo();
      await getCurrent();
    } catch (error: any) {
      console.log('Profile load error', error);
    }
  }, [authContext, getCurrent]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const stored = await getProfileExtras();
      const notif = await AsyncStorage.getItem('settings_notifications');
      const bio = await AsyncStorage.getItem('settings_biometrics');
      
      if (isMounted) {
        setExtras(stored);
        if (notif !== null) setNotificationsEnabled(JSON.parse(notif));
        if (bio !== null) setBiometricsEnabled(JSON.parse(bio));
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, [loadProfile]),
  );

  const handleAvatarPress = async () => {
    // Requires react-native-image-picker
    const { launchImageLibrary } = require('react-native-image-picker');
    
    try {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        });

        if (result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setUploading(true);
            setTimeout(() => {
                setUploading(false);
                Alert.alert('Thành công', 'Avatar đã được cập nhật (Demo mode)');
            }, 1500);
        }
    } catch (err) {
        Alert.alert('Lỗi', 'Không thể mở thư viện ảnh');
    }
  };

  const handleSaveExtras = async () => {
    await saveProfileExtras(extras);
    setIsEditing(false);
    Alert.alert('Thành công', 'Đã cập nhật hồ sơ cá nhân');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };
  
  // Settings Handlers
  const handleToggleNotification = async (value: boolean) => {
      setNotificationsEnabled(value);
      await AsyncStorage.setItem('settings_notifications', JSON.stringify(value));
  };

  const handleToggleBiometrics = async (value: boolean) => {
      setBiometricsEnabled(value);
      await AsyncStorage.setItem('settings_biometrics', JSON.stringify(value));
  };

  const handleExportCsv = async () => {
    try {
      if (Platform.OS === 'android') {
        const { PermissionsAndroid } = require('react-native');
        // Đối với Android 10 trở xuống cần quyền này
        // Android 11+ Scoped Storage tự động cho phép ghi vào Downloads
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                {
                    title: 'Cấp quyền lưu trữ',
                    message: 'Ứng dụng cần quyền lưu file CSV vào máy.',
                    buttonPositive: 'Đồng ý',
                }
            );
            // Kệ kết quả granted vì Android 13+ luôn trả về denied cho write storage nhưng vẫn ghi được vào share folder
        } catch (err) {
            console.warn(err);
        }
      }

      Alert.alert('Đang xuất dữ liệu', 'Vui lòng đợi trong giây lát...');
      
      const response = await axiosInstance.get(API_ENDPOINTS.GET_EXPENSE_EXPORT, {
          params: { from: '2020-01-01' }
      });
      
      console.log('Export response:', response.status); // Debug log

      const csvData = response.data.csv;
      if (!csvData) throw new Error('Không có dữ liệu trả về từ Server');

      const fileName = `fepa_${new Date().getTime()}.csv`;
      const path = Platform.OS === 'android' 
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(path, csvData, 'utf8');
      
      Alert.alert(
          'Xuất thành công', 
          `File đã được lưu tại thư mục Download:\n${fileName}`,
          [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.log('Export error:', error);
      Alert.alert('Lỗi', `Không thể xuất file CSV.\nChi tiết: ${error.message}`);
    }
  };
  
  // Password Handlers
  const handleSendOtp = async () => {
    if (!authContext?.user?.email) return;
    try {
      await forgotPassword(authContext.user.email);
      Alert.alert('Thành công', 'Đã gửi OTP về email');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi OTP');
    }
  };

  const handleChangePassword = async () => {
    if (!authContext?.user?.email) return;
    if (!otp.trim() || !newPassword || newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra lại thông tin');
      return;
    }
    try {
      await resetPassword(authContext.user.email, otp.trim(), newPassword);
      setOtp(''); setNewPassword(''); setConfirmPassword('');
      setShowPasswordModal(false);
      Alert.alert('Thành công', 'Đã đổi mật khẩu');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu');
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
  const { user } = authContext;

  // Render Helpers
  const renderInfoItem = (label: string, value: string, icon: string) => (
      <View style={styles.infoCardItem}>
          <View style={[styles.infoIcon, { backgroundColor: isPremium ? 'rgba(255, 215, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]}>
             <Ionicons name={icon} size={20} color={isPremium ? '#D97706' : Colors.primary} />
          </View>
          <View>
             <Text style={styles.infoLabel}>{label}</Text>
             <Text style={styles.infoValue}>{value}</Text>
          </View>
      </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Dynamic Header */}
        <LinearGradient
          colors={isPremium ? Colors.goldGradient : Colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerProfile}
        >
           <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Hồ sơ</Text>
              <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
                 <Ionicons name={isEditing ? "close" : "settings-outline"} size={22} color="#FFF" />
              </TouchableOpacity>
           </View>
           
           <View style={styles.profileCenter}>
              <View style={[styles.avatarWrapper, isPremium && styles.premiumAvatarBorder]}>
                 <TouchableOpacity onPress={handleAvatarPress} disabled={uploading}>
                    {user?.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                    {uploading && (
                        <View style={styles.uploadOverlay}>
                            <ActivityIndicator color="#FFF" />
                        </View>
                    )}
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.cameraBtn} onPress={handleAvatarPress}>
                    <Ionicons name="camera" size={16} color={Colors.primary} />
                 </TouchableOpacity>
              </View>

              <Text style={styles.profileName}>{user?.fullName || 'Người dùng'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              
              {isPremium ? (
                  <View style={styles.premiumBadge}>
                      <Ionicons name="diamond" size={14} color="#FFF" style={{marginRight:4}} />
                      <Text style={styles.premiumBadgeText}>PREMIUM MEMBER</Text>
                  </View>
              ) : (
                  <View style={styles.memberBadge}>
                      <Text style={styles.memberBadgeText}>MEMBER</Text>
                  </View>
              )}
           </View>

           {/* Stats Row */}
           <View style={styles.statsRow}>
               <View style={styles.statItem}>
                   <Text style={styles.statValue}>{extras.age || '--'}</Text>
                   <Text style={styles.statLabel}>Tuổi</Text>
               </View>
               <View style={styles.statDivider} />
               <View style={styles.statItem}>
                   <Text style={styles.statValue}>{subscriptionState.current?.planId ? 'Premium' : 'Free'}</Text>
                   <Text style={styles.statLabel}>Gói</Text>
               </View>
               <View style={styles.statDivider} />
               <View style={styles.statItem}>
                   <Text style={styles.statValue}>{extras.location?.split(',')[0] || 'VN'}</Text>
                   <Text style={styles.statLabel}>Vị trí</Text>
               </View>
           </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
           {isEditing ? (
               <GlassCard style={styles.editCard}>
                  <Text style={styles.cardTitle}>Chỉnh sửa thông tin</Text>
                  <View style={styles.editForm}>
                    <Text style={styles.fieldLabel}>Họ và tên</Text>
                    <TextInput style={styles.input} value={user?.fullName} editable={false} />
                    
                    <Text style={styles.fieldLabel}>Tuổi</Text>
                    <TextInput 
                        style={styles.input} 
                        value={extras.age} 
                        onChangeText={t => setExtras(p => ({...p, age: t}))}
                        keyboardType="numeric"
                    />

                    <Text style={styles.fieldLabel}>Thu nhập</Text>
                    <TextInput 
                        style={styles.input} 
                        value={extras.income} 
                        onChangeText={t => setExtras(p => ({...p, income: t}))}
                        keyboardType="numeric"
                    />
                    
                    <Text style={styles.fieldLabel}>Vị trí</Text>
                    <TextInput 
                        style={styles.input} 
                        value={extras.location} 
                        onChangeText={t => setExtras(p => ({...p, location: t}))} 
                    />

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveExtras}>
                        <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                    </TouchableOpacity>
                  </View>
               </GlassCard>
           ) : (
               <>
                  {/* Quick Actions Grid */}
                  <View style={styles.gridRow}>
                     <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('BudgetStack')}>
                        <View style={[styles.gridIcon, {backgroundColor: '#EEF2FF'}]}>
                           <Ionicons name="wallet" size={24} color="#4F46E5" />
                        </View>
                        <Text style={styles.gridLabel}>Ngân sách</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Blog')}>
                        <View style={[styles.gridIcon, {backgroundColor: '#ECFDF5'}]}>
                           <Ionicons name="newspaper" size={24} color="#10B981" />
                        </View>
                        <Text style={styles.gridLabel}>Blog</Text>
                     </TouchableOpacity>

                     <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Premium')}>
                        <View style={[styles.gridIcon, {backgroundColor: '#FFFBEB'}]}>
                           <Ionicons name="diamond" size={24} color="#D97706" />
                        </View>
                        <Text style={styles.gridLabel}>Premium</Text>
                     </TouchableOpacity>
                  </View>

                  {/* Detailed Info */}
                  <GlassCard style={styles.sectionCard}>
                     <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Thông tin chi tiết</Text>
                        <TouchableOpacity onPress={() => setIsEditing(true)}>
                            <Text style={styles.linkText}>Sửa</Text>
                        </TouchableOpacity>
                     </View>
                     
                     <View style={styles.infoGrid}>
                        {renderInfoItem("Email", user?.email || '--', "mail-outline")}
                        {renderInfoItem("Giới tính", extras.gender === 'male' ? 'Nam' : extras.gender === 'female' ? 'Nữ' : 'Khác', "people-outline")}
                        {renderInfoItem("Thu nhập", extras.income ? `${Number(extras.income).toLocaleString()}₫` : '--', "cash-outline")}
                     </View>
                  </GlassCard>
                  
                  {/* Settings Menu */}
                  <GlassCard style={[styles.sectionCard, {marginTop: 16}]}>
                      <Text style={styles.cardTitle}>Cài đặt & Dữ liệu</Text>
                      
                      <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
                            <Text style={styles.settingLabel}>Thông báo</Text>
                        </View>
                        <Switch 
                            value={notificationsEnabled} 
                            onValueChange={handleToggleNotification} 
                            trackColor={{ false: Colors.border, true: isPremium ? Colors.accent : Colors.primary }}
                        />
                      </View>

                      <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="finger-print-outline" size={22} color={Colors.textSecondary} />
                            <Text style={styles.settingLabel}>Sinh trắc học</Text>
                        </View>
                        <Switch 
                            value={biometricsEnabled} 
                            onValueChange={handleToggleBiometrics}
                            trackColor={{ false: Colors.border, true: isPremium ? Colors.accent : Colors.primary }}
                        />
                      </View>
                      
                      <TouchableOpacity style={styles.settingRow} onPress={handleExportCsv}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="download-outline" size={22} color={Colors.textSecondary} />
                            <Text style={styles.settingLabel}>Xuất dữ liệu (CSV)</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.settingRow} onPress={() => setShowPasswordModal(true)}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="lock-closed-outline" size={22} color={Colors.textSecondary} />
                            <Text style={styles.settingLabel}>Đổi mật khẩu</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                      </TouchableOpacity>
                  </GlassCard>

                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                      <Text style={styles.logoutText}>Đăng xuất</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.versionText}>v1.0.0</Text>
               </>
           )}
        </View>
      </ScrollView>
      
      {/* Change Password Modal (Reused) */}
      <Modal visible={showPasswordModal} animationType="slide" transparent={true} onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
               <TouchableOpacity style={styles.otpButton} onPress={handleSendOtp} disabled={authState.isLoading}>
                 <Text style={styles.otpButtonText}>Gửi OTP xác thực</Text>
               </TouchableOpacity>
               <TextInput style={styles.modalInput} placeholder="Nhập OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
               <TextInput style={styles.modalInput} placeholder="Mật khẩu mới" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
               <TextInput style={styles.modalInput} placeholder="Xác nhận mật khẩu" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
               <TouchableOpacity style={styles.confirmButton} onPress={handleChangePassword}>
                 <Text style={styles.confirmButtonText}>Xác nhận đổi</Text>
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
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerProfile: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  editBtn: {
     padding: 8,
     backgroundColor: 'rgba(255,255,255,0.2)',
     borderRadius: 12,
  },
  profileCenter: {
     alignItems: 'center',
     marginBottom: 24,
  },
  avatarWrapper: {
     width: 88,
     height: 88,
     borderRadius: 44,
     backgroundColor: '#FFF',
     padding: 3,
     marginBottom: 12,
     position: 'relative',
     ...Shadow.medium,
  },
  premiumAvatarBorder: {
     borderWidth: 3,
     borderColor: '#FFD700', // Gold
     padding: 2,
  },
  avatar: {
     width: '100%',
     height: '100%',
     borderRadius: 44,
  },
  avatarPlaceholder: {
     backgroundColor: '#F3F4F6',
     alignItems: 'center',
     justifyContent: 'center',
     width: '100%',
      height: '100%',
      borderRadius: 44,
  },
  avatarText: {
     fontSize: 32,
     fontWeight: '700',
     color: Colors.primary,
  },
  uploadOverlay: {
     ...StyleSheet.absoluteFillObject,
     backgroundColor: 'rgba(0,0,0,0.4)',
     borderRadius: 44,
     alignItems: 'center',
     justifyContent: 'center',
  },
  cameraBtn: {
     position: 'absolute',
     bottom: 0,
     right: 0,
     backgroundColor: '#FFF',
     width: 28,
     height: 28,
     borderRadius: 14,
     alignItems: 'center',
     justifyContent: 'center',
     borderWidth: 2,
     borderColor: Colors.background,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  premiumBadge: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#F59E0B',
     paddingHorizontal: 12,
     paddingVertical: 4,
     borderRadius: 20,
     ...Shadow.light,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  
  // Stats
  statsRow: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: 'rgba(255,255,255,0.15)',
     marginHorizontal: Spacing.lg,
     borderRadius: 16,
     paddingVertical: 12,
  },
  statItem: {
     alignItems: 'center',
     paddingHorizontal: 16,
     minWidth: 80,
  },
  statValue: {
     fontSize: 16,
     fontWeight: '700',
     color: '#FFF',
     marginBottom: 2,
  },
  statLabel: {
     fontSize: 11,
     color: 'rgba(255,255,255,0.8)',
     textTransform: 'uppercase',
  },
  statDivider: {
     width: 1,
     height: 24,
     backgroundColor: 'rgba(255,255,255,0.2)',
  },

  contentContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: -20,
    paddingBottom: 40,
  },
  
  // Grid Actions
  gridRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginBottom: 16,
  },
  gridItem: {
     flex: 1,
     backgroundColor: '#FFF',
     borderRadius: 16,
     padding: 12,
     alignItems: 'center',
     marginHorizontal: 4,
     ...Shadow.light,
  },
  gridIcon: {
     width: 44,
     height: 44,
     borderRadius: 14,
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: 8,
  },
  gridLabel: {
     fontSize: 12,
     fontWeight: '600',
     color: Colors.textPrimary,
  },

  // Cards
  sectionCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  cardHeaderRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 16,
  },
  cardTitle: {
     fontSize: 16,
     fontWeight: '700',
     color: Colors.textPrimary,
  },
  linkText: {
     fontSize: 14,
     color: Colors.primary,
     fontWeight: '600',
  },
  
  infoGrid: {
     gap: 12,
  },
  infoCardItem: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 12,
     backgroundColor: Colors.background,
     borderRadius: 12,
  },
  infoIcon: {
     width: 36,
     height: 36,
     borderRadius: 10,
     alignItems: 'center',
     justifyContent: 'center',
     marginRight: 12,
  },
  infoLabel: {
     fontSize: 11,
     color: Colors.textMuted,
     marginBottom: 2,
  },
  infoValue: {
     fontSize: 14,
     fontWeight: '600',
     color: Colors.textPrimary,
  },

  // Edit Form
  editCard: {
     padding: 20,
     borderRadius: 20,
     backgroundColor: '#FFF',
  },
  editForm: {
      marginTop: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editActions: {
     flexDirection: 'row',
     marginTop: 24,
     gap: 12,
  },
  cancelBtn: {
     flex: 1,
     paddingVertical: 14,
     borderRadius: Radius.md,
     borderWidth: 1,
     borderColor: Colors.border,
     alignItems: 'center',
  },
  cancelBtnText: {
     color: Colors.textSecondary,
     fontWeight: '600',
  },
  saveBtn: {
     flex: 1,
     backgroundColor: Colors.primary,
     paddingVertical: 14,
     borderRadius: Radius.md,
     alignItems: 'center',
     justifyContent: 'center',
  },
  saveBtnText: {
     color: '#FFF',
     fontWeight: '700',
     fontSize: 16,
  },
  
  // Settings Rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: Radius.lg,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 16,
    color: Colors.textMuted,
    fontSize: 12,
  },
  
  // Modal Results
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '70%',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalContent: {
     flex: 1,
  },
  helperText: {
     color: Colors.textMuted,
     marginBottom: 16,
  },
  inputLabel: {
     fontSize: 14,
     fontWeight: '600',
     marginBottom: 8,
     marginTop: 12,
     color: Colors.textPrimary,
  },
  modalInput: {
     backgroundColor: '#F3F4F6',
     borderRadius: 12,
     padding: 14,
     fontSize: 16,
     marginBottom: 12,
  },
  otpButton: {
     alignSelf: 'flex-end',
     padding: 8,
  },
  otpButtonText: {
     color: Colors.primary,
     fontWeight: '600',
  },
  confirmButton: {
     backgroundColor: Colors.primary,
     padding: 16,
     borderRadius: 16,
     alignItems: 'center',
     marginTop: 24,
  },
  confirmButtonText: {
     color: '#FFF',
     fontWeight: '700',
     fontSize: 16,
  },
});

export default ProfileScreen;
