import { Pressable, StyleSheet, Text, View } from "react-native";

import { notesColors } from "@/constants/notes-theme";

type CategoryRowProps = {
  name: string;
  count: number;
  onPress: () => void;
};

export default function CategoryRow({name,count,onPress,}: CategoryRowProps) {
    
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${count} notes`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.marker} />

      <Text style={styles.name}>{name}</Text>

      <Text style={styles.count}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderRadius: 18,
    backgroundColor: notesColors.surface,
  },
  marker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: notesColors.accent,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    color: notesColors.text,
  },
  count: {
    fontSize: 15,
    color: notesColors.muted,
  },
  pressed: {
    opacity: 0.6,
  },
});