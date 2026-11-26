import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import FormField from "@/components/FormField";
import { notesColors } from "@/constants/notes-theme";
import { categories, useNotes, type Note } from "@/hooks/use-notes";

type Draft = Pick<Note, "title" | "body"> & { id?: string };

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useNotes();
  const category = categories.find(item => item.id === id);

  if (!profile) return <Redirect href="/login" />;
  if (!category) return <Redirect href="/categories" />;

  return <CategoryNotes key={category.id} category={category} />;
}

function CategoryNotes({ category }: { category: (typeof categories)[number] }) {
  const { notes, saving, saveNote, deleteNote } = useNotes();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const categoryNotes = notes.filter(note => note.category === category.id);

  function openDraft(next: Draft | null) {
    setDraft(next);
    setConfirmDelete(false);
    setError("");
  }

  async function handleSave() {
    if (!draft) return;

    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title && !body) {
      setError("Enter a title or write something in the note.");
      return;
    }

    setError("");
    try {
      await saveNote(category.id, { title, body }, draft.id);
      openDraft(null);
    } catch {
      setError("Unable to save the note. Please try again.");
    }
  }

  async function handleDelete() {
    if (!draft?.id) return;

    setError("");
    try {
      await deleteNote(draft.id);
      openDraft(null);
    } catch {
      setError("Unable to delete the note. Please try again.");
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            style={styles.back}
            disabled={saving}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/categories")}
          >
            <Text style={styles.link}>Back to categories</Text>
          </Pressable>

          <Text accessibilityRole="header" style={styles.title}>{category.name}</Text>

          {draft ? (
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.heading}>{draft.id ? "Edit note" : "New note"}</Text>
              <FormField label="Title" value={draft.title} editable={!saving} onChangeText={title => setDraft({ ...draft, title })} />
              <FormField
                label="Note"
                multiline
                numberOfLines={5}
                style={styles.bodyField}
                value={draft.body}
                editable={!saving}
                onChangeText={body => setDraft({ ...draft, body })}
              />

              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

              {confirmDelete ? (
                <>
                  <Text style={styles.message}>Permanently delete this note?</Text>
                  <AppButton title="Delete permanently" disabled={saving} onPress={handleDelete} />
                  <AppButton title="Keep note" variant="secondary" disabled={saving} onPress={() => setConfirmDelete(false)} />
                </>
              ) : (
                <>
                  <AppButton title="Save note" disabled={saving} onPress={handleSave} />
                  <AppButton title="Cancel editing" variant="secondary" disabled={saving} onPress={() => openDraft(null)} />
                  {draft.id ? (
                    <Pressable accessibilityRole="button" style={styles.back} disabled={saving} onPress={() => setConfirmDelete(true)}>
                      <Text style={styles.error}>Delete note</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <AppButton
                title="New note"
                icon="plus"
                onPress={() => openDraft({ title: "", body: "" })}
              />
              {categoryNotes.length === 0 ? (
                <Text style={styles.message}>No notes in this category yet.</Text>
              ) : (
                categoryNotes.map(note => (
                  <Pressable
                    key={note.id}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    onPress={() => openDraft(note)}
                  >
                    <Text style={styles.heading} numberOfLines={2}>{note.title || "Untitled note"}</Text>
                    {note.body ? <Text style={styles.message} numberOfLines={3}>{note.body}</Text> : null}
                  </Pressable>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: notesColors.background },
  keyboard: { flex: 1 },
  content: { width: "100%", maxWidth: 600, alignSelf: "center", padding: 24 },
  back: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center" },
  link: { fontSize: 16, color: notesColors.text },
  title: { fontSize: 34, fontWeight: "700", color: notesColors.text, marginTop: 12 },
  section: { marginTop: 24, gap: 12 },
  heading: { fontSize: 18, fontWeight: "600", color: notesColors.text },
  bodyField: { minHeight: 144, textAlignVertical: "top" },
  message: { fontSize: 16, lineHeight: 24, color: notesColors.muted },
  error: { fontSize: 15, color: "#B42318" },
  card: {
    backgroundColor: notesColors.surface,
    borderColor: notesColors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  pressed: { opacity: 0.7 },
});
