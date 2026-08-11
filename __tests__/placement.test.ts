import {
  buildPlacementProfile,
  createPlacementAttempt,
  determinePlacementBranch,
  getConfirmationPlacementItems,
  getContradictoryPlacementCells,
  getPlacementRoute,
  getPlacementTieBreakItems,
  isPlacementAnswerCorrect,
  validatePlacementBank,
} from '../src/placement/engine';
import {
  PLACEMENT_BASE_ITEM_COUNT,
  PLACEMENT_MAX_ITEM_COUNT,
  placementItemById,
  sharedPlacementItems,
} from '../src/placement/items';
import { PlacementAttempt, PlacementBranch } from '../src/placement/types';

const attemptsForRoute = (
  branch: PlacementBranch,
  decide: (
    itemId: string,
    skill: 'comprehension' | 'production',
  ) => {
    correct: boolean;
    usedHint?: boolean;
  },
): PlacementAttempt[] =>
  getPlacementRoute(branch).map((item) => {
    const result = decide(item.id, item.skill);
    return {
      itemId: item.id,
      objectiveId: item.objectiveId,
      skill: item.skill,
      correct: result.correct,
      usedHint: result.usedHint ?? false,
    };
  });

describe('placement content and routing', () => {
  it('validates the item bank and every 12-item path', () => {
    expect(validatePlacementBank()).toEqual([]);
    for (const branch of ['meaning-support', 'production-support', 'balanced'] as const) {
      const route = getPlacementRoute(branch);
      expect(route).toHaveLength(12);
      expect(new Set(route.map((item) => item.id)).size).toBe(12);
      expect(route.slice(0, 4).map((item) => item.id)).toEqual(
        sharedPlacementItems.map((item) => item.id),
      );
    }
  });

  it('keeps the same confirmation items in every branch', () => {
    const confirmationSets = (['meaning-support', 'production-support', 'balanced'] as const).map(
      (branch) => getConfirmationPlacementItems(branch).map((item) => item.id),
    );

    expect(confirmationSets[1]).toEqual(confirmationSets[0]);
    expect(confirmationSets[2]).toEqual(confirmationSets[0]);
  });

  it('requires at least four non-punctuation chunks in every reorder item', () => {
    for (const branch of ['meaning-support', 'production-support', 'balanced'] as const) {
      for (const item of getPlacementRoute(branch)) {
        if (item.kind !== 'reorder') continue;
        expect(
          item.chunks.filter((chunk) => !/^[,.!?]$/.test(chunk)).length,
        ).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('adds at most two targeted items when core evidence contradicts itself', () => {
    const contradictoryIds = new Set([
      'confirm-greeting-understand-afternoon',
      'confirm-greeting-produce-later',
      'confirm-request-understand-eraser',
    ]);
    const attempts = attemptsForRoute('balanced', (itemId) => ({
      correct: !contradictoryIds.has(itemId),
    }));

    expect(getContradictoryPlacementCells(attempts)).toHaveLength(3);
    const tieBreakItems = getPlacementTieBreakItems(attempts);
    expect(tieBreakItems).toHaveLength(2);
    expect(new Set(tieBreakItems.map((item) => item.id)).size).toBe(2);
    expect(PLACEMENT_BASE_ITEM_COUNT + tieBreakItems.length).toBeLessThanOrEqual(
      PLACEMENT_MAX_ITEM_COUNT,
    );
  });

  it('does not add extra items when the core evidence agrees', () => {
    const attempts = attemptsForRoute('balanced', () => ({ correct: true }));
    expect(getContradictoryPlacementCells(attempts)).toEqual([]);
    expect(getPlacementTieBreakItems(attempts)).toEqual([]);
  });

  it('checks both choice and reorder answers without case tricks', () => {
    const choice = placementItemById('shared-greeting-understand-morning');
    const reorder = placementItemById('shared-greeting-produce-morning');
    expect(choice && isPlacementAnswerCorrect(choice, 'good morning!')).toBe(true);
    expect(
      reorder &&
        isPlacementAnswerCorrect(reorder, ['good', 'morning', ',', 'how', 'are', 'you', '?']),
    ).toBe(true);
    expect(
      reorder &&
        isPlacementAnswerCorrect(reorder, ['morning', 'good', ',', 'how', 'are', 'you', '?']),
    ).toBe(false);
  });

  it('routes to meaning support from two weaker comprehension evidences', () => {
    const attempts = sharedPlacementItems.map((item) => ({
      itemId: item.id,
      objectiveId: item.objectiveId,
      skill: item.skill,
      correct: item.skill === 'production',
      usedHint: false,
    }));
    expect(determinePlacementBranch(attempts)).toBe('meaning-support');
  });

  it('routes to production support from two weaker production evidences', () => {
    const attempts = sharedPlacementItems.map((item) => ({
      itemId: item.id,
      objectiveId: item.objectiveId,
      skill: item.skill,
      correct: item.skill === 'comprehension',
      usedHint: false,
    }));
    expect(determinePlacementBranch(attempts)).toBe('production-support');
  });

  it('uses a balanced branch when comprehension and production evidence agree', () => {
    const attempts = sharedPlacementItems.map((item) => ({
      itemId: item.id,
      objectiveId: item.objectiveId,
      skill: item.skill,
      correct: true,
      usedHint: false,
    }));
    expect(determinePlacementBranch(attempts)).toBe('balanced');
  });

  it.each([
    ['all answers are wrong', false, false],
    ['all correct answers use hints', true, true],
  ])('routes to meaning support when %s', (_label, correct, usedHint) => {
    const attempts = sharedPlacementItems.map((item) => ({
      itemId: item.id,
      objectiveId: item.objectiveId,
      skill: item.skill,
      correct,
      usedHint,
    }));

    expect(determinePlacementBranch(attempts)).toBe('meaning-support');
  });

  it('records hint use separately from correctness', () => {
    const item = placementItemById('shared-request-understand-pencil');
    if (!item || item.kind !== 'choice') throw new Error('missing test item');
    expect(createPlacementAttempt(item, item.answer, true)).toMatchObject({
      correct: true,
      usedHint: true,
      objectiveId: 'request',
      skill: 'comprehension',
    });
  });
});

describe('placement profile evidence rules', () => {
  it('marks both objectives independent only with multiple unhinted production evidences', () => {
    const attempts = attemptsForRoute('balanced', () => ({ correct: true }));
    const profile = buildPlacementProfile('balanced', attempts);
    expect(profile.entries.map((entry) => entry.status)).toEqual(['independent', 'independent']);
    expect(profile.entries.every((entry) => entry.productionIndependentCorrect >= 2)).toBe(true);
    expect(profile.milestone).toBe('起步交流');
  });

  it('does not declare independence from lucky multiple-choice answers', () => {
    const attempts = attemptsForRoute('balanced', (_itemId, skill) => ({
      correct: skill === 'comprehension',
    }));
    const profile = buildPlacementProfile('balanced', attempts);
    expect(profile.entries.every((entry) => entry.status !== 'independent')).toBe(true);
    expect(profile.entries.every((entry) => entry.productionIndependentCorrect === 0)).toBe(true);
  });

  it('distinguishes evidence completed with hints', () => {
    const attempts = attemptsForRoute('balanced', (_itemId, skill) => ({
      correct: true,
      usedHint: skill === 'production',
    }));
    const profile = buildPlacementProfile('balanced', attempts);
    expect(profile.entries.map((entry) => entry.status)).toEqual(['with-hints', 'with-hints']);
    expect(profile.nextTaskTitle).toContain('無提示變式');
  });

  it('does not assign with-hints without any hint-assisted correct evidence', () => {
    const branchProductionIds = new Set([
      'balanced-greeting-produce-meet',
      'balanced-request-produce-help',
    ]);
    const attempts = attemptsForRoute('balanced', (itemId, skill) => ({
      correct: skill === 'comprehension' || branchProductionIds.has(itemId),
      usedHint: false,
    }));
    const profile = buildPlacementProfile('balanced', attempts);

    expect(profile.entries.map((entry) => entry.hintedCorrect)).toEqual([0, 0]);
    expect(profile.entries.map((entry) => entry.productionIndependentCorrect)).toEqual([1, 1]);
    expect(profile.entries.map((entry) => entry.status)).toEqual([
      'practice-first',
      'practice-first',
    ]);
    expect(profile.nextTaskTitle).toContain('語塊重組');
  });

  it('recommends production practice when understanding outpaces production', () => {
    const attempts = attemptsForRoute('production-support', (_itemId, skill) => ({
      correct: skill === 'comprehension',
    }));
    const profile = buildPlacementProfile('production-support', attempts);
    expect(profile.entries.map((entry) => entry.status)).toEqual([
      'practice-first',
      'practice-first',
    ]);
    expect(profile.nextTaskTitle).toContain('語塊重組');
  });

  it('returns insufficient data when either dimension has fewer than two items', () => {
    const partial = attemptsForRoute('balanced', () => ({ correct: true })).filter(
      (attempt) => attempt.objectiveId === 'greeting' && attempt.skill === 'comprehension',
    );
    const profile = buildPlacementProfile('balanced', partial);
    expect(profile.entries.find((entry) => entry.objectiveId === 'greeting')?.status).toBe(
      'insufficient',
    );
    expect(profile.nextTaskTitle).toContain('先確認');
  });

  it('keeps unresolved contradictions as insufficient after the two-item budget is used', () => {
    const contradictoryIds = new Set([
      'confirm-greeting-understand-afternoon',
      'confirm-greeting-produce-later',
      'confirm-request-understand-eraser',
    ]);
    const baselineAttempts = attemptsForRoute('balanced', (itemId) => ({
      correct: !contradictoryIds.has(itemId),
    }));
    const tieBreakAttempts = getPlacementTieBreakItems(baselineAttempts).map((item) => ({
      itemId: item.id,
      objectiveId: item.objectiveId,
      skill: item.skill,
      correct: true,
      usedHint: false,
    }));
    const profile = buildPlacementProfile('balanced', [...baselineAttempts, ...tieBreakAttempts]);

    expect(profile.entries.some((entry) => entry.unresolvedContradictions > 0)).toBe(true);
    expect(
      profile.entries
        .filter((entry) => entry.unresolvedContradictions > 0)
        .every((entry) => entry.status === 'insufficient'),
    ).toBe(true);
  });
});
