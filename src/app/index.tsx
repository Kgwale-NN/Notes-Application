import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { notesColors } from "@/constants/notes-theme";

export default function CategoriesScreen() {
  return (
    <SafeAreaView style={styles.screen}>

      <View style={styles.content}>
        <View style={styles.accentLine} />

        <Text style={styles.title}>Categories</Text>

        <Text style={styles.subtitle}>
          Keep your thoughts in one place.
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
    paddingTop: 24,
  },
  accentLine: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: notesColors.accent,
    marginBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: notesColors.text,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: notesColors.muted,
    marginTop: 8,
  },
});