import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { UIIcon } from './UIIcon';
import { UIText } from './UIText';

export type UIStatGradientCardProps = {
  streakDays: number;
  practiceMinutesToday: number;
};

export function UIStatGradientCard({
  streakDays,
  practiceMinutesToday,
}: UIStatGradientCardProps) {
  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.gradient}
    >
      <View style={styles.half}>
        <View style={styles.statRow}>
          <UIIcon name="flame" size="lg" color={theme.colors.onPrimary} />
          <UIText variant="title" style={styles.bigNumber}>
            {streakDays}
          </UIText>
        </View>
        <UIText variant="caption" style={styles.caption}>
          Day streak!
        </UIText>
      </View>
      <View style={styles.divider} />
      <View style={styles.half}>
        <UIText variant="title" style={styles.bigNumber}>
          {practiceMinutesToday} min
        </UIText>
        <UIText variant="caption" style={styles.caption}>
          {"Today's practice"}
        </UIText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  half: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bigNumber: {
    color: theme.colors.onPrimary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  caption: {
    color: 'rgba(255,255,255,0.92)',
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: '500',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginHorizontal: 8,
  },
});
