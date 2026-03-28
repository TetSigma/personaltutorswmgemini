import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../stores/appStore';
import { useQuizStore } from '../stores/quizStore';
import { theme } from '../theme';
import { UIButton, UIIcon, UIText } from '../ui';

export default function QuizResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const questions = useQuizStore((s) => s.questions);
  const answers = useQuizStore((s) => s.answers);
  const reset = useQuizStore((s) => s.reset);
  const updateCourseScore = useAppStore((s) => s.updateCourseScore);

  const { correct, total, pct } = useMemo(() => {
    let c = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) c++;
    });
    return { correct: c, total: questions.length, pct: Math.round((c / questions.length) * 100) || 0 };
  }, [questions, answers]);

  useEffect(() => {
    if (courseId && total > 0) {
      updateCourseScore(courseId, pct);
    }
  }, [courseId, total, pct, updateCourseScore]);

  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
  const message =
    pct >= 80
      ? 'Excellent work!'
      : pct >= 50
        ? 'Good effort, keep going!'
        : "Don't give up, practice makes perfect!";

  const handleDone = useCallback(() => {
    reset();
    router.dismissAll();
  }, [reset, router]);

  const handleRetry = useCallback(() => {
    const qs = [...questions];
    reset();
    useQuizStore.getState().loadQuiz(qs);
    router.replace({ pathname: '/quiz', params: courseId ? { courseId } : {} });
  }, [questions, reset, router, courseId]);

  const footerPad = Math.max(16, insets.bottom);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <UIText variant="title" style={styles.emoji}>
          {emoji}
        </UIText>
        <UIText variant="title" style={styles.score}>
          {correct} / {total}
        </UIText>
        <UIText variant="subtitle" style={styles.pct}>
          {pct}%
        </UIText>
        <UIText variant="bodySecondary" style={styles.message}>
          {message}
        </UIText>

        <View style={styles.breakdown}>
          {questions.map((q, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === q.correct;
            return (
              <View key={i} style={styles.row}>
                <UIIcon
                  name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size="sm"
                  color={isCorrect ? theme.colors.primary : '#ef4444'}
                />
                <View style={styles.rowText}>
                  <UIText variant="body" numberOfLines={2}>
                    {q.sentence}
                  </UIText>
                  {!isCorrect && (
                    <UIText variant="caption" style={styles.correctAnswer}>
                      Correct: {q.correct}
                    </UIText>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPad }]}>
        <UIButton title="Try again" variant="secondary" onPress={handleRetry} />
        <View style={styles.footerGap} />
        <UIButton title="Done" onPress={handleDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  score: {
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  pct: {
    color: theme.colors.primary,
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginBottom: 28,
  },
  breakdown: {
    width: '100%',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  correctAnswer: {
    color: theme.colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  footerGap: {
    height: 10,
  },
});
