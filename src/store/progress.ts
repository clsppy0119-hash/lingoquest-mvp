import { TerritoryId, territories, territoryIds } from '@/data/territories';

export type ChallengeMode = 'conquest' | 'patrol';
export type Attempt = { questionId: string; selected: string; correct: boolean };
export type TerritoryLevels = Record<TerritoryId, number>;
export type ReviewQueues = Record<TerritoryId, string[]>;
export type Progress = { territoryLevels: TerritoryLevels; reviewQueues: ReviewQueues };

type LegacyProgress = { territoryLevel?: unknown; reviewQueue?: unknown };

export const CONQUEST_MIN_CORRECT = 2;

export const createInitialProgress = (): Progress => ({
  territoryLevels: { school: 0, restaurant: 0, airport: 0 },
  reviewQueues: { school: [], restaurant: [], airport: [] },
});

const asLevel = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? 1 : 0;

const asQueue = (value: unknown) =>
  Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string')))
    : [];

export const normalizeProgress = (value: unknown): Progress => {
  const initial = createInitialProgress();
  if (!value || typeof value !== 'object') return initial;

  const saved = value as Partial<Progress> & LegacyProgress;
  const savedLevels = saved.territoryLevels;
  const savedQueues = saved.reviewQueues;

  if (savedLevels && savedQueues) {
    return {
      territoryLevels: {
        school: asLevel(savedLevels.school),
        restaurant: asLevel(savedLevels.restaurant),
        airport: asLevel(savedLevels.airport),
      },
      reviewQueues: {
        school: asQueue(savedQueues.school),
        restaurant: asQueue(savedQueues.restaurant),
        airport: asQueue(savedQueues.airport),
      },
    };
  }

  return {
    ...initial,
    territoryLevels: { ...initial.territoryLevels, school: asLevel(saved.territoryLevel) },
    reviewQueues: { ...initial.reviewQueues, school: asQueue(saved.reviewQueue) },
  };
};

export type ChallengeEvaluation = {
  correctCount: number;
  incorrectIds: string[];
  passed: boolean;
};

export const evaluateChallenge = (
  mode: ChallengeMode,
  attempts: Attempt[],
): ChallengeEvaluation => {
  const correctCount = attempts.filter((attempt) => attempt.correct).length;
  const incorrectIds = attempts
    .filter((attempt) => !attempt.correct)
    .map((attempt) => attempt.questionId);

  return {
    correctCount,
    incorrectIds,
    passed:
      mode === 'patrol' ? correctCount === attempts.length : correctCount >= CONQUEST_MIN_CORRECT,
  };
};

export const isTerritoryUnlocked = (progress: Progress, territoryId: TerritoryId) => {
  const territory = territories.find((item) => item.id === territoryId);
  if (!territory?.prerequisiteId) return territoryId === territoryIds[0];
  return progress.territoryLevels[territory.prerequisiteId] > 0;
};

export const deriveProgress = (
  progress: Progress,
  territoryId: TerritoryId,
  mode: ChallengeMode,
  attempts: Attempt[],
): Progress => {
  const { incorrectIds, passed } = evaluateChallenge(mode, attempts);
  const attempted = new Set(attempts.map((attempt) => attempt.questionId));
  const reviewQueue = Array.from(
    new Set([
      ...progress.reviewQueues[territoryId].filter((id) => !attempted.has(id)),
      ...incorrectIds,
    ]),
  );

  return {
    territoryLevels: {
      ...progress.territoryLevels,
      [territoryId]:
        mode === 'conquest' && passed
          ? Math.max(1, progress.territoryLevels[territoryId])
          : progress.territoryLevels[territoryId],
    },
    reviewQueues: { ...progress.reviewQueues, [territoryId]: reviewQueue },
  };
};
