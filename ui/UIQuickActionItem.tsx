import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { theme } from '../theme';
import { UIPressable } from './UIPressable';
import { UIText } from './UIText';

export type UIQuickActionItemProps = {
  label: string;
  icon: React.ReactNode;
  /** Background tint for the circle */
  circleColor: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export function UIQuickActionItem({
  label,
  icon,
  circleColor,
  onPress,
  style,
}: UIQuickActionItemProps) {
  return (
    <UIPressable
      variant="plain"
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [
        styles.wrap,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={[styles.circle, { backgroundColor: circleColor }]}>{icon}</View>
      <UIText variant="caption" style={styles.label} numberOfLines={2}>
        {label}
      </UIText>
    </UIPressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    color: theme.colors.textPrimary,
    fontWeight: '500',
    textTransform: 'none',
    letterSpacing: 0,
  },
  pressed: {
    opacity: 0.82,
  },
});
