import {
  Attempt,
  createInitialProgress,
  deriveProgress,
  evaluateChallenge,
  isTerritoryUnlocked,
  normalizeProgress,
} from '../src/store/progress';

const attempts = (correct: boolean[], prefix = 'q'): Attempt[] =>
  correct.map((value, index) => ({
    questionId: `${prefix}${index + 1}`,
    selected: 'answer',
    correct: value,
  }));

describe('multi-territory progress', () => {
  it.each(['school', 'restaurant', 'airport'] as const)(
    'occupies %s when at least two conquest answers are correct',
    (territoryId) => {
      const progress = createInitialProgress();
      const result = deriveProgress(
        progress,
        territoryId,
        'conquest',
        attempts([true, true, false], territoryId),
      );

      expect(result.territoryLevels[territoryId]).toBe(1);
      expect(result.reviewQueues[territoryId]).toEqual([`${territoryId}3`]);
    },
  );

  it('does not occupy a territory after a failed conquest', () => {
    const result = deriveProgress(
      createInitialProgress(),
      'school',
      'conquest',
      attempts([true, false, false]),
    );
    expect(result.territoryLevels.school).toBe(0);
  });

  it('keeps review queues isolated by territory', () => {
    const progress = createInitialProgress();
    progress.reviewQueues.school = ['school-hello'];
    progress.reviewQueues.restaurant = ['restaurant-order'];

    const result = deriveProgress(progress, 'restaurant', 'patrol', [
      { questionId: 'restaurant-order', selected: 'answer', correct: true },
    ]);

    expect(result.reviewQueues.restaurant).toEqual([]);
    expect(result.reviewQueues.school).toEqual(['school-hello']);
  });

  it('clears corrected patrol items and retains missed ones', () => {
    const progress = createInitialProgress();
    progress.territoryLevels.airport = 1;
    progress.reviewQueues.airport = ['airport-passport', 'airport-gate'];

    const result = deriveProgress(progress, 'airport', 'patrol', [
      { questionId: 'airport-passport', selected: 'answer', correct: true },
      { questionId: 'airport-gate', selected: 'answer', correct: false },
    ]);

    expect(result.reviewQueues.airport).toEqual(['airport-gate']);
  });

  it('clears old review items answered correctly during conquest', () => {
    const progress = createInitialProgress();
    progress.reviewQueues.school = ['q1', 'q2'];
    const result = deriveProgress(progress, 'school', 'conquest', attempts([true, false, true]));
    expect(result.reviewQueues.school).toEqual(['q2']);
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

  it('migrates the legacy School-only snapshot without losing progress', () => {
    expect(
      normalizeProgress({ territoryLevel: 1, reviewQueue: ['school-pencil', 'school-pencil'] }),
    ).toEqual({
      territoryLevels: { school: 1, restaurant: 0, airport: 0 },
      reviewQueues: {
        school: ['school-pencil'],
        restaurant: [],
        airport: [],
      },
    });
  });

  it('repairs malformed snapshots with safe defaults', () => {
    expect(
      normalizeProgress({
        territoryLevels: { school: null, restaurant: 1, airport: Number.NaN },
        reviewQueues: { school: 'bad', restaurant: ['restaurant-order'], airport: null },
      }),
    ).toEqual({
      territoryLevels: { school: 0, restaurant: 1, airport: 0 },
      reviewQueues: { school: [], restaurant: ['restaurant-order'], airport: [] },
    });
  });

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
