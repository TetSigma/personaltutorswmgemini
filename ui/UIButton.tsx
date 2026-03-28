import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  type PressableStateCallbackType,
  type StyleProp,
  StyleSheet,
  type View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { UIPressable, type UIPressableProps } from './UIPressable';
import { UIText } from './UIText';

export type UIButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type UIButtonSize = 'sm' | 'md' | 'lg';

export type UIButtonProps = Omit<
  UIPressableProps,
  'children' | 'style' | 'android_ripple' | 'variant'
> & {
  title?: string;
  children?: React.ReactNode;
  variant?: UIButtonVariant;
  size?: UIButtonSize;
  loading?: boolean;
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

const shellStyles: Record<UIButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
  },
  secondary: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  danger: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
};

const shellStylesNoPrimaryBg: Record<UIButtonVariant, ViewStyle> = {
  ...shellStyles,
  primary: {
    ...shellStyles.primary,
    backgroundColor: 'transparent',
  },
};

const sizeStyles: Record<UIButtonSize, ViewStyle> = {
  sm: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
  md: { paddingVertical: 12, paddingHorizontal: 18, minHeight: 44 },
  lg: { paddingVertical: 14, paddingHorizontal: 22, minHeight: 48 },
};

const labelStyles: Record<UIButtonVariant, { color: string; fontSize: number }> =
  {
    primary: { color: theme.colors.onPrimary, fontSize: 16 },
    secondary: { color: '#111', fontSize: 16 },
    ghost: { color: theme.colors.primary, fontSize: 16 },
    danger: { color: '#fff', fontSize: 16 },
  };

const sizeLabelStyles: Record<UIButtonSize, { fontSize: number }> = {
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 17 },
};

function shellPressed(variant: UIButtonVariant, pressed: boolean): ViewStyle {
  if (!pressed) return {};
  return { opacity: 0.88 };
}

function rippleFor(variant: UIButtonVariant) {
  switch (variant) {
    case 'primary':
    case 'danger':
      return { color: 'rgba(255,255,255,0.28)' };
    case 'secondary':
      return { color: 'rgba(0,0,0,0.08)' };
    case 'ghost':
      return { color: 'rgba(76,174,79,0.18)' };
    default:
      return undefined;
  }
}

function spinnerColor(variant: UIButtonVariant): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return '#fff';
    case 'secondary':
      return '#111';
    case 'ghost':
      return theme.colors.primary;
    default:
      return '#111';
  }
}

export const UIButton = React.forwardRef<View, UIButtonProps>(function UIButton(
  {
    title,
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    style,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  const disabledProgress = useSharedValue(isDisabled ? 1 : 0);

  useEffect(() => {
    disabledProgress.value = withTiming(isDisabled ? 1 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [isDisabled, disabledProgress]);

  const primaryFillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      disabledProgress.value,
      [0, 1],
      [theme.colors.primary, theme.colors.primaryDisabled]
    ),
  }));

  const shellFadeStyle = useAnimatedStyle(() => {
    if (variant === 'primary') {
      return { opacity: 1 };
    }
    return {
      opacity: interpolate(disabledProgress.value, [0, 1], [1, 0.48]),
    };
  });

  const content =
    children !== undefined ? (
      children
    ) : title !== undefined ? (
      <UIText
        variant="body"
        style={[
          { fontWeight: '600', textAlign: 'center' },
          labelStyles[variant],
          sizeLabelStyles[size],
        ]}
      >
        {title}
      </UIText>
    ) : null;

  return (
    <Animated.View style={[shellFadeStyle, styles.animWrap]}>
      <UIPressable
        ref={ref}
        variant="plain"
        accessibilityRole="button"
        disabled={isDisabled}
        android_ripple={rippleFor(variant)}
        style={(state) => [
          variant === 'primary' ? shellStylesNoPrimaryBg[variant] : shellStyles[variant],
          sizeStyles[size],
          !isDisabled && shellPressed(variant, state.pressed),
          typeof style === 'function' ? style(state) : style,
        ]}
        {...rest}
      >
        {variant === 'primary' ? (
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, primaryFillStyle]}
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={spinnerColor(variant)} size="small" />
        ) : null}
        {content}
      </UIPressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  animWrap: {
    alignSelf: 'stretch',
  },
});

UIButton.displayName = 'UIButton';
