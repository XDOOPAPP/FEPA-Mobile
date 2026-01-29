// Modern UI Design System - PREMIUM LIGHT THEME
// Based on "FEPA" Brand: Clean White/Slate + Vibrant Gradients + Glassmorphism

// Define raw constants first to ensure no circular dependency issues
const PALETTE = {
  primary: '#0EA5E9', // Sky 500 (Bright, Modern Blue)
  primaryDark: '#0284C7', // Sky 600
  primaryLight: '#38BDF8', // Sky 400
  primaryHighlight: 'rgba(14, 165, 233, 0.1)',
  
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  
  success: '#10B981',
  danger: '#F43F5E',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  border: '#E2E8F0',
  divider: '#F1F5F9',
  
  overlay: 'rgba(15, 23, 42, 0.4)',
  backdrop: 'rgba(255, 255, 255, 0.8)',
};

export const Colors = {
  // Application Backgrounds
  background: PALETTE.background,
  backgroundSecondary: PALETTE.backgroundSecondary,
  
  // Content Backgrounds (Cards, Modals)
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  
  // Text Colors
  textPrimary: PALETTE.textPrimary,
  textSecondary: PALETTE.textSecondary,
  textMuted: PALETTE.textMuted,
  textInverse: PALETTE.textInverse,
  
  // Brand Colors
  primary: PALETTE.primary,
  primaryDark: PALETTE.primaryDark,
  primaryLight: PALETTE.primaryLight,
  primaryHighlight: PALETTE.primaryHighlight,
  primarySoft: PALETTE.primaryHighlight, // Alias
  
  // Gradients
  primaryGradient: ['#0EA5E9', '#2563EB'] as [string, string],
  successGradient: ['#10B981', '#059669'] as [string, string],
  dangerGradient: ['#F43F5E', '#E11D48'] as [string, string],
  goldGradient: ['#F59E0B', '#D97706'] as [string, string],
  
  // Accents
  accent: '#F59E0B',
  accentHover: '#D97706',
  accentLight: '#FDE68A',
  
  // Functional
  success: PALETTE.success,
  danger: PALETTE.danger,
  dangerLight: '#FECACA',
  warning: PALETTE.warning,
  info: PALETTE.info,
  
  // Borders
  border: PALETTE.border,
  divider: PALETTE.divider,
  
  // Overlays
  overlay: PALETTE.overlay,
  backdrop: PALETTE.backdrop,
};

export const Spacing = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  headerHeight: 60,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
  round: 9999,
  xxl: 40,
};

export const Typography = {
  fontFamily: {
    regular: 'System', 
    medium: 'System',
    bold: 'System',
  },
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: PALETTE.textPrimary,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: PALETTE.textPrimary,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: PALETTE.textPrimary,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: PALETTE.textPrimary,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    color: PALETTE.textSecondary,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    color: PALETTE.textPrimary,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: PALETTE.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 13,
    color: PALETTE.textMuted,
    lineHeight: 18,
  },
  captionBold: {
    fontSize: 13,
    color: PALETTE.textMuted,
    fontWeight: '700' as const,
  },
  smallBold: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '700' as const,
  },
  small: {
    fontSize: 11,
    color: PALETTE.textMuted,
    lineHeight: 14,
  },
};

export const Shadow = {
  soft: {
    shadowColor: PALETTE.textSecondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    shadowColor: PALETTE.textSecondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  float: {
    shadowColor: PALETTE.textPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  sm: {
      shadowColor: PALETTE.textSecondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
  },
  md: {
      shadowColor: PALETTE.textSecondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
  },
  lg: {
      shadowColor: PALETTE.textSecondary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
  },
  light: {
    shadowColor: PALETTE.textSecondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const SCREEN_PADDING = Spacing.lg;
