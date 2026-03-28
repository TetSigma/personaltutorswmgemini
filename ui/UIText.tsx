import React from 'react';
import {
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';

export type UITextVariant =
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodySecondary'
  | 'caption'
  | 'label';

export type UITextProps = TextProps & {
  variant?: UITextVariant;
  style?: StyleProp<TextStyle>;
};

const variantStyles: Record<UITextVariant, TextStyle> = {
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#111',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.25,
    color: '#111',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    color: '#111',
  },
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    color: '#555',
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: '#666',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.4,
    color: '#666',
    textTransform: 'uppercase',
  },
};

export const UIText = React.forwardRef<Text, UITextProps>(function UIText(
  { variant = 'body', style, ...rest },
  ref
) {
  return <Text ref={ref} style={[variantStyles[variant], style]} {...rest} />;
});

UIText.displayName = 'UIText';
