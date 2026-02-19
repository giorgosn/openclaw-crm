"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useList } from "@/hooks/use-list";
import { ListEntryTable } from "@/components/lists/list-entry-table";
import { AddEntryModal } from "@/components/lists/add-entry-modal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Trash2, ArrowLeft } from "lucide-react";

export default function ListPage() {
  const params = useParams<{ listId: string }>();
  const router = useRouter();
  const listId = params.listId;

  const {
    list,
    entries,
    total,
    loading,
    fetchData,
    addEntry,
    removeEntry,
    updateEntryValues,
  } = useList(listId);

  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete list "${list?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/v1/lists/${listId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/home");
    }
    setDeleting(false);
  }

  if (loading && !list) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        List not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{list.name}</h1>
            <p className="text-xs text-muted-foreground">
              {list.objectPluralName} list · {total}{" "}
              {total === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add {list.objectName}
          </Button>
        </div>
      </div>

      {/* Entry table */}
      <div className="flex-1 overflow-hidden">
        <ListEntryTable
          entries={entries}
          listAttributes={list.attributes}
          onUpdateEntryValues={updateEntryValues}
          onRemoveEntry={removeEntry}
        />
      </div>

      {/* Add entry modal */}
      <AddEntryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(recordId) => addEntry(recordId)}
        listId={listId}
        objectName={list.objectName}
      />
    </div>
  );
}
