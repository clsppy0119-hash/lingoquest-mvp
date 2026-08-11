import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Territory, TerritoryId, territories } from '@/data/territories';
import { useGameStore } from '@/store/game';
import { isTerritoryUnlocked, reviewQueueForTerritory } from '@/store/progress';
import { colors } from '@/theme';

type NodeState = 'locked' | 'available' | 'occupied' | 'patrol';

const nodePosition = (territoryId: TerritoryId) => {
  if (territoryId === 'restaurant') return styles.restaurantNode;
  if (territoryId === 'airport') return styles.airportNode;
  return styles.schoolNode;
};

const nodeStateStyle = (state: NodeState) => {
  if (state === 'locked') return styles.nodeLocked;
  if (state === 'occupied') return styles.nodeOccupied;
  if (state === 'patrol') return styles.nodePatrol;
  return styles.nodeAvailable;
};

function TerrainTile({ style, icon, label }: { style: object; icon: string; label: string }) {
  return (
    <View style={[styles.terrainTile, style]}>
      <Text style={styles.terrainIcon}>{icon}</Text>
      <Text style={styles.terrainLabel}>{label}</Text>
    </View>
  );
}

function TerritoryNode({ territory, state }: { territory: Territory; state: NodeState }) {
  const stateLabel = {
    locked: '尚未解鎖',
    available: '可進攻',
    occupied: '已駐守',
    patrol: '待巡邏',
  }[state];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${territory.name}領地，${stateLabel}`}
      onPress={() => router.push({ pathname: '/territory', params: { id: territory.id } })}
      style={({ pressed }) => [
        styles.territoryNode,
        nodePosition(territory.id),
        nodeStateStyle(state),
        pressed && styles.nodePressed,
      ]}
    >
      <View style={styles.nodeOrder}>
        <Text style={styles.nodeOrderText}>0{territory.order}</Text>
      </View>
      <Text style={[styles.nodeIcon, state === 'locked' && styles.nodeIconLocked]}>
        {state === 'locked' ? '◆' : territory.icon}
      </Text>
      <Text style={styles.nodeName}>{territory.name}</Text>
      <Text style={styles.nodeState}>{stateLabel}</Text>
      {state === 'patrol' && (
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>!</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const { hydrated, territoryLevels, reviewQueue } = useGameStore();
  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const reviewQueues = Object.fromEntries(
    territories.map((territory) => [
      territory.id,
      reviewQueueForTerritory(reviewQueue, territory.id),
    ]),
  ) as Record<TerritoryId, string[]>;
  const progress = { version: 2 as const, territoryLevels, reviewQueue };
  const states = Object.fromEntries(
    territories.map((territory) => {
      const occupied = territoryLevels[territory.id] > 0;
      const patrolDue = occupied && reviewQueues[territory.id].length > 0;
      const state: NodeState = patrolDue
        ? 'patrol'
        : occupied
          ? 'occupied'
          : isTerritoryUnlocked(progress, territory.id)
            ? 'available'
            : 'locked';
      return [territory.id, state];
    }),
  ) as Record<TerritoryId, NodeState>;

  const occupiedCount = territories.filter((territory) => territoryLevels[territory.id] > 0).length;
  const patrolTarget = territories.find((territory) => reviewQueues[territory.id].length > 0);
  const conquestTarget = territories.find(
    (territory) =>
      territoryLevels[territory.id] === 0 && isTerritoryUnlocked(progress, territory.id),
  );
  const commandTarget = patrolTarget ?? conquestTarget ?? territories[territories.length - 1];
  const totalReview = territories.reduce(
    (total, territory) => total + reviewQueues[territory.id].length,
    0,
  );
  const campaignComplete = occupiedCount === territories.length;

  return (
    <Screen style={styles.screen}>
      <View style={styles.hud}>
        <View style={styles.banner}>
          <Text style={styles.bannerMark}>LQ</Text>
        </View>
        <View style={styles.hudCopy}>
          <Text style={styles.eyebrow}>LINGOQUEST 戰略指揮</Text>
          <Text style={styles.hudTitle}>晨望主城</Text>
        </View>
        <View style={styles.level}>
          <Text style={styles.levelTop}>領地</Text>
          <Text style={styles.levelValue}>{occupiedCount}/3</Text>
        </View>
      </View>

      <View style={styles.placementCard}>
        <View style={styles.placementTop}>
          <View style={styles.placementSigil}>
            <Text style={styles.placementSigilText}>⌖</Text>
          </View>
          <View style={styles.placementCopy}>
            <Text style={styles.placementKicker}>新手英文能力偵察</Text>
            <Text style={styles.placementTitle}>先確認起點，再安排下一個學習任務</Text>
            <Text style={styles.placementBody}>
              約 6–10 分鐘、12–14 個短情境；結果會說明你能獨立完成、需要提示或應先練的內容。
            </Text>
          </View>
        </View>
        <PrimaryButton label="開始能力偵察" onPress={() => router.push('/placement')} />
      </View>

      <View style={styles.chapterBar}>
        <View>
          <Text style={styles.chapterLabel}>第一章</Text>
          <Text style={styles.chapterName}>通往天空的語言遠征</Text>
        </View>
        <Text style={styles.chapterCount}>{occupiedCount} / 3</Text>
      </View>

      <View style={styles.map}>
        <View style={styles.mapGlow} />
        <View style={styles.river} />
        <TerrainTile style={styles.forestWest} icon="♠" label="西側松林" />
        <TerrainTile style={styles.ridgeEast} icon="▲" label="北境高地" />
        <TerrainTile style={styles.farmSouth} icon="≋" label="河谷平原" />

        <View style={styles.compass}>
          <Text style={styles.compassText}>N</Text>
          <View style={styles.compassNeedle} />
        </View>

        <View style={styles.routeCitySchool} />
        <View style={styles.routeSchoolRestaurant} />
        <View style={styles.routeRestaurantAirport} />
        <Text style={[styles.routeArrow, styles.arrowOne]}>› › ›</Text>
        <Text style={[styles.routeArrow, styles.arrowTwo]}>› › ›</Text>
        <Text style={[styles.routeArrow, styles.arrowThree]}>› › ›</Text>

        <View style={styles.castleWrap}>
          <View style={styles.castleHalo} />
          <Text style={styles.castleIcon}>♜</Text>
          <Text style={styles.castleTitle}>晨望城</Text>
          <Text style={styles.castleSub}>主城 · 安全</Text>
        </View>

        {territories.map((territory) => (
          <TerritoryNode key={territory.id} state={states[territory.id]} territory={territory} />
        ))}

        <View style={styles.mapLegend}>
          <View style={[styles.legendDot, totalReview > 0 && styles.legendAlert]} />
          <Text style={styles.legendText}>
            {totalReview > 0
              ? `全境有 ${totalReview} 題待巡邏`
              : campaignComplete
                ? '三領地皆已插旗'
                : '沿金色路線逐步解鎖領地'}
          </Text>
        </View>
      </View>

      <View style={styles.progressStrip}>
        {territories.map((territory, index) => (
          <View key={territory.id} style={styles.progressStep}>
            <View
              style={[
                styles.progressMark,
                states[territory.id] === 'occupied' && styles.progressDone,
                states[territory.id] === 'patrol' && styles.progressPatrol,
                states[territory.id] === 'available' && styles.progressActive,
              ]}
            >
              <Text style={styles.progressMarkText}>{index + 1}</Text>
            </View>
            <Text style={styles.progressLabel}>{territory.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.commandPanel}>
        <View style={styles.commandTop}>
          <View
            style={[
              styles.statusSigil,
              campaignComplete && styles.statusSigilOccupied,
              patrolTarget && styles.statusSigilPatrolDue,
            ]}
          >
            <Text style={styles.statusSigilText}>
              {patrolTarget ? '!' : campaignComplete ? '✓' : '⚔'}
            </Text>
          </View>
          <View style={styles.commandCopy}>
            <Text style={styles.commandKicker}>
              {patrolTarget ? '優先巡邏命令' : campaignComplete ? '遠征完成' : '下一個作戰命令'}
            </Text>
            <Text style={styles.commandTitle}>
              {commandTarget.name} · {commandTarget.chapter}
            </Text>
            <Text style={styles.commandBody}>
              {patrolTarget
                ? `${commandTarget.name}尚有 ${reviewQueues[commandTarget.id].length} 題待複習。`
                : campaignComplete
                  ? '學校、餐廳與機場皆已穩固；可返回各領地查看駐軍與巡邏簿。'
                  : `${commandTarget.scenario}：${commandTarget.conquestBrief}`}
            </Text>
          </View>
        </View>
        <PrimaryButton
          label={patrolTarget ? `前往${commandTarget.name}巡邏` : `查看${commandTarget.name}戰情`}
          tone={patrolTarget || !campaignComplete ? 'red' : 'gold'}
          onPress={() => router.push({ pathname: '/territory', params: { id: commandTarget.id } })}
        />
      </View>

      <View style={styles.helpPanel}>
        <Text style={styles.helpTitle}>遠征作戰指南</Text>
        <Text style={styles.helpText}>
          1. 占領學校解鎖餐廳　2. 占領餐廳解鎖機場　3. 各領地錯題分開巡邏複習
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  screen: { paddingTop: 10 },
  hud: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 2 },
  banner: {
    width: 45,
    height: 54,
    backgroundColor: colors.red,
    borderWidth: 1,
    borderColor: '#D58469',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerMark: { color: '#FFEBC1', fontWeight: '900', fontSize: 15, letterSpacing: -1 },
  hudCopy: { flex: 1 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  hudTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  level: {
    width: 52,
    height: 48,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: '#172225',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTop: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  levelValue: { color: colors.gold, fontSize: 17, fontWeight: '900' },
  placementCard: {
    backgroundColor: '#1B2A29',
    borderWidth: 1,
    borderColor: '#587066',
    padding: 15,
    gap: 13,
  },
  placementTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  placementSigil: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E372B',
  },
  placementSigilText: { color: colors.gold, fontSize: 27, fontWeight: '900' },
  placementCopy: { flex: 1, gap: 3 },
  placementKicker: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  placementTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '900' },
  placementBody: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  chapterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    paddingLeft: 12,
  },
  chapterLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  chapterName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  chapterCount: { color: colors.gold, fontWeight: '900', fontSize: 16 },
  map: {
    height: 535,
    borderWidth: 1,
    borderColor: '#6F725D',
    backgroundColor: colors.terrain,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  mapGlow: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 190,
    backgroundColor: 'rgba(216,181,104,0.10)',
    top: -120,
    right: -80,
  },
  river: {
    position: 'absolute',
    width: 58,
    height: 700,
    backgroundColor: colors.water,
    opacity: 0.82,
    transform: [{ rotate: '18deg' }],
    left: 70,
    top: -80,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderColor: 'rgba(177,198,176,0.14)',
  },
  terrainTile: {
    position: 'absolute',
    width: 96,
    height: 62,
    borderWidth: 1,
    borderColor: 'rgba(235,220,170,0.20)',
    backgroundColor: 'rgba(35,55,40,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  forestWest: { left: 9, top: 42, transform: [{ rotate: '-3deg' }] },
  ridgeEast: { right: 8, top: 8, transform: [{ rotate: '3deg' }] },
  farmSouth: { left: 17, bottom: 136, transform: [{ rotate: '-2deg' }] },
  terrainIcon: { color: '#91A878', fontSize: 23, fontWeight: '900' },
  terrainLabel: { color: '#C4C8AE', fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  compass: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 31,
    height: 31,
    borderWidth: 1,
    borderColor: 'rgba(244,226,182,0.55)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassText: { color: '#F0DDAF', fontSize: 9, fontWeight: '900' },
  compassNeedle: {
    position: 'absolute',
    width: 1,
    height: 12,
    backgroundColor: colors.red,
    top: 2,
  },
  castleWrap: { position: 'absolute', width: 108, alignItems: 'center', left: 24, bottom: 38 },
  castleHalo: {
    position: 'absolute',
    top: 2,
    width: 75,
    height: 75,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(233,197,112,0.55)',
    backgroundColor: 'rgba(23,37,34,0.58)',
  },
  castleIcon: { color: '#E7C97F', fontSize: 62, lineHeight: 67, textShadowRadius: 8 },
  castleTitle: {
    color: '#FFF0C5',
    backgroundColor: 'rgba(20,27,25,0.9)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontSize: 10,
  },
  castleSub: { color: '#BFC6AA', fontSize: 7, marginTop: 3, letterSpacing: 1, fontWeight: '800' },
  routeCitySchool: {
    position: 'absolute',
    left: 104,
    bottom: 94,
    width: 155,
    height: 5,
    backgroundColor: '#C8A65E',
    transform: [{ rotate: '-12deg' }],
  },
  routeSchoolRestaurant: {
    position: 'absolute',
    left: 113,
    bottom: 220,
    width: 182,
    height: 5,
    backgroundColor: '#C8A65E',
    transform: [{ rotate: '47deg' }],
  },
  routeRestaurantAirport: {
    position: 'absolute',
    left: 105,
    top: 182,
    width: 188,
    height: 5,
    backgroundColor: '#C8A65E',
    transform: [{ rotate: '-32deg' }],
  },
  routeArrow: {
    position: 'absolute',
    color: '#F3CE78',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  arrowOne: { left: 145, bottom: 96, transform: [{ rotate: '-12deg' }] },
  arrowTwo: { left: 188, bottom: 220, transform: [{ rotate: '47deg' }] },
  arrowThree: { left: 173, top: 178, transform: [{ rotate: '-32deg' }] },
  territoryNode: {
    position: 'absolute',
    width: 112,
    height: 90,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 7,
  },
  schoolNode: { right: 18, bottom: 46 },
  restaurantNode: { left: 17, top: 218 },
  airportNode: { right: 19, top: 82 },
  nodeLocked: { backgroundColor: '#303B3B', borderColor: '#66706D', opacity: 0.88 },
  nodeAvailable: { backgroundColor: '#70362C', borderColor: '#E79B71' },
  nodeOccupied: { backgroundColor: '#315E46', borderColor: '#8DC18A' },
  nodePatrol: { backgroundColor: '#725227', borderColor: '#E7BC67' },
  nodePressed: { transform: [{ scale: 0.97 }] },
  nodeOrder: {
    position: 'absolute',
    left: -8,
    top: -9,
    width: 29,
    height: 25,
    backgroundColor: '#182426',
    borderWidth: 1,
    borderColor: colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeOrderText: { color: colors.gold, fontWeight: '900', fontSize: 9 },
  nodeIcon: { color: '#FFE8B5', fontSize: 30, fontWeight: '900', lineHeight: 34 },
  nodeIconLocked: { color: '#7F8985', fontSize: 23 },
  nodeName: { color: '#FFF2D0', fontWeight: '900', letterSpacing: 1.1, fontSize: 13 },
  nodeState: { color: '#F2CE91', fontSize: 8, fontWeight: '900', letterSpacing: 1.1, marginTop: 2 },
  alertBadge: {
    position: 'absolute',
    right: -9,
    top: -11,
    width: 27,
    height: 27,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeText: { color: '#252015', fontWeight: '900', fontSize: 15 },
  mapLegend: {
    position: 'absolute',
    bottom: 9,
    left: 142,
    right: 9,
    backgroundColor: 'rgba(18,27,27,0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
  legendAlert: { backgroundColor: '#E7BC67' },
  legendText: { color: '#D6D1BC', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  progressStrip: {
    flexDirection: 'row',
    backgroundColor: '#182326',
    borderWidth: 1,
    borderColor: '#4D554D',
    padding: 11,
  },
  progressStep: { flex: 1, alignItems: 'center', gap: 4 },
  progressMark: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#59615D',
    backgroundColor: '#303A3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDone: { backgroundColor: colors.greenDark, borderColor: '#82A878' },
  progressPatrol: { backgroundColor: colors.goldDark, borderColor: '#E7BC67' },
  progressActive: { backgroundColor: colors.redDark, borderColor: '#C87961' },
  progressMarkText: { color: '#FFEAB8', fontSize: 10, fontWeight: '900' },
  progressLabel: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  commandPanel: {
    backgroundColor: '#182326',
    borderWidth: 1,
    borderColor: '#4D554D',
    padding: 15,
    gap: 14,
  },
  commandTop: { flexDirection: 'row', gap: 12 },
  statusSigil: {
    width: 48,
    height: 48,
    borderRadius: 26,
    backgroundColor: colors.redDark,
    borderWidth: 1,
    borderColor: '#C87961',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSigilOccupied: { backgroundColor: colors.greenDark, borderColor: '#82A878' },
  statusSigilPatrolDue: { backgroundColor: colors.goldDark, borderColor: '#E7BC67' },
  statusSigilText: { color: '#FFEAB8', fontSize: 23, fontWeight: '900' },
  commandCopy: { flex: 1 },
  commandKicker: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  commandTitle: { color: colors.ink, fontSize: 19, fontWeight: '900', marginTop: 2 },
  commandBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  helpPanel: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 13, gap: 4 },
  helpTitle: { color: colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  helpText: { color: colors.muted, fontSize: 12, lineHeight: 19 },
});
