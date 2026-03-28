import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { UICard } from './UICard';
import { UIIcon } from './UIIcon';
import { UIPressable } from './UIPressable';
import { UIText } from './UIText';
import type { SavedCourse } from '../stores/appStore';

export type UICourseItemProps = {
  course: SavedCourse;
  onPlay: () => void;
  onDelete?: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function UICourseItem({ course, onPlay, onDelete }: UICourseItemProps) {
  const hasScore = course.bestScore !== null;

  return (
    <UICard style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <UIText variant="body" style={styles.cardTitle}>
            {course.questionCount} questions
          </UIText>
          <UIText variant="caption" style={styles.cardDate}>
            {formatDate(course.createdAt)}
          </UIText>
        </View>

        {hasScore && (
          <View style={styles.scoreBadge}>
            <UIText variant="caption" style={styles.scoreText}>
              Best: {course.bestScore}%
            </UIText>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <UIPressable variant="plain" onPress={onPlay} style={styles.playBtn}>
          <UIIcon name="play-circle" size="sm" color={theme.colors.primary} />
          <UIText variant="body" style={styles.playText}>
            {hasScore ? 'Retry' : 'Start'}
          </UIText>
        </UIPressable>

        {onDelete && (
          <UIPressable variant="plain" onPress={onDelete} style={styles.deleteBtn}>
            <UIIcon name="trash-outline" size="sm" color={theme.colors.textMuted} />
          </UIPressable>
        )}
      </View>
    </UICard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardInfo: {
    gap: 2,
    flex: 1,
  },
  cardTitle: {
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  cardDate: {
    color: theme.colors.textMuted,
  },
  scoreBadge: {
    backgroundColor: `${theme.colors.primary}14`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
});
