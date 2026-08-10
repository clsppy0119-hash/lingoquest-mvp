import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/theme';
export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) { return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={[styles.content, style]}>{children}</ScrollView></SafeAreaView>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.paper }, content: { flexGrow: 1, padding: 24, gap: 18 } });
