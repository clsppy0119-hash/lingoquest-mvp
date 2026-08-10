import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme';
export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}><Text style={styles.label}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ button: { backgroundColor: colors.blue, borderRadius: 14, padding: 16, alignItems: 'center' }, disabled: { opacity: 0.4 }, pressed: { backgroundColor: colors.blueDark }, label: { color: '#FFF', fontSize: 17, fontWeight: '800' } });
