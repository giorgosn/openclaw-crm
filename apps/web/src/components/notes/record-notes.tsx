"use client";

import { useState, useEffect, useCallback } from "react";
import { NoteEditor } from "./note-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: unknown;
  createdAt: string;
  updatedAt: string;
}

interface RecordNotesProps {
  objectSlug: string;
  recordId: string;
}

export function RecordNotes({ objectSlug, recordId }: RecordNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New note form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState<unknown>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/objects/${objectSlug}/records/${recordId}/notes`
      );
      if (res.ok) {
        const data = await res.json();
        setNotes(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [objectSlug, recordId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleCreate() {
    if (!newTitle.trim() && !newContent) return;

    const res = await fetch(
      `/api/v1/objects/${objectSlug}/records/${recordId}/notes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      }
    );

    if (res.ok) {
      setNewTitle("");
      setNewContent(null);
      setCreating(false);
      fetchNotes();
    }
  }

  async function handleUpdate(noteId: string, updates: { title?: string; content?: unknown }) {
    await fetch(`/api/v1/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...updates } : n))
    );
  }

  async function handleDelete(noteId: string) {
    await fetch(`/api/v1/notes/${noteId}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Notes</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCreating(!creating)}
          className="text-xs"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add note
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title"
            className="h-8 text-sm"
          />
          <NoteEditor
            content={newContent}
            onChange={setNewContent}
            placeholder="Write your note..."
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreating(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {loading && notes.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Loading...
        </p>
      )}

      {!loading && notes.length === 0 && !creating && (
        <p className="text-xs text-muted-foreground py-4 text-center">
          No notes yet
        </p>
      )}

      <div className="space-y-2">
        {notes.map((note) => {
          const isExpanded = expandedId === note.id;
          return (
            <div
              key={note.id}
              className="rounded-lg border border-border/60 bg-card/30"
            >
              {/* Header */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/20"
                onClick={() => setExpandedId(isExpanded ? null : note.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-medium flex-1 truncate">
                  {note.title || "Untitled"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(note.id);
                  }}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-3">
                  <NoteEditor
                    content={note.content}
                    onChange={(content) =>
                      handleUpdate(note.id, { content })
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
