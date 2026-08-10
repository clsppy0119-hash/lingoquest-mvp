import { Attempt, deriveProgress, evaluateChallenge } from '../src/store/progress';

const attempts = (correct: boolean[]): Attempt[] =>
  correct.map((value, index) => ({
    questionId: `q${index + 1}`,
    selected: 'answer',
    correct: value,
  }));

describe('deriveProgress', () => {
  it('occupies School when at least two conquest answers are correct', () => {
    expect(
      deriveProgress(
        { territoryLevel: 0, reviewQueue: [] },
        'conquest',
        attempts([true, true, false]),
      ),
    ).toEqual({ territoryLevel: 1, reviewQueue: ['q3'] });
  });

  it('does not occupy School after a failed conquest', () => {
    expect(
      deriveProgress(
        { territoryLevel: 0, reviewQueue: [] },
        'conquest',
        attempts([true, false, false]),
      ).territoryLevel,
    ).toBe(0);
  });

  it('clears corrected patrol items and retains missed ones', () => {
    const result = deriveProgress(
      { territoryLevel: 1, reviewQueue: ['q1', 'q2'] },
      'patrol',
      attempts([true, false]),
    );
    expect(result.reviewQueue).toEqual(['q2']);
  });

  it('clears old review items answered correctly during conquest', () => {
    const result = deriveProgress(
      { territoryLevel: 0, reviewQueue: ['q1', 'q2'] },
      'conquest',
      attempts([true, false, true]),
    );
    expect(result.reviewQueue).toEqual(['q2']);
  });

  it('uses the same evaluation for conquest results', () => {
    expect(evaluateChallenge('conquest', attempts([true, true, false]))).toEqual({
      correctCount: 2,
      incorrectIds: ['q3'],
      passed: true,
    });
  });

  it('requires every patrol answer to be correct', () => {
    expect(evaluateChallenge('patrol', attempts([true, false])).passed).toBe(false);
    expect(evaluateChallenge('patrol', attempts([true, true])).passed).toBe(true);
  });
});
