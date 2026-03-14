// FretMaster Color System - Exact specification from MOBILE_APP_DESIGN_SPEC.md
export const colors = {
  // Brand colors (HSL values converted to hex)
  primary: '#D4952A', // hsl(38, 75%, 52%) - Primary buttons, active states, chord dots
  brand: '#B57028', // hsl(30, 62%, 44%) - Gradient start, warm accents
  emphasis: '#E8C55C', // hsl(43, 83%, 65%) - Metronome accents, countdown numbers
  
  // Text colors
  text: '#F2EDE5', // hsl(36, 33%, 93%) - Primary headings, chord symbols
  textSubtle: '#BFB6AA', // hsl(33, 14%, 72%) - Secondary text, descriptions
  textMuted: '#807A73', // hsl(30, 7%, 47%) - Tertiary text, labels, disabled
  
  // Background colors
  background: '#0D0B08', // hsl(30, 25%, 4%) - Main app background
  bgElevated: '#181310', // hsl(28, 20%, 8%) - Cards, panels, modals
  bgOverlay: '#211D18', // hsl(28, 17%, 11%) - Hover states, pressed states
  bgSurface: '#2C2723', // hsl(28, 14%, 15%) - Input backgrounds, inactive buttons
  
  // Border colors
  border: '#3D3731', // hsl(28, 12%, 21%) - Standard borders
  borderSubtle: '#2E2A25', // hsl(28, 10%, 16%) - Subtle dividers
  
  // Semantic colors
  success: '#22C55E', // hsl(142, 71%, 45%) - Correct feedback, active states
  warning: '#FACC15', // hsl(43, 96%, 56%) - Warning badges
  error: '#EF4444', // hsl(0, 84%, 60%) - Wrong feedback, delete actions
  info: '#3B82F6', // hsl(217, 91%, 60%) - Info tooltips
  
  // Accent colors for specific features
  rootNoteBlue: '#4DB8E8', // hsl(200, 80%, 62%) - Root note diamonds
  amber: '#F59E0B', // Key filter active state
  emerald: '#10B981', // Category filter active, chord card accent
  violet: '#8B5CF6', // Type filter active, progression card accent
  cyan: '#06B6D4', // Scale preview audio icon
  rose: '#F43F5E', // My Progressions section accent
  
  // Fretboard specific
  fretboard: '#0D0B08',
  string: '#BFB6AA', // Text Subtle for strings
  fret: '#FFFFFF', // White fret lines
  fingerDot: '#D4952A', // Primary color for finger positions
  rootNote: '#4DB8E8', // Root Note Blue for diamond shapes
  fretInlay: 'rgba(140, 125, 107, 0.5)', // hsl(30, 15%, 50%) at 50% opacity
  
  // Additional UI
  overlay: 'rgba(13, 11, 8, 0.7)',
  
  // Legacy aliases for compatibility
  surface: '#181310',
  surfaceElevated: '#211D18',
  card: '#181310',
  textSecondary: '#BFB6AA',
  textDisabled: '#807A73',
  borderLight: '#2E2A25',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography - Sora + DM Sans exact specifications
// Note: Install fonts with: npx expo install expo-font @expo-google-fonts/sora @expo-google-fonts/dm-sans
// Google Fonts URLs:
// - Sora: https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800
// - DM Sans: https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700
export const typography = {
  fontFamily: {
    heading: 'Sora', // Display / Headings
    body: 'DM Sans', // Body / UI text
  },
  
  // Specific text styles from spec
  appTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.45, // -0.025em
  },
  pageTitle: {
    fontSize: 30, // 48px on tablet
    fontWeight: '800' as const,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.7, // 0.05em
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontSize: 24, // 30px on tablet
    fontWeight: '700' as const,
  },
  chordSymbol: {
    fontSize: 30, // 48-60px on desktop
    fontWeight: '800' as const,
  },
  chordName: {
    fontSize: 12, // 16px on desktop
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  buttonPrimary: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.9, // 0.05em
    textTransform: 'uppercase' as const,
  },
  buttonSecondary: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.1, // 0.1em
    textTransform: 'uppercase' as const,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  badge: {
    fontSize: 20, // 24px on desktop
    fontWeight: '800' as const,
    letterSpacing: 1, // 0.05em
    textTransform: 'uppercase' as const,
  },
  filterChip: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  filterTag: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  chordDiagramFinger: {
    fontSize: 14, // 18px md, 24px lg
    fontWeight: '700' as const,
  },
  fretLabel: {
    fontSize: 9, // 11px md, 14px lg
    fontWeight: '600' as const,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
