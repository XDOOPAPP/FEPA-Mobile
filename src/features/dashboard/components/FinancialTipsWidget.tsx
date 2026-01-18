import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography } from '../../../constants/theme';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { useAI } from '../../../common/hooks/useAI';
import { useAuth } from '../../../common/hooks/useMVVM';
import { getProfileExtras } from '../../../utils/profileExtrasStorage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FinancialTipsWidget: React.FC = () => {
  const { authState } = useAuth();
  const { assistantChat, loading } = useAI(authState.token || null);
  const [advice, setAdvice] = useState<string>('');
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    loadAdvice();
  }, []);

  const loadAdvice = async () => {
    try {
      const extras = await getProfileExtras();
      if (!extras.age || !extras.income) {
        setAdvice('Hãy cập nhật hồ sơ (Tuổi & Thu nhập) để nhận lời khuyên tài chính cá nhân hóa.');
        setProfileLoaded(false);
        return;
      }
      setProfileLoaded(true);

      const prompt = `Tôi ${extras.age} tuổi, thu nhập ${extras.income} VND/tháng, sống tại ${extras.location || 'Việt Nam'}. Hãy cho tôi một lời khuyên tài chính ngắn gọn, thực tế trong 1 câu.`;
      
      const res = await assistantChat({ message: prompt });
      if (res && res.reply) {
        setAdvice(res.reply);
      }
    } catch (e) {
      setAdvice('Không thể lấy lời khuyên lúc này.');
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
        <Text style={styles.hint}>Vào Profile để cập nhật thông tin.</Text>
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
