import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { questionById } from '@/data/questions';
import { TerritoryId, territoryById } from '@/data/territories';
import {
  Attempt,
  ChallengeMode,
  createInitialProgress,
  deriveProgress,
  isTerritoryUnlocked,
  normalizeProgress,
  Progress,
} from '@/store/progress';

const STORAGE_KEY = 'lingoquest.progress.v1';

type GameState = Progress & {
  hydrated: boolean;
  activeTerritoryId: TerritoryId | null;
  mode: ChallengeMode | null;
  questionIds: string[];
  attempts: Attempt[];
  hydrate: () => Promise<void>;
  begin: (territoryId: TerritoryId, mode: ChallengeMode) => boolean;
  answer: (questionId: string, selected: string) => void;
  commitResult: () => Promise<void>;
  resetSession: () => void;
};

const initialProgress = createInitialProgress();

export const useGameStore = create<GameState>((set, get) => ({
  ...initialProgress,
  hydrated: false,
  activeTerritoryId: null,
  mode: null,
  questionIds: [],
  attempts: [],
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const saved = normalizeProgress(raw ? JSON.parse(raw) : null);
      set({ ...saved, hydrated: true });
    } catch {
      set({ ...createInitialProgress(), hydrated: true });
    }
  },
  begin: (territoryId, mode) => {
    const state = get();
    const territory = territoryById(territoryId);
    const progress = { territoryLevels: state.territoryLevels, reviewQueues: state.reviewQueues };
    if (!territory || !isTerritoryUnlocked(progress, territoryId)) return false;

    const ids =
      mode === 'conquest'
        ? territory.questionIds
        : state.reviewQueues[territoryId].filter(
            (id) => territory.questionIds.includes(id) && Boolean(questionById(id)),
          );
    if (!ids.length) return false;

    set({ activeTerritoryId: territoryId, mode, questionIds: ids, attempts: [] });
    return true;
  },
  answer: (questionId, selected) => {
    const question = questionById(questionId);
    if (!question || get().attempts.some((attempt) => attempt.questionId === questionId)) return;
    set((state) => ({
      attempts: [
        ...state.attempts,
        { questionId, selected, correct: selected === question.answer },
      ],
    }));
  },
  commitResult: async () => {
    const { territoryLevels, reviewQueues, activeTerritoryId, mode, attempts } = get();
    if (!activeTerritoryId || !mode || attempts.length === 0) return;

    const progress = deriveProgress(
      { territoryLevels, reviewQueues },
      activeTerritoryId,
      mode,
      attempts,
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    set(progress);
  },
  resetSession: () => set({ activeTerritoryId: null, mode: null, questionIds: [], attempts: [] }),
}));
