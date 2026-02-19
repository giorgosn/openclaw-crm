import { db } from "@/db";
import { notes, objects, records } from "@/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { batchGetRecordDisplayNames } from "./display-names";

export interface NoteData {
  id: string;
  recordId: string;
  title: string;
  content: unknown;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  recordDisplayName?: string;
  objectSlug?: string;
  objectName?: string;
}

// ─── Workspace verification ──────────────────────────────────────────

/** Verify that a note belongs to a given workspace via records → objects chain. */
export async function verifyNoteWorkspace(noteId: string, workspaceId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: notes.id })
    .from(notes)
    .innerJoin(records, eq(notes.recordId, records.id))
    .innerJoin(objects, eq(records.objectId, objects.id))
    .where(and(eq(notes.id, noteId), eq(objects.workspaceId, workspaceId)))
    .limit(1);
  return !!row;
}

// ─── CRUD ────────────────────────────────────────────────────────────

export async function listNotes(workspaceId: string, options: { limit?: number; offset?: number } = {}) {
  const { limit = 50, offset = 0 } = options;

  // Get all records belonging to this workspace's objects
  const workspaceObjects = await db
    .select({ id: objects.id })
    .from(objects)
    .where(eq(objects.workspaceId, workspaceId));

  if (workspaceObjects.length === 0) return { notes: [], total: 0 };

  const objectIds = workspaceObjects.map((o) => o.id);

  const workspaceRecords = await db
    .select({ id: records.id })
    .from(records)
    .where(inArray(records.objectId, objectIds));

  if (workspaceRecords.length === 0) return { notes: [], total: 0 };

  const recordIds = workspaceRecords.map((r) => r.id);

  const [noteRows, [countResult]] = await Promise.all([
    db
      .select()
      .from(notes)
      .where(inArray(notes.recordId, recordIds))
      .orderBy(desc(notes.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(inArray(notes.recordId, recordIds)),
  ]);

  // Batch-resolve display names for all records referenced by notes
  const noteRecordIds = [...new Set(noteRows.map((n) => n.recordId))];
  const displayMap = await batchGetRecordDisplayNames(noteRecordIds);

  const enriched: NoteData[] = noteRows.map((note) => {
    const info = displayMap.get(note.recordId);
    return {
      ...note,
      recordDisplayName: info?.displayName || "Unknown",
      objectSlug: info?.objectSlug || "",
      objectName: info?.objectName || "",
    };
  });

  return { notes: enriched, total: Number(countResult.count) };
}

export async function getNotesForRecord(recordId: string) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.recordId, recordId))
    .orderBy(desc(notes.updatedAt));
}

export async function getNote(noteId: string) {
  const [note] = await db
    .select()
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);
  return note || null;
}

export async function createNote(
  recordId: string,
  title: string,
  content: unknown,
  createdBy: string | null
) {
  const [note] = await db
    .insert(notes)
    .values({ recordId, title, content, createdBy })
    .returning();
  return note;
}

export async function updateNote(
  noteId: string,
  updates: { title?: string; content?: unknown }
) {
  const [note] = await db
    .update(notes)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(notes.id, noteId))
    .returning();
  return note;
}

export async function deleteNote(noteId: string) {
  const [note] = await db
    .delete(notes)
    .where(eq(notes.id, noteId))
    .returning();
  return note;
}
