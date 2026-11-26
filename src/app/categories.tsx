import { router } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import CategoryRow from "@/components/CategoryRow";
import FormField from "@/components/FormField";
import GlassIconButton from "@/components/GlassIconButton";
import NoteSearchBar from "@/components/NoteSearchBar";
import { notesColors } from "@/constants/notes-theme";
import { useNotes } from "@/hooks/use-notes";
import { searchNotes } from "@/services/noteSearch";

export default function CategoriesScreen() {
  const { categories, notes, saving, createFolder } = useNotes();
  const [search, setSearch] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState("");
  const searching = search.trim().length > 0;
  const results = searching ? searchNotes(notes, search) : [];

  function openNewFolder() {
    Keyboard.dismiss();
    setFolderName("");
    setFolderError("");
    setShowNewFolder(true);
  }

  async function saveFolder() {
    setFolderError("");
    try {
      await createFolder(folderName);
      setSearch("");
      setShowNewFolder(false);
    } catch (error) {
      setFolderError(error instanceof Error ? error.message : "Could not create the folder.");
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.main} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <View style={styles.accentLine} />
          <View style={styles.headerButtons}>
            <GlassIconButton label="New folder" icon="folderPlus" onPress={openNewFolder} disabled={saving} />
            <GlassIconButton label="Profile" icon="profile" onPress={() => router.push("/profile")} disabled={saving} />
          </View>
        </View>

        <ScrollView
          style={styles.main}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text accessibilityRole="header" style={styles.title}>Categories</Text>
          {searching ? (
            <View style={styles.categories}>
              {results.length === 0 ? (
                <Text accessibilityLiveRegion="polite" style={styles.subtitle}>No notes match your search.</Text>
              ) : results.map(note => (
                <Pressable
                  key={note.id}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.result, pressed && styles.pressed]}
                  onPress={() => {
                    Keyboard.dismiss();
                    router.push({
                      pathname: "/category/[id]",
                      params: { id: note.category, noteId: note.id },
                    });
                  }}
                >
                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle} numberOfLines={2}>{note.title || "Untitled note"}</Text>
                    <Text style={styles.resultMeta}>{categories.find(folder => folder.id === note.category)?.name}</Text>
                    {note.body ? <Text style={styles.resultMeta} numberOfLines={2}>{note.body}</Text> : null}
                  </View>
                  <AppIcon name="chevronRight" size={16} color={notesColors.muted} />
                </Pressable>
              ))}
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>
                {categories.length > 0
                  ? "Choose a category to view or write notes."
                  : "No categories yet. Tap New folder to add one."}
              </Text>
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
            </>
          )}
        </ScrollView>

        <NoteSearchBar label="Search all notes" value={search} onChangeText={setSearch} />
      </KeyboardAvoidingView>

      <Modal
        transparent
        visible={showNewFolder}
        animationType="fade"
        onRequestClose={() => { if (!saving) setShowNewFolder(false); }}
      >
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.dialogTitle}>New folder</Text>
            <FormField
              label="Folder name"
              value={folderName}
              onChangeText={value => { setFolderName(value); setFolderError(""); }}
              editable={!saving}
              maxLength={60}
            />
            {folderError ? <Text accessibilityRole="alert" style={styles.error}>{folderError}</Text> : null}
            <AppButton title={saving ? "Creating folder…" : "Create folder"} loading={saving} onPress={saveFolder} />
            <AppButton title="Cancel" variant="secondary" disabled={saving} onPress={() => setShowNewFolder(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: notesColors.background },
  main: { flex: 1 },
  header: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerButtons: { flexDirection: "row", gap: 10 },
  content: { width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 24, paddingBottom: 16 },
  accentLine: { width: 36, height: 4, borderRadius: 2, backgroundColor: notesColors.accent },
  title: { fontSize: 34, fontWeight: "700", color: notesColors.text },
  subtitle: { fontSize: 16, lineHeight: 24, color: notesColors.muted, marginTop: 8 },
  categories: { marginVertical: 24, gap: 12 },
  pressed: { opacity: 0.7 },
  result: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: notesColors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  resultText: { flex: 1, minWidth: 0, gap: 4 },
  resultTitle: { color: notesColors.text, fontSize: 17, fontWeight: "600" },
  resultMeta: { color: notesColors.muted, fontSize: 14, lineHeight: 20 },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0, 0, 0, 0.45)" },
  dialog: { width: "100%", maxWidth: 400, padding: 24, gap: 12, borderRadius: 20, backgroundColor: notesColors.surface },
  dialogTitle: { fontSize: 22, fontWeight: "700", color: notesColors.text },
  error: { fontSize: 15, color: "#B42318" },
});
