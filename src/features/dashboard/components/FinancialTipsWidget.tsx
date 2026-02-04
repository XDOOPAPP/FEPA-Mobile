import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, Shadow } from '../../../constants/theme';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { useAI } from '../../../common/hooks/useAI';
import { useAuth } from '../../../common/hooks/useMVVM';
import { getProfileExtras } from '../../../utils/profileExtrasStorage';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useNavigation } from '@react-navigation/native';

const FinancialTipsWidget: React.FC = () => {
  const navigation = useNavigation<any>();
  const { authState } = useAuth();
  const { assistantChat, loading } = useAI(authState.token || null);
  const [advice, setAdvice] = useState<string>('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    loadAdvice();
  }, []);

  const loadAdvice = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('ai_financial_profile');
      if (!savedProfile) {
        setAdvice('Hãy cập nhật Hồ sơ AI (Thu nhập & Mục tiêu) để nhận lời khuyên tài chính cá nhân hóa từ Gemini.');
        setProfileLoaded(false);
        return;
      }
      
      const profile = JSON.parse(savedProfile);
      const { monthlyIncome, savingsGoal, spendingStyle } = profile;

      if (!monthlyIncome) {
        setAdvice('Hãy thiết lập thu nhập hàng tháng trong Profile để AI có thể tư vấn kế hoạch tiết kiệm cho bạn.');
        setProfileLoaded(false);
        return;
      }
      
      setProfileLoaded(true);
      const styleVn = spendingStyle === 'frugal' ? 'tiết kiệm cực hạn' : spendingStyle === 'relaxed' ? 'thoải mái hưởng thụ' : 'cân bằng chi tiêu';
      
      const prompt = `Hồ sơ tài chính: Thu nhập ${monthlyIncome.toLocaleString()} VNĐ/tháng, mục tiêu tiết kiệm ${savingsGoal}% thu nhập, phong cách ${styleVn}. Hãy đưa ra 1 lời khuyên tài chính ngắn gọn, thực tế và hành động được ngay trong 1 câu.`;
      
      const res = await assistantChat({ message: prompt });
      if (res && res.reply) {
        setAdvice(res.reply);
      }
    } catch (e) {
      setAdvice('Không thể kết nối với trí tuệ nhân tạo FEPA lúc này.');
    }
  };

  return (
    <GlassCard variant="default" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrapper}>
            <Ionicons name="bulb" size={20} color="#F59E0B" />
          </View>
          <Text style={styles.title}>Lời khuyên tài chính</Text>
        </View>
        <TouchableOpacity onPress={loadAdvice} disabled={loading} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 10 }} />
        ) : (
          <Text style={styles.adviceText}>{advice}</Text>
        )}
      </View>
      
      {!profileLoaded && !loading && (
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.hintContainer}>
           <Text style={styles.hint}>Vào Profile để cập nhật thông tin</Text>
           <Ionicons name="arrow-forward" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 10,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  refreshButton: {
    padding: 2,
  },
  content: {
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 12,
  },
  adviceText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontSize: 15,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hint: {
    ...Typography.bodyBold,
    color: Colors.primary,
    fontSize: 14,
  },
});

export default FinancialTipsWidget;
