import React from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { UIPressable } from './UIPressable';
import { UIText } from './UIText';

export type UICoursePreviewCardProps = {
  title: string;
  description: string;
  /** Local require(...) or { uri } */
  imageSource: ImageSourcePropType;
  onPress?: () => void;
};

export function UICoursePreviewCard({
  title,
  description,
  imageSource,
  onPress,
}: UICoursePreviewCardProps) {
  return (
    <UIPressable
      variant="plain"
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <View style={styles.card}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        <View style={styles.body}>
          <UIText variant="subtitle" style={styles.title}>
            {title}
          </UIText>
          <UIText variant="bodySecondary" style={styles.desc}>
            {description}
          </UIText>
        </View>
      </View>
    </UIPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 16,
  },
  pressed: {
    opacity: 0.94,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.pageBackground,
  },
  body: {
    padding: 16,
    gap: 8,
  },
  title: {
    color: theme.colors.textPrimary,
  },
  desc: {
    color: theme.colors.textSecondary,
  },
});
