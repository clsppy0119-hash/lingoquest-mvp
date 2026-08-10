import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useGameStore } from '@/store/game';
import { colors } from '@/theme';
export default function RootLayout() {
  const hydrate = useGameStore((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="territory" options={{ title: '學校領地' }} />
        <Stack.Screen name="challenge" options={{ title: '英文挑戰', gestureEnabled: false }} />
        <Stack.Screen
          name="result"
          options={{ title: '戰役結果', gestureEnabled: false, headerBackVisible: false }}
        />
      </Stack>
    </>
  );
}
