import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Radius, Typography, Spacing } from '../../constants/theme';

interface ModernInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  icon,
  style,
  containerStyle,
  ...props
}) => {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.container, error ? styles.errorBorder : null, style]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          {...props}
        />
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    height: 50, // Standard touch target
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    height: '100%',
  },
  icon: {
    marginRight: 10,
  },
  errorBorder: {
    borderColor: Colors.danger,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 4,
    marginLeft: 4,
  }
});
