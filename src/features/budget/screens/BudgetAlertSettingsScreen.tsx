import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Shadow, Spacing, Colors, Radius } from '../../../constants/theme';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80; // Padding 20 * 2 + inner padding of card

const ALERT_SETTINGS_KEY = '@budget_alert_settings';

const BudgetAlertSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { 
    budgetId,
    budgetName = 'Ăn uống', 
    currentLimit = '0₫',
    remaining = '0₫',
    spent = '0₫',
    percentage = 0
  } = route.params || {};

  const [reach80, setReach80] = useState(true);
  const [exceeded, setExceeded] = useState(true);
  const [threshold, setThreshold] = useState(85);
  const [isSaving, setIsSaving] = useState(false);

  // Parse limit string back to number for calculations
  const limitValue = useMemo(() => {
    return parseInt(currentLimit.replace(/[^\d]/g, '')) || 0;
  }, [currentLimit]);

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, [budgetId]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(`${ALERT_SETTINGS_KEY}_${budgetId}`);
      if (saved) {
        const settings = JSON.parse(saved);
        setReach80(settings.reach80 ?? true);
        setExceeded(settings.exceeded ?? true);
        setThreshold(settings.threshold ?? 85);
      }
    } catch (error) {
      console.warn('Error loading alert settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings = {
        budgetId,
        reach80,
        exceeded,
        threshold,
        updatedAt: new Date().toISOString()
      };
      await AsyncStorage.setItem(`${ALERT_SETTINGS_KEY}_${budgetId}`, JSON.stringify(settings));
      
      Alert.alert('Thành công', 'Cài đặt cảnh báo đã được lưu lại.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSliderPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    let newPercent = Math.round((locationX / SLIDER_WIDTH) * 100);
    newPercent = Math.max(50, Math.min(100, newPercent)); // Restrict 50-100%
    setThreshold(newPercent);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt cảnh báo</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
           {isSaving ? (
             <Text style={[styles.saveText, { opacity: 0.5 }]}>Đang lưu...</Text>
           ) : (
             <Text style={styles.saveText}>Lưu</Text>
           )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[
          styles.infoCard,
          percentage > 100 && { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }
        ]}>
           <View style={[
             styles.infoIconBox,
             percentage > 100 && { backgroundColor: 'rgba(239,68,68,0.1)' }
           ]}>
              <Ionicons 
                name={budgetName.toLowerCase().includes('ăn') ? "restaurant" : "wallet"} 
                size={24} 
                color={percentage > 100 ? '#EF4444' : Colors.primary} 
              />
           </View>
           <View style={styles.infoMain}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.infoTitle}>Ngân sách {budgetName}</Text>
                {percentage > 100 && (
                  <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>VƯỢT MỨC</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.infoSubtitle, percentage > 100 && { color: '#EF4444' }]}>
                {percentage > 100 ? `Đã vượt ${Math.abs(parseInt(remaining.replace(/[^\d]/g, '')) || 0).toLocaleString()}₫` : `Tháng này • Còn lại ${remaining}`}
              </Text>
              
              <View style={styles.miniProgressRow}>
                 <Text style={styles.miniProgressLabel}>Tiến độ chi tiêu</Text>
                 <Text style={[styles.miniProgressLabel, percentage > 100 && { color: '#EF4444', fontWeight: '700' }]}>{Math.round(percentage)}%</Text>
              </View>
              <View style={styles.miniProgressBar}>
                 <View style={[styles.miniProgressFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: percentage > 100 ? '#EF4444' : percentage > 80 ? '#F59E0B' : Colors.primary }]} />
              </View>
              
              <Text style={styles.limitInfo}>Hạn mức: {currentLimit}</Text>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={styles.groupTitle}>Thông báo đẩy</Text>
           <Text style={styles.groupSubtitle}>Nhận cập nhật tức thì về tình hình tài chính của bạn</Text>
        </View>

        <View style={styles.settingCard}>
           <View style={styles.settingIconBox}>
              <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
           </View>
           <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Cảnh báo khi đạt 80%</Text>
              <Text style={styles.settingDesc}>
                Thông báo khi chi tiêu chạm mức { (limitValue * 0.8 / 1000).toLocaleString() }k₫
              </Text>
           </View>
           <Switch 
             value={reach80} 
             onValueChange={setReach80}
             trackColor={{ false: '#E2E8F0', true: Colors.primary }}
             thumbColor="#FFFFFF"
           />
        </View>

        <View style={styles.settingCard}>
           <View style={styles.settingIconBoxRed}>
              <Ionicons name="warning-outline" size={20} color="#EF4444" />
           </View>
           <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Cảnh báo khi vượt mức</Text>
              <Text style={styles.settingDesc}>Thông báo ngay lập tức khi chi vượt hạn mức</Text>
           </View>
           <Switch 
             value={exceeded} 
             onValueChange={setExceeded}
             trackColor={{ false: '#E2E8F0', true: Colors.primary }}
             thumbColor="#FFFFFF"
           />
        </View>

        <View style={styles.thresholdSection}>
           <View style={styles.thresholdHeader}>
              <Text style={styles.settingTitle}>Tùy chỉnh ngưỡng cảnh báo</Text>
              <Text style={styles.thresholdValue}>{threshold}%</Text>
           </View>
           
           <TouchableOpacity 
             activeOpacity={1} 
             onPress={handleSliderPress} 
             style={styles.sliderContainer}
           >
              <View style={styles.sliderTrack}>
                 <View style={[styles.sliderFill, { width: `${threshold}%` }]} />
                 <View style={[styles.sliderThumb, { left: `${threshold}%` }]} />
              </View>
           </TouchableOpacity>

           <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>50%</Text>
              <Text style={styles.sliderLabel}>75%</Text>
              <Text style={styles.sliderLabel}>100%</Text>
           </View>
        </View>

        <TouchableOpacity
          style={styles.saveButtonBottom}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Đang xử lý...' : 'Lưu cài đặt'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          Chúng tôi sẽ gửi thông báo giúp bạn duy trì kỷ luật tài chính tốt hơn.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  backButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadow.card,
  },
  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primaryHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoMain: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  miniProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  miniProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  miniProgressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  limitInfo: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  settingCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  settingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIconBoxRed: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  thresholdSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadow.soft,
  },
  thresholdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  thresholdValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  sliderContainer: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    position: 'absolute',
    top: -9,
    marginLeft: -12,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...Shadow.md,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  saveButtonBottom: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...Shadow.glow,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footerNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});

export default BudgetAlertSettingsScreen;
