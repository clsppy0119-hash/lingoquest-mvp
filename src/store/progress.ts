import { TerritoryId, territories, territoryIds } from '@/data/territories';

export type ChallengeMode = 'conquest' | 'patrol';
export type Attempt = { questionId: string; selected: string; correct: boolean };
export type TerritoryLevels = Record<TerritoryId, number>;
export type Progress = { version: 2; territoryLevels: TerritoryLevels; reviewQueue: string[] };

type SavedProgress = {
  version?: unknown;
  territoryLevel?: unknown;
  territoryLevels?: unknown;
  reviewQueue?: unknown;
  reviewQueues?: unknown;
};

export const CONQUEST_MIN_CORRECT = 2;
export const PROGRESS_STORAGE_KEY = 'lingoquest.progress.v2';
export const LEGACY_PROGRESS_STORAGE_KEY = 'lingoquest.progress.v1';

export const createInitialProgress = (): Progress => ({
  version: 2,
  territoryLevels: { school: 0, restaurant: 0, airport: 0 },
  reviewQueue: [],
});

const asLevel = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;

const questionTerritory = new Map(
  territories.flatMap((territory) =>
    territory.questionIds.map((questionId) => [questionId, territory.id] as const),
  ),
);

export const territoryIdForQuestion = (questionId: string) => questionTerritory.get(questionId);

const asQueue = (value: unknown) =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value.filter(
            (item): item is string =>
              typeof item === 'string' && Boolean(territoryIdForQuestion(item)),
          ),
        ),
      )
    : [];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const normalizeLevels = (value: unknown): TerritoryLevels => {
  const saved = isRecord(value) ? value : {};
  return {
    school: asLevel(saved.school),
    restaurant: asLevel(saved.restaurant),
    airport: asLevel(saved.airport),
  };
};

const legacySchoolQueue = (value: unknown) =>
  asQueue(value).filter((questionId) => territoryIdForQuestion(questionId) === 'school');

const flattenPluralQueues = (value: unknown) => {
  const saved = isRecord(value) ? value : {};
  return asQueue(
    territoryIds.flatMap((territoryId) =>
      Array.isArray(saved[territoryId]) ? saved[territoryId] : [],
    ),
  );
};

export const reviewQueueForTerritory = (reviewQueue: string[], territoryId: TerritoryId) =>
  reviewQueue.filter((questionId) => territoryIdForQuestion(questionId) === territoryId);

export const normalizeProgress = (value: unknown): Progress => {
  const initial = createInitialProgress();
  if (!isRecord(value)) return initial;

  const saved = value as SavedProgress & Record<string, unknown>;

  if (saved.version === 2) {
    return {
      version: 2,
      territoryLevels: normalizeLevels(saved.territoryLevels),
      reviewQueue: asQueue(saved.reviewQueue),
    };
  }

  const hasPluralLevels = hasOwn(saved, 'territoryLevels');
  const hasPluralQueues = hasOwn(saved, 'reviewQueues');
  if (hasPluralLevels || hasPluralQueues) {
    return {
      version: 2,
      territoryLevels: hasPluralLevels
        ? normalizeLevels(saved.territoryLevels)
        : { ...initial.territoryLevels, school: asLevel(saved.territoryLevel) },
      reviewQueue: hasPluralQueues
        ? flattenPluralQueues(saved.reviewQueues)
        : legacySchoolQueue(saved.reviewQueue),
    };
  }

  return {
    version: 2,
    territoryLevels: { ...initial.territoryLevels, school: asLevel(saved.territoryLevel) },
    reviewQueue: legacySchoolQueue(saved.reviewQueue),
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
  const reviewQueue = asQueue([
    ...progress.reviewQueue.filter((id) => !attempted.has(id)),
    ...incorrectIds,
  ]);

  return {
    version: 2,
    territoryLevels: {
      ...progress.territoryLevels,
      [territoryId]:
        mode === 'conquest' && passed
          ? Math.max(1, progress.territoryLevels[territoryId])
          : progress.territoryLevels[territoryId],
    },
    reviewQueue,
  };
};
