import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useGameStore } from '@/store/game';
import { colors } from '@/theme';

function TerrainTile({ style, icon, label }: { style: object; icon: string; label: string }) {
  return (
    <View style={[styles.terrainTile, style]}>
      <Text style={styles.terrainIcon}>{icon}</Text>
      <Text style={styles.terrainLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { hydrated, territoryLevel, reviewQueue } = useGameStore();
  const occupied = territoryLevel > 0;
  if (!hydrated)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );

  return (
    <Screen style={styles.screen}>
      <View style={styles.hud}>
        <View style={styles.banner}>
          <Text style={styles.bannerMark}>LQ</Text>
        </View>
        <View style={styles.hudCopy}>
          <Text style={styles.eyebrow}>LINGOQUEST COMMAND</Text>
          <Text style={styles.hudTitle}>Dawnwatch Citadel</Text>
        </View>
        <View style={styles.level}>
          <Text style={styles.levelTop}>RANK</Text>
          <Text style={styles.levelValue}>01</Text>
        </View>
      </View>

      <View style={styles.chapterBar}>
        <View>
          <Text style={styles.chapterLabel}>CAMPAIGN I</Text>
          <Text style={styles.chapterName}>The First Banner</Text>
        </View>
        <Text style={styles.chapterCount}>{occupied ? '1 / 1' : '0 / 1'}</Text>
      </View>

      <View style={styles.map}>
        <View style={styles.mapGlow} />
        <View style={styles.river} />
        <View style={[styles.road, styles.roadOne]} />
        <View style={[styles.road, styles.roadTwo]} />
        <View style={[styles.road, styles.roadThree]} />
        <TerrainTile style={styles.forestWest} icon="♠" label="Pinewood" />
        <TerrainTile style={styles.ridgeEast} icon="▲" label="Grey Ridge" />
        <TerrainTile style={styles.farmSouth} icon="≋" label="Low Fields" />

        <View style={styles.compass}>
          <Text style={styles.compassText}>N</Text>
          <View style={styles.compassNeedle} />
        </View>

        <View style={styles.castleWrap}>
          <View style={styles.castleHalo} />
          <Text style={styles.castleIcon}>♜</Text>
          <Text style={styles.castleTitle}>DAWNWATCH</Text>
          <Text style={styles.castleSub}>CAPITAL · SAFE</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="School territory"
          onPress={() => router.push('/territory')}
          style={({ pressed }) => [
            styles.schoolNode,
            occupied ? styles.schoolOccupied : styles.schoolAvailable,
            pressed && styles.nodePressed,
          ]}
        >
          <View style={styles.nodeFlag}>
            <Text style={styles.nodeFlagText}>{occupied ? '◆' : '!'}</Text>
          </View>
          <Text style={styles.schoolIcon}>⌂</Text>
          <Text style={styles.schoolName}>SCHOOL</Text>
          <Text style={styles.schoolState}>{occupied ? 'GARRISONED' : 'AVAILABLE'}</Text>
        </Pressable>

        <View style={styles.marchLine}>
          <Text style={styles.marchArrow}>› › ›</Text>
        </View>
        <View style={styles.fogNode}>
          <Text style={styles.fogIcon}>?</Text>
          <Text style={styles.fogText}>FOG</Text>
        </View>
        <View style={styles.mapLegend}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>
            {occupied ? 'Territory secured' : 'Tap School to inspect'}
          </Text>
        </View>
      </View>

      <View style={styles.commandPanel}>
        <View style={styles.commandTop}>
          <View style={[styles.statusSigil, occupied && styles.statusSigilOccupied]}>
            <Text style={styles.statusSigilText}>{occupied ? '✓' : '⚔'}</Text>
          </View>
          <View style={styles.commandCopy}>
            <Text style={styles.commandKicker}>
              {occupied ? 'GARRISON REPORT' : 'ACTIVE WAR ORDER'}
            </Text>
            <Text style={styles.commandTitle}>School · Territory I</Text>
            <Text style={styles.commandBody}>
              {occupied
                ? reviewQueue.length
                  ? `${reviewQueue.length} question${reviewQueue.length === 1 ? '' : 's'} await patrol review.`
                  : 'The district is secure. No review patrols remain.'
                : 'Win the English skirmish to raise your banner over the school.'}
            </Text>
          </View>
        </View>
        <PrimaryButton
          label={occupied ? 'INSPECT GARRISON' : 'MARCH TO SCHOOL'}
          tone={occupied ? 'gold' : 'red'}
          onPress={() => router.push('/territory')}
        />
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
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: '#172225',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelTop: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  levelValue: { color: colors.gold, fontSize: 19, fontWeight: '900' },
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
    height: 438,
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
    width: 75,
    height: 580,
    backgroundColor: colors.water,
    opacity: 0.8,
    transform: [{ rotate: '23deg' }],
    left: -30,
    top: -65,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderColor: 'rgba(177,198,176,0.16)',
  },
  road: {
    position: 'absolute',
    height: 5,
    backgroundColor: '#A18B60',
    opacity: 0.72,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CFB77C',
  },
  roadOne: { width: 130, top: 238, left: 155, transform: [{ rotate: '-14deg' }] },
  roadTwo: { width: 110, top: 202, left: 78, transform: [{ rotate: '44deg' }] },
  roadThree: { width: 105, top: 166, right: 35, transform: [{ rotate: '-51deg' }] },
  terrainTile: {
    position: 'absolute',
    width: 104,
    height: 70,
    borderWidth: 1,
    borderColor: 'rgba(235,220,170,0.22)',
    backgroundColor: 'rgba(35,55,40,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  forestWest: { left: 28, top: 61 },
  ridgeEast: { right: 20, top: 58 },
  farmSouth: { left: 35, bottom: 34 },
  terrainIcon: { color: '#91A878', fontSize: 25, fontWeight: '900' },
  terrainLabel: { color: '#C4C8AE', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
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
  castleWrap: {
    position: 'absolute',
    width: 150,
    alignItems: 'center',
    left: '50%',
    marginLeft: -75,
    top: 122,
  },
  castleHalo: {
    position: 'absolute',
    top: 4,
    width: 86,
    height: 86,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(233,197,112,0.55)',
    backgroundColor: 'rgba(23,37,34,0.58)',
  },
  castleIcon: {
    color: '#E7C97F',
    fontSize: 72,
    lineHeight: 78,
    textShadowColor: '#19231D',
    textShadowRadius: 8,
  },
  castleTitle: {
    color: '#FFF0C5',
    backgroundColor: 'rgba(20,27,25,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontSize: 11,
  },
  castleSub: { color: '#BFC6AA', fontSize: 8, marginTop: 3, letterSpacing: 1.2, fontWeight: '800' },
  schoolNode: {
    position: 'absolute',
    right: 25,
    bottom: 58,
    width: 130,
    minHeight: 104,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 7,
  },
  schoolAvailable: { backgroundColor: '#70362C', borderColor: '#E79B71' },
  schoolOccupied: { backgroundColor: '#315E46', borderColor: '#8DC18A' },
  nodePressed: { transform: [{ scale: 0.97 }] },
  nodeFlag: {
    position: 'absolute',
    right: -10,
    top: -13,
    width: 29,
    height: 34,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  nodeFlagText: { color: '#252015', fontWeight: '900', fontSize: 16 },
  schoolIcon: { color: '#FFE8B5', fontSize: 35, fontWeight: '900' },
  schoolName: { color: '#FFF2D0', fontWeight: '900', letterSpacing: 1.2, fontSize: 13 },
  schoolState: {
    color: '#F2CE91',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 3,
  },
  marchLine: { position: 'absolute', right: 138, bottom: 109, transform: [{ rotate: '16deg' }] },
  marchArrow: { color: '#F3CE78', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  fogNode: {
    position: 'absolute',
    right: 34,
    top: 111,
    width: 72,
    height: 65,
    borderWidth: 1,
    borderColor: '#626B68',
    backgroundColor: 'rgba(37,47,48,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fogIcon: { color: '#87908C', fontSize: 25, fontWeight: '900' },
  fogText: { color: '#87908C', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  mapLegend: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(18,27,27,0.84)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
  legendText: { color: '#D6D1BC', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
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
  statusSigilText: { color: '#FFEAB8', fontSize: 23, fontWeight: '900' },
  commandCopy: { flex: 1 },
  commandKicker: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  commandTitle: { color: colors.ink, fontSize: 19, fontWeight: '900', marginTop: 2 },
  commandBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
