import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface WeatherCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  unit?: string;
  color?: string;
  style?: ViewStyle;
}

export function WeatherCard({ icon, title, value, unit, color = colors.primary, style }: WeatherCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.value}>
        {value}
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

interface MetricCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function MetricCard({ icon, title, value, subtitle, color = colors.primary, onPress, style }: MetricCardProps) {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.metricCard, style]} onPress={onPress} activeOpacity={0.7}>
        <MetricCardContent icon={icon} title={title} value={value} subtitle={subtitle} color={color} showArrow />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.metricCard, style]}>
      <MetricCardContent icon={icon} title={title} value={value} subtitle={subtitle} color={color} showArrow={false} />
    </View>
  );
}

function MetricCardContent({
  icon,
  title,
  value,
  subtitle,
  color,
  showArrow,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  showArrow: boolean;
}) {
  return (
    <>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconContainer, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {showArrow && (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </>
  );
}

interface SummaryCardProps {
  title: string;
  children: React.ReactNode;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function SummaryCard({ title, children, action, style }: SummaryCardProps) {
  return (
    <View style={[styles.summaryCard, style]}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>{title}</Text>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  unit: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Metric Card
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  metricSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});

export default { WeatherCard, MetricCard, SummaryCard };
