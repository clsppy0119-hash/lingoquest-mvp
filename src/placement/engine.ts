import {
  allPlacementItems,
  confirmationPlacementItems,
  PLACEMENT_BASE_ITEM_COUNT,
  PLACEMENT_MAX_TIE_BREAK_ITEMS,
  placementBranchItems,
  placementItemById,
  placementTieBreakItems,
  sharedPlacementItems,
} from '@/placement/items';
import {
  PlacementAnswer,
  PlacementAttempt,
  PlacementBranch,
  PlacementItem,
  PlacementObjectiveId,
  PlacementProfile,
  PlacementProfileEntry,
  PlacementSkill,
  PlacementStatus,
  placementObjectiveIds,
} from '@/placement/types';

const objectiveLabels: Record<PlacementObjectiveId, string> = {
  greeting: '在熟悉情境完成日常問候',
  request: '禮貌提出一個簡單需求',
};

export type PlacementContradiction = {
  objectiveId: PlacementObjectiveId;
  skill: PlacementSkill;
};

const normalizeText = (value: string) => value.trim().toLocaleLowerCase();

export const isPlacementAnswerCorrect = (item: PlacementItem, answer: PlacementAnswer) => {
  if (item.kind === 'choice') {
    return typeof answer === 'string' && normalizeText(answer) === normalizeText(item.answer);
  }

  return (
    Array.isArray(answer) &&
    answer.length === item.answer.length &&
    answer.every((chunk, index) => normalizeText(chunk) === normalizeText(item.answer[index]))
  );
};

export const createPlacementAttempt = (
  item: PlacementItem,
  answer: PlacementAnswer,
  usedHint: boolean,
): PlacementAttempt => ({
  itemId: item.id,
  objectiveId: item.objectiveId,
  skill: item.skill,
  correct: isPlacementAnswerCorrect(item, answer),
  usedHint,
});

const independentCorrectCount = (attempts: PlacementAttempt[], skill: PlacementAttempt['skill']) =>
  attempts.filter((attempt) => attempt.skill === skill && attempt.correct && !attempt.usedHint)
    .length;

export const determinePlacementBranch = (attempts: PlacementAttempt[]): PlacementBranch => {
  const sharedIds = new Set(sharedPlacementItems.map((item) => item.id));
  const sharedAttempts = attempts.filter((attempt) => sharedIds.has(attempt.itemId));
  const comprehension = independentCorrectCount(sharedAttempts, 'comprehension');
  const production = independentCorrectCount(sharedAttempts, 'production');

  if (comprehension < production) return 'meaning-support';
  if (production < comprehension) return 'production-support';
  return 'balanced';
};

export const getConfirmationPlacementItems = (_branch: PlacementBranch) => [
  ...confirmationPlacementItems,
];

export const getPlacementRoute = (branch: PlacementBranch) => [
  ...sharedPlacementItems,
  ...placementBranchItems[branch],
  ...getConfirmationPlacementItems(branch),
];

const corePlacementItems = [...sharedPlacementItems, ...confirmationPlacementItems];

export const getContradictoryPlacementCells = (
  attempts: PlacementAttempt[],
): PlacementContradiction[] =>
  placementObjectiveIds.flatMap((objectiveId) =>
    (['comprehension', 'production'] as const).flatMap((skill) => {
      const coreIds = new Set(
        corePlacementItems
          .filter((item) => item.objectiveId === objectiveId && item.skill === skill)
          .map((item) => item.id),
      );
      const coreAttempts = attempts.filter((attempt) => coreIds.has(attempt.itemId));
      if (coreAttempts.length !== 2) return [];

      const outcomes = new Set(coreAttempts.map((attempt) => attempt.correct));
      return outcomes.size === 2 ? [{ objectiveId, skill }] : [];
    }),
  );

const tieBreakAttemptExists = (
  attempts: PlacementAttempt[],
  contradiction: PlacementContradiction,
) =>
  attempts.some(
    (attempt) =>
      attempt.itemId === placementTieBreakItems[contradiction.objectiveId][contradiction.skill].id,
  );

export const getPlacementTieBreakItems = (attempts: PlacementAttempt[]): PlacementItem[] => {
  const contradictions = getContradictoryPlacementCells(attempts).filter(
    (contradiction) => !tieBreakAttemptExists(attempts, contradiction),
  );
  const contradictionCountByObjective = new Map(
    placementObjectiveIds.map((objectiveId) => [
      objectiveId,
      contradictions.filter((item) => item.objectiveId === objectiveId).length,
    ]),
  );

  return contradictions
    .sort((left, right) => {
      const objectiveDifference =
        (contradictionCountByObjective.get(left.objectiveId) ?? 0) -
        (contradictionCountByObjective.get(right.objectiveId) ?? 0);
      if (objectiveDifference !== 0) return objectiveDifference;
      if (left.skill !== right.skill) return left.skill === 'production' ? -1 : 1;
      return (
        placementObjectiveIds.indexOf(left.objectiveId) -
        placementObjectiveIds.indexOf(right.objectiveId)
      );
    })
    .slice(0, PLACEMENT_MAX_TIE_BREAK_ITEMS)
    .map(({ objectiveId, skill }) => placementTieBreakItems[objectiveId][skill]);
};

