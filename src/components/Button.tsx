import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  sportTheme?: 'badminton' | 'tennis' | 'neutral';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  sportTheme = 'neutral', 
  loading = false,
  style,
  textStyle
}: ButtonProps) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (variant === 'outline') return 'transparent';
    if (variant === 'secondary') return theme.colors.background;
    if (sportTheme === 'badminton') return theme.colors.badmintonPrimary;
    if (sportTheme === 'tennis') return theme.colors.tennisPrimary;
    return theme.colors.textPrimary;
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      if (sportTheme === 'badminton') return theme.colors.badmintonPrimary;
      if (sportTheme === 'tennis') return theme.colors.tennisPrimary;
      return theme.colors.textPrimary;
    }
    if (variant === 'secondary') return theme.colors.textPrimary;
    return '#FFFFFF'; // Explicitly white for primary buttons
  };

  return (
    <TouchableOpacity 
      style={[
        styles(theme).button, 
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && { borderWidth: 2, borderColor: getTextColor() },
        style
      ]} 
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles(theme).text, { color: getTextColor() }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = (theme: any) => StyleSheet.create({
  button: {
    height: 56,
    borderRadius: theme.borderRadius.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
  },
  text: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.body,
  }
});

