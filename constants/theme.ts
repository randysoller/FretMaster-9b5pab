// Concert Stage Aesthetic - Warm blacks with amber/gold lighting
export const colors = {
  // Stage blacks - warm undertones
  background: '#0A0A0A', // Deep stage black
  surface: '#1A1612', // Warm dark brown-black
  surfaceElevated: '#2A2520', // Elevated surfaces
  card: '#211E1A', // Warmer card background
  
  // Amber/Gold concert lighting accents
  primary: '#D4AF37', // Rich gold
  secondary: '#B8860B', // Dimmed gold
  accent: '#FFB000', // Bright amber spotlight
  
  // Text hierarchy
  text: '#FFFFFF',
  textSecondary: '#E5D5B7', // Warm light text
  textMuted: '#8B7355', // Muted brown-gold
  textDisabled: '#5C4E3A', // Very dim brown
  
  // Fretboard colors with gold theme
  fretboard: '#0A0A0A',
  string: '#4A423A', // Warm string color
  fret: '#4A423A',
  dot: '#D4AF37', // Rich gold dots
  fingerPosition: '#D4AF37',
  
  // Root note highlighting
  rootNote: '#FFD700', // Pure gold for root notes
  
  // Semantic colors
  success: '#6BCF7F',
  error: '#FF6B6B',
  warning: '#FFB000',
  info: '#D4AF37',
  
  // Additional UI colors
  border: '#3A3229', // Warm border
  borderLight: '#4A423A',
  overlay: 'rgba(10, 10, 10, 0.85)',
  
  // Stage lighting effects
  spotlightGlow: 'rgba(212, 175, 55, 0.3)', // Gold glow
  dimLight: 'rgba(184, 134, 11, 0.15)', // Subtle amber
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography - Sora + DM Sans for modern musical feel
// Note: To use custom fonts, install:
// npx expo install @expo-google-fonts/sora @expo-google-fonts/dm-sans
// Then load fonts in app/_layout.tsx with useFonts
export const typography = {
  // Font families (placeholder - requires font installation)
  fontFamily: {
    heading: 'Sora', // For chord names, titles
    body: 'DM Sans', // For body text, labels
    mono: 'Courier New', // For chord diagrams, fret numbers
  },
  
  // Text styles
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
