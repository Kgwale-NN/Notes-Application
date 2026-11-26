import { randomUUID } from "expo-crypto";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";

import { loginAccount } from "@/services/accountService";
import { withDeadline } from "@/services/withDeadline";
import { readData, saveData } from "@/storage/appStorage";
import type { UserProfile } from "@/types/account";

export const categories = [
  { id: "work", name: "Work" },
  { id: "study", name: "Study" },
  { id: "personal", name: "Personal" },
] as const;

type CategoryId = (typeof categories)[number]["id"];

export type Note = {
  id: string;
  category: CategoryId;
  title: string;
  body: string;
};

function useNotesState() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [saving, setSaving] = useState(false);
  const writeInProgress = useRef(false);

  async function signIn(email: string, password: string) {
    const account = await loginAccount(email, password);
    const saved = await withDeadline(
      readData("notes:" + account.id),
      8_000,
      "Notes could not open your saved notes. Close and reopen the app, then try again."
    );

    if (saved !== null && (!Array.isArray(saved) || !saved.every(isNote))) {
      throw new Error("Saved notes could not be read.");
    }

    setNotes(saved ?? []);
    setProfile(account);
  }

  function signOut() {
    if (writeInProgress.current) return;

    setProfile(null);
    setNotes([]);
  }

  async function persist(next: Note[]) {
    if (!profile || writeInProgress.current) {
      throw new Error("Notes are currently unavailable. Please try again.");
    }

    writeInProgress.current = true;
    setSaving(true);
    try {
      await saveData("notes:" + profile.id, next);
      setNotes(next);
    } finally {
      writeInProgress.current = false;
      setSaving(false);
    }
  }

  function saveNote(category: CategoryId, draft: Pick<Note, "title" | "body">, id?: string) {
    const note = { ...draft, category, id: id ?? randomUUID() };
    return persist([note, ...notes.filter(item => item.id !== note.id)]);
  }

  function deleteNote(id: string) {
    return persist(notes.filter(note => note.id !== id));
  }

  return { profile, notes, saving, signIn, signOut, saveNote, deleteNote };
}

function isNote(value: unknown): value is Note {
  if (typeof value !== "object" || value === null) return false;

  const note = value as Partial<Note>;
  return typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.body === "string" &&
    categories.some(category => category.id === note.category);
}

const NotesContext = createContext<ReturnType<typeof useNotesState> | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  return <NotesContext.Provider value={useNotesState()}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) throw new Error("NotesProvider is missing.");
  return context;
}
