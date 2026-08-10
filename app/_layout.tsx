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
        <Stack.Screen name="territory" options={{ title: 'School District' }} />
        <Stack.Screen
          name="challenge"
          options={{ title: 'English Challenge', gestureEnabled: false }}
        />
        <Stack.Screen
          name="result"
          options={{ title: 'Battle Report', gestureEnabled: false, headerBackVisible: false }}
        />
      </Stack>
    </>
  );
}
