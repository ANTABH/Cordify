import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, style, ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError
      ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
    fontFamily: theme.typography.fonts.medium,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 56,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  inputFocused: {
    borderColor: theme.colors.badmintonPrimary,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.alert,
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.textPrimary,
  },
  errorText: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.subtext,
    color: theme.colors.alert,
    marginTop: theme.spacing.xs,
    marginLeft: 4,
  }
});
