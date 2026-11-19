import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { notesColors } from "@/constants/notes-theme";

const categoryNames: Record<string, string> = {
  work: "Work",
  study: "Study",
  personal: "Personal",
};

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const categoryName = categoryNames[id];

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/categories");
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={goBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backText}>Back to categories</Text>
        </Pressable>

        <Text style={styles.title}>
          {categoryName ?? "Category not found"}
        </Text>

        <Text style={styles.message}>
          {categoryName
            ? "You have no notes in this category yet."
            : "Go back and choose Work, Study, or Personal."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: notesColors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: notesColors.text,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: notesColors.text,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: notesColors.muted,
    marginTop: 12,
  },
  pressed: {
    opacity: 0.6,
  },
});