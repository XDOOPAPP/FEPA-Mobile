import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography, Spacing } from '../../constants/theme';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  label: string;
  amount: string;
  type?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  amount,
  type = 'neutral',
  icon
}) => {
  const getColor = () => {
    switch(type) {
      case 'positive': return Colors.success;
      case 'negative': return Colors.danger;
      default: return Colors.textPrimary;
    }
  };

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
      </View>
      <Text style={[styles.amount, { color: getColor() }]}>
        {amount}
      </Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  iconWrap: {
    opacity: 0.8,
  },
  amount: {
    ...Typography.h3,
    fontWeight: '700',
  }
});
