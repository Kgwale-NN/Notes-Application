import { randomUUID } from "expo-crypto";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";

import { loginAccount, updateAccount, type ProfileChanges } from "@/services/accountService";
import { authFeedbackDelay } from "@/services/authFeedback";
import { withDeadline } from "@/services/withDeadline";
import { readData, saveData } from "@/storage/appStorage";
import type { UserProfile } from "@/types/account";

export type Category = { id: string; name: string };

const defaultCategories: Category[] = [
  { id: "work", name: "Work" },
  { id: "study", name: "Study" },
  { id: "personal", name: "Personal" },
];

export type Note = {
  id: string;
  category: string;
  title: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
};

function useNotesState() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Category[]>([]);
  const categories = [...defaultCategories, ...folders];
  const [saving, setSaving] = useState(false);
  const writeInProgress = useRef(false);

  async function signIn(email: string, password: string) {
    const feedback = authFeedbackDelay();
    const account = await loginAccount(email, password);
    const [saved, savedFolders] = await withDeadline(
      Promise.all([readData("notes:" + account.id), readData("folders:" + account.id)]),
      8_000,
      "Notes could not open your saved notes. Close and reopen the app, then try again."
    );

    if (savedFolders !== null && (!Array.isArray(savedFolders) || !savedFolders.every(isFolder))) {
      throw new Error("Saved folders could not be read.");
    }

    const folderIds = new Set([...defaultCategories, ...(savedFolders ?? [])].map(folder => folder.id));
    if (saved !== null && (!Array.isArray(saved) || !saved.every(note => isNote(note, folderIds)))) {
      throw new Error("Saved notes could not be read.");
    }

    // Updating the profile lets the protected navigator leave the login screen.
    await feedback;
    setNotes(saved ?? []);
    setFolders(savedFolders ?? []);
    setProfile(account);
  }

  function signOut() {
    if (writeInProgress.current) return;

    setProfile(null);
    setNotes([]);
    setFolders([]);
  }

  async function updateProfile(changes: ProfileChanges) {
    if (!profile || writeInProgress.current) {
      throw new Error("Your profile is currently unavailable. Please try again.");
    }

    writeInProgress.current = true;
    setSaving(true);
    try {
      const updated = await updateAccount(profile.id, changes);
      setProfile(updated);
      return updated;
    } finally {
      writeInProgress.current = false;
      setSaving(false);
    }
  }

  async function persist(write: (accountId: string) => Promise<void>) {
    if (!profile || writeInProgress.current) {
      throw new Error("Notes are currently unavailable. Please try again.");
    }

    writeInProgress.current = true;
    setSaving(true);
    try {
      await write(profile.id);
    } finally {
      writeInProgress.current = false;
      setSaving(false);
    }
  }

  function persistNotes(next: Note[]) {
    return persist(async accountId => {
      await saveData("notes:" + accountId, next);
      setNotes(next);
    });
  }

  async function createFolder(name: string) {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Enter a folder name.");
    if (categories.some(folder => folder.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error("A folder with that name already exists.");
    }

    const next = [...folders, { id: randomUUID(), name: cleanName }];
    await persist(async accountId => {
      await saveData("folders:" + accountId, next);
      setFolders(next);
    });
  }

  function saveNote(category: string, draft: Pick<Note, "title" | "body">, id?: string) {
    if (!categories.some(folder => folder.id === category)) throw new Error("This folder no longer exists.");
    const now = new Date().toISOString();

    if (id !== undefined) {
      const existing = notes.find(note => note.id === id && note.category === category);
      if (!existing) throw new Error("This note no longer exists.");
      if (existing.title === draft.title && existing.body === draft.body) return Promise.resolve();

      const updated = { ...existing, ...draft, updatedAt: now };
      return persistNotes([updated, ...notes.filter(note => note.id !== id)]);
    }

    const note: Note = { ...draft, category, id: randomUUID(), createdAt: now };
    return persistNotes([note, ...notes]);
  }

  function deleteNote(id: string) {
    return persistNotes(notes.filter(note => note.id !== id));
  }

  return { profile, notes, categories, saving, signIn, signOut, updateProfile, createFolder, saveNote, deleteNote };
}

function isFolder(value: unknown): value is Category {
  if (typeof value !== "object" || value === null) return false;

  const folder = value as Partial<Category>;
  return typeof folder.id === "string" && typeof folder.name === "string";
}

function isNote(value: unknown, folderIds: Set<string>): value is Note {
  if (typeof value !== "object" || value === null) return false;

  const note = value as Partial<Note>;
  return typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.body === "string" &&
    isOptionalDate(note.createdAt) &&
    isOptionalDate(note.updatedAt) &&
    typeof note.category === "string" &&
    folderIds.has(note.category);
}

function isOptionalDate(value: unknown) {
  return value === undefined || (typeof value === "string" && Number.isFinite(Date.parse(value)));
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
