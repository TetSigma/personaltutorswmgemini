import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import React from 'react';
import { theme } from '../theme';

export type UIIconSize = 'sm' | 'md' | 'lg';

export type UIIconProps = Omit<
  ComponentProps<typeof Ionicons>,
  'size' | 'color'
> & {
  size?: UIIconSize | number;
  color?: string;
};

const sizeMap: Record<UIIconSize, number> = {
  sm: 20,
  md: 24,
  lg: 28,
};

function resolveSize(size: UIIconProps['size']): number {
  if (size === undefined) return sizeMap.md;
  if (typeof size === 'number') return size;
  return sizeMap[size];
}

export function UIIcon({
  name,
  size = 'md',
  color = theme.colors.textPrimary,
  ...rest
}: UIIconProps) {
  return (
    <Ionicons name={name} size={resolveSize(size)} color={color} {...rest} />
  );
}

UIIcon.displayName = 'UIIcon';
