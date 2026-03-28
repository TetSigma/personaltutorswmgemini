import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';

/** Sources picked on the New course screen; used when generating questions. */
export type CourseDataSource = 'gmail' | 'photos';

export type SavedCourse = {
  id: string;
  createdAt: string;
  questionCount: number;
  bestScore: number | null;
  questions: { description: string; sentence: string; correct: string; options: string[]; source?: 'local' | 'gemini' }[];
};

/** Serializable slice written to disk (no functions). */
export type AppPersistedState = {
  /** Optional name for greetings / personalization */
  displayName: string | null;
  streakDays: number;
  practiceMinutesToday: number;
  /** ISO date string for the day `practiceMinutesToday` refers to */
  practiceDayKey: string | null;
  /** BCP-47 or short codes, e.g. ["es", "de"] */
  preferredLanguages: string[];
  /** Currently selected target language (BCP-47 code) */
  learningLanguage: string | null;
  /** Last confirmed course generation sources (at least one). */
  courseGenerationSources: CourseDataSource[];
  /** Completed courses saved for replay */
  savedCourses: SavedCourse[];
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const initialPersisted: AppPersistedState = {
  displayName: null,
  streakDays: 12,
  practiceMinutesToday: 45,
  practiceDayKey: todayKey(),
  preferredLanguages: [],
  learningLanguage: null,
  courseGenerationSources: [],
  savedCourses: [],
};

type AppActions = {
  setDisplayName: (displayName: string | null) => void;
  setStreakDays: (streakDays: number) => void;
  setPracticeMinutesToday: (minutes: number) => void;
  /** Call after a study session; rolls daily minutes if the calendar day changed */
  addPracticeMinutes: (minutes: number) => void;
  setPreferredLanguages: (preferredLanguages: string[]) => void;
  setLearningLanguage: (language: string | null) => void;
  setCourseGenerationSources: (sources: CourseDataSource[]) => void;
  addCourse: (course: SavedCourse) => void;
  updateCourseScore: (id: string, score: number) => void;
  deleteCourse: (id: string) => void;
  reset: () => void;
};

export type AppStore = AppPersistedState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialPersisted,

      setDisplayName: (displayName) => set({ displayName }),

      setStreakDays: (streakDays) => set({ streakDays }),

      setPracticeMinutesToday: (practiceMinutesToday) =>
        set({ practiceMinutesToday, practiceDayKey: todayKey() }),

      addPracticeMinutes: (minutes) => {
        const key = todayKey();
        const s = get();
        const sameDay = s.practiceDayKey === key;
        const base = sameDay ? s.practiceMinutesToday : 0;
        set({
          practiceMinutesToday: base + minutes,
          practiceDayKey: key,
        });
      },

      setPreferredLanguages: (preferredLanguages) => set({ preferredLanguages }),

      setLearningLanguage: (learningLanguage) => set({ learningLanguage }),

      setCourseGenerationSources: (courseGenerationSources) =>
        set({ courseGenerationSources }),

      addCourse: (course) =>
        set((s) => ({ savedCourses: [course, ...s.savedCourses] })),

      updateCourseScore: (id, score) =>
        set((s) => ({
          savedCourses: s.savedCourses.map((c) =>
            c.id === id
              ? { ...c, bestScore: Math.max(score, c.bestScore ?? 0) }
              : c,
          ),
        })),

      deleteCourse: (id) =>
        set((s) => ({
          savedCourses: s.savedCourses.filter((c) => c.id !== id),
        })),

      reset: () => set(initialPersisted),
    }),
    {
      name: 'personaltutor-app',
      storage: zustandStorage,
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const p = persisted as Partial<AppPersistedState>;
        if (version < 2) {
          return {
            ...p,
            courseGenerationSources: p.courseGenerationSources ?? [],
            learningLanguage: p.learningLanguage ?? null,
            savedCourses: p.savedCourses ?? [],
          } as AppPersistedState;
        }
        if (version < 3) {
          return {
            ...p,
            learningLanguage: p.learningLanguage ?? null,
            savedCourses: p.savedCourses ?? [],
          } as AppPersistedState;
        }
        if (version < 4) {
          return {
            ...p,
            savedCourses: p.savedCourses ?? [],
          } as AppPersistedState;
        }
        return persisted as AppPersistedState;
      },
      partialize: (state): AppPersistedState => ({
        displayName: state.displayName,
        streakDays: state.streakDays,
        practiceMinutesToday: state.practiceMinutesToday,
        practiceDayKey: state.practiceDayKey,
        preferredLanguages: state.preferredLanguages,
        learningLanguage: state.learningLanguage,
        courseGenerationSources: state.courseGenerationSources,
        savedCourses: state.savedCourses,
      }),
    }
  )
);
