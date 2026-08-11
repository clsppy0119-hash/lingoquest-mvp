import { TerritoryId, territoryById } from '../src/data/territories';
import {
  Attempt,
  createInitialProgress,
  deriveProgress,
  evaluateChallenge,
  isTerritoryUnlocked,
  LEGACY_PROGRESS_STORAGE_KEY,
  normalizeProgress,
  PROGRESS_STORAGE_KEY,
  reviewQueueForTerritory,
} from '../src/store/progress';

const attempts = (correct: boolean[], prefix = 'q'): Attempt[] =>
  correct.map((value, index) => ({
    questionId: `${prefix}${index + 1}`,
    selected: 'answer',
    correct: value,
  }));

const territoryAttempts = (territoryId: TerritoryId, correct: boolean[]): Attempt[] => {
  const territory = territoryById(territoryId);
  if (!territory) throw new Error(`missing territory: ${territoryId}`);
  return correct.map((value, index) => ({
    questionId: territory.questionIds[index],
    selected: 'answer',
    correct: value,
  }));
};

describe('multi-territory progress', () => {
  it.each(['school', 'restaurant', 'airport'] as const)(
    'occupies %s when at least two conquest answers are correct',
    (territoryId) => {
      const progress = createInitialProgress();
      const result = deriveProgress(
        progress,
        territoryId,
        'conquest',
        territoryAttempts(territoryId, [true, true, false]),
      );
      const territory = territoryById(territoryId);

      expect(result.territoryLevels[territoryId]).toBe(1);
      expect(result.reviewQueue).toEqual([territory?.questionIds[2]]);
    },
  );

  it('does not occupy a territory after a failed conquest', () => {
    const result = deriveProgress(
      createInitialProgress(),
      'school',
      'conquest',
      territoryAttempts('school', [true, false, false]),
    );
    expect(result.territoryLevels.school).toBe(0);
  });

  it('keeps other territory review items when a patrol is completed', () => {
    const progress = createInitialProgress();
    progress.reviewQueue = ['school-hello', 'restaurant-order'];

    const result = deriveProgress(progress, 'restaurant', 'patrol', [
      { questionId: 'restaurant-order', selected: 'answer', correct: true },
    ]);

    expect(result.reviewQueue).toEqual(['school-hello']);
    expect(reviewQueueForTerritory(result.reviewQueue, 'restaurant')).toEqual([]);
    expect(reviewQueueForTerritory(result.reviewQueue, 'school')).toEqual(['school-hello']);
  });

  it('clears corrected patrol items and retains missed ones', () => {
    const progress = createInitialProgress();
    progress.territoryLevels.airport = 1;
    progress.reviewQueue = ['airport-passport', 'airport-gate'];

    const result = deriveProgress(progress, 'airport', 'patrol', [
      { questionId: 'airport-passport', selected: 'answer', correct: true },
      { questionId: 'airport-gate', selected: 'answer', correct: false },
    ]);

    expect(result.reviewQueue).toEqual(['airport-gate']);
  });

  it('clears old review items answered correctly during conquest', () => {
    const progress = createInitialProgress();
    progress.reviewQueue = ['school-hello', 'school-pencil'];
    const result = deriveProgress(
      progress,
      'school',
      'conquest',
      territoryAttempts('school', [true, false, true]),
    );
    expect(result.reviewQueue).toEqual(['school-pencil']);
  });

  it('unlocks territories in School → Restaurant → Airport order', () => {
    const progress = createInitialProgress();
    expect(isTerritoryUnlocked(progress, 'school')).toBe(true);
    expect(isTerritoryUnlocked(progress, 'restaurant')).toBe(false);
    expect(isTerritoryUnlocked(progress, 'airport')).toBe(false);

    progress.territoryLevels.school = 1;
    expect(isTerritoryUnlocked(progress, 'restaurant')).toBe(true);
    expect(isTerritoryUnlocked(progress, 'airport')).toBe(false);

    progress.territoryLevels.restaurant = 1;
    expect(isTerritoryUnlocked(progress, 'airport')).toBe(true);
  });
});

