import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import {
  buildPlacementProfile,
  createPlacementAttempt,
  determinePlacementBranch,
  getPlacementRoute,
  getPlacementTieBreakItems,
} from '@/placement/engine';
import {
  PLACEMENT_BASE_ITEM_COUNT,
  PLACEMENT_MAX_ITEM_COUNT,
  sharedPlacementItems,
} from '@/placement/items';
import {
  PlacementAttempt,
  PlacementBranch,
  PlacementItem,
  PlacementStatus,
} from '@/placement/types';
import { colors } from '@/theme';

type PlacementPhase = 'intro' | 'questions' | 'profile';

const statusSections: Array<{
  status: PlacementStatus;
  title: string;
  icon: string;
  color: string;
}> = [
  { status: 'independent', title: '已能獨立完成', icon: '✓', color: colors.green },
  { status: 'with-hints', title: '有提示就能完成', icon: '△', color: colors.gold },
  { status: 'practice-first', title: '建議先練', icon: '→', color: '#D7795D' },
  { status: 'insufficient', title: '資料不足', icon: '?', color: colors.muted },
];

const branchLabels: Record<PlacementBranch, string> = {
  'meaning-support': '先確認情境理解',
  'production-support': '先確認句子產出',
  balanced: '平衡確認理解與產出',
};

const answerText = (item: PlacementItem) =>
  item.kind === 'choice' ? item.answer : item.answer.join(' ');

