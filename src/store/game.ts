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
  LEGACY_PROGRESS_STORAGE_KEY,
  normalizeProgress,
  Progress,
  PROGRESS_STORAGE_KEY,
  reviewQueueForTerritory,
} from '@/store/progress';

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
      const currentRaw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
      const legacyRaw = currentRaw ? null : await AsyncStorage.getItem(LEGACY_PROGRESS_STORAGE_KEY);
      const raw = currentRaw ?? legacyRaw;
      const saved = normalizeProgress(raw ? JSON.parse(raw) : null);
      if (raw) await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(saved));
      set({ ...saved, hydrated: true });
    } catch {
      set({ ...createInitialProgress(), hydrated: true });
    }
  },
  begin: (territoryId, mode) => {
    const state = get();
    const territory = territoryById(territoryId);
    const progress = {
      version: 2 as const,
      territoryLevels: state.territoryLevels,
      reviewQueue: state.reviewQueue,
    };
    if (!territory || !isTerritoryUnlocked(progress, territoryId)) return false;

    const ids =
      mode === 'conquest'
        ? territory.questionIds
        : reviewQueueForTerritory(state.reviewQueue, territoryId).filter((id) =>
            Boolean(questionById(id)),
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
    const { territoryLevels, reviewQueue, activeTerritoryId, mode, attempts } = get();
    if (!activeTerritoryId || !mode || attempts.length === 0) return;

    const progress = deriveProgress(
      { version: 2, territoryLevels, reviewQueue },
      activeTerritoryId,
      mode,
      attempts,
    );
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    set(progress);
  },
  resetSession: () => set({ activeTerritoryId: null, mode: null, questionIds: [], attempts: [] }),
}));
