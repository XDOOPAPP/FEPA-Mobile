import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography } from '../../../constants/theme';
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
          <Ionicons name="bulb" size={20} color={Colors.warning} style={styles.icon} />
          <Text style={styles.title}>Lời khuyên tài chính</Text>
        </View>
        <TouchableOpacity onPress={loadAdvice} disabled={loading}>
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Text style={styles.adviceText}>{advice}</Text>
        )}
      </View>
      
      {!profileLoaded && !loading && (
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
           <Text style={styles.hint}>Vào Profile để cập nhật thông tin <Ionicons name="arrow-forward" size={12} /></Text>
        </TouchableOpacity>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Spacing.xs,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  content: {
    minHeight: 50,
    justifyContent: 'center',
  },
  adviceText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  hint: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
});

export default FinancialTipsWidget;
