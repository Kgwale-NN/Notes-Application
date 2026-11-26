import { Redirect, router, useLocalSearchParams, usePreventRemove } from "expo-router";
import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/AppButton";
import AppIcon from "@/components/AppIcon";
import GlassBackground from "@/components/GlassBackground";
import GlassIconButton from "@/components/GlassIconButton";
import NoteSearchBar from "@/components/NoteSearchBar";
import { notesColors } from "@/constants/notes-theme";
import { useNotes, type Category, type Note } from "@/hooks/use-notes";
import { searchNotes } from "@/services/noteSearch";

type Draft = Pick<Note, "title" | "body" | "createdAt" | "updatedAt"> & { id?: string };
type Menu = "categoryOptions" | "sortOptions" | "deleteCategory" | "noteOptions" | "deleteNote";
const dangerColor = "#B42318";

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
] as const;

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function CategoryScreen() {
  const { id, noteId } = useLocalSearchParams<{ id: string; noteId?: string }>();
  const { categories, notes } = useNotes();
  const category = categories.find(item => item.id === id);

  if (!category) return <Redirect href="/categories" />;

  const selectedNote = noteId ? notes.find(note => note.id === noteId && note.category === id) : undefined;
  return <CategoryNotes key={category.id + ":" + (noteId ?? "")} category={category} selectedNote={selectedNote} />;
}

