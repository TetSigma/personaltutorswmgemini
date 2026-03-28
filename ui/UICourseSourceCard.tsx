import type { ComponentProps } from 'react';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { UIIcon } from './UIIcon';
import { UIPressable } from './UIPressable';
import { UIText } from './UIText';

export type UICourseSourceCardProps = {
  title: string;
  description: string;
  icon: ComponentProps<typeof UIIcon>['name'];
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

const TIMING = {
  duration: 300,
  easing: Easing.out(Easing.cubic),
};

export function UICourseSourceCard({
  title,
  description,
  icon,
  selected,
  onPress,
  disabled,
}: UICourseSourceCardProps) {
  const selectedProgress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    selectedProgress.value = withTiming(selected ? 1 : 0, TIMING);
  }, [selected, selectedProgress]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    ),
    backgroundColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [theme.colors.white, theme.colors.surfaceSelected]
    ),
    borderWidth: interpolate(selectedProgress.value, [0, 1], [1, 2]),
    transform: [
      {
        scale: interpolate(selectedProgress.value, [0, 1], [1, 1.012]),
      },
    ],
  }));

  const iconWrapBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [theme.colors.pageBackground, theme.colors.white]
    ),
  }));

  const iconUnselectedOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(selectedProgress.value, [0, 1], [1, 0]),
  }));

  const iconSelectedOpacity = useAnimatedStyle(() => ({
    opacity: selectedProgress.value,
  }));

  const checkShellStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [theme.colors.borderStrong, theme.colors.primary]
    ),
    backgroundColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      ['rgba(255,255,255,0)', theme.colors.primary]
    ),
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: selectedProgress.value,
    transform: [
      {
        scale: interpolate(selectedProgress.value, [0, 1], [0.65, 1]),
      },
    ],
  }));

  return (
    <UIPressable
      variant="plain"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <View style={styles.row}>
          <Animated.View style={[styles.iconWrap, iconWrapBgStyle]}>
            <Animated.View
              pointerEvents="none"
              style={[styles.iconLayer, iconUnselectedOpacity]}
            >
              <UIIcon
                name={icon}
                size="md"
                color={theme.colors.textSecondary}
              />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[styles.iconLayer, iconSelectedOpacity]}
            >
              <UIIcon name={icon} size="md" color={theme.colors.primary} />
            </Animated.View>
          </Animated.View>
          <View style={styles.texts}>
            <UIText variant="body" style={styles.title}>
              {title}
            </UIText>
            <UIText variant="caption" style={styles.desc}>
              {description}
            </UIText>
          </View>
          <Animated.View style={[styles.check, checkShellStyle]}>
            <Animated.View style={checkmarkStyle}>
              <UIIcon name="checkmark" size="sm" color={theme.colors.onPrimary} />
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>
    </UIPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
  pressed: {
    opacity: 0.94,
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  desc: {
    color: theme.colors.textMuted,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '400',
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
