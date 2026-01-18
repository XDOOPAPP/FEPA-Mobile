import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { Colors, Radius, Shadow } from '../../constants/theme';
import LinearGradient from 'react-native-linear-gradient';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'featured';
}

/**
 * Modern Glassmorphism Card Component
 * Uses a subtle gradient background and thin borders to create a premium feel.
 */
export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style,
  variant = 'default' 
}) => {
  // To simulate glass effect:
  // We use a linear gradient from slightly lighter white to transparent white
  // on top of a dark background.
  
  if (variant === 'featured') {
     return (
        <LinearGradient
            colors={['rgba(30, 41, 59, 0.9)', 'rgba(30, 41, 59, 0.6)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.featured, style]}
        >
            {children}
            <View style={styles.borderOverlay} />
        </LinearGradient>
     );
  }

  return (
    <View style={[styles.card, styles.default, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.card,
  },
  default: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featured: {
    // Featured cards will have the gradient component wrapper
    // Border is handled by the overlay to support gradient borders if needed
    borderWidth: 0,
    ...Shadow.glow,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    pointerEvents: 'none',
  }
});