function CategoryNotes({ category, selectedNote }: { category: Category; selectedNote?: Note }) {
  const { notes, saving, saveNote, deleteNote, deleteCategory } = useNotes();
  const [draft, setDraft] = useState<Draft | null>(selectedNote ?? null);
  const [discardPrompt, setDiscardPrompt] = useState<{ leave?: () => void } | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [menu, setMenu] = useState<Menu | null>(null);
  const [categoryError, setCategoryError] = useState("");
  const categoryNotes = notes.filter(note => note.category === category.id);
  const sortExpanded = menu === "sortOptions";
  const sortLabel = sortOptions.find(option => option.value === sortOrder)?.label;
  const showEmptyCategory = !draft && categoryNotes.length === 0;
  const matchingNotes = searchNotes(categoryNotes, search);
  const sortedNotes = [...matchingNotes].sort((left, right) => {
    if (!left.createdAt) return right.createdAt ? 1 : 0;
    if (!right.createdAt) return -1;

    const difference = Date.parse(left.createdAt) - Date.parse(right.createdAt);
    return sortOrder === "oldest" ? difference : -difference;
  });
  const savedNote = draft?.id ? categoryNotes.find(note => note.id === draft.id) : null;
  const editorDate = draft?.updatedAt ?? draft?.createdAt;
  const hasUnsavedChanges = draft !== null && (
    draft.title !== (savedNote?.title ?? "") ||
    draft.body !== (savedNote?.body ?? "")
  );

  usePreventRemove(hasUnsavedChanges || (draft !== null && saving), ({ repeat }) => {
    if (saving || discardPrompt) return;

    Keyboard.dismiss();
    setDiscardPrompt({ leave: repeat });
  });

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/categories");
  }

  function openOptions() {
    Keyboard.dismiss();
    setCategoryError("");
    setError("");
    setMenu(draft ? "noteOptions" : "categoryOptions");
  }

  function closeMenu() {
    if (!saving) setMenu(null);
  }

  async function handleDeleteCategory() {
    setCategoryError("");
    try {
      await deleteCategory(category.id);
      setMenu(null);
      goBack();
    } catch {
      setCategoryError("Unable to delete this category. Please try again.");
    }
  }

  function openDraft(next: Draft | null) {
    Keyboard.dismiss();
    setDraft(next);
    setError("");
  }

  function cancelEditing() {
    if (hasUnsavedChanges) {
      Keyboard.dismiss();
      setDiscardPrompt({});
      return;
    }

    openDraft(null);
  }

  function discardChanges() {
    const leave = discardPrompt?.leave;
    setDiscardPrompt(null);
    openDraft(null);
    leave?.();
  }

  async function handleSave() {
    if (!draft) return;

    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!body) {
      setError("Write something in the note before saving.");
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
    if (!draft) return;

    setError("");
    try {
      if (draft.id) await deleteNote(draft.id);
      setMenu(null);
      openDraft(null);
    } catch {
      setError("Unable to delete the note. Please try again.");
    }
  }

  return (
    <SafeAreaView style={[styles.screen, draft && styles.editorScreen]}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.toolbar}>
          <GlassIconButton label="Go back" icon="chevronLeft" disabled={saving} onPress={draft ? cancelEditing : goBack} />
          <View style={styles.toolbarActions}>
            <GlassIconButton
              label={draft ? "Note options" : "Category options"}
              icon="more"
              disabled={saving}
              onPress={openOptions}
            />
            {draft && (
              <GlassIconButton label="Save note" icon="check" loading={saving} accent onPress={handleSave} />
            )}
          </View>
        </View>
        <ScrollView
          style={styles.keyboard}
          contentContainerStyle={[styles.content, (showEmptyCategory || draft !== null) && styles.fillContent]}
          keyboardShouldPersistTaps="handled"
        >
          {!draft && <Text accessibilityRole="header" style={styles.title}>{category.name}</Text>}
          {showEmptyCategory && <Text style={styles.noteCount}>0 notes</Text>}

          {draft ? (
            <View style={styles.editor}>
              {editorDate && <Text style={styles.editorDate}>{dateFormat.format(new Date(editorDate))}</Text>}
              <TextInput
                accessibilityLabel="Title (optional)"
                placeholder="Title (optional)"
                placeholderTextColor={notesColors.muted}
                style={styles.editorTitle}
                value={draft.title}
                editable={!saving}
                onChangeText={title => setDraft({ ...draft, title })}
              />
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <TextInput
                accessibilityLabel="Note"
                placeholder="Write a note"
                placeholderTextColor={notesColors.muted}
                multiline
                style={styles.bodyField}
                autoFocus={!draft.id && Platform.OS === "ios"}
                autoCapitalize="sentences"
                value={draft.body}
                editable={!saving}
                onChangeText={body => setDraft({ ...draft, body })}
              />
            </View>
          ) : showEmptyCategory ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <AppIcon name="note" size={34} color={notesColors.muted} />
              </View>
              <Text accessibilityRole="header" style={styles.emptyTitle}>No notes</Text>
            </View>
          ) : (
            <View style={styles.section}>
              {matchingNotes.length === 0 ? (
                <Text style={styles.message} accessibilityLiveRegion="polite">
                  No notes match your search.
                </Text>
              ) : (
                sortedNotes.map(note => (
                  <Pressable
                    key={note.id}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                    onPress={() => openDraft(note)}
                  >
                    <View style={styles.cardText}>
                      <Text style={styles.heading} numberOfLines={2}>{note.title || "Untitled note"}</Text>
                      {note.body ? <Text style={styles.message} numberOfLines={3}>{note.body}</Text> : null}
                      <Text style={styles.timestamp}>
                        {note.createdAt ? "Added " + dateFormat.format(new Date(note.createdAt)) : "Date added unavailable"}
                      </Text>
                      {note.updatedAt ? (
                        <Text style={styles.timestamp}>Edited {dateFormat.format(new Date(note.updatedAt))}</Text>
                      ) : null}
                    </View>
                    <AppIcon name="chevronRight" size={16} color={notesColors.muted} />
                  </Pressable>
                ))
              )}
            </View>
          )}
        </ScrollView>
        {!draft && (
          <NoteSearchBar
            label="Search notes"
            value={search}
            onChangeText={setSearch}
            onNewNote={() => openDraft({ title: "", body: "", createdAt: new Date().toISOString() })}
          />
        )}
      </KeyboardAvoidingView>
      <Modal
        visible={menu !== null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        {menu === "deleteCategory" ? (
          <View style={styles.modalBackdrop}>
            <View style={styles.dialog} accessibilityViewIsModal>
              <Text accessibilityRole="header" style={styles.heading}>Delete {category.name}?</Text>
              <Text style={styles.message}>This permanently deletes the category and all notes inside it.</Text>
              {categoryError ? <Text accessibilityRole="alert" style={styles.error}>{categoryError}</Text> : null}
              <AppButton title={saving ? "Deleting category…" : "Delete category"} loading={saving} onPress={handleDeleteCategory} />
              <AppButton title="Cancel" variant="secondary" disabled={saving} onPress={closeMenu} />
            </View>
          </View>
        ) : menu === "deleteNote" ? (
          <View style={styles.modalBackdrop}>
            <View style={styles.dialog} accessibilityViewIsModal>
              <Text accessibilityRole="header" style={styles.heading}>{draft?.id ? "Delete this note?" : "Discard this draft?"}</Text>
              <Text style={styles.message}>{draft?.id ? "This permanently deletes the note." : "Your unsaved writing will be lost."}</Text>
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <AppButton
                title={draft?.id ? "Delete note" : "Discard draft"}
                icon="trash"
                loading={saving}
                onPress={handleDelete}
              />
              <AppButton title="Cancel" variant="secondary" disabled={saving} onPress={closeMenu} />
            </View>
          </View>
        ) : (
          <SafeAreaView style={styles.menuBackdrop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close options"
              style={StyleSheet.absoluteFill}
              onPress={closeMenu}
            />
            <View style={[styles.menuRow, draft && styles.editorMenuRow]}>
              <View style={styles.menu} accessibilityViewIsModal>
                <GlassBackground />
                {(menu === "categoryOptions" || sortExpanded) && (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: sortExpanded }}
                      style={styles.menuItem}
                      onPress={() => setMenu(sortExpanded ? "categoryOptions" : "sortOptions")}
                    >
                      <AppIcon name="sort" size={20} />
                      <View style={styles.sortText}>
                        <Text style={styles.menuLabel}>Sort by</Text>
                        <Text style={styles.sortSubtitle}>Date added · {sortLabel}</Text>
                      </View>
                      <AppIcon name={sortExpanded ? "chevronDown" : "chevronRight"} size={14} />
                    </Pressable>
                    {sortExpanded && (
                      <View style={styles.sortChoices}>
                        {sortOptions.map(({ value, label }) => {
                          const selected = sortOrder === value;
                          return (
                            <Pressable
                              key={value}
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                              onPress={() => {
                                setSortOrder(value);
                                closeMenu();
                              }}
                              style={styles.menuItem}
                            >
                              <View style={styles.sortCheck}>
                                {selected && <AppIcon name="check" size={16} />}
                              </View>
                              <Text style={styles.menuLabel}>{label}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                    <View style={styles.menuDivider} />
                  </>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={draft ? (draft.id ? "Delete note" : "Discard draft") : "Delete category"}
                  style={styles.menuItem}
                  onPress={() => setMenu(draft ? "deleteNote" : "deleteCategory")}
                >
                  <AppIcon name="trash" size={20} color={dangerColor} />
                  <Text style={styles.deleteLabel}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        )}
      </Modal>
      <Modal
        visible={discardPrompt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDiscardPrompt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={styles.heading}>Discard changes?</Text>
            <Text style={styles.message}>Your unsaved edits will be lost.</Text>
            <AppButton title="Keep editing" onPress={() => setDiscardPrompt(null)} />
            <AppButton title="Discard changes" variant="secondary" onPress={discardChanges} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: notesColors.background },
  editorScreen: { backgroundColor: notesColors.surface },
  keyboard: { flex: 1 },
  toolbar: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  toolbarActions: { flexDirection: "row", gap: 10 },
  content: { width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 24, paddingBottom: 24 },
  fillContent: { flexGrow: 1 },
  title: { fontSize: 34, fontWeight: "700", color: notesColors.text, marginTop: 12 },
  noteCount: { marginTop: 4, fontSize: 15, color: notesColors.muted },
  emptyState: {
    flex: 1,
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#FCE7F1",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: notesColors.text },
  section: { marginTop: 24, gap: 12 },
  heading: { fontSize: 18, fontWeight: "600", color: notesColors.text },
  editor: { flex: 1, paddingTop: 12, gap: 8 },
  editorDate: { color: notesColors.muted, textAlign: "center", fontSize: 14 },
  editorTitle: { minHeight: 48, paddingVertical: 8, color: notesColors.text, fontSize: 26, fontWeight: "700" },
  bodyField: {
    flex: 1,
    minHeight: 180,
    paddingTop: 8,
    color: notesColors.text,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: "top",
  },
  message: { fontSize: 16, lineHeight: 24, color: notesColors.muted },
  error: { fontSize: 15, color: dangerColor },
  menuBackdrop: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.06)" },
  menuRow: { width: "100%", maxWidth: 600, alignSelf: "center", alignItems: "flex-end", paddingHorizontal: 24, paddingTop: 68, pointerEvents: "box-none" },
  editorMenuRow: { paddingRight: 56 },
  menu: {
    width: 244,
    maxWidth: "100%",
    padding: 10,
  },
  menuItem: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: notesColors.text },
  deleteLabel: { fontSize: 15, fontWeight: "600", color: dangerColor },
  sortText: { flex: 1, minWidth: 0 },
  sortSubtitle: { fontSize: 12, color: notesColors.muted, marginTop: 2 },
  sortChoices: { marginTop: 2 },
  sortCheck: { width: 20, alignItems: "center" },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: notesColors.border, marginHorizontal: 12, marginVertical: 4 },
  timestamp: { fontSize: 13, color: notesColors.muted },
  card: {
    backgroundColor: notesColors.surface,
    borderColor: notesColors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardText: { flex: 1, minWidth: 0, gap: 6 },
  pressed: { opacity: 0.7 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    gap: 12,
    borderRadius: 20,
    backgroundColor: notesColors.surface,
  },
});
