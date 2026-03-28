import type { ComponentProps } from 'react';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchGeminiQuestions,
  resolveLang,
  useGalleryPhotos,
  useGmailEmails,
  useImageDescriber,
  useQuestionGenerator,
  type EmailSnippet,
  type GalleryPhoto,
  type ImageDescription,
  type QuizQuestion,
} from '../ai';
import {
  type CourseDataSource,
  type SavedCourse,
  useAppStore,
} from '../stores/appStore';
import { useQuizStore } from '../stores/quizStore';
import { theme } from '../theme';
import { UIButton, UICourseSourceCard, UIIcon, UIPressable, UIText } from '../ui';

type PipelinePhase = 'idle' | 'preparing' | 'describing' | 'generating' | 'done' | 'error';

const SOURCE_OPTIONS: {
  id: CourseDataSource;
  title: string;
  description: string;
  icon: ComponentProps<typeof UIIcon>['name'];
}[] = [
  {
    id: 'gmail',
    title: 'Gmail',
    description: 'Topics and vocabulary from your inbox',
    icon: 'mail',
  },
  {
    id: 'photos',
    title: 'Photos',
    description: 'Choose photos to create questions from',
    icon: 'images',
  },
];

/** Shuffle array (Fisher-Yates). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Phase 1: only the VLM is in memory ──────────────────────────────

function DescriberPhase({
  photos,
  onDone,
  onError,
}: {
  photos: GalleryPhoto[];
  onDone: (descs: ImageDescription[]) => void;
  onError: (msg: string) => void;
}) {
  const describer = useImageDescriber();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !describer.vlm.isReady) return;
    started.current = true;
    describer.describeAll(photos).then((results) => {
      if (results.length === 0) onError('Could not describe any images.');
      else onDone(results);
    });
  }, [describer.vlm.isReady, describer, photos, onDone, onError]);

  return (
    <View style={styles.progressCard}>
      <ActivityIndicator color={theme.colors.primary} size="small" />
      <View style={styles.progressTextWrap}>
        {!describer.vlm.isReady ? (
          <UIText variant="body" style={styles.progressLabel}>
            Loading vision model… {Math.round(describer.vlm.downloadProgress * 100)}%
          </UIText>
        ) : (
          <>
            <UIText variant="body" style={styles.progressLabel}>
              Analyzing images…
            </UIText>
            {describer.progress.total > 0 && (
              <UIText variant="caption" style={styles.progressDetail}>
                {describer.progress.current} / {describer.progress.total} images
              </UIText>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// ── Phase 2: only the text LLM is in memory ─────────────────────────

function GeneratorPhase({
  descriptions,
  emails,
  language,
  onDone,
  onError,
}: {
  descriptions: ImageDescription[];
  emails: EmailSnippet[];
  language: string | undefined;
  onDone: (courseId: string, count: number) => void;
  onError: (msg: string) => void;
}) {
  const questionGen = useQuestionGenerator();
  const loadQuiz = useQuizStore((s) => s.loadQuiz);
  const addCourse = useAppStore((s) => s.addCourse);
  const started = useRef(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (started.current || !questionGen.llm.isReady) return;
    started.current = true;

    (async () => {
      const allLocalQs: QuizQuestion[] = [];

      if (descriptions.length > 0) {
        setStatus('Generating questions from photos…');
        const photoQs = await questionGen.generate(descriptions, language);
        allLocalQs.push(...photoQs);
      }

      if (emails.length > 0) {
        setStatus('Generating questions from emails…');
        const emailQs = await questionGen.generateFromEmails(emails, language);
        allLocalQs.push(...emailQs);
      }

      if (allLocalQs.length === 0) {
        onError(questionGen.error ?? 'No questions generated.');
        return;
      }

      setStatus('Extracting topics…');
      const allDescs = [
        ...descriptions.map((d) => d.description),
        ...emails.map((e) => `${e.subject}: ${e.snippet}`),
      ];
      const topics = await questionGen.extractTopics(allDescs);

      let geminiQs: QuizQuestion[] = [];
      if (topics.length > 0) {
        setStatus('Fetching Gemini questions…');
        const lang = resolveLang(language ?? 'Spanish');
        geminiQs = await fetchGeminiQuestions(topics, lang);
      }

      const allQs = shuffle([...allLocalQs, ...geminiQs]);
      console.log(`[Pipeline] ${allLocalQs.length} local + ${geminiQs.length} gemini = ${allQs.length} total`);

      const course: SavedCourse = {
        id: Date.now().toString(36),
        createdAt: new Date().toISOString(),
        questionCount: allQs.length,
        bestScore: null,
        questions: allQs,
      };
      addCourse(course);
      loadQuiz(allQs);
      onDone(course.id, allQs.length);
    })();
  }, [questionGen.llm.isReady, questionGen, descriptions, emails, language, addCourse, loadQuiz, onDone, onError]);

  return (
    <View style={styles.progressCard}>
      <ActivityIndicator color={theme.colors.primary} size="small" />
      <View style={styles.progressTextWrap}>
        {!questionGen.llm.isReady ? (
          <UIText variant="body" style={styles.progressLabel}>
            Loading language model… {Math.round(questionGen.llm.downloadProgress * 100)}%
          </UIText>
        ) : (
          <UIText variant="body" style={styles.progressLabel}>
            {status || 'Generating quiz questions…'}
          </UIText>
        )}
      </View>
    </View>
  );
}

// ── Main screen ─────────────────────────────────────────────────────

export default function NewCourseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const savedSources = useAppStore((s) => s.courseGenerationSources);
  const learningLanguage = useAppStore((s) => s.learningLanguage);
  const setCourseGenerationSources = useAppStore(
    (s) => s.setCourseGenerationSources,
  );

  const [selected, setSelected] = useState<Set<CourseDataSource>>(
    () => new Set(savedSources),
  );

  const gallery = useGalleryPhotos();
  const gmail = useGmailEmails();
  const [pickedPhotos, setPickedPhotos] = useState<GalleryPhoto[]>([]);
  const pipelinePhotosRef = useRef<GalleryPhoto[]>([]);
  const [fetchedEmails, setFetchedEmails] = useState<EmailSnippet[]>([]);

  const [phase, setPhase] = useState<PipelinePhase>('idle');
  const [descriptions, setDescriptions] = useState<ImageDescription[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const running = phase === 'preparing' || phase === 'describing' || phase === 'generating';

  const toggle = useCallback((id: CourseDataSource) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handlePickPhotos = useCallback(async () => {
    const result = await gallery.pickPhotos();
    if (result.length > 0) {
      setPickedPhotos(result);
      setSelected((prev) => new Set(prev).add('photos'));
    } else {
      setPickedPhotos([]);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete('photos');
        return next;
      });
    }
  }, [gallery]);

  const removePhoto = useCallback((id: string) => {
    setPickedPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) {
        setSelected((s) => {
          const ns = new Set(s);
          ns.delete('photos');
          return ns;
        });
      }
      return next;
    });
  }, []);

  const canContinue = selected.size >= 1 && !running;

  const onContinue = useCallback(async () => {
    if (!canContinue) return;

    const list = SOURCE_OPTIONS.filter((o) => selected.has(o.id)).map((o) => o.id);
    setCourseGenerationSources(list);
    setErrorMsg(null);

    const wantsPhotos = selected.has('photos');
    const wantsGmail = selected.has('gmail');

    if (!wantsPhotos && !wantsGmail) {
      router.push('/new-course');
      return;
    }

    setPhase('preparing');

    // Fetch emails in parallel while user's photos are prepared
    let emailsPromise: Promise<EmailSnippet[]> = Promise.resolve([]);
    if (wantsGmail) {
      emailsPromise = gmail.fetchEmails(5);
    }

    // Ensure photos are picked
    if (wantsPhotos) {
      let photos = pickedPhotos;
      if (photos.length === 0) {
        photos = await gallery.pickPhotos();
        if (photos.length === 0 && !wantsGmail) {
          setPhase('idle');
          return;
        }
        setPickedPhotos(photos);
      }
      pipelinePhotosRef.current = photos;
    }

    // Await emails
    if (wantsGmail) {
      const emails = await emailsPromise;
      if (emails.length === 0 && !wantsPhotos) {
        setErrorMsg(gmail.error ?? 'Could not fetch emails. Make sure you are signed in with Google.');
        setPhase('error');
        return;
      }
      setFetchedEmails(emails);
    }

    // Start pipeline: if photos selected, go through VLM first; otherwise skip to generating
    if (wantsPhotos && pipelinePhotosRef.current.length > 0) {
      setPhase('describing');
    } else {
      setPhase('generating');
    }
  }, [canContinue, selected, pickedPhotos, gallery, gmail, setCourseGenerationSources, router]);

  // Phase 1 done → unmount VLM, start Phase 2
  const onDescriptionsDone = useCallback((descs: ImageDescription[]) => {
    setDescriptions(descs);
    setPhase('generating');
  }, []);

  // Phase 2 done → save quiz and navigate
  const onQuestionsDone = useCallback((courseId: string, count: number) => {
    setQuestionCount(count);
    setPhase('done');
    router.replace({ pathname: '/quiz', params: { courseId } });
  }, [router]);

  const onPhaseError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setPhase('error');
  }, []);

  const footerPad = Math.max(16, insets.bottom);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <UIText variant="subtitle" style={styles.heading}>
          Data for your course
        </UIText>
        <UIText variant="bodySecondary" style={styles.lede}>
          {"Pick one or more sources. We'll use them to generate personalized questions."}
        </UIText>

        <View style={styles.cards}>
          {SOURCE_OPTIONS.map((opt) => (
            <UICourseSourceCard
              key={opt.id}
              title={opt.title}
              description={
                opt.id === 'photos' && pickedPhotos.length > 0
                  ? `${pickedPhotos.length} photo${pickedPhotos.length > 1 ? 's' : ''} selected`
                  : opt.description
              }
              icon={opt.icon}
              selected={selected.has(opt.id)}
              onPress={opt.id === 'photos' ? handlePickPhotos : () => toggle(opt.id)}
              disabled={running}
            />
          ))}
        </View>

        {/* Photo thumbnails */}
        {pickedPhotos.length > 0 && !running && (
          <View style={styles.thumbRow}>
            {pickedPhotos.map((photo) => (
              <View key={photo.id} style={styles.thumbWrap}>
                <Image source={{ uri: photo.uri }} style={styles.thumb} />
                <UIPressable
                  variant="plain"
                  style={styles.thumbRemove}
                  onPress={() => removePhoto(photo.id)}
                >
                  <UIIcon name="close-circle" size="sm" color="#fff" />
                </UIPressable>
              </View>
            ))}
          </View>
        )}

        {/* Phase 1: VLM only */}
        {phase === 'describing' && (
          <DescriberPhase
            photos={pipelinePhotosRef.current}
            onDone={onDescriptionsDone}
            onError={onPhaseError}
          />
        )}

        {/* Preparing: fetching emails etc */}
        {phase === 'preparing' && (
          <View style={styles.progressCard}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <View style={styles.progressTextWrap}>
              <UIText variant="body" style={styles.progressLabel}>
                Preparing data…
              </UIText>
            </View>
          </View>
        )}

        {/* Text LLM phase: generates from both photos + emails */}
        {phase === 'generating' && (
          <GeneratorPhase
            descriptions={descriptions}
            emails={fetchedEmails}
            language={learningLanguage ?? undefined}
            onDone={onQuestionsDone}
            onError={onPhaseError}
          />
        )}

        {phase === 'done' && (
          <View style={styles.progressCard}>
            <UIIcon name="checkmark-circle" size="md" color={theme.colors.primary} />
            <View style={styles.progressTextWrap}>
              <UIText variant="body" style={styles.progressLabel}>
                Course ready!
              </UIText>
              <UIText variant="caption" style={styles.progressDetail}>
                {questionCount} questions generated
              </UIText>
            </View>
          </View>
        )}

        {phase === 'error' && errorMsg && (
          <View style={styles.progressCard}>
            <UIIcon name="alert-circle" size="md" color="#b00020" />
            <UIText variant="body" style={styles.progressError}>
              {errorMsg}
            </UIText>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPad }]}>
        <UIButton
          title={running ? 'Generating…' : 'Continue'}
          disabled={!canContinue}
          loading={running}
          onPress={onContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.pageBackground,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  heading: {
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  lede: {
    marginBottom: 20,
  },
  cards: {
    gap: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },

  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: theme.colors.pageBackground,
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressTextWrap: {
    flex: 1,
    gap: 2,
  },
  progressLabel: {
    color: theme.colors.textPrimary,
  },
  progressDetail: {
    color: theme.colors.textMuted,
  },
  progressError: {
    color: '#b00020',
  },
});
