import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LucideIcon } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = ({ label, error, icon: Icon, style, ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();

  const themedStyles = styles(theme);

  return (
    <View style={[themedStyles.container, style]}>
      {label && <Text style={themedStyles.label}>{label}</Text>}
      <View style={[
        themedStyles.inputContainer,
        isFocused && themedStyles.inputFocused,
        error && themedStyles.inputError
      ]}>
        {Icon && (
          <Icon 
            size={20} 
            color={isFocused ? theme.colors.badmintonPrimary : theme.colors.textSecondary} 
            style={themedStyles.icon} 
          />
        )}
        <TextInput
          style={themedStyles.input}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={theme.colors.badmintonPrimary}
          {...props}
        />
      </View>
      {error && <Text style={themedStyles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    marginLeft: 4,
    opacity: 0.8,
  },
  inputContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    height: 58,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  inputFocused: {
    borderColor: theme.colors.badmintonPrimary,
    shadowOpacity: 0.1,
  },
  inputError: {
    borderColor: theme.colors.alert,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  errorText: {
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.alert,
    marginTop: theme.spacing.xs,
    marginLeft: 8,
  }
});

