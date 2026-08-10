import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { questionById } from '@/data/questions';
import { territoryById } from '@/data/territories';
import { useGameStore } from '@/store/game';
import { evaluateChallenge } from '@/store/progress';
import { colors } from '@/theme';

export default function ResultScreen() {
  const { activeTerritoryId, mode, attempts, commitResult, resetSession } = useGameStore();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (activeTerritoryId && mode && attempts.length)
      void commitResult().then(() => setSaved(true));
  }, [activeTerritoryId, attempts.length, commitResult, mode]);
  const territory = territoryById(activeTerritoryId);
  if (!territory || !mode || !attempts.length) return <Redirect href="/" />;
  const { correctCount, incorrectIds, passed } = evaluateChallenge(mode, attempts);
  const done = () => {
    resetSession();
    router.replace('/');
  };

  return (
    <Screen>
      <View style={[styles.victory, !passed && styles.defeat]}>
        <Text style={styles.victoryKicker}>{passed ? '戰役勝利' : '整隊再戰'}</Text>
        <Text style={styles.sigil}>{passed ? '◆' : '◇'}</Text>
        <Text style={styles.title}>
          {passed
            ? mode === 'conquest'
              ? '成功插旗'
              : '巡邏完成'
            : mode === 'conquest'
              ? '防線未破'
              : '巡邏待續'}
        </Text>
        <Text style={styles.subtitle}>
          {passed
            ? mode === 'conquest'
              ? `${territory.name}領地 · 已占領`
              : `${territory.name}巡邏線 · 已穩固`
            : `${territory.name}錯題 · 已記入巡邏簿`}
        </Text>
      </View>
      <View style={styles.scorePanel}>
        <Text style={styles.scoreLabel}>作答戰績</Text>
        <Text style={styles.score}>
          {correctCount}
          <Text style={styles.scoreSmall}> / {attempts.length}</Text>
        </Text>
        <Text style={styles.scoreCopy}>
          {incorrectIds.length
            ? mode === 'conquest'
              ? `有 ${incorrectIds.length} 題答錯，已加入${territory.name}巡邏簿。請查看下方中文解析。`
              : `仍有 ${incorrectIds.length} 題需要巡邏複習。請查看下方中文解析。`
            : '全部答對！本次沒有新增複習題目。'}
        </Text>
      </View>
      <View style={styles.report}>
        {attempts.map((attempt, index) => {
          const question = questionById(attempt.questionId);
          return (
            <View key={attempt.questionId} style={styles.row}>
              <View style={[styles.mark, !attempt.correct && styles.markWrong]}>
                <Text style={styles.markText}>{attempt.correct ? '✓' : '×'}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowKicker}>第 {index + 1} 題</Text>
                <Text style={styles.rowTitle}>{attempt.selected}</Text>
                {!attempt.correct && <Text style={styles.tip}>{question?.tip}</Text>}
              </View>
            </View>
          );
        })}
      </View>
      <PrimaryButton
        disabled={!saved}
        label={saved ? '返回主城' : '正在保存戰役結果…'}
        onPress={done}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  victory: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A68445',
    backgroundColor: '#344A39',
    padding: 22,
    gap: 5,
  },
  defeat: { backgroundColor: '#4D302C', borderColor: '#925044' },
  victoryKicker: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 2.2 },
  sigil: { color: '#F0CE77', fontSize: 42, lineHeight: 45 },
  title: { color: '#FFF0C9', fontSize: 31, fontWeight: '900' },
  subtitle: {
    color: '#D5C9A8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  scorePanel: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
  },
  scoreLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  score: { color: colors.gold, fontSize: 48, lineHeight: 53, fontWeight: '900' },
  scoreSmall: { color: colors.muted, fontSize: 22 },
  scoreCopy: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  report: { gap: 9 },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.card,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.line,
  },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: colors.greenDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#729778',
  },
  markWrong: { backgroundColor: colors.redDark, borderColor: '#B46B5A' },
  markText: { color: '#FFE9B7', fontSize: 20, fontWeight: '900' },
  rowBody: { flex: 1, gap: 3 },
  rowKicker: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  rowTitle: { color: colors.ink, fontWeight: '800' },
  tip: { color: '#E28D76', lineHeight: 19, fontSize: 12 },
});
