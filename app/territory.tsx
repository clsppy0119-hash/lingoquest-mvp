import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { territories, territoryById } from '@/data/territories';
import { useGameStore } from '@/store/game';
import { ChallengeMode, CONQUEST_MIN_CORRECT, isTerritoryUnlocked } from '@/store/progress';
import { colors } from '@/theme';

export default function TerritoryScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const requestedId = Array.isArray(params.id) ? params.id[0] : params.id;
  const territory = territoryById(requestedId) ?? territories[0];
  const { territoryLevels, reviewQueues, begin } = useGameStore();
  const progress = { territoryLevels, reviewQueues };
  const occupied = territoryLevels[territory.id] > 0;
  const unlocked = isTerritoryUnlocked(progress, territory.id);
  const reviewQueue = reviewQueues[territory.id];
  const prerequisite = territoryById(territory.prerequisiteId);

  const launch = (mode: ChallengeMode) => {
    if (begin(territory.id, mode)) router.push('/challenge');
  };

  const statusLabel = occupied ? '◆ 已插旗占領' : unlocked ? '⚔ 可發動進攻' : '◆ 戰區尚未解鎖';
  const originName = prerequisite?.name ?? '主城';
  const originIcon = prerequisite?.icon ?? '♜';

  return (
    <Screen>
      <View style={styles.theaterHeader}>
        <Text style={styles.theaterKicker}>{territory.region}</Text>
        <Text style={styles.theaterTitle}>{territory.name}領地</Text>
        <Text style={styles.englishName}>{territory.englishName}</Text>
        <View
          style={[
            styles.statusPlate,
            occupied && styles.statusOccupied,
            !unlocked && styles.statusLocked,
          ]}
        >
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.routeMap}>
        <View style={styles.routeTerrainOne} />
        <View style={styles.routeTerrainTwo} />
        <View style={styles.routeRiver} />
        <View style={styles.origin}>
          <Text style={styles.originIcon}>{originIcon}</Text>
          <Text style={styles.nodeLabel}>{originName}</Text>
        </View>
        <View style={styles.routeLine}>
          <Text style={[styles.routeArrows, !unlocked && styles.routeLocked]}>› › › ›</Text>
        </View>
        <View
          style={[
            styles.target,
            occupied && styles.targetOccupied,
            !unlocked && styles.targetLocked,
          ]}
        >
          <Text style={[styles.targetIcon, !unlocked && styles.targetIconLocked]}>
            {unlocked ? territory.icon : '◆'}
          </Text>
          <Text style={styles.targetName}>{territory.name}</Text>
          <Text style={styles.targetLevel}>{territory.chapter}</Text>
        </View>
        <View style={styles.distance}>
          <Text style={styles.distanceText}>行軍時間 · {territory.marchTime}</Text>
        </View>
      </View>

      <View style={styles.scenarioPanel}>
        <Text style={styles.scenarioKicker}>本區英文任務</Text>
        <Text style={styles.scenarioTitle}>{territory.scenario}</Text>
        <Text style={styles.scenarioCopy}>{territory.conquestBrief}</Text>
      </View>

      <View style={styles.intelPanel}>
        <View style={styles.intelHeader}>
          <Text style={styles.intelMark}>戰區情報</Text>
          <Text style={styles.intelState}>
            {occupied ? '我方控制' : unlocked ? '進攻目標' : '前線封鎖'}
          </Text>
        </View>
        <Text style={styles.intelTitle}>
          {occupied ? '駐軍簡報' : unlocked ? '勝利條件' : '解鎖條件'}
        </Text>
        <Text style={styles.copy}>
          {occupied
            ? reviewQueue.length
              ? `巡邏簿中還有 ${reviewQueue.length} 題錯題。每題重新答對後即可完成巡邏。`
              : '領地安全，巡邏簿目前沒有待複習題目。'
            : unlocked
              ? `挑戰共有 ${territory.questionIds.length} 題英文題目，至少答對 ${CONQUEST_MIN_CORRECT} 題即可占領領地。`
              : `先占領${prerequisite?.name ?? '前一領地'}，才能開通通往${territory.name}的行軍路線。`}
        </Text>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{territory.questionIds.length}</Text>
            <Text style={styles.statLabel}>題目</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{CONQUEST_MIN_CORRECT}</Text>
            <Text style={styles.statLabel}>通關</Text>
          </View>
          <View style={[styles.stat, styles.statLast]}>
            <Text style={styles.statValue}>{reviewQueue.length}</Text>
            <Text style={styles.statLabel}>待複習</Text>
          </View>
        </View>
      </View>

      <View style={[styles.dispatch, !unlocked && styles.dispatchLocked]}>
        <Text style={styles.dispatchKicker}>
          {occupied ? '巡邏命令' : unlocked ? '進軍命令' : '解鎖命令'}
        </Text>
        <Text style={styles.dispatchBody}>
          {occupied
            ? territory.patrolBrief
            : unlocked
              ? `派出語言部隊完成三題${territory.scenario}挑戰，占領${territory.name}。`
              : `返回戰略地圖，先完成${prerequisite?.name ?? '前線'}征服。`}
        </Text>
      </View>

      {!unlocked ? (
        <PrimaryButton
          label={`占領${prerequisite?.name ?? '前線'}後解鎖`}
          disabled
          onPress={() => undefined}
        />
      ) : occupied ? (
        <PrimaryButton
          label={reviewQueue.length ? `開始巡邏 · ${reviewQueue.length} 題` : '巡邏簿已清空'}
          disabled={!reviewQueue.length}
          onPress={() => launch('patrol')}
        />
      ) : (
        <PrimaryButton label="發動進攻" tone="red" onPress={() => launch('conquest')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  theaterHeader: { borderLeftWidth: 3, borderLeftColor: colors.gold, paddingLeft: 13, gap: 4 },
  theaterKicker: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  theaterTitle: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  englishName: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  statusPlate: {
    alignSelf: 'flex-start',
    backgroundColor: colors.redDark,
    borderWidth: 1,
    borderColor: '#A95C4D',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusOccupied: { backgroundColor: colors.greenDark, borderColor: '#6E9A70' },
  statusLocked: { backgroundColor: '#303A3A', borderColor: '#626B68' },
  statusText: { color: '#F7DEAA', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  routeMap: {
    height: 230,
    backgroundColor: colors.terrain,
    borderWidth: 1,
    borderColor: '#656955',
    overflow: 'hidden',
    position: 'relative',
  },
  routeTerrainOne: {
    position: 'absolute',
    width: 170,
    height: 150,
    borderRadius: 100,
    backgroundColor: '#526D4D',
    top: -65,
    right: -30,
  },
  routeTerrainTwo: {
    position: 'absolute',
    width: 190,
    height: 130,
    borderRadius: 100,
    backgroundColor: '#304E3C',
    bottom: -70,
    left: 70,
  },
  routeRiver: {
    position: 'absolute',
    width: 45,
    height: 320,
    backgroundColor: colors.water,
    transform: [{ rotate: '32deg' }],
    left: 175,
    top: -50,
  },
  origin: { position: 'absolute', left: 31, top: 77, alignItems: 'center' },
  originIcon: { color: '#E9CF8B', fontSize: 54, lineHeight: 59 },
  nodeLabel: {
    color: '#F4E4B9',
    fontSize: 8,
    backgroundColor: '#1D2926',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontWeight: '900',
    letterSpacing: 1,
  },
  routeLine: {
    position: 'absolute',
    left: 105,
    right: 115,
    top: 105,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  routeArrows: { color: '#F2CB72', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  routeLocked: { color: '#737D79' },
  target: {
    position: 'absolute',
    right: 22,
    top: 47,
    width: 105,
    height: 128,
    backgroundColor: '#71392E',
    borderWidth: 2,
    borderColor: '#D98263',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetOccupied: { backgroundColor: '#315C44', borderColor: '#88B47C' },
  targetLocked: { backgroundColor: '#303A3A', borderColor: '#626B68' },
  targetIcon: { color: '#FFE7B1', fontSize: 42, fontWeight: '900' },
  targetIconLocked: { color: '#7E8884', fontSize: 28 },
  targetName: { color: '#FFF0C8', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  targetLevel: {
    color: '#E9BE76',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 3,
  },
  distance: { position: 'absolute', bottom: 11, left: 0, right: 0, alignItems: 'center' },
  distanceText: {
    color: '#D7D2BA',
    backgroundColor: 'rgba(19,29,27,0.82)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  scenarioPanel: {
    backgroundColor: '#253631',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    padding: 14,
    gap: 4,
  },
  scenarioKicker: { color: colors.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  scenarioTitle: { color: colors.ink, fontSize: 19, fontWeight: '900' },
  scenarioCopy: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  intelPanel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 17,
    gap: 8,
  },
  intelHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  intelMark: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  intelState: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  intelTitle: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 5 },
  statRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.line },
  statLast: { borderRightWidth: 0 },
  statValue: { color: colors.gold, fontSize: 23, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  dispatch: { borderLeftWidth: 2, borderLeftColor: colors.red, paddingLeft: 12 },
  dispatchLocked: { borderLeftColor: '#626B68' },
  dispatchKicker: { color: '#D9866A', fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  dispatchBody: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: 3 },
});
