export const colors = {
  // Base colors
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#252525',
  card: '#1E1E1E',
  
  // Brand colors
  primary: '#FF8C00', // Dark Orange
  secondary: '#8A2BE2', // Blue Violet (for chord progressions)
  accent: '#00C853', // Green (for chords)
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#666666',
  textDisabled: '#444444',
  
  // Fretboard colors
  fretboard: '#1A1A1A',
  string: '#666666',
  fret: '#333333',
  dot: '#FF8C00',
  fingerPosition: '#FF8C00',
  
  // Semantic colors
  success: '#00C853',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#0A84FF',
  
  // Additional UI colors
  border: '#2A2A2A',
  overlay: 'rgba(0, 0, 0, 0.8)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
