import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function CustomButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: CustomButtonProps) {
  const buttonStyles = getButtonStyles(variant, size);
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        buttonStyles.container,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.background : colors.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, buttonStyles.text, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const getButtonStyles = (variant: string, size: string) => {
  const sizeStyles = {
    sm: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: fontSize.sm,
    },
    md: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      fontSize: fontSize.md,
    },
    lg: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      fontSize: fontSize.lg,
    },
  }[size] || {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
  };

  const variantStyles = {
    primary: {
      container: {
        backgroundColor: colors.primary,
        paddingVertical: sizeStyles.paddingVertical,
        paddingHorizontal: sizeStyles.paddingHorizontal,
      } as ViewStyle,
      text: {
        color: colors.background,
        fontSize: sizeStyles.fontSize,
      } as TextStyle,
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
        paddingVertical: sizeStyles.paddingVertical,
        paddingHorizontal: sizeStyles.paddingHorizontal,
      } as ViewStyle,
      text: {
        color: colors.primary,
        fontSize: sizeStyles.fontSize,
      } as TextStyle,
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        paddingVertical: sizeStyles.paddingVertical,
        paddingHorizontal: sizeStyles.paddingHorizontal,
      } as ViewStyle,
      text: {
        color: colors.primary,
        fontSize: sizeStyles.fontSize,
      } as TextStyle,
    },
    danger: {
      container: {
        backgroundColor: colors.danger,
        paddingVertical: sizeStyles.paddingVertical,
        paddingHorizontal: sizeStyles.paddingHorizontal,
      } as ViewStyle,
      text: {
        color: colors.textPrimary,
        fontSize: sizeStyles.fontSize,
      } as TextStyle,
    },
  };

  return variantStyles[variant as keyof typeof variantStyles] || variantStyles.primary;
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  text: {
    fontWeight: fontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default CustomButton;
