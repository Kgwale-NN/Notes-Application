import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { notesColors } from "@/constants/notes-theme";
import { NotesProvider, useNotes } from "@/hooks/use-notes";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotesProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </NotesProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { profile } = useNotes();
  const isSignedIn = profile !== null;

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: notesColors.background },
    }}>
      <Stack.Protected guard={!isSignedIn} redirectTo="/categories">
        <Stack.Screen name="login" />
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn} redirectTo="/login">
        <Stack.Screen name="categories" />
        <Stack.Screen name="category/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="explore" />
      </Stack.Protected>
    </Stack>
  );
}
