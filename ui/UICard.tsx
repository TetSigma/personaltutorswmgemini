import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { theme } from '../theme';

export type UICardProps = ViewProps & {
  children: React.ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

export function UICard({
  children,
  padding = 16,
  style,
  ...rest
}: UICardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