export default function PlacementScreen() {
  const [phase, setPhase] = useState<PlacementPhase>('intro');
  const [route, setRoute] = useState<PlacementItem[]>(sharedPlacementItems);
  const [branch, setBranch] = useState<PlacementBranch>('balanced');
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<PlacementAttempt[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [selectedChunks, setSelectedChunks] = useState<string[]>([]);
  const [usedHint, setUsedHint] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<PlacementAttempt | null>(null);
  const [showReference, setShowReference] = useState(false);

  const item = route[index] ?? sharedPlacementItems[0];
  const profile = useMemo(() => buildPlacementProfile(branch, attempts), [attempts, branch]);

  const resetAnswer = () => {
    setSelectedChoice(null);
    setSelectedChunks([]);
    setUsedHint(false);
    setSubmitted(false);
    setLastAttempt(null);
  };

  const start = () => {
    setPhase('questions');
    setRoute(sharedPlacementItems);
    setBranch('balanced');
    setIndex(0);
    setAttempts([]);
    setShowReference(false);
    resetAnswer();
  };

  const submit = () => {
    const answer = item.kind === 'choice' ? selectedChoice : selectedChunks;
    if (!answer || (Array.isArray(answer) && answer.length !== item.answer.length)) return;

    const attempt = createPlacementAttempt(item, answer, usedHint);
    setAttempts((current) => [...current, attempt]);
    setLastAttempt(attempt);
    setSubmitted(true);
  };

  const continuePlacement = () => {
    if (index === sharedPlacementItems.length - 1 && route.length === sharedPlacementItems.length) {
      const selectedBranch = determinePlacementBranch(attempts);
      setBranch(selectedBranch);
      setRoute(getPlacementRoute(selectedBranch));
      setIndex(index + 1);
      resetAnswer();
      return;
    }

    if (index === PLACEMENT_BASE_ITEM_COUNT - 1 && route.length === PLACEMENT_BASE_ITEM_COUNT) {
      const tieBreakItems = getPlacementTieBreakItems(attempts);
      if (tieBreakItems.length > 0) {
        setRoute((current) => [...current, ...tieBreakItems]);
        setIndex((current) => current + 1);
        resetAnswer();
        return;
      }
    }

    if (index >= route.length - 1) {
      setPhase('profile');
      return;
    }

    setIndex((current) => current + 1);
    resetAnswer();
  };

  if (phase === 'intro') {
    return (
      <Screen style={styles.screen}>
        <View style={styles.introHero}>
          <Text style={styles.kicker}>新手偵察 · 不計勝敗</Text>
          <Text style={styles.introIcon}>⌖</Text>
          <Text style={styles.introTitle}>先找出最適合你的英文起點</Text>
          <Text style={styles.introCopy}>
            這不是考試，也不會影響遊戲資格。我們會用短情境確認你已經會的內容，以及下一步先練什麼。
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>6–10</Text>
            <Text style={styles.summaryLabel}>分鐘</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {PLACEMENT_BASE_ITEM_COUNT}–{PLACEMENT_MAX_ITEM_COUNT}
            </Text>
            <Text style={styles.summaryLabel}>個短情境</Text>
          </View>
          <View style={[styles.summaryItem, styles.summaryItemLast]}>
            <Text style={styles.summaryValue}>2</Text>
            <Text style={styles.summaryLabel}>種作答方式</Text>
          </View>
        </View>

        <View style={styles.intelPanel}>
          <Text style={styles.panelKicker}>偵察方式</Text>
          <Text style={styles.panelTitle}>共同起點 → 調整路線 → 確認能力</Text>
          <Text style={styles.panelCopy}>
            系統會同時看你是否理解情境，以及能不能自己重組短句。每個判斷至少使用兩個不同題面，不會用一次猜中宣稱你已經學會。
          </Text>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleIcon}>◇</Text>
            <Text style={styles.ruleText}>
              需要時可查看繁中提示，不扣分，但會記為「使用提示」。
            </Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleIcon}>◇</Text>
            <Text style={styles.ruleText}>不需打字或錄音，只做四選一與語塊重組。</Text>
          </View>
          <View style={styles.ruleRow}>
            <Text style={styles.ruleIcon}>◇</Text>
            <Text style={styles.ruleText}>
              基線為 12 題；證據互相矛盾時最多追加 2 題。結果離開後不會儲存。
            </Text>
          </View>
        </View>

        <PrimaryButton label="開始英文能力偵察" tone="gold" onPress={start} />
      </Screen>
    );
  }

  if (phase === 'profile') {
    return (
      <Screen style={styles.screen}>
        <View style={styles.profileHero}>
          <Text style={styles.kicker}>偵察完成 · 可解釋能力檔案</Text>
          <Text style={styles.profileTitle}>你的起點：{profile.milestone}</Text>
          <Text style={styles.profileCopy}>
            本次走的是「{branchLabels[profile.branch]}
            」路線。以下判斷只描述兩個生活英文任務，不是正式語言檢定或長期掌握證明。
          </Text>
        </View>

        <View style={styles.snapshotNotice}>
          <Text style={styles.snapshotTitle}>這是本次即時快照，不會儲存</Text>
          <Text style={styles.snapshotText}>
            關閉或重新載入後，本次能力檔案就會消失。這份結果只能安排眼前的下一個任務，不能證明你在
            24 小時後仍保留相同能力。
          </Text>
        </View>

        {statusSections.map((section) => {
          const entries = profile.entries.filter((entry) => entry.status === section.status);
          return (
            <View key={section.status} style={styles.profileSection}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { borderColor: section.color }]}>
                  <Text style={[styles.sectionIconText, { color: section.color }]}>
                    {section.icon}
                  </Text>
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              {entries.length ? (
                entries.map((entry) => (
                  <View key={entry.objectiveId} style={styles.evidenceCard}>
                    <Text style={styles.evidenceTitle}>{entry.label}</Text>
                    <Text style={styles.evidenceMeta}>
                      {entry.comprehensionEvidence} 題理解證據 · {entry.productionEvidence}{' '}
                      題產出證據
                    </Text>
                    <Text style={styles.evidenceReason}>{entry.reason}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>目前沒有項目。</Text>
              )}
            </View>
          );
        })}

        <View style={styles.nextTaskPanel}>
          <Text style={styles.panelKicker}>推薦下一個學習任務</Text>
          <Text style={styles.nextTaskTitle}>{profile.nextTaskTitle}</Text>
          <Text style={styles.panelCopy}>{profile.nextTaskReason}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="這個里程碑代表什麼"
          onPress={() => setShowReference((current) => !current)}
          style={styles.referenceButton}
        >
          <Text style={styles.referenceButtonText}>
            {showReference ? '收起參考說明' : '這個里程碑代表什麼？'}
          </Text>
        </Pressable>
        {showReference && (
          <View style={styles.referencePanel}>
            <Text style={styles.referenceTitle}>能力框架參考</Text>
            <Text style={styles.referenceText}>
              「{profile.milestone}」約用來描述 CEFR Pre-A1–A1
              的部分生活溝通任務。它只根據本次有限題目提供課程起點，不是正式 CEFR
              認證、總等級或長期能力證明。
            </Text>
          </View>
        )}

        <PrimaryButton label="返回主城查看建議路線" onPress={() => router.replace('/')} />
        <Pressable accessibilityRole="button" onPress={start} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>重新進行偵察</Text>
        </Pressable>
      </Screen>
    );
  }

  const stageLabel =
    index < 4 ? '共同起點' : index < 8 ? '調整路線' : index < 12 ? '確認能力' : '補充確認';
  const displayedItemCount =
    route.length === sharedPlacementItems.length ? PLACEMENT_BASE_ITEM_COUNT : route.length;
  const pendingTieBreakCount =
    submitted && index === PLACEMENT_BASE_ITEM_COUNT - 1
      ? getPlacementTieBreakItems(attempts).length
      : 0;
  const isFinalQuestion =
    route.length !== sharedPlacementItems.length && index === route.length - 1;
  const canSubmit =
    item.kind === 'choice' ? Boolean(selectedChoice) : selectedChunks.length === item.answer.length;
  const remainingChunks =
    item.kind === 'reorder' ? item.chunks.filter((chunk) => !selectedChunks.includes(chunk)) : [];

  return (
    <Screen style={styles.screen}>
      <View style={styles.questionHeader}>
        <View>
          <Text style={styles.kicker}>{stageLabel}</Text>
          <Text style={styles.questionCount}>
            第 {index + 1} 題 / {displayedItemCount}
          </Text>
        </View>
        <Text style={styles.skillBadge}>
          {item.skill === 'comprehension' ? '情境理解' : '語塊重組'}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        {Array.from({ length: displayedItemCount }).map((_, progressIndex) => (
          <View
            key={progressIndex}
            style={[styles.progressSegment, progressIndex <= index && styles.progressSegmentActive]}
          />
        ))}
      </View>

      <View style={styles.promptPanel}>
        <Text style={styles.promptLabel}>繁中情境</Text>
        <Text style={styles.promptZh}>{item.promptZh}</Text>
        <View style={styles.englishPrompt}>
          <Text style={styles.promptLabel}>英文任務</Text>
          <Text style={styles.promptEn}>{item.promptEn}</Text>
        </View>
      </View>

      {item.kind === 'choice' ? (
        <View style={styles.choiceList}>
          {item.choices.map((choice, choiceIndex) => (
            <Pressable
              key={choice}
              accessibilityRole="button"
              disabled={submitted}
              onPress={() => setSelectedChoice(choice)}
              style={[
                styles.choice,
                selectedChoice === choice && styles.choiceSelected,
                submitted && choice === item.answer && styles.choiceCorrect,
                submitted &&
                  selectedChoice === choice &&
                  choice !== item.answer &&
                  styles.choiceWrong,
              ]}
            >
              <Text style={styles.choiceLetter}>{String.fromCharCode(65 + choiceIndex)}</Text>
              <Text style={styles.choiceText}>{choice}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.reorderPanel}>
          <Text style={styles.reorderLabel}>你的句子</Text>
          <View style={styles.answerSlots}>
            {selectedChunks.length ? (
              selectedChunks.map((chunk, chunkIndex) => (
                <Pressable
                  key={`${chunk}-${chunkIndex}`}
                  accessibilityRole="button"
                  disabled={submitted}
                  onPress={() =>
                    setSelectedChunks((current) =>
                      current.filter((_, selectedIndex) => selectedIndex !== chunkIndex),
                    )
                  }
                  style={styles.selectedChunk}
                >
                  <Text style={styles.selectedChunkText}>{chunk}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.slotPlaceholder}>依序點選下方英文語塊</Text>
            )}
          </View>
          <View style={styles.chunkBank}>
            {remainingChunks.map((chunk) => (
              <Pressable
                key={chunk}
                accessibilityRole="button"
                disabled={submitted}
                onPress={() => setSelectedChunks((current) => [...current, chunk])}
                style={styles.chunk}
              >
                <Text style={styles.chunkText}>{chunk}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {!submitted && (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setUsedHint(true)}
            style={[styles.hintButton, usedHint && styles.hintButtonUsed]}
          >
            <Text style={styles.hintButtonText}>{usedHint ? '已查看提示' : '查看繁中提示'}</Text>
          </Pressable>
          {usedHint && <Text style={styles.hintText}>{item.hintZh}</Text>}
          <PrimaryButton label="確認答案" disabled={!canSubmit} onPress={submit} />
        </>
      )}

      {submitted && lastAttempt && (
        <View
          style={[
            styles.feedback,
            lastAttempt.correct ? styles.feedbackCorrect : styles.feedbackWrong,
          ]}
        >
          <Text style={styles.feedbackTitle}>
            {lastAttempt.correct ? '答對了' : '這一題需要再練'}
          </Text>
          {!lastAttempt.correct && (
            <Text style={styles.correctAnswer}>正確答案：{answerText(item)}</Text>
          )}
          <Text style={styles.feedbackText}>{item.feedbackZh}</Text>
          <Text style={styles.feedbackMeta}>
            {lastAttempt.usedHint ? '本題記錄：使用提示' : '本題記錄：無提示作答'}
          </Text>
          <PrimaryButton
            label={
              pendingTieBreakCount > 0
                ? `進入 ${pendingTieBreakCount} 題補充確認`
                : isFinalQuestion
                  ? '查看能力檔案'
                  : '前往下一題'
            }
            tone={lastAttempt.correct ? 'gold' : 'red'}
            onPress={continuePlacement}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 12 },
  kicker: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  introHero: {
    alignItems: 'center',
    backgroundColor: '#172625',
    borderWidth: 1,
    borderColor: '#50655A',
    padding: 24,
    gap: 9,
  },
  introIcon: { color: colors.gold, fontSize: 54, lineHeight: 60 },
  introTitle: { color: colors.ink, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  introCopy: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  summaryGrid: { flexDirection: 'row', backgroundColor: colors.card, paddingVertical: 14 },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  summaryItemLast: { borderRightWidth: 0 },
  summaryValue: { color: colors.gold, fontSize: 22, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  intelPanel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 17,
    gap: 9,
  },
  panelKicker: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  panelTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  panelCopy: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  ruleRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  ruleIcon: { color: colors.gold, fontSize: 17, fontWeight: '900' },
  ruleText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 20 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionCount: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 3 },
  skillBadge: {
    color: '#FFE4A7',
    backgroundColor: colors.blueDark,
    borderWidth: 1,
    borderColor: colors.blue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '900',
  },
  progressTrack: { flexDirection: 'row', gap: 4 },
  progressSegment: { flex: 1, height: 5, backgroundColor: '#33403E', borderRadius: 4 },
  progressSegmentActive: { backgroundColor: colors.gold },
  promptPanel: {
    backgroundColor: colors.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    padding: 17,
    gap: 8,
  },
  promptLabel: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  promptZh: { color: colors.ink, fontSize: 16, lineHeight: 25, fontWeight: '700' },
  englishPrompt: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 6 },
  promptEn: { color: '#FFF0C6', fontSize: 19, lineHeight: 27, fontWeight: '800' },
  choiceList: { gap: 10 },
  choice: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  choiceSelected: { borderColor: colors.gold, backgroundColor: '#3A3424' },
  choiceCorrect: { borderColor: colors.green, backgroundColor: colors.greenDark },
  choiceWrong: { borderColor: '#D7795D', backgroundColor: colors.redDark },
  choiceLetter: { color: colors.gold, fontSize: 12, fontWeight: '900' },
  choiceText: { flex: 1, color: colors.ink, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  reorderPanel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    gap: 12,
  },
  reorderLabel: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  answerSlots: {
    minHeight: 72,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    gap: 8,
    backgroundColor: '#111A1E',
    borderWidth: 1,
    borderColor: '#59605A',
    padding: 10,
  },
  slotPlaceholder: { color: '#858B82', fontSize: 13 },
  selectedChunk: {
    backgroundColor: colors.gold,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 5,
  },
  selectedChunkText: { color: '#191B17', fontSize: 15, fontWeight: '900' },
  chunkBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chunk: {
    backgroundColor: '#2D4440',
    borderWidth: 1,
    borderColor: colors.blue,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 5,
  },
  chunkText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  hintButton: {
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.gold,
    paddingVertical: 4,
  },
  hintButtonUsed: { borderBottomColor: colors.muted },
  hintButtonText: { color: colors.gold, fontSize: 13, fontWeight: '800' },
  hintText: {
    color: colors.ink,
    backgroundColor: '#283633',
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
  },
  feedback: { borderWidth: 1, padding: 16, gap: 8 },
  feedbackCorrect: { backgroundColor: colors.greenDark, borderColor: colors.green },
  feedbackWrong: { backgroundColor: colors.redDark, borderColor: '#D7795D' },
  feedbackTitle: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  correctAnswer: { color: '#FFE1A6', fontSize: 15, lineHeight: 22, fontWeight: '800' },
  feedbackText: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  feedbackMeta: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  profileHero: {
    backgroundColor: '#172625',
    borderWidth: 1,
    borderColor: '#50655A',
    padding: 20,
    gap: 7,
  },
  profileTitle: { color: colors.ink, fontSize: 27, fontWeight: '900' },
  profileCopy: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  snapshotNotice: {
    backgroundColor: '#3A3022',
    borderWidth: 1,
    borderColor: colors.gold,
    padding: 14,
    gap: 5,
  },
  snapshotTitle: { color: '#FFE1A6', fontSize: 15, fontWeight: '900' },
  snapshotText: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  profileSection: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    gap: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: {
    width: 30,
    height: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconText: { fontSize: 17, fontWeight: '900' },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  evidenceCard: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, gap: 4 },
  evidenceTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  evidenceMeta: { color: colors.gold, fontSize: 10, fontWeight: '800' },
  evidenceReason: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  emptyText: { color: '#81877F', fontSize: 12 },
  nextTaskPanel: {
    backgroundColor: '#26352D',
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    padding: 18,
    gap: 7,
  },
  nextTaskTitle: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  referenceButton: { alignSelf: 'flex-start', paddingVertical: 6 },
  referenceButtonText: { color: colors.gold, fontSize: 13, fontWeight: '900' },
  referencePanel: {
    backgroundColor: '#222E2D',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 5,
  },
  referenceTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  referenceText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  secondaryButton: { alignSelf: 'center', padding: 10 },
  secondaryButtonText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
});
