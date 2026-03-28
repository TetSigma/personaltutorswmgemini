import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuizStore } from '../stores/quizStore';
import { theme } from '../theme';
import { UIButton, UIPressable, UIText } from '../ui';

export default function QuizScreen() {
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const insets = useSafeAreaInsets();

  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const answers = useQuizStore((s) => s.answers);
  const answerQ = useQuizStore((s) => s.answer);
  const next = useQuizStore((s) => s.next);

  const question = questions[currentIndex];
  const selected = answers[currentIndex] ?? null;
  const isLast = currentIndex === questions.length - 1;

  const progress = useSharedValue(0);

  useEffect(() => {
    const target = questions.length > 0 ? (currentIndex + 1) / questions.length : 0;
    progress.value = withTiming(target, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentIndex, questions.length, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleSelect = useCallback(
    (option: string) => {
      if (selected) return;
      answerQ(currentIndex, option);
    },
    [selected, answerQ, currentIndex],
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      router.replace({ pathname: '/quiz-results', params: courseId ? { courseId } : {} });
    } else {
      next();
    }
  }, [isLast, next, router, courseId]);

  if (!question) {
    return (
      <View style={[styles.root, styles.empty]}>
        <UIText variant="subtitle">No questions loaded</UIText>
      </View>
    );
  }

  const footerPad = Math.max(16, insets.bottom);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, progressStyle]} />
      </View>

      <Animated.View
        key={currentIndex}
        entering={FadeInRight.duration(250)}
        exiting={FadeOutLeft.duration(200)}
        style={styles.content}
      >
        <View style={styles.counterRow}>
          <UIText variant="caption" style={styles.counter}>
            Question {currentIndex + 1} of {questions.length}
          </UIText>
          {question.source === 'gemini' && (
            <View style={styles.geminiBadge}>
              <UIText variant="caption" style={styles.geminiBadgeText}>
                Gemini
              </UIText>
            </View>
          )}
        </View>

        <UIText variant="subtitle" style={styles.sentence}>
          {question.sentence}
        </UIText>

        <UIText variant="bodySecondary" style={styles.context}>
          {question.description}
        </UIText>

        <View style={styles.options}>
          {question.options.map((opt, optIdx) => {
            const isSelected = selected === opt;
            const isCorrect = opt === question.correct;
            const showResult = !!selected;

            let optStyle = styles.option;
            let textStyle = styles.optionText;

            if (showResult && isCorrect) {
              optStyle = { ...styles.option, ...styles.optionCorrect };
              textStyle = { ...styles.optionText, ...styles.optionTextCorrect };
            } else if (showResult && isSelected && !isCorrect) {
              optStyle = { ...styles.option, ...styles.optionWrong };
              textStyle = { ...styles.optionText, ...styles.optionTextWrong };
            }

            return (
              <UIPressable
                key={optIdx}
                variant="plain"
                style={optStyle}
                onPress={() => handleSelect(opt)}
                disabled={!!selected}
              >
                <UIText variant="body" style={textStyle}>
                  {opt}
                </UIText>
              </UIPressable>
            );
          })}
        </View>
      </Animated.View>

      {selected && (
        <View style={[styles.footer, { paddingBottom: footerPad }]}>
          <UIButton
            title={isLast ? 'See results' : 'Next question'}
            onPress={handleNext}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginHorizontal: 20,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  counter: {
    color: theme.colors.textMuted,
  },
  geminiBadge: {
    backgroundColor: '#e8f0fe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  geminiBadgeText: {
    color: '#4285f4',
    fontWeight: '600',
    fontSize: 11,
  },
  sentence: {
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  context: {
    marginBottom: 28,
  },
  options: {
    gap: 12,
  },
  option: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: theme.colors.white,
  },
  optionCorrect: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}14`,
  },
  optionWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    color: theme.colors.textPrimary,
  },
  optionTextCorrect: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#ef4444',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
});
