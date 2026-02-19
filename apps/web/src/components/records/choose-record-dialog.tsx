"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordOption {
  recordId: string;
  displayName: string;
  subtitle: string;
  objectSlug: string;
  objectName: string;
  objectIcon?: string;
}

interface ChooseRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (record: RecordOption) => void;
}

const OBJECT_COLORS: Record<string, string> = {
  companies: "bg-blue-500",
  people: "bg-purple-500",
  deals: "bg-orange-500",
};

function getObjectColor(slug: string): string {
  return OBJECT_COLORS[slug] || "bg-muted-foreground";
}

export function ChooseRecordDialog({
  open,
  onOpenChange,
  onSelect,
}: ChooseRecordDialogProps) {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<RecordOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial records on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      loadBrowse();
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  async function loadBrowse() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/records/browse?limit=30");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const searchRecords = useCallback((q: string) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    if (!q.trim()) {
      loadBrowse();
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/search?q=${encodeURIComponent(q)}&limit=20`
        );
        if (res.ok) {
          const data = await res.json();
          setRecords(
            (data.data || [])
              .filter((r: { type: string }) => r.type === "record")
              .map(
                (r: {
                  id: string;
                  title: string;
                  subtitle: string;
                  objectSlug: string;
                  objectName: string;
                  objectIcon?: string;
                }) => ({
                  recordId: r.id,
                  displayName: r.title,
                  subtitle: r.subtitle,
                  objectSlug: r.objectSlug,
                  objectName: r.objectName,
                  objectIcon: r.objectIcon,
                })
              )
          );
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, records.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && records[selectedIndex]) {
      e.preventDefault();
      onSelect(records[selectedIndex]);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>Choose record</DialogTitle>
          <DialogDescription className="sr-only">
            Select a record to link this note to
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
                searchRecords(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search records..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Records list */}
        <div className="max-h-[400px] overflow-auto">
          {loading && records.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading...
            </p>
          )}

          {!loading && records.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No records found
            </p>
          )}

          {records.length > 0 && (
            <div className="px-2 py-2">
              <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">
                Records
              </p>
              {records.map((rec, idx) => (
                <button
                  key={rec.recordId}
                  onClick={() => {
                    onSelect(rec);
                    onOpenChange(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                    idx === selectedIndex
                      ? "bg-muted/50"
                      : "hover:bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded flex items-center justify-center shrink-0",
                      getObjectColor(rec.objectSlug)
                    )}
                  >
                    <Building2 className="h-3 w-3 text-white" />
                  </div>
                  <span className="font-medium flex-1 text-left truncate">
                    {rec.displayName}
                  </span>
                  {rec.subtitle && rec.subtitle !== rec.objectName && (
                    <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {rec.subtitle}
                    </span>
                  )}
                  <Badge
                    variant="secondary"
                    className="text-[10px] shrink-0 gap-1"
                  >
                    <div
                      className={cn(
                        "h-2 w-2 rounded-sm",
                        getObjectColor(rec.objectSlug)
                      )}
                    />
                    {rec.objectName}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>↑ ↓</span>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1 rounded bg-primary/20 px-2 py-1 text-xs text-primary">
            Select record ↵
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
