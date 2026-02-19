"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NoteEditor } from "./note-editor";
import {
  Copy,
  MoreVertical,
  Trash2,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteEditorPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId?: string;
  recordDisplayName?: string;
  objectSlug?: string;
  noteId?: string;
  onNoteCreated?: () => void;
  onNoteDeleted?: () => void;
}

const OBJECT_COLORS: Record<string, string> = {
  companies: "bg-blue-500",
  people: "bg-purple-500",
  deals: "bg-orange-500",
};

export function NoteEditorPanel({
  open,
  onOpenChange,
  recordId,
  recordDisplayName,
  objectSlug,
  noteId,
  onNoteCreated,
  onNoteDeleted,
}: NoteEditorPanelProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<unknown>(null);
  const [liveNoteId, setLiveNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [ready, setReady] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Refs to always have latest values for the close handler
  const titleLatest = useRef("");
  const contentLatest = useRef<unknown>(null);
  const liveNoteIdRef = useRef<string | null>(null);

  // ── Open: load existing note OR create a new one immediately ───────
  useEffect(() => {
    if (!open) return;

    setShowMenu(false);
    setReady(false);

    if (noteId) {
      // Editing existing note
      liveNoteIdRef.current = noteId;
      setLiveNoteId(noteId);
      fetch(`/api/v1/notes/${noteId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.data) {
            setTitle(data.data.title || "");
            setContent(data.data.content);
            titleLatest.current = data.data.title || "";
            contentLatest.current = data.data.content;
          }
          setReady(true);
        })
        .catch(() => setReady(true));
    } else if (recordId && objectSlug) {
      // Creating new note — create it now so all edits are just PATCHes
      setTitle("");
      setContent(null);
      titleLatest.current = "";
      contentLatest.current = null;
      liveNoteIdRef.current = null;
      setLiveNoteId(null);

      fetch(`/api/v1/objects/${objectSlug}/records/${recordId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", content: null }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.data) {
            liveNoteIdRef.current = data.data.id;
            setLiveNoteId(data.data.id);
            onNoteCreated?.();
          }
          setReady(true);
          setTimeout(() => titleRef.current?.focus(), 100);
        })
        .catch(() => setReady(true));
    }
  }, [open, noteId, recordId, objectSlug, onNoteCreated]);

  // ── Close menu on click outside ────────────────────────────────────
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  // ── Debounced save (PATCH only, note already exists) ───────────────
  const flushSave = useCallback(async () => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const nId = liveNoteIdRef.current;
    if (!nId) return;
    setSaving(true);
    await fetch(`/api/v1/notes/${nId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleLatest.current,
        content: contentLatest.current,
      }),
    });
    setSaving(false);
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSave, 800);
  }, [flushSave]);

  // ── Handlers ───────────────────────────────────────────────────────
  function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    titleLatest.current = newTitle;
    scheduleSave();
  }

  function handleContentChange(newContent: unknown) {
    setContent(newContent);
    contentLatest.current = newContent;
    scheduleSave();
  }

  async function handleClose() {
    // Flush pending save before closing
    await flushSave();

    // If note is empty (no title and no content), delete it
    const nId = liveNoteIdRef.current;
    const hasTitle = titleLatest.current.trim().length > 0;
    const hasContent = contentLatest.current !== null &&
      JSON.stringify(contentLatest.current) !== '{"type":"doc","content":[{"type":"paragraph"}]}';

    if (nId && !hasTitle && !hasContent) {
      await fetch(`/api/v1/notes/${nId}`, { method: "DELETE" });
      onNoteDeleted?.();
    }

    onOpenChange(false);
  }

  async function handleDelete() {
    const nId = liveNoteIdRef.current;
    if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
    if (nId) {
      await fetch(`/api/v1/notes/${nId}`, { method: "DELETE" });
      onNoteDeleted?.();
    }
    onOpenChange(false);
  }

  const objectColor =
    OBJECT_COLORS[objectSlug || ""] || "bg-muted-foreground";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl p-0 gap-0 max-h-[85vh] flex flex-col">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <div
            className={cn(
              "h-4 w-4 rounded flex items-center justify-center shrink-0",
              objectColor
            )}
          >
            <Building2 className="h-2.5 w-2.5 text-white" />
          </div>
          <DialogTitle className="text-sm font-medium truncate flex-1">
            {recordDisplayName || "Untitled"}
          </DialogTitle>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2 px-4 py-1.5 border-b border-border/50">
          {saving && (
            <span className="text-[10px] text-muted-foreground">
              Saving...
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 text-muted-foreground"
            onClick={() => {
              if (liveNoteId) {
                navigator.clipboard.writeText(
                  `${window.location.origin}/objects/${objectSlug}/${recordId}`
                );
              }
            }}
          >
            <Copy className="h-3 w-3" />
            Copy link
          </Button>
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-md border border-border bg-popover shadow-lg">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted/50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete note
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Note content */}
        <div className="flex-1 overflow-auto px-12 py-6">
          {!ready ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              {/* Title */}
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled note"
                className="w-full bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground/40 outline-none border-none mb-2"
              />

              {/* Record badge */}
              <div className="flex items-center gap-2 mb-6">
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-xs font-normal"
                >
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-sm",
                      objectColor
                    )}
                  />
                  {recordDisplayName}
                </Badge>
              </div>

              {/* TipTap Editor */}
              <NoteEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Start typing..."
                className="border-none"
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
