import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { UIPressable } from './UIPressable';
import { UIText } from './UIText';

export type UISectionHeaderProps = {
  title: string;
  rightAction?: { label: string; onPress: () => void };
};

export function UISectionHeader({ title, rightAction }: UISectionHeaderProps) {
  return (
    <View style={styles.row}>
      <UIText variant="subtitle" style={styles.title}>
        {title}
      </UIText>
      {rightAction ? (
        <UIPressable
          variant="plain"
          accessibilityRole="button"
          hitSlop={8}
          onPress={rightAction.onPress}
          android_ripple={{ color: 'rgba(76,174,79,0.12)' }}
          style={({ pressed }) => [pressed && styles.linkPressed]}
        >
          <UIText variant="body" style={styles.link}>
            {rightAction.label}
          </UIText>
        </UIPressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: theme.colors.textPrimary,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  linkPressed: {
    opacity: 0.75,
  },
});
