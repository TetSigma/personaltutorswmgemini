import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type SavedCourse, useAppStore } from '../../stores/appStore';
import { useQuizStore } from '../../stores/quizStore';
import { theme } from '../../theme';
import { UIButton, UICourseItem, UIIcon, UIText } from '../../ui';

export default function CoursesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const savedCourses = useAppStore((s) => s.savedCourses);
  const deleteCourse = useAppStore((s) => s.deleteCourse);
  const loadQuiz = useQuizStore((s) => s.loadQuiz);

  const handlePlay = useCallback(
    (course: SavedCourse) => {
      loadQuiz(course.questions);
      router.push({ pathname: '/quiz', params: { courseId: course.id } });
    },
    [loadQuiz, router],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteCourse(id);
    },
    [deleteCourse],
  );

  const handleNewCourse = useCallback(() => {
    router.push('/new-course');
  }, [router]);

  if (savedCourses.length === 0) {
    return (
      <View style={styles.root}>
        <View style={styles.empty}>
          <UIIcon name="book-outline" size="lg" color={theme.colors.textMuted} />
          <UIText variant="subtitle" style={styles.emptyTitle}>
            No courses yet
          </UIText>
          <UIText variant="bodySecondary" style={styles.emptySub}>
            Generate your first quiz from photos and it will appear here.
          </UIText>
          <View style={styles.emptyBtn}>
            <UIButton title="Create course" onPress={handleNewCourse} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={savedCourses}
        keyExtractor={(c) => c.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Math.max(20, insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <UICourseItem
              course={item}
              onPlay={() => handlePlay(item)}
              onDelete={() => handleDelete(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <UIText variant="title">Your courses</UIText>
            <UIText variant="bodySecondary">
              {savedCourses.length} {savedCourses.length === 1 ? 'course' : 'courses'}
            </UIText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
    gap: 2,
  },
  itemWrap: {
    marginBottom: 12,
  },
  empty: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    marginTop: 8,
    color: theme.colors.textPrimary,
  },
  emptySub: {
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 20,
    width: '100%',
  },
});
