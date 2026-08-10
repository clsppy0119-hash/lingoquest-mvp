import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useGameStore } from '@/store/game';
import { CONQUEST_MIN_CORRECT } from '@/store/progress';
import { colors } from '@/theme';

export default function TerritoryScreen() {
  const { territoryLevel, reviewQueue, begin } = useGameStore();
  const occupied = territoryLevel > 0;
  const launch = (mode: 'conquest' | 'patrol') => {
    begin(mode);
    router.push('/challenge');
  };

  return (
    <Screen>
      <View style={styles.theaterHeader}>
        <Text style={styles.theaterKicker}>EASTERN THEATER · TILE 01</Text>
        <Text style={styles.theaterTitle}>School District</Text>
        <View style={[styles.statusPlate, occupied && styles.statusOccupied]}>
          <Text style={styles.statusText}>
            {occupied ? '◆ BANNER RAISED' : '⚔ HOSTILE FRONTIER'}
          </Text>
        </View>
      </View>

      <View style={styles.routeMap}>
        <View style={styles.routeTerrainOne} />
        <View style={styles.routeTerrainTwo} />
        <View style={styles.routeRiver} />
        <View style={styles.origin}>
          <Text style={styles.originIcon}>♜</Text>
          <Text style={styles.nodeLabel}>CAPITAL</Text>
        </View>
        <View style={styles.routeLine}>
          <Text style={styles.routeArrows}>› › › ›</Text>
        </View>
        <View style={[styles.target, occupied && styles.targetOccupied]}>
          <Text style={styles.targetIcon}>⌂</Text>
          <Text style={styles.targetName}>SCHOOL</Text>
          <Text style={styles.targetLevel}>LEVEL I</Text>
        </View>
        <View style={styles.distance}>
          <Text style={styles.distanceText}>MARCH · 03 MIN</Text>
        </View>
      </View>

      <View style={styles.intelPanel}>
        <View style={styles.intelHeader}>
          <Text style={styles.intelMark}>INTEL</Text>
          <Text style={styles.intelState}>{occupied ? 'CONTROLLED' : 'TARGET'}</Text>
        </View>
        <Text style={styles.intelTitle}>
          {occupied ? 'Garrison Briefing' : 'Victory Condition'}
        </Text>
        <Text style={styles.copy}>
          {occupied
            ? reviewQueue.length
              ? `${reviewQueue.length} missed question${reviewQueue.length === 1 ? '' : 's'} remain in the patrol ledger. Correct each one to secure the route.`
              : 'The district is secure and the patrol ledger is clear.'
            : `Answer at least ${CONQUEST_MIN_CORRECT} of 3 English questions correctly to occupy this territory.`}
        </Text>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>ORDERS</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{CONQUEST_MIN_CORRECT}</Text>
            <Text style={styles.statLabel}>TO WIN</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{reviewQueue.length}</Text>
            <Text style={styles.statLabel}>REVIEW</Text>
          </View>
        </View>
      </View>

      <View style={styles.dispatch}>
        <Text style={styles.dispatchKicker}>{occupied ? 'PATROL ORDER' : 'MARCH ORDER'}</Text>
        <Text style={styles.dispatchBody}>
          {occupied
            ? 'Redeploy to the questions that need reinforcement.'
            : 'Deploy your language company and take the school banner.'}
        </Text>
      </View>

      {occupied ? (
        <PrimaryButton
          label={
            reviewQueue.length ? `BEGIN PATROL · ${reviewQueue.length}` : 'PATROL LEDGER CLEAR'
          }
          disabled={!reviewQueue.length}
          onPress={() => launch('patrol')}
        />
      ) : (
        <PrimaryButton label="LAUNCH ATTACK" tone="red" onPress={() => launch('conquest')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  theaterHeader: { borderLeftWidth: 3, borderLeftColor: colors.gold, paddingLeft: 13, gap: 4 },
  theaterKicker: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  theaterTitle: { color: colors.ink, fontSize: 30, fontWeight: '900' },
  statusPlate: {
    alignSelf: 'flex-start',
    backgroundColor: colors.redDark,
    borderWidth: 1,
    borderColor: '#A95C4D',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusOccupied: { backgroundColor: colors.greenDark, borderColor: '#6E9A70' },
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
  targetIcon: { color: '#FFE7B1', fontSize: 42, fontWeight: '900' },
  targetName: { color: '#FFF0C8', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  targetLevel: {
    color: '#E9BE76',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginTop: 3,
  },
  distance: {
    position: 'absolute',
    bottom: 11,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  distanceText: {
    color: '#D7D2BA',
    backgroundColor: 'rgba(19,29,27,0.82)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
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
  statValue: { color: colors.gold, fontSize: 23, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  dispatch: { borderLeftWidth: 2, borderLeftColor: colors.red, paddingLeft: 12 },
  dispatchKicker: { color: '#D9866A', fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  dispatchBody: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: 3 },
});
