"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { AttributeType } from "@openclaw-crm/shared";
import { AttributeCell } from "@/components/records/attribute-cell";
import { AttributeEditor } from "@/components/records/attribute-editor";
import { cn } from "@/lib/utils";
import { ExternalLink, Trash2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface ListAttribute {
  id: string;
  slug: string;
  title: string;
  type: string;
  config: unknown;
  sortOrder: number;
}

interface ListEntry {
  id: string;
  recordId: string;
  recordDisplayName: string;
  recordObjectSlug: string;
  createdAt: string;
  listValues: Record<string, unknown>;
}

interface ListEntryTableProps {
  entries: ListEntry[];
  listAttributes: ListAttribute[];
  onUpdateEntryValues: (entryId: string, values: Record<string, unknown>) => void;
  onRemoveEntry: (entryId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function ListEntryTable({
  entries,
  listAttributes,
  onUpdateEntryValues,
  onRemoveEntry,
}: ListEntryTableProps) {
  const router = useRouter();
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    colId: string;
  } | null>(null);

  const columns = useMemo<ColumnDef<ListEntry>[]>(() => {
    // Open record button
    const openCol: ColumnDef<ListEntry> = {
      id: "_open",
      header: "",
      size: 40,
      cell: ({ row }) => (
        <button
          onClick={() =>
            router.push(
              `/objects/${row.original.recordObjectSlug}/${row.original.recordId}`
            )
          }
          className="flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      ),
    };

    // Record name column (always shown)
    const nameCol: ColumnDef<ListEntry> = {
      id: "_record_name",
      header: "Record",
      size: 200,
      cell: ({ row }) => (
        <span className="font-medium text-sm">
          {row.original.recordDisplayName}
        </span>
      ),
    };

    // Date added column
    const dateCol: ColumnDef<ListEntry> = {
      id: "_added_at",
      header: "Added",
      size: 120,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    };

    // List attribute columns
    const attrCols: ColumnDef<ListEntry>[] = listAttributes.map((attr) => ({
      id: attr.slug,
      header: attr.title,
      size: 150,
      cell: ({ row }: { row: { original: ListEntry; id: string } }) => {
        const val = row.original.listValues[attr.slug];
        const isEditing =
          editingCell?.rowId === row.original.id &&
          editingCell?.colId === attr.slug;

        if (isEditing) {
          return (
            <div className="relative">
              <AttributeEditor
                type={attr.type as AttributeType}
                value={val}
                onSave={(newVal) => {
                  onUpdateEntryValues(row.original.id, {
                    [attr.slug]: newVal,
                  });
                  setEditingCell(null);
                }}
                onCancel={() => setEditingCell(null)}
              />
            </div>
          );
        }

        return (
          <div
            className="cursor-pointer truncate px-1"
            onClick={() =>
              setEditingCell({
                rowId: row.original.id,
                colId: attr.slug,
              })
            }
          >
            <AttributeCell type={attr.type as AttributeType} value={val} />
          </div>
        );
      },
    }));

    // Remove button column
    const removeCol: ColumnDef<ListEntry> = {
      id: "_remove",
      header: "",
      size: 40,
      cell: ({ row }) => (
        <button
          onClick={() => onRemoveEntry(row.original.id)}
          className="flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      ),
    };

    return [openCol, nameCol, ...attrCols, dateCol, removeCol];
  }, [listAttributes, editingCell, onUpdateEntryValues, onRemoveEntry, router]);

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-9 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="group/row border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="h-10 px-3 text-sm"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No entries yet. Add records to this list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
