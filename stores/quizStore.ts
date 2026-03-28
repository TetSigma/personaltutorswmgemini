import { create } from 'zustand';

export type QuizQuestion = {
  description: string;
  sentence: string;
  correct: string;
  options: string[];
  source?: 'local' | 'gemini';
};

type QuizState = {
  questions: QuizQuestion[];
  currentIndex: number;
  /** Maps question index → selected answer string */
  answers: Record<number, string>;
};

type QuizActions = {
  loadQuiz: (questions: QuizQuestion[]) => void;
  answer: (index: number, selected: string) => void;
  next: () => void;
  reset: () => void;
  getScore: () => { correct: number; total: number };
};

export type QuizStore = QuizState & QuizActions;

const initialState: QuizState = {
  questions: [],
  currentIndex: 0,
  answers: {},
};

export const useQuizStore = create<QuizStore>()((set, get) => ({
  ...initialState,

  loadQuiz: (questions) => set({ questions, currentIndex: 0, answers: {} }),

  answer: (index, selected) =>
    set((s) => ({ answers: { ...s.answers, [index]: selected } })),

  next: () =>
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1),
    })),

  reset: () => set(initialState),

  getScore: () => {
    const { questions, answers } = get();
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });
    return { correct, total: questions.length };
  },
}));
