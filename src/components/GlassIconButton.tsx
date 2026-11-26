import { Pressable, StyleSheet } from "react-native";

import AppIcon, { type AppIconName } from "@/components/AppIcon";
import GlassBackground from "@/components/GlassBackground";

type GlassIconButtonProps = {
  label: string;
  icon: AppIconName;
  onPress: () => void;
  disabled?: boolean;
};

export default function GlassIconButton({ label, icon, onPress, disabled = false }: GlassIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={onPress}
    >
      <GlassBackground />
      <AppIcon name={icon} size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.7 },
});
