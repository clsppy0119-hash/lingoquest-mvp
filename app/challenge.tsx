import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { questionById } from '@/data/questions';
import { useGameStore } from '@/store/game';
import { colors } from '@/theme';

export default function ChallengeScreen() {
  const { mode, questionIds, attempts, answer } = useGameStore();
  if (!mode || !questionIds.length) return <Redirect href="/territory" />;
  const index = attempts.length;
  if (index >= questionIds.length) return <Redirect href="/result" />;
  const question = questionById(questionIds[index]);
  if (!question) return <Redirect href="/territory" />;
  const choose = (choice: string) => { answer(question.id, choice); if (index + 1 >= questionIds.length) router.replace('/result'); };

  return <Screen>
    <View style={styles.battleHeader}>
      <View><Text style={styles.kicker}>{mode === 'conquest' ? 'SCHOOL FRONT · ATTACK' : 'SCHOOL FRONT · PATROL'}</Text><Text style={styles.title}>Issue Your Order</Text></View>
      <View style={styles.round}><Text style={styles.roundTop}>ORDER</Text><Text style={styles.roundValue}>{index + 1}/{questionIds.length}</Text></View>
    </View>
    <View style={styles.frontLine}><View style={styles.capital}><Text style={styles.unitIcon}>♜</Text><Text style={styles.unitName}>YOUR BANNER</Text></View><View style={styles.clash}><View style={[styles.track, { width: `${((index + 1) / questionIds.length) * 100}%` }]} /><Text style={styles.swords}>⚔</Text></View><View style={styles.enemy}><Text style={styles.unitIcon}>⌂</Text><Text style={styles.unitName}>SCHOOL</Text></View></View>
    <View style={styles.orderPanel}>
      <Text style={styles.orderLabel}>TACTICAL ENGLISH ORDER</Text>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.choices}>{question.choices.map((choice, choiceIndex) => <Pressable accessibilityRole="button" key={choice} onPress={() => choose(choice)} style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}><Text style={styles.choiceMark}>{String.fromCharCode(65 + choiceIndex)}</Text><Text style={styles.choiceText}>{choice}</Text><Text style={styles.choiceArrow}>›</Text></Pressable>)}</View>
    </View>
    <Text style={styles.hint}>Select the command that advances your company.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  battleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3, borderLeftColor: colors.red, paddingLeft: 12 }, kicker: { color: '#D88970', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, title: { color: colors.ink, fontSize: 27, fontWeight: '900', marginTop: 2 }, round: { width: 55, height: 55, borderWidth: 1, borderColor: colors.goldDark, alignItems: 'center', justifyContent: 'center', backgroundColor: '#192427' }, roundTop: { color: colors.muted, fontSize: 8, fontWeight: '900' }, roundValue: { color: colors.gold, fontWeight: '900', fontSize: 17 },
  frontLine: { height: 120, flexDirection: 'row', alignItems: 'center', backgroundColor: '#253A34', borderWidth: 1, borderColor: '#55604F', paddingHorizontal: 14 }, capital: { width: 88, alignItems: 'center' }, enemy: { width: 75, alignItems: 'center' }, unitIcon: { color: '#EACB82', fontSize: 43, lineHeight: 48 }, unitName: { color: '#DAD2B8', fontSize: 7, fontWeight: '900', letterSpacing: 1 }, clash: { flex: 1, height: 42, justifyContent: 'center', backgroundColor: '#172522', borderWidth: 1, borderColor: '#46524A', overflow: 'hidden' }, track: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#86513F' }, swords: { color: '#FFE29A', fontSize: 25, textAlign: 'center' },
  orderPanel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 17 }, orderLabel: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 }, prompt: { color: colors.ink, fontSize: 25, lineHeight: 33, fontWeight: '900' }, choices: { gap: 10 }, choice: { minHeight: 61, flexDirection: 'row', alignItems: 'center', backgroundColor: '#263437', borderWidth: 1, borderColor: '#58605B' }, choicePressed: { borderColor: colors.gold, backgroundColor: '#39443D', transform: [{ translateX: 2 }] }, choiceMark: { width: 47, alignSelf: 'stretch', textAlign: 'center', textAlignVertical: 'center', paddingTop: 20, backgroundColor: '#172224', color: colors.gold, fontWeight: '900' }, choiceText: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '700', paddingHorizontal: 13 }, choiceArrow: { color: colors.gold, fontSize: 26, marginRight: 13 }, hint: { marginTop: 'auto', color: colors.muted, textAlign: 'center', fontSize: 11, letterSpacing: 0.4 },
});
