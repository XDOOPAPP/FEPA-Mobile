import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Radius, Shadow, Typography } from '../../constants/theme';

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger';
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  style,
  icon,
  variant = 'primary',
}) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'success': return Colors.successGradient;
      case 'danger': return Colors.dangerGradient;
      case 'primary': default: return Colors.primaryGradient;
    }
  };

  if (disabled) {
    return (
      <View style={[styles.container, styles.disabled, style]}>
         <Text style={styles.text}>{title}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color={Colors.textPrimary} />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={styles.text}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.glow,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  text: {
    ...Typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  iconContainer: {
    marginRight: 8,
  }
});

// Mock View for disabled state to avoid TS errors with mismatched types
const View = require('react-native').View;
