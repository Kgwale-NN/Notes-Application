import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import { notesColors } from "@/constants/notes-theme";

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoLetter}>N</Text>
          </View>

          <Text style={styles.appName}>Notes</Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.tagline}>
            A little space for your thoughts.
          </Text>

          <View style={styles.buttons}>
            <AppButton
              title="Create account"
              variant="secondary"
              onPress={() =>
                Alert.alert(
                  "Create account",
                  "We will build this screen next."
                )
              }
            />

            <AppButton
              title="Log in"
              onPress={() =>
                Alert.alert(
                  "Log in",
                  "We will connect this button to the login screen."
                )
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: notesColors.surface,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 24,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: notesColors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontSize: 30,
    fontWeight: "700",
    color: notesColors.text,
  },
  appName: {
    fontSize: 36,
    fontWeight: "700",
    color: notesColors.text,
    flexShrink: 1,
  },
  bottom: {
    marginTop: "auto",
    paddingTop: 80,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 22,
    color: notesColors.muted,
    textAlign: "center",
    marginBottom: 28,
  },
  buttons: {
    gap: 10,
  },
});