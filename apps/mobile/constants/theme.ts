/**
 * OLED Sharp colour palette — dark mode only.
 * Matches Tailwind tokens in tailwind.config.js.
 */

export const Colors = {
  bg: {
    primary: '#080808',
    surface: '#141414',
    elevated: '#1C1C1C',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#7A7A7A',
    muted: '#404040',
  },
  border: {
    subtle: '#1E1E1E',
    active: '#B4FF32',
  },
  accent: '#B4FF32',
  success: '#B4FF32',
  jackpot: '#FFD700',
  captain: '#FFD700',
  deadline: '#FF6B35',
  streak: '#A78BFA',
  miss: '#303030',
} as const;

/**
 * React Navigation dark theme override using OLED Sharp palette.
 */
export const NavigationTheme = {
  dark: true,
  colors: {
    primary: Colors.accent,
    background: Colors.bg.primary,
    card: Colors.bg.surface,
    text: Colors.text.primary,
    border: Colors.border.subtle,
    notification: Colors.deadline,
  },
  fonts: {
    regular: { fontFamily: 'Inter_400Regular', fontWeight: '400' as const },
    medium: { fontFamily: 'Inter_500Medium', fontWeight: '500' as const },
    bold: { fontFamily: 'Inter_700Bold', fontWeight: '700' as const },
    heavy: { fontFamily: 'Inter_700Bold', fontWeight: '700' as const },
  },
} as const;
