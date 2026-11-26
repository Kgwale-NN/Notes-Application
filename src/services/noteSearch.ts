import type { Note } from "@/hooks/use-notes";

export function searchNotes(notes: Note[], query: string) {
  const words = query.toLowerCase().match(/\S+/g) ?? [];
  if (words.length === 0) return notes;

  return notes.filter(note => {
    const title = note.title.toLowerCase();
    const body = note.body.toLowerCase();
    return words.every(word => title.includes(word) || body.includes(word));
  });
}
