import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { questionById, schoolQuestions } from '@/data/questions';
import { Attempt, ChallengeMode, deriveProgress, Progress } from '@/store/progress';

const STORAGE_KEY = 'lingoquest.progress.v1';
type GameState = Progress & {
  hydrated: boolean;
  mode: ChallengeMode | null;
  questionIds: string[];
  attempts: Attempt[];
  hydrate: () => Promise<void>;
  begin: (mode: ChallengeMode) => void;
  answer: (questionId: string, selected: string) => void;
  commitResult: () => Promise<void>;
  resetSession: () => void;
};
const initialProgress: Progress = { territoryLevel: 0, reviewQueue: [] };

export const useGameStore = create<GameState>((set, get) => ({
  ...initialProgress,
  hydrated: false,
  mode: null,
  questionIds: [],
  attempts: [],
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as Progress) : initialProgress;
      set({ ...saved, hydrated: true });
    } catch {
      set({ ...initialProgress, hydrated: true });
    }
  },
  begin: (mode) => {
    const ids =
      mode === 'conquest'
        ? schoolQuestions.map((q) => q.id)
        : get().reviewQueue.filter((id) => Boolean(questionById(id)));
    set({ mode, questionIds: ids, attempts: [] });
  },
  answer: (questionId, selected) => {
    const question = questionById(questionId);
    if (!question || get().attempts.some((a) => a.questionId === questionId)) return;
    set((state) => ({
      attempts: [
        ...state.attempts,
        { questionId, selected, correct: selected === question.answer },
      ],
    }));
  },
  commitResult: async () => {
    const { territoryLevel, reviewQueue, mode, attempts } = get();
    if (!mode || attempts.length === 0) return;
    const progress = deriveProgress({ territoryLevel, reviewQueue }, mode, attempts);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    set(progress);
  },
  resetSession: () => set({ mode: null, questionIds: [], attempts: [] }),
}));
