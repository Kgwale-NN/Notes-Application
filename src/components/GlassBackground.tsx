import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform, StyleSheet, View } from "react-native";

import { notesColors } from "@/constants/notes-theme";

export default function GlassBackground() {
  if (Platform.OS === "ios" && isGlassEffectAPIAvailable() && isLiquidGlassAvailable()) {
    return (
      <GlassView
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.shape]}
        colorScheme="light"
      />
    );
  }

  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fallback]} />;
}

const styles = StyleSheet.create({
  shape: { borderRadius: 28 },
  fallback: {
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderWidth: 1,
    borderColor: notesColors.surface,
    boxShadow: "0px 3px 12px rgba(23, 23, 23, 0.10)",
  },
});
