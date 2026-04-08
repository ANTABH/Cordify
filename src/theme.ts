export const lightColors = {
  badmintonPrimary: '#2ECC71',
  badmintonAccent: '#F1C40F',
  tennisPrimary: '#2980B9',
  tennisAccent: '#3498DB',
  success: '#27AE60',
  alert: '#E74C3C',
  warning: '#F39C12',
  surface: '#FFFFFF',
  background: '#F8F9FA',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  border: '#E0E0E0',
};

export const darkColors = {
  badmintonPrimary: '#27AE60',
  badmintonAccent: '#F1C40F',
  tennisPrimary: '#3498DB',
  tennisAccent: '#2980B9',
  success: '#2ECC71',
  alert: '#E74C3C',
  warning: '#F39C12',
  surface: '#1E1E1E',
  background: '#121212',
  textPrimary: '#F8F9FA',
  textSecondary: '#AAB7B8',
  border: '#2C3E50',
};

const sharedTheme = {
  typography: {
    fonts: {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semiBold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
    sizes: {
      h1: 28,
      h2: 22,
      h3: 18,
      body: 16,
      subtext: 14,
      badge: 12,
    },
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  borderRadius: {
    badge: 12,
    input: 16,
    button: 24,
    container: 48,
  },
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 3,
    },
    elevated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.10,
      shadowRadius: 32,
      elevation: 8,
    },
  },
};


export const lightTheme = {
  ...sharedTheme,
  colors: lightColors,
  isDark: false,
};

export const darkTheme = {
  ...sharedTheme,
  colors: darkColors,
  isDark: true,
};

// Default export for backward compatibility during transition
export const theme = lightTheme;

export type Theme = typeof lightTheme;

