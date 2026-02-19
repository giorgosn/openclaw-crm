"use client";

import type { SortConfig } from "@openclaw-crm/shared";
import type { AttributeType } from "@openclaw-crm/shared";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X, ArrowUp, ArrowDown } from "lucide-react";

interface AttributeDef {
  id: string;
  slug: string;
  title: string;
  type: AttributeType;
}

interface SortBuilderProps {
  attributes: AttributeDef[];
  sorts: SortConfig[];
  onChange: (sorts: SortConfig[]) => void;
  onClose: () => void;
}

export function SortBuilder({
  attributes,
  sorts,
  onChange,
  onClose,
}: SortBuilderProps) {
  // Only show sortable attributes (exclude json-stored ones like location, personal_name)
  const sortableAttrs = attributes.filter(
    (a) =>
      a.type !== "location" &&
      a.type !== "personal_name" &&
      a.type !== "interaction"
  );

  function addSort() {
    // Find first attribute not already in sorts
    const used = new Set(sorts.map((s) => s.attribute));
    const available = sortableAttrs.find((a) => !used.has(a.slug));
    if (!available) return;

    onChange([...sorts, { attribute: available.slug, direction: "asc" }]);
  }

  function updateSort(index: number, updates: Partial<SortConfig>) {
    const newSorts = [...sorts];
    newSorts[index] = { ...newSorts[index], ...updates };
    onChange(newSorts);
  }

  function removeSort(index: number) {
    onChange(sorts.filter((_, i) => i !== index));
  }

  return (
    <div className="w-[360px] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sort</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {sorts.length > 0 && (
        <div className="space-y-2">
          {sorts.map((sort, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs text-muted-foreground text-right">
                {index === 0 ? "Sort by" : "then by"}
              </span>

              {/* Attribute select */}
              <select
                value={sort.attribute}
                onChange={(e) =>
                  updateSort(index, { attribute: e.target.value })
                }
                className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs"
              >
                {sortableAttrs.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.title}
                  </option>
                ))}
              </select>

              {/* Direction toggle */}
              <button
                onClick={() =>
                  updateSort(index, {
                    direction: sort.direction === "asc" ? "desc" : "asc",
                  })
                }
                className="flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs hover:bg-muted"
              >
                {sort.direction === "asc" ? (
                  <>
                    <ArrowUp className="h-3 w-3" />
                    Asc
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3 w-3" />
                    Desc
                  </>
                )}
              </button>

              {/* Remove */}
              <button
                onClick={() => removeSort(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {sorts.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">
          No sorts applied. Records are sorted by creation date.
        </p>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={addSort}
        className="text-xs"
        disabled={sorts.length >= sortableAttrs.length}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add sort
      </Button>
    </div>
  );
}
