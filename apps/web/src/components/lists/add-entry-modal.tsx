"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

interface AvailableRecord {
  id: string;
  displayName: string;
}

interface AddEntryModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (recordId: string) => void;
  listId: string;
  objectName: string;
}

export function AddEntryModal({
  open,
  onClose,
  onAdd,
  listId,
  objectName,
}: AddEntryModalProps) {
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<AvailableRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(
        `/api/v1/lists/${listId}/available-records?${params}`
      );
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [listId, search]);

  useEffect(() => {
    if (open) {
      fetchRecords();
    }
  }, [open, fetchRecords]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-4 shadow-lg">
        <h2 className="text-sm font-semibold mb-3">
          Add {objectName} to list
        </h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${objectName}...`}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Results */}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {loading && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Loading...
            </p>
          )}
          {!loading && records.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No records available to add
            </p>
          )}
          {records.map((rec) => (
            <button
              key={rec.id}
              onClick={() => {
                onAdd(rec.id);
                // Remove from the available list immediately
                setRecords((prev) => prev.filter((r) => r.id !== rec.id));
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted text-left"
            >
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{rec.displayName}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
