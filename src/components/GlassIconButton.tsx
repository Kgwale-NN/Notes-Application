import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import AppIcon, { type AppIconName } from "@/components/AppIcon";
import GlassBackground from "@/components/GlassBackground";
import { notesColors } from "@/constants/notes-theme";

type GlassIconButtonProps = {
  label: string;
  icon: AppIconName;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accent?: boolean;
};

export default function GlassIconButton({
  label, icon, onPress, disabled = false, loading = false, accent = false,
}: GlassIconButtonProps) {
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      style={({ pressed }) => [styles.button, accent && styles.accent, pressed && styles.pressed]}
      onPress={onPress}
    >
      {!accent && <GlassBackground />}
      {loading ? <ActivityIndicator size="small" color={notesColors.text} /> : <AppIcon name={icon} size={24} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  accent: { borderRadius: 26, backgroundColor: notesColors.accent },
  pressed: { opacity: 0.7 },
});
