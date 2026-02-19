"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  StickyNote,
  Star,
  ArrowUpDown,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChooseRecordDialog } from "@/components/records/choose-record-dialog";
import { NoteEditorPanel } from "@/components/notes/note-editor-panel";
import { isToday, isYesterday, isThisWeek, format } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────

interface Note {
  id: string;
  recordId: string;
  title: string;
  content: unknown;
  createdAt: string;
  updatedAt: string;
  recordDisplayName?: string;
  objectSlug?: string;
  objectName?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

type DateGroup = "today" | "yesterday" | "this_week" | "older";

function getDateGroup(dateStr: string): DateGroup {
  const d = new Date(dateStr);
  if (isToday(d)) return "today";
  if (isYesterday(d)) return "yesterday";
  if (isThisWeek(d, { weekStartsOn: 1 })) return "this_week";
  return "older";
}

const GROUP_LABELS: Record<DateGroup, string> = {
  today: "Created today",
  yesterday: "Yesterday",
  this_week: "This week",
  older: "Older",
};

const GROUP_ORDER: DateGroup[] = ["today", "yesterday", "this_week", "older"];

const OBJECT_COLORS: Record<string, string> = {
  companies: "bg-blue-500",
  people: "bg-purple-500",
  deals: "bg-orange-500",
};

function getContentPreview(content: unknown): string {
  if (!content) return "This note has no content.";
  try {
    const doc = content as { content?: Array<{ content?: Array<{ text?: string }> }> };
    if (doc.content) {
      for (const block of doc.content) {
        if (block.content) {
          for (const inline of block.content) {
            if (inline.text && inline.text.trim()) {
              return inline.text.trim().slice(0, 100);
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return "This note has no content.";
}

function getRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

// ─── Main Component ─────────────────────────────────────────────────

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Choose record dialog
  const [chooseRecordOpen, setChooseRecordOpen] = useState(false);

  // Note editor panel
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorNoteId, setEditorNoteId] = useState<string | undefined>();
  const [editorRecordId, setEditorRecordId] = useState<string | undefined>();
  const [editorRecordName, setEditorRecordName] = useState<string | undefined>();
  const [editorObjectSlug, setEditorObjectSlug] = useState<string | undefined>();

  // Collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<DateGroup>>(
    new Set()
  );

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/notes?limit=100");
      if (res.ok) {
        const data = await res.json();
        setNotes(data.data.notes);
        setTotal(data.data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  function handleNewNote() {
    setChooseRecordOpen(true);
  }

  function handleRecordSelected(record: {
    recordId: string;
    displayName: string;
    objectSlug: string;
  }) {
    setEditorNoteId(undefined);
    setEditorRecordId(record.recordId);
    setEditorRecordName(record.displayName);
    setEditorObjectSlug(record.objectSlug);
    setEditorOpen(true);
  }

  function handleNoteClick(note: Note) {
    setEditorNoteId(note.id);
    setEditorRecordId(note.recordId);
    setEditorRecordName(note.recordDisplayName);
    setEditorObjectSlug(note.objectSlug);
    setEditorOpen(true);
  }

  function toggleGroup(key: DateGroup) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Group notes by date
  const groups = new Map<DateGroup, Note[]>();
  for (const note of notes) {
    const key = getDateGroup(note.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(note);
  }

  const visibleGroups = GROUP_ORDER.filter((key) => groups.has(key));

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Notes</h1>
          <span className="text-sm text-muted-foreground">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort pill */}
          <div className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3 w-3" />
            <span>Creation date</span>
          </div>

          <Button size="sm" onClick={handleNewNote}>
            <Plus className="mr-1 h-4 w-4" />
            New note
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Favorites section */}
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-xs font-medium text-muted-foreground mb-3">
            Favorites
          </h2>
          <div className="rounded-lg border-2 border-dashed border-border/50 py-8 text-center">
            <Star className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Favorites</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Notes that you favorite will appear here
            </p>
          </div>
        </div>

        {/* Loading / Empty states */}
        {loading && notes.length === 0 && (
          <p className="text-muted-foreground text-center py-12">Loading...</p>
        )}

        {!loading && notes.length === 0 && (
          <div className="text-center py-12">
            <StickyNote className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No notes yet.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Click &quot;+ New note&quot; to create your first note.
            </p>
          </div>
        )}

        {/* Date-grouped notes */}
        {visibleGroups.map((groupKey) => {
          const groupNotes = groups.get(groupKey)!;
          const isCollapsed = collapsedGroups.has(groupKey);

          return (
            <div key={groupKey} className="px-4 pt-4">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {GROUP_LABELS[groupKey]}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                  {groupNotes.length}
                </span>
              </button>

              {/* Note cards */}
              {!isCollapsed && (
                <div className="space-y-2">
                  {groupNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleNoteClick(note)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Choose Record Dialog */}
      <ChooseRecordDialog
        open={chooseRecordOpen}
        onOpenChange={setChooseRecordOpen}
        onSelect={handleRecordSelected}
      />

      {/* Note Editor Panel */}
      <NoteEditorPanel
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) fetchNotes(); // Refresh list when closing
        }}
        noteId={editorNoteId}
        recordId={editorRecordId}
        recordDisplayName={editorRecordName}
        objectSlug={editorObjectSlug}
        onNoteCreated={fetchNotes}
        onNoteDeleted={fetchNotes}
      />
    </div>
  );
}

// ─── Note Card ───────────────────────────────────────────────────────

function NoteCard({
  note,
  onClick,
}: {
  note: Note;
  onClick: () => void;
}) {
  const objectColor =
    OBJECT_COLORS[note.objectSlug || ""] || "bg-muted-foreground";
  const preview = getContentPreview(note.content);

  return (
    <div
      onClick={onClick}
      className="group rounded-lg border border-border/60 bg-card/30 px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Record badge */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div
              className={cn(
                "h-3.5 w-3.5 rounded flex items-center justify-center shrink-0",
                objectColor
              )}
            >
              <Building2 className="h-2 w-2 text-white" />
            </div>
            <span className="text-xs font-medium text-muted-foreground truncate">
              {note.recordDisplayName || "Unknown"}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium truncate">
            {note.title || "Untitled"}
          </h3>

          {/* Preview */}
          <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
            {preview}
          </p>
        </div>

        {/* Date */}
        <span className="text-xs text-muted-foreground shrink-0 mt-5">
          {getRelativeDate(note.createdAt)}
        </span>
      </div>
    </div>
  );
}
