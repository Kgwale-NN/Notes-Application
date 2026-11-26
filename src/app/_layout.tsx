import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { notesColors } from "@/constants/notes-theme";
import { NotesProvider } from "@/hooks/use-notes";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotesProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: notesColors.background,
            },
          }}
        />
      </NotesProvider>
    </SafeAreaProvider>
  );
}