describe('progress snapshot v2 migration', () => {
  it('uses the v2 storage key while retaining the v1 lookup key', () => {
    expect(PROGRESS_STORAGE_KEY).toBe('lingoquest.progress.v2');
    expect(LEGACY_PROGRESS_STORAGE_KEY).toBe('lingoquest.progress.v1');
  });

  it('migrates shape A: the legacy School-only snapshot', () => {
    expect(
      normalizeProgress({
        territoryLevel: 1,
        reviewQueue: ['school-pencil', 'school-pencil', 'deleted-question'],
      }),
    ).toEqual({
      version: 2,
      territoryLevels: { school: 1, restaurant: 0, airport: 0 },
      reviewQueue: ['school-pencil'],
    });
  });

  it('migrates shape B: plural queues are flattened in territory order and deduplicated', () => {
    expect(
      normalizeProgress({
        territoryLevels: { school: 1, restaurant: 2, airport: 0 },
        reviewQueues: {
          school: ['school-pencil'],
          restaurant: ['restaurant-order', 'school-pencil'],
          airport: ['airport-gate'],
        },
      }),
    ).toEqual({
      version: 2,
      territoryLevels: { school: 1, restaurant: 2, airport: 0 },
      reviewQueue: ['school-pencil', 'restaurant-order', 'airport-gate'],
    });
  });

  it('reads shape C by version before inspecting misleading legacy fields', () => {
    expect(
      normalizeProgress({
        version: 2,
        territoryLevels: { school: 1, restaurant: 1, airport: 1 },
        reviewQueue: ['airport-gate'],
        reviewQueues: { school: ['school-pencil'] },
        territoryLevel: 0,
      }),
    ).toEqual({
      version: 2,
      territoryLevels: { school: 1, restaurant: 1, airport: 1 },
      reviewQueue: ['airport-gate'],
    });
  });

  it('rescues plural territory levels when the plural queues half is missing', () => {
    expect(
      normalizeProgress({
        territoryLevels: { school: 2, restaurant: 3, airport: 0 },
        reviewQueue: ['school-library'],
      }),
    ).toEqual({
      version: 2,
      territoryLevels: { school: 2, restaurant: 3, airport: 0 },
      reviewQueue: ['school-library'],
    });
  });

  it('rescues plural queues when the plural levels half is missing', () => {
    expect(
      normalizeProgress({
        territoryLevel: 1,
        reviewQueues: {
          school: [],
          restaurant: ['restaurant-thanks'],
          airport: ['airport-boarding'],
        },
      }),
    ).toEqual({
      version: 2,
      territoryLevels: { school: 1, restaurant: 0, airport: 0 },
      reviewQueue: ['restaurant-thanks', 'airport-boarding'],
    });
  });

  it('preserves finite non-negative integer levels above one', () => {
    expect(
      normalizeProgress({
        version: 2,
        territoryLevels: { school: 4, restaurant: 2.9, airport: -3 },
        reviewQueue: [],
      }).territoryLevels,
    ).toEqual({ school: 4, restaurant: 2, airport: 0 });
  });

  it('drops orphan and duplicate question ids from global queues', () => {
    expect(
      normalizeProgress({
        version: 2,
        territoryLevels: { school: 1, restaurant: 1, airport: 0 },
        reviewQueue: ['deleted-question', 'restaurant-order', 'restaurant-order'],
      }).reviewQueue,
    ).toEqual(['restaurant-order']);
  });

  it('repairs malformed snapshots with safe defaults', () => {
    expect(
      normalizeProgress({
        territoryLevels: { school: null, restaurant: 1, airport: Number.NaN },
        reviewQueues: { school: 'bad', restaurant: ['restaurant-order'], airport: null },
      }),
    ).toEqual({
      version: 2,
      territoryLevels: { school: 0, restaurant: 1, airport: 0 },
      reviewQueue: ['restaurant-order'],
    });
  });
});

describe('challenge evaluation', () => {
  it('uses one shared evaluation rule for all territories', () => {
    expect(evaluateChallenge('conquest', attempts([true, true, false]))).toEqual({
      correctCount: 2,
      incorrectIds: ['q3'],
      passed: true,
    });
    expect(evaluateChallenge('patrol', attempts([true, false])).passed).toBe(false);
    expect(evaluateChallenge('patrol', attempts([true, true])).passed).toBe(true);
  });
});
