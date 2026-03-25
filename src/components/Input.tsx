import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Animated } from 'react-native';
import { theme } from '../theme';
import { LucideIcon } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = ({ label, error, icon: Icon, style, ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError
      ]}>
        {Icon && (
          <Icon 
            size={20} 
            color={isFocused ? theme.colors.badmintonPrimary : theme.colors.textSecondary} 
            style={styles.icon} 
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={theme.colors.badmintonPrimary}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.input,
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
    height: 58,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  inputFocused: {
    borderColor: theme.colors.badmintonPrimary,
    backgroundColor: '#FFFFFF',
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
