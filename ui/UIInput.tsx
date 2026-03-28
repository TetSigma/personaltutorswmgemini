import React, { useCallback, useState } from 'react';
import {
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { theme } from '../theme';
import { UIText } from './UIText';

export type UIInputSize = 'sm' | 'md' | 'lg';

export type UIInputProps = Omit<TextInputProps, 'style'> & {
  size?: UIInputSize;
  /** Shows error border; pair with `errorMessage` for hint text */
  error?: boolean;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  label?: string;
  errorMessage?: string;
};

const baseInput: TextStyle = {
  borderWidth: 1,
  borderRadius: 10,
  borderColor: '#ddd',
  backgroundColor: '#fafafa',
  color: '#111',
};

const sizeStyles: Record<UIInputSize, TextStyle> = {
  sm: {
    minHeight: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  md: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  lg: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 17,
  },
};

export const UIInput = React.forwardRef<TextInput, UIInputProps>(function UIInput(
  {
    size = 'md',
    error,
    style,
    containerStyle,
    label,
    errorMessage,
    editable,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback<
    NonNullable<TextInputProps['onFocus']>
  >(
    (e) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>(
    (e) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const borderColor = error
    ? '#b00020'
    : focused
      ? theme.colors.primary
      : '#ddd';

  const input = (
    <TextInput
      ref={ref}
      editable={editable}
      placeholderTextColor="#888"
      style={[baseInput, sizeStyles[size], { borderColor }, style]}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    />
  );

  const needsWrapper = !!(label || errorMessage || containerStyle);

  if (!needsWrapper) {
    return input;
  }

  return (
    <View style={[{ gap: label || errorMessage ? 6 : 0 }, containerStyle]}>
      {label ? <UIText variant="label">{label}</UIText> : null}
      {input}
      {errorMessage ? (
        <UIText
          variant="caption"
          style={{ color: error ? '#b00020' : '#666' }}
        >
          {errorMessage}
        </UIText>
      ) : null}
    </View>
  );
});

UIInput.displayName = 'UIInput';
