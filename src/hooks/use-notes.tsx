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

type Workspace = { categories: Category[]; notes: Note[] };
const emptyWorkspace: Workspace = { categories: defaultCategories, notes: [] };

function useNotesState() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState(emptyWorkspace);
  const { categories, notes } = workspace;
  const [saving, setSaving] = useState(false);
  const writeInProgress = useRef(false);

  async function signIn(email: string, password: string) {
    const feedback = authFeedbackDelay();
    const account = await loginAccount(email, password);
    const saved = await withDeadline(
      loadWorkspace(account.id),
      8_000,
      "Notes could not open your saved notes. Close and reopen the app, then try again."
    );

    // Updating the profile lets the protected navigator leave the login screen.
    await feedback;
    setWorkspace(saved);
    setProfile(account);
  }

  function signOut() {
    if (writeInProgress.current) return;

    setProfile(null);
    setWorkspace(emptyWorkspace);
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

  async function persist(next: Workspace) {
    if (!profile || writeInProgress.current) {
      throw new Error("Notes are currently unavailable. Please try again.");
    }

    writeInProgress.current = true;
    setSaving(true);
    try {
      await saveData("notes:" + profile.id, next);
      setWorkspace(next);
    } finally {
      writeInProgress.current = false;
      setSaving(false);
    }
  }

  function persistNotes(next: Note[]) {
    return persist({ categories, notes: next });
  }

  async function createFolder(name: string) {
    const cleanName = name.trim();
    if (!cleanName) throw new Error("Enter a folder name.");
    if (categories.some(folder => folder.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error("A folder with that name already exists.");
    }

    await persist({ categories: [...categories, { id: randomUUID(), name: cleanName }], notes });
  }

  function deleteCategory(id: string) {
    return persist({
      categories: categories.filter(category => category.id !== id),
      notes: notes.filter(note => note.category !== id),
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

  return { profile, notes, categories, saving, signIn, signOut, updateProfile, createFolder, deleteCategory, saveNote, deleteNote };
}

async function loadWorkspace(accountId: string): Promise<Workspace> {
  const stored = await readData("notes:" + accountId);
  if (stored === null || Array.isArray(stored)) {
    const folders = await readData("folders:" + accountId);
    if (folders !== null && (!Array.isArray(folders) || !folders.every(isFolder))) {
      throw new Error("Saved folders could not be read.");
    }
    return validateWorkspace([...defaultCategories, ...(folders ?? [])], stored ?? []);
  }

  if (typeof stored === "object" && stored) {
    const { categories, notes } = stored as Partial<Workspace>;
    return validateWorkspace(categories, notes);
  }

  throw new Error("Saved notes could not be read.");
}

function validateWorkspace(categories: unknown, notes: unknown): Workspace {
  if (!Array.isArray(categories) || !categories.every(isFolder)) {
    throw new Error("Saved folders could not be read.");
  }
  const folderIds = new Set(categories.map(folder => folder.id));
  if (!Array.isArray(notes) || !notes.every(note => isNote(note, folderIds))) {
    throw new Error("Saved notes could not be read.");
  }
  return { categories, notes };
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
