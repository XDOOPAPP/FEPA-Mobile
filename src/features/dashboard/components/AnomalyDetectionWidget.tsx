import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadow } from '../../../constants/theme';
import { GlassCard } from '../../../components/design-system/GlassCard';
import { useAI } from '../../../common/hooks/useAI';
import { useAuth } from '../../../common/hooks/useMVVM';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AnomalyDetectionWidget: React.FC = () => {
  const { authState } = useAuth();
  const { detectAnomalies, loading, error } = useAI(authState.token || null);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  useEffect(() => {
    if (authState.token) {
      loadAnomalies();
    }
  }, [authState.token]);

  const loadAnomalies = async () => {
    if (!authState.token) return;
    
    try {
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      
      const res = await detectAnomalies({
        from: lastMonth.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      });
      
      if (res && res.anomalies) {
        setAnomalies(res.anomalies);
      }
    } catch (e) {
      console.log('Detect Anomalies Error:', e);
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  if (loading && anomalies.length === 0) {
    return (
      <GlassCard style={styles.container}>
        <ActivityIndicator color={Colors.primary} />
      </GlassCard>
    );
  }

  if (anomalies.length === 0 && !loading) {
    return null; // Don't show if no clusters/anomalies found to keep UI clean
  }

  return (
    <GlassCard variant="default" style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="alert-circle" size={20} color={Colors.danger} style={styles.icon} />
          <Text style={styles.title}>Phát hiện bất thường (AI)</Text>
        </View>
        <TouchableOpacity onPress={loadAnomalies} disabled={loading}>
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {anomalies.map((item, index) => (
          <View key={index} style={styles.anomalyItem}>
            <View style={styles.itemTop}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.date}>{new Date(item.date).toLocaleDateString('vi-VN')}</Text>
            </View>
            <View style={styles.itemBottom}>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Mức độ: {(item.score * 100).toFixed(0)}%</Text>
              </View>
            </View>
            <Text style={styles.description}>
              {item.description || `Chi tiêu cao hơn bình thường (${formatCurrency(item.expected)}).`}
            </Text>
          </View>
        ))}
      </View>
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
    marginBottom: Spacing.md,
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
    gap: 12,
  },
  anomalyItem: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  category: {
    ...Typography.bodyBold,
    color: Colors.textPrimary,
  },
  date: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  itemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amount: {
    ...Typography.h4,
    color: Colors.danger,
  },
  scoreBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreText: {
    ...Typography.smallBold,
    color: Colors.danger,
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default AnomalyDetectionWidget;