const unresolvedContradictionCount = (
  objectiveId: PlacementObjectiveId,
  attempts: PlacementAttempt[],
) =>
  getContradictoryPlacementCells(attempts).filter(
    (contradiction) =>
      contradiction.objectiveId === objectiveId && !tieBreakAttemptExists(attempts, contradiction),
  ).length;

const statusFromEvidence = (
  objectiveId: PlacementObjectiveId,
  attempts: PlacementAttempt[],
  allAttempts: PlacementAttempt[],
): PlacementStatus => {
  if (unresolvedContradictionCount(objectiveId, allAttempts) > 0) return 'insufficient';

  const comprehensionEvidence = attempts.filter(
    (attempt) => attempt.skill === 'comprehension',
  ).length;
  const productionEvidence = attempts.filter((attempt) => attempt.skill === 'production').length;
  if (comprehensionEvidence < 2 || productionEvidence < 2) return 'insufficient';

  const independentCorrect = attempts.filter(
    (attempt) => attempt.correct && !attempt.usedHint,
  ).length;
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const productionIndependent = independentCorrectCount(attempts, 'production');
  const productionCorrect = attempts.filter(
    (attempt) => attempt.skill === 'production' && attempt.correct,
  ).length;
  const hintedCorrect = attempts.filter((attempt) => attempt.correct && attempt.usedHint).length;

  if (independentCorrect >= 4 && productionIndependent >= 2) return 'independent';
  if (correct >= 3 && productionCorrect >= 1 && (hintedCorrect >= 1 || independentCorrect >= 2)) {
    return 'with-hints';
  }
  return 'practice-first';
};

const reasonForStatus = (
  status: PlacementStatus,
  attempts: PlacementAttempt[],
  label: string,
  unresolvedContradictions: number,
) => {
  const independentCorrect = attempts.filter(
    (attempt) => attempt.correct && !attempt.usedHint,
  ).length;
  const hintedCorrect = attempts.filter((attempt) => attempt.correct && attempt.usedHint).length;
  const productionIndependent = independentCorrectCount(attempts, 'production');

  if (status === 'independent') {
    return `${label}已有 ${independentCorrect} 份無提示正確證據，其中 ${productionIndependent} 份來自語塊重組。`;
  }
  if (status === 'with-hints') {
    return `${label}目前有 ${independentCorrect} 份無提示正確與 ${hintedCorrect} 份提示後正確證據，先逐步撤除提示會更穩。`;
  }
  if (status === 'practice-first') {
    return `${label}尚未累積兩份無提示產出成功；建議先理解情境，再用不同題面重組句子。`;
  }
  if (unresolvedContradictions > 0) {
    return `${label}仍有 ${unresolvedContradictions} 組核心證據互相矛盾，且已超出最多兩題的補充確認額度，因此保留為資料不足。`;
  }
  return `${label}的理解或產出證據少於兩題，系統不會用單一題目推定能力。`;
};

const buildEntry = (
  objectiveId: PlacementObjectiveId,
  attempts: PlacementAttempt[],
): PlacementProfileEntry => {
  const objectiveAttempts = attempts.filter((attempt) => attempt.objectiveId === objectiveId);
  const unresolvedContradictions = unresolvedContradictionCount(objectiveId, attempts);
  const status = statusFromEvidence(objectiveId, objectiveAttempts, attempts);
  const label = objectiveLabels[objectiveId];

  return {
    objectiveId,
    label,
    status,
    evidenceCount: objectiveAttempts.length,
    comprehensionEvidence: objectiveAttempts.filter((attempt) => attempt.skill === 'comprehension')
      .length,
    productionEvidence: objectiveAttempts.filter((attempt) => attempt.skill === 'production')
      .length,
    independentCorrect: objectiveAttempts.filter((attempt) => attempt.correct && !attempt.usedHint)
      .length,
    hintedCorrect: objectiveAttempts.filter((attempt) => attempt.correct && attempt.usedHint)
      .length,
    productionIndependentCorrect: independentCorrectCount(objectiveAttempts, 'production'),
    unresolvedContradictions,
    reason: reasonForStatus(status, objectiveAttempts, label, unresolvedContradictions),
  };
};

