import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import CategoryRow from "@/components/CategoryRow";
import { notesColors } from "@/constants/notes-theme";
import { categories, useNotes } from "@/hooks/use-notes";

export default function CategoriesScreen() {
  const { notes, signOut, saving } = useNotes();
  const [signingOut, setSigningOut] = useState(false);

  function handleSignOut() {
    setSigningOut(true);
    // Give the loading state one frame to paint before the session closes.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        signOut();
        setSigningOut(false);
      });
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.accentLine} />
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Choose a category to view or write notes.</Text>

        <View style={styles.categories}>
          {categories.map(({ id, name }) => (
            <CategoryRow
              key={id}
              name={name}
              count={notes.filter(note => note.category === id).length}
              onPress={() => router.push({ pathname: "/category/[id]", params: { id } })}
            />
          ))}
        </View>

        <AppButton
          title={signingOut ? "Logging out…" : "Log out"}
          variant="secondary"
          disabled={saving}
          loading={signingOut}
          onPress={handleSignOut}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: notesColors.background },
  content: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: 24,
  },
  accentLine: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: notesColors.accent,
    marginBottom: 16,
  },
  title: { fontSize: 34, fontWeight: "700", color: notesColors.text },
  subtitle: { fontSize: 16, lineHeight: 24, color: notesColors.muted, marginTop: 8 },
  categories: { marginVertical: 28, gap: 12 },
});
