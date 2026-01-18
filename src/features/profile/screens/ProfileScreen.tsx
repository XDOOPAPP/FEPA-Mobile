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
  KeyboardAvoidingView,
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
import { Colors, Radius, Shadow, Spacing, Typography } from '../../../constants/theme';
import { useAuth } from '../../../common/hooks/useMVVM';
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
  const scrollRef = useRef<ScrollView>(null);
  const [extras, setExtras] = useState<ProfileExtras>({});
  const [isEditing, setIsEditing] = useState(false);

  // Settings States
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Change Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadProfile = useCallback(async () => {
    if (!authContext) return;
    try {
      await authContext.loadUserInfo();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải hồ sơ');
    }
  }, [authContext]);

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

  const handleToggleNotification = async (value: boolean) => {
      setNotificationsEnabled(value);
      await AsyncStorage.setItem('settings_notifications', JSON.stringify(value));
  };

  const handleToggleBiometrics = async (value: boolean) => {
      setBiometricsEnabled(value);
      await AsyncStorage.setItem('settings_biometrics', JSON.stringify(value));
  };

  const handleSaveExtras = async () => {
    await saveProfileExtras(extras);
    setIsEditing(false);
    Alert.alert('Thành công', 'Đã cập nhật hồ sơ cá nhân');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Change Password Logic
  const handleSendOtp = async () => {
    if (!authContext?.user?.email) {
      Alert.alert('Lỗi', 'Không có email để gửi OTP');
      return;
    }
    try {
      await forgotPassword(authContext.user.email);
      Alert.alert('Thành công', 'Đã gửi OTP về email');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi OTP');
    }
  };

  const handleChangePassword = async () => {
    if (!authContext?.user?.email) return;
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
      await resetPassword(authContext.user.email, otp.trim(), newPassword);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      Alert.alert('Thành công', 'Đã đổi mật khẩu');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, [loadProfile]),
  );

  if (!authContext) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const { user, isLoading, logout } = authContext;

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất khỏi tài khoản?', [
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

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
         <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderEditForm = () => (
    <View style={styles.editForm}>
      <Text style={styles.fieldLabel}>Tuổi</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tuổi"
        placeholderTextColor={Colors.textMuted}
        value={extras.age || ''}
        onChangeText={age => setExtras(prev => ({ ...prev, age }))}
        keyboardType="numeric"
      />

      <Text style={styles.fieldLabel}>Giới tính</Text>
      <View style={styles.genderRow}>
        {[
          { key: 'male', label: 'Nam' },
          { key: 'female', label: 'Nữ' },
          { key: 'other', label: 'Khác' },
        ].map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.genderChip,
              extras.gender === item.key && styles.genderChipActive,
            ]}
            onPress={() =>
              setExtras(prev => ({
                ...prev,
                gender: item.key as ProfileExtras['gender'],
              }))
            }
          >
            <Text
              style={[
                styles.genderText,
                extras.gender === item.key && styles.genderTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Thu nhập (VND)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: 15000000"
        placeholderTextColor={Colors.textMuted}
        value={extras.income || ''}
        onChangeText={income =>
          setExtras(prev => ({ ...prev, income }))
        }
        keyboardType="numeric"
      />

      <Text style={styles.fieldLabel}>Vị trí</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: TP.HCM"
        placeholderTextColor={Colors.textMuted}
        value={extras.location || ''}
        onChangeText={location =>
          setExtras(prev => ({ ...prev, location }))
        }
      />
      
      <View style={styles.editActions}>
         <TouchableOpacity 
           style={styles.cancelBtn} 
           onPress={() => setIsEditing(false)}
         >
            <Text style={styles.cancelBtnText}>Hủy</Text>
         </TouchableOpacity>
         <TouchableOpacity 
           style={styles.saveBtn} 
           onPress={handleSaveExtras}
         >
            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
         </TouchableOpacity>
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
        {/* Header Profile Card */}
        <LinearGradient
          colors={Colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerProfile}
        >
           <View style={styles.headerTopRow}>
              <Text style={styles.headerTitle}>Hồ sơ</Text>
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                 <Ionicons name="create-outline" size={24} color="#FFF" />
              </TouchableOpacity>
           </View>
           
           <View style={styles.profileMain}>
              <View style={styles.avatarContainer}>
                 {user?.avatar ? (
                   <Image source={{ uri: user.avatar }} style={styles.avatar} />
                 ) : (
                   <Text style={styles.avatarText}>
                     {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                   </Text>
                 )}
              </View>
              <View style={styles.profileTexts}>
                 <Text style={styles.profileName}>{user?.fullName || 'Người dùng'}</Text>
                 <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
                 <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>Thành viên FEPA</Text>
                 </View>
              </View>
           </View>
        </LinearGradient>

        <View style={styles.contentContainer}>
           
           {isEditing ? (
             <GlassCard style={styles.editCard}>
                <Text style={styles.cardTitle}>Chỉnh sửa thông tin</Text>
                {renderEditForm()}
             </GlassCard>
           ) : (
             <>
               {/* Personal Info Section */}
               <SectionHeader title="Thông tin cá nhân" />
               <GlassCard style={styles.sectionCard}>
                  <InfoRow 
                    icon="person-outline" 
                    label="Họ và tên" 
                    value={user?.fullName || '--'} 
                  />
                  <View style={styles.divider} />
                  <InfoRow 
                    icon="calendar-outline" 
                    label="Tuổi" 
                    value={extras.age || '--'} 
                  />
                  <View style={styles.divider} />
                  <InfoRow 
                    icon="male-female-outline" 
                    label="Giới tính" 
                    value={
                      extras.gender === 'male' ? 'Nam' : 
                      extras.gender === 'female' ? 'Nữ' : 
                      extras.gender === 'other' ? 'Khác' : '--'
                    } 
                  />
                  <View style={styles.divider} />
                  <InfoRow 
                    icon="card-outline" 
                    label="Thu nhập" 
                    value={extras.income ? `${Number(extras.income).toLocaleString()}₫` : '--'} 
                  />
                  <View style={styles.divider} />
                  <InfoRow 
                    icon="location-outline" 
                    label="Vị trí" 
                    value={extras.location || '--'} 
                  />
               </GlassCard>


               {/* Premium Banner */}
               <TouchableOpacity 
                 style={styles.premiumCard}
                 activeOpacity={0.9}
               >
                  <LinearGradient
                    colors={Colors.goldGradient}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.premiumGradient}
                  >
                     <View style={styles.premiumContent}>
                        <View style={styles.premiumIconCircle}>
                           <Ionicons name="diamond-outline" size={24} color={Colors.accent} />
                        </View>
                        <View style={{flex: 1}}>
                           <Text style={styles.premiumTitle}>Nâng cấp Premium</Text>
                           <Text style={styles.premiumSubtitle}>Mở khóa tính năng nâng cao & không quảng cáo</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#FFF" />
                     </View>
                  </LinearGradient>
               </TouchableOpacity>

               {/* Settings Section */}
               <SectionHeader title="Cài đặt & Bảo mật" />
               <GlassCard style={styles.sectionCard}>
                  <View style={styles.settingRow}>
                     <View style={styles.settingLeft}>
                        <View style={[styles.iconBox, {backgroundColor: 'rgba(16, 185, 129, 0.1)'}]}>
                           <Ionicons name="notifications-outline" size={20} color={Colors.success} />
                        </View>
                        <Text style={styles.settingLabel}>Thông báo</Text>
                     </View>
                     <Switch 
                        value={notificationsEnabled} 
                        onValueChange={handleToggleNotification}
                        trackColor={{ false: Colors.border, true: Colors.primary }}
                        thumbColor="#FFF"
                     />
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.settingRow}>
                     <View style={styles.settingLeft}>
                        <View style={[styles.iconBox, {backgroundColor: 'rgba(6, 182, 212, 0.1)'}]}>
                           <Ionicons name="finger-print-outline" size={20} color={Colors.primary} />
                        </View>
                        <View>
                           <Text style={styles.settingLabel}>Bảo mật sinh trắc học</Text>
                           <Text style={styles.settingSubLabel}>FaceID / Vân tay</Text>
                        </View>
                     </View>
                     <Switch 
                        value={biometricsEnabled} 
                        onValueChange={handleToggleBiometrics}
                        trackColor={{ false: Colors.border, true: Colors.primary }}
                        thumbColor="#FFF"
                     />
                  </View>
                  <View style={styles.divider} />
                  <TouchableOpacity 
                    style={styles.settingRow}
                    onPress={() => setShowPasswordModal(true)}
                  >
                     <View style={styles.settingLeft}>
                        <View style={[styles.iconBox, {backgroundColor: 'rgba(245, 158, 11, 0.1)'}]}>
                           <Ionicons name="shield-checkmark-outline" size={20} color={Colors.warning} />
                        </View>
                        <View>
                           <Text style={styles.settingLabel}>Cài đặt bảo mật</Text>
                           <Text style={styles.settingSubLabel}>2FA, Mật khẩu</Text>
                        </View>
                     </View>
                     <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
               </GlassCard>

               {/* Resources Section */}
               <SectionHeader title="Tài nguyên" />
               <GlassCard style={styles.sectionCard}>
                  <TouchableOpacity style={styles.settingRow}>
                     <View style={styles.settingLeft}>
                        <View style={[styles.iconBox, {backgroundColor: 'rgba(99, 102, 241, 0.1)'}]}>
                           <Ionicons name="newspaper-outline" size={20} color="#6366F1" />
                        </View>
                        <View>
                           <Text style={styles.settingLabel}>Blog tài chính</Text>
                           <Text style={styles.settingSubLabel}>Mẹo tiết kiệm & kiến thức</Text>
                        </View>
                     </View>
                     <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.settingRow}>
                     <View style={styles.settingLeft}>
                        <View style={[styles.iconBox, {backgroundColor: 'rgba(59, 130, 246, 0.1)'}]}>
                           <Ionicons name="help-circle-outline" size={20} color={Colors.info} />
                        </View>
                        <Text style={styles.settingLabel}>Trung tâm trợ giúp</Text>
                     </View>
                     <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
               </GlassCard>

               {/* Logout Button */}
               <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={20} color={Colors.danger} style={{marginRight: 8}} />
                  <Text style={styles.logoutText}>Đăng xuất</Text>
               </TouchableOpacity>
               
               <Text style={styles.versionText}>Phiên bản 1.0.0 (Build 20260118)</Text>
             </>
           )}
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
               <Text style={styles.helperText}>
                 Nhấn 'Gửi OTP' để nhận mã xác thực qua email, sau đó nhập mã và mật khẩu mới.
               </Text>
               
               <TouchableOpacity
                 style={styles.otpButton}
                 onPress={handleSendOtp}
                 disabled={authState.isLoading}
               >
                 {authState.isLoading ? (
                   <ActivityIndicator color={Colors.primary} size="small" />
                 ) : (
                   <Text style={styles.otpButtonText}>Gửi OTP</Text>
                 )}
               </TouchableOpacity>

               <Text style={styles.inputLabel}>Mã OTP</Text>
               <TextInput
                 style={styles.modalInput}
                 placeholder="Nhập 6 số OTP"
                 keyboardType="number-pad"
                 value={otp}
                 onChangeText={setOtp}
                 placeholderTextColor={Colors.textMuted}
               />

               <Text style={styles.inputLabel}>Mật khẩu mới</Text>
               <TextInput
                 style={styles.modalInput}
                 placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                 secureTextEntry
                 value={newPassword}
                 onChangeText={setNewPassword}
                 placeholderTextColor={Colors.textMuted}
               />

               <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
               <TextInput
                 style={styles.modalInput}
                 placeholder="Nhập lại mật khẩu mới"
                 secureTextEntry
                 value={confirmPassword}
                 onChangeText={setConfirmPassword}
                 placeholderTextColor={Colors.textMuted}
               />

               <TouchableOpacity
                 style={styles.confirmButton}
                 onPress={handleChangePassword}
               >
                 <Text style={styles.confirmButtonText}>Cập nhật mật khẩu</Text>
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  profileTexts: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: -20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 24,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: 48,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  settingSubLabel: {
     fontSize: 12,
     color: Colors.textMuted,
     marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: 24,
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
  // Premium Card Styles
  premiumCard: {
     marginTop: 12,
     marginBottom: 12,
     ...Shadow.glow,
  },
  premiumGradient: {
     borderRadius: 20,
     padding: 2,
  },
  premiumContent: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255,255,255,0.1)', // Glassy overlay
     padding: 16,
     borderRadius: 18,
  },
  premiumIconCircle: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: '#FFF',
     alignItems: 'center',
     justifyContent: 'center',
     marginRight: 12,
  },
  premiumTitle: {
     fontSize: 16,
     fontWeight: '700',
     color: '#FFF',
     marginBottom: 2,
  },
  premiumSubtitle: {
     fontSize: 12,
     color: 'rgba(255,255,255,0.9)',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '80%',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
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
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  otpButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    marginBottom: 20,
  },
  otpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
    ...Shadow.glow,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  editCard: {
     padding: 20,
     borderRadius: 20,
  },
  cardTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: Colors.textPrimary,
     marginBottom: 20,
     textAlign: 'center',
  },
  editForm: {
     gap: 16,
  },
  fieldLabel: {
     fontSize: 14,
     fontWeight: '600',
     color: Colors.textSecondary,
     marginBottom: 8,
  },
  input: {
     backgroundColor: Colors.background,
     borderWidth: 1,
     borderColor: Colors.border,
     borderRadius: 12,
     paddingHorizontal: 16,
     paddingVertical: 12,
     fontSize: 16,
     color: Colors.textPrimary,
  },
  genderRow: {
     flexDirection: 'row',
     gap: 12,
  },
  genderChip: {
     flex: 1,
     paddingVertical: 10,
     borderRadius: 12,
     borderWidth: 1,
     borderColor: Colors.border,
     alignItems: 'center',
     backgroundColor: Colors.background,
  },
  genderChipActive: {
     borderColor: Colors.primary,
     backgroundColor: 'rgba(14, 165, 233, 0.1)',
  },
  genderText: {
     fontWeight: '600',
     color: Colors.textSecondary,
  },
  genderTextActive: {
     color: Colors.primary,
  },
  editActions: {
     flexDirection: 'row',
     gap: 12,
     marginTop: 20,
  },
  cancelBtn: {
     flex: 1,
     paddingVertical: 14,
     backgroundColor: Colors.background,
     borderRadius: 12,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: Colors.border,
  },
  cancelBtnText: {
     fontWeight: '600',
     color: Colors.textSecondary,
  },
  saveBtn: {
     flex: 1,
     paddingVertical: 14,
     backgroundColor: Colors.primary,
     borderRadius: 12,
     alignItems: 'center',
     ...Shadow.glow,
  },
  saveBtnText: {
     fontWeight: '700',
     color: '#FFF',
  },
});

export default ProfileScreen;
