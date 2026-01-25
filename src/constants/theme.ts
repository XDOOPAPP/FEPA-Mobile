// Modern UI Design System - PREMIUM LIGHT THEME
// Based on "FEPA" Brand: Clean White/Slate + Vibrant Gradients + Glassmorphism

export const Colors = {
  // Application Backgrounds
  background: '#F8FAFC', // Slate 50 (Very soft white/grey)
  backgroundSecondary: '#FFFFFF', // Pure White
  
  // Content Backgrounds (Cards, Modals)
  card: '#FFFFFF', // Clean White
  cardElevated: '#FFFFFF', // White with stronger shadow
  
  // Text Colors
  textPrimary: '#0F172A', // Slate 900 (High Contrast Dark)
  textSecondary: '#64748B', // Slate 500 (Soft Grey)
  textMuted: '#94A3B8', // Slate 400 (Lighter Grey)
  textInverse: '#FFFFFF', // Light text on dark backgrounds
  
  // Brand Colors (Vibrant & Modern)
  primary: '#0EA5E9', // Sky 500 (Bright, Modern Blue)
  primaryDark: '#0284C7', // Sky 600
  primaryLight: '#38BDF8', // Sky 400
  primaryHighlight: 'rgba(14, 165, 233, 0.1)', // Sky 500 with low opacity for backgrounds
  primarySoft: 'rgba(14, 165, 233, 0.1)', // Alias for compatibility
  
  // Gradients (Refined for Light Mode)
  primaryGradient: ['#0EA5E9', '#2563EB'] as [string, string], // Sky to Blue (Vibrant)
  successGradient: ['#10B981', '#059669'] as [string, string], // Emerald
  dangerGradient: ['#F43F5E', '#E11D48'] as [string, string], // Rose
  goldGradient: ['#F59E0B', '#D97706'] as [string, string], // Amber
  
  // Accents
  accent: '#F59E0B', // Amber 500
  accentHover: '#D97706',
  accentLight: '#FDE68A', // Amber 200
  
  // Functional Status
  success: '#10B981', 
  danger: '#F43F5E', // Rose 500 (Softer than pure red)
  dangerLight: '#FECACA', // Rose 200
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Borders & Dividers
  border: '#E2E8F0', // Slate 200 (Very light grey)
  divider: '#F1F5F9', // Slate 100
  
  // Overlays
  overlay: 'rgba(15, 23, 42, 0.4)', // Dark overlay for modals
  backdrop: 'rgba(255, 255, 255, 0.8)', // Blur backdrop
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
    color: Colors.textPrimary,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  body: {
    fontSize: 15, // Slightly smaller for better density
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    color: Colors.textPrimary, // Darker for emphasis
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  captionBold: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '700' as const,
  },
  smallBold: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700' as const,
  },
  small: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 14,
  },
};

export const Shadow = {
  soft: {
    shadowColor: '#64748B', // Slate colored shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, // Very subtle
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // Reduced glow intensity for light mode
    shadowRadius: 12,
    elevation: 6,
  },
  float: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  sm: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
  },
  md: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
  },
  lg: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
  },
  light: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const SCREEN_PADDING = Spacing.lg;

