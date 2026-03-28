import React from 'react';
import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  StyleSheet,
  type View,
  type ViewStyle,
} from 'react-native';

export type UIPressableVariant = 'plain' | 'opacity' | 'surface' | 'surfaceMuted';

export type UIPressableProps = Omit<PressableProps, 'style'> & {
  variant?: UIPressableVariant;
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};

const variantStyles: Record<UIPressableVariant, ViewStyle> = {
  plain: {},
  opacity: {},
  surface: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  surfaceMuted: {
    backgroundColor: '#f6f7fb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
};

function pressedOverlay(
  variant: UIPressableVariant,
  pressed: boolean
): ViewStyle {
  if (!pressed) return {};
  if (variant === 'surface' || variant === 'surfaceMuted') {
    return { opacity: 0.92 };
  }
  if (variant === 'opacity' || variant === 'plain') {
    return { opacity: 0.72 };
  }
  return {};
}

export const UIPressable = React.forwardRef<View, UIPressableProps>(
  function UIPressable(
    {
      variant = 'plain',
      style,
      android_ripple: androidRippleProp,
      ...rest
    },
    ref
  ) {
    const androidRipple =
      androidRippleProp ??
      (variant === 'surface' || variant === 'surfaceMuted'
        ? { color: 'rgba(0,0,0,0.08)' }
        : undefined);

    return (
      <Pressable
        ref={ref}
        android_ripple={androidRipple}
        style={(state) => [
          variantStyles[variant],
          pressedOverlay(variant, state.pressed),
          typeof style === 'function' ? style(state) : style,
        ]}
        {...rest}
      />
    );
  }
);

UIPressable.displayName = 'UIPressable';
