import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { type SavedCourse, useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useQuizStore } from '../../stores/quizStore';
import {
  UIButton,
  UICard,
  UICourseItem,
  UIIcon,
  UIPressable,
  UIQuickActionItem,
  UISectionHeader,
  UIStatGradientCard,
  UIText,
} from '../../ui';
import { theme } from '../../theme';

export default function HomeDashboardScreen() {
  const router = useRouter();
  const streakDays = useAppStore((s) => s.streakDays);
  const practiceMinutesToday = useAppStore((s) => s.practiceMinutesToday);
  const savedCourses = useAppStore((s) => s.savedCourses);
  const displayName = useAuthStore((s) => s.user?.displayName);
  const loadQuiz = useQuizStore((s) => s.loadQuiz);

  const recentCourses = savedCourses.slice(0, 3);

  const greeting = displayName
    ? `Welcome back, ${displayName.split(' ')[0]}!`
    : 'Welcome back!';

  const handlePlayCourse = useCallback(
    (course: SavedCourse) => {
      loadQuiz(course.questions);
      router.push({ pathname: '/quiz', params: { courseId: course.id } });
    },
    [loadQuiz, router],
  );

  const handleRandomQuiz = useCallback(() => {
    if (savedCourses.length === 0) {
      router.push('/new-course');
      return;
    }
    const random = savedCourses[Math.floor(Math.random() * savedCourses.length)];
    handlePlayCourse(random);
  }, [savedCourses, handlePlayCourse, router]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerColumn}>
          <View style={styles.titleRow}>
            <UIText variant="title" style={styles.greeting} numberOfLines={2}>
              {greeting}
            </UIText>
            <View style={styles.headerIcons}>
              <UIPressable
                variant="plain"
                accessibilityRole="button"
                accessibilityLabel="Settings"
                hitSlop={10}
                onPress={() => router.push('/profile')}
                android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                style={({ pressed }) => [
                  styles.iconHit,
                  pressed && styles.iconPressed,
                ]}
              >
                <UIIcon name="settings-outline" />
              </UIPressable>
            </View>
          </View>
          <UIText variant="bodySecondary" style={styles.subtitle}>
            {"Let's continue learning"}
          </UIText>
        </View>

        <View style={styles.section}>
          <UIStatGradientCard
            streakDays={streakDays}
            practiceMinutesToday={practiceMinutesToday}
          />
        </View>

        <View style={styles.section}>
          <UISectionHeader title="Quick actions" />
          <View style={styles.quickRow}>
            <UIQuickActionItem
              label="New course"
              circleColor={theme.colors.quickTintPurple}
              icon={
                <UIIcon
                  name="sparkles"
                  size={26}
                  color={theme.colors.iconPurple}
                />
              }
              onPress={() => router.push('/new-course')}
            />
            <UIQuickActionItem
              label="Random quiz"
              circleColor={theme.colors.quickTintGreen}
              icon={
                <UIIcon
                  name="shuffle"
                  size={26}
                  color={theme.colors.iconGreen}
                />
              }
              onPress={handleRandomQuiz}
            />
            <UIQuickActionItem
              label="My library"
              circleColor={theme.colors.quickTintOrange}
              icon={
                <UIIcon
                  name="library"
                  size={26}
                  color={theme.colors.iconOrange}
                />
              }
              onPress={() => router.push('/courses')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <UISectionHeader
            title="Continue learning"
            rightAction={
              recentCourses.length > 0
                ? { label: 'See all', onPress: () => router.push('/courses') }
                : undefined
            }
          />
          {recentCourses.length === 0 ? (
            <UICard style={styles.emptyCard}>
              <UIIcon name="book-outline" size="md" color={theme.colors.textMuted} />
              <UIText variant="bodySecondary" style={styles.emptyText}>
                No courses yet. Create one to get started!
              </UIText>
              <UIButton
                title="Create course"
                size="sm"
                onPress={() => router.push('/new-course')}
              />
            </UICard>
          ) : (
            <View style={styles.recentList}>
              {recentCourses.map((course) => (
                <UICourseItem
                  key={course.id}
                  course={course}
                  onPlay={() => handlePlayCourse(course)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerColumn: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  greeting: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  headerIcons: {
    flexShrink: 0,
  },
  iconHit: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPressed: {
    opacity: 0.65,
  },
  root: {
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 24,
  },
  section: {
    gap: 14,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
  },
  emptyText: {
    textAlign: 'center',
  },
  recentList: {
    gap: 10,
  },
});
