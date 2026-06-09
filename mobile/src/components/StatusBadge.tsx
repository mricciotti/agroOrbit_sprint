import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { StatusSeveridade, TipoFonte } from '../data/mocks';

interface StatusBadgeProps {
  status: StatusSeveridade;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  style?: ViewStyle;
}

const statusConfig = {
  normal: {
    color: colors.statusNormal,
    label: 'Normal',
    icon: 'checkmark-circle' as const,
  },
  atencao: {
    color: colors.statusAtencao,
    label: 'Atenção',
    icon: 'warning' as const,
  },
  critico: {
    color: colors.statusCritico,
    label: 'Crítico',
    icon: 'alert-circle' as const,
  },
};

export function StatusBadge({ status, size = 'md', showIcon = true, style }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.badge, { backgroundColor: `${config.color}20` }, sizeStyles.container, style]}>
      {showIcon && (
        <Ionicons name={config.icon} size={sizeStyles.iconSize} color={config.color} />
      )}
      <Text style={[styles.label, { color: config.color }, sizeStyles.text]}>
        {config.label}
      </Text>
    </View>
  );
}

interface FonteBadgeProps {
  fonte: TipoFonte;
  style?: ViewStyle;
}

const fonteConfig = {
  Satélite: {
    color: colors.fonteSatelite,
    icon: 'planet' as const,
  },
  Drone: {
    color: colors.fonteDrone,
    icon: 'airplane' as const,
  },
  IoT: {
    color: colors.fonteIoT,
    icon: 'hardware-chip' as const,
  },
};

export function FonteBadge({ fonte, style }: FonteBadgeProps) {
  const config = fonteConfig[fonte];

  return (
    <View style={[styles.fonteBadge, { backgroundColor: `${config.color}20` }, style]}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.fonteLabel, { color: config.color }]}>{fonte}</Text>
    </View>
  );
}

interface AlertStatusBadgeProps {
  status: 'aberto' | 'em_andamento' | 'resolvido';
  style?: ViewStyle;
}

const alertStatusConfig = {
  aberto: {
    color: colors.danger,
    label: 'Aberto',
  },
  em_andamento: {
    color: colors.warning,
    label: 'Em Andamento',
  },
  resolvido: {
    color: colors.success,
    label: 'Resolvido',
  },
};

export function AlertStatusBadge({ status, style }: AlertStatusBadgeProps) {
  const config = alertStatusConfig[status];

  return (
    <View style={[styles.alertBadge, { backgroundColor: `${config.color}20` }, style]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.alertLabel, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const getSizeStyles = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        container: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
        iconSize: 12,
        text: { fontSize: fontSize.xs },
      };
    case 'lg':
      return {
        container: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
        iconSize: 18,
        text: { fontSize: fontSize.md },
      };
    default:
      return {
        container: { paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },
        iconSize: 14,
        text: { fontSize: fontSize.sm },
      };
  }
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    gap: 4,
  },
  label: {
    fontWeight: fontWeight.medium,
  },
  fonteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  fonteLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  alertLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
