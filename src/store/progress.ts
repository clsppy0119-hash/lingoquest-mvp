export type ChallengeMode = 'conquest' | 'patrol';
export type Attempt = { questionId: string; selected: string; correct: boolean };
export type Progress = { territoryLevel: number; reviewQueue: string[] };

export const CONQUEST_MIN_CORRECT = 2;

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

export const deriveProgress = (
  progress: Progress,
  mode: ChallengeMode,
  attempts: Attempt[],
): Progress => {
  const { incorrectIds, passed } = evaluateChallenge(mode, attempts);
  const attempted = new Set(attempts.map((attempt) => attempt.questionId));
  const reviewQueue = Array.from(
    new Set([...progress.reviewQueue.filter((id) => !attempted.has(id)), ...incorrectIds]),
  );

  return {
    territoryLevel:
      mode === 'conquest' && passed
        ? Math.max(1, progress.territoryLevel)
        : progress.territoryLevel,
    reviewQueue,
  };
};
