import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { notesColors } from "@/constants/notes-theme";

export default function RootLayout() {
  return (
    
    <SafeAreaProvider>
      <StatusBar style="dark" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: notesColors.background,
          },
        }}
      />
    </SafeAreaProvider>
  );
}
