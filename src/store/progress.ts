export type ChallengeMode = 'conquest' | 'patrol';
export type Attempt = { questionId: string; selected: string; correct: boolean };
export type Progress = { territoryLevel: number; reviewQueue: string[] };

export const deriveProgress = (progress: Progress, mode: ChallengeMode, attempts: Attempt[]): Progress => {
  const correctCount = attempts.filter((attempt) => attempt.correct).length;
  const passed = mode === 'patrol' ? correctCount === attempts.length : correctCount >= 2;
  const incorrect = attempts.filter((attempt) => !attempt.correct).map((attempt) => attempt.questionId);
  if (mode === 'conquest') return { territoryLevel: passed ? Math.max(1, progress.territoryLevel) : progress.territoryLevel, reviewQueue: Array.from(new Set([...progress.reviewQueue, ...incorrect])) };
  const attempted = new Set(attempts.map((attempt) => attempt.questionId));
  return { ...progress, reviewQueue: Array.from(new Set([...progress.reviewQueue.filter((id) => !attempted.has(id)), ...incorrect])) };
};