const statusPriority: Record<PlacementStatus, number> = {
  'practice-first': 0,
  'with-hints': 1,
  insufficient: 2,
  independent: 3,
};

const nextTaskForEntry = (entry: PlacementProfileEntry) => {
  if (entry.status === 'insufficient') {
    return {
      title: `先確認：${entry.label}`,
      reason: '理解與產出還沒有各兩份不同題面的證據；下一步先補短確認題，不急著分級。',
    };
  }

  if (entry.status === 'practice-first') {
    const productionIsWeaker = entry.productionIndependentCorrect < 2;
    return productionIsWeaker
      ? {
          title: `先練：${entry.label}的語塊重組`,
          reason: '你已完成多個情境判斷，但無提示產出證據還不足；下一步從有提示重組逐步撤除提示。',
        }
      : {
          title: `先練：${entry.label}的情境理解`,
          reason: '下一步先看極短情境簡報，再做不同題面的理解題，建立句子與目的的連結。',
        };
  }

  if (entry.status === 'with-hints') {
    return {
      title: `接著練：${entry.label}的無提示變式`,
      reason: '你在提示或部分題型下已能完成；下一步換一個新題面，確認移除提示後仍能使用。',
    };
  }

  return {
    title: '下一步：進入新的生活情境',
    reason: '兩個目標都有多份理解與無提示產出證據；可略過重複示範，但這仍不代表長期掌握。',
  };
};

export const buildPlacementProfile = (
  branch: PlacementBranch,
  attempts: PlacementAttempt[],
): PlacementProfile => {
  const entries = placementObjectiveIds.map((objectiveId) => buildEntry(objectiveId, attempts));
  const weakest = [...entries].sort(
    (left, right) => statusPriority[left.status] - statusPriority[right.status],
  )[0];
  const nextTask = nextTaskForEntry(weakest);
  const independentCount = entries.filter((entry) => entry.status === 'independent').length;
  const milestone =
    independentCount === entries.length
      ? '起步交流'
      : entries.some((entry) => entry.status === 'practice-first')
        ? '開始辨認'
        : '準備交流';

  return {
    branch,
    milestone,
    entries,
    nextTaskTitle: nextTask.title,
    nextTaskReason: nextTask.reason,
  };
};

const sameMultiset = (left: string[], right: string[]) => {
  const normalize = (values: string[]) => [...values].map(normalizeText).sort();
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
};

export const validatePlacementBank = () => {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const item of allPlacementItems) {
    if (ids.has(item.id)) errors.push(`${item.id}: 題目 id 重複`);
    ids.add(item.id);

    if (item.kind === 'choice') {
      if (item.choices.length !== 4) errors.push(`${item.id}: 理解題必須有四個選項`);
      if (new Set(item.choices.map(normalizeText)).size !== item.choices.length) {
        errors.push(`${item.id}: 選項不得重複`);
      }
      if (!item.choices.some((choice) => normalizeText(choice) === normalizeText(item.answer))) {
        errors.push(`${item.id}: 正確答案不在選項中`);
      }
    } else {
      if (!sameMultiset(item.chunks, item.answer)) {
        errors.push(`${item.id}: 重組答案與可用語塊不一致`);
      }
      const lexicalChunkCount = item.chunks.filter((chunk) => !/^[,.!?]$/.test(chunk)).length;
      if (lexicalChunkCount < 4) {
        errors.push(`${item.id}: 重組題至少需要四個非標點語塊`);
      }
      if (item.chunks.some((chunk) => /[.!?]$/.test(chunk) && !/^[.!?]$/.test(chunk))) {
        errors.push(`${item.id}: 標點必須是獨立語塊`);
      }
      if (item.chunks.some((chunk) => /[A-Z]/.test(chunk))) {
        errors.push(`${item.id}: 重組語塊不得以大寫洩漏句首`);
      }
    }
  }

  for (const branch of Object.keys(placementBranchItems) as PlacementBranch[]) {
    const route = getPlacementRoute(branch);
    if (route.length !== PLACEMENT_BASE_ITEM_COUNT) {
      errors.push(`${branch}: 基線路徑必須是 ${PLACEMENT_BASE_ITEM_COUNT} 題`);
    }
    if (new Set(route.map((item) => item.id)).size !== route.length) {
      errors.push(`${branch}: 同一路徑不得重複題目`);
    }
  }

  const confirmationIds = (Object.keys(placementBranchItems) as PlacementBranch[]).map((branch) =>
    getConfirmationPlacementItems(branch)
      .map((item) => item.id)
      .join(','),
  );
  if (new Set(confirmationIds).size !== 1) {
    errors.push('確認題必須在所有分支中保持相同');
  }

  return errors;
};

export const placementItemExists = (itemId: string) => Boolean(placementItemById(itemId));
