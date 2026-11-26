import { Pressable, StyleSheet, TextInput, View } from "react-native";

import AppIcon from "@/components/AppIcon";
import GlassBackground from "@/components/GlassBackground";
import GlassIconButton from "@/components/GlassIconButton";
import { notesColors } from "@/constants/notes-theme";

type NoteSearchBarProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onNewNote?: () => void;
};

export default function NoteSearchBar({ label, value, onChangeText, onNewNote }: NoteSearchBarProps) {
  return (
    <View style={styles.dock}>
      <View style={styles.bar}>
        <GlassBackground />
        <AppIcon name="search" size={21} />
        <TextInput
          accessibilityLabel={label}
          style={styles.input}
          placeholder={label}
          placeholderTextColor={notesColors.muted}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            style={styles.clearButton}
            onPress={() => onChangeText("")}
          >
            <AppIcon name="close" size={19} color={notesColors.muted} />
          </Pressable>
        ) : null}
      </View>
      {onNewNote && <GlassIconButton label="New note" icon="compose" onPress={onNewNote} />}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 10,
  },
  bar: { flex: 1, minWidth: 0, minHeight: 54, flexDirection: "row", alignItems: "center", paddingLeft: 16, gap: 10 },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingVertical: 8, paddingRight: 12, color: notesColors.text, fontSize: 16 },
  clearButton: { width: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
