import { deriveProgress, Attempt } from '../src/store/progress';
const attempts = (correct: boolean[]): Attempt[] => correct.map((value, index) => ({ questionId: `q${index + 1}`, selected: 'answer', correct: value }));
describe('deriveProgress', () => {
  it('occupies School when at least two conquest answers are correct', () => { expect(deriveProgress({ territoryLevel: 0, reviewQueue: [] }, 'conquest', attempts([true, true, false]))).toEqual({ territoryLevel: 1, reviewQueue: ['q3'] }); });
  it('does not occupy School after a failed conquest', () => { expect(deriveProgress({ territoryLevel: 0, reviewQueue: [] }, 'conquest', attempts([true, false, false])).territoryLevel).toBe(0); });
  it('clears corrected patrol items and retains missed ones', () => { const result = deriveProgress({ territoryLevel: 1, reviewQueue: ['q1', 'q2'] }, 'patrol', attempts([true, false])); expect(result.reviewQueue).toEqual(['q2']); });
});
