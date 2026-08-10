export const placementObjectiveIds = ['greeting', 'request'] as const;

export type PlacementObjectiveId = (typeof placementObjectiveIds)[number];
export type PlacementSkill = 'comprehension' | 'production';
export type PlacementBranch = 'meaning-support' | 'production-support' | 'balanced';
export type PlacementStatus = 'independent' | 'with-hints' | 'practice-first' | 'insufficient';

type PlacementItemBase = {
  id: string;
  objectiveId: PlacementObjectiveId;
  skill: PlacementSkill;
  promptZh: string;
  promptEn: string;
  hintZh: string;
  feedbackZh: string;
};

export type PlacementChoiceItem = PlacementItemBase & {
  kind: 'choice';
  choices: string[];
  answer: string;
};

export type PlacementReorderItem = PlacementItemBase & {
  kind: 'reorder';
  chunks: string[];
  answer: string[];
};

export type PlacementItem = PlacementChoiceItem | PlacementReorderItem;

export type PlacementAnswer = string | string[];

export type PlacementAttempt = {
  itemId: string;
  objectiveId: PlacementObjectiveId;
  skill: PlacementSkill;
  correct: boolean;
  usedHint: boolean;
};

export type PlacementProfileEntry = {
  objectiveId: PlacementObjectiveId;
  label: string;
  status: PlacementStatus;
  evidenceCount: number;
  comprehensionEvidence: number;
  productionEvidence: number;
  independentCorrect: number;
  hintedCorrect: number;
  productionIndependentCorrect: number;
  unresolvedContradictions: number;
  reason: string;
};

export type PlacementProfile = {
  branch: PlacementBranch;
  milestone: string;
  entries: PlacementProfileEntry[];
  nextTaskTitle: string;
  nextTaskReason: string;
};
