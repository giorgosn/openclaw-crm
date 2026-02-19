"use client";

import { useState } from "react";
import type { AttributeType } from "@openclaw-crm/shared";
import { AttributeCell } from "./attribute-cell";
import { AttributeEditor } from "./attribute-editor";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

interface AttributeDef {
  id: string;
  slug: string;
  title: string;
  type: AttributeType;
  isRequired: boolean;
  isMultiselect: boolean;
  options?: { id: string; title: string; color: string }[];
  statuses?: { id: string; title: string; color: string; isActive: boolean }[];
}

interface RecordDetailProps {
  attributes: AttributeDef[];
  values: Record<string, unknown>;
  onUpdate: (slug: string, value: unknown) => void;
}

export function RecordDetail({ attributes, values, onUpdate }: RecordDetailProps) {
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      {attributes.map((attr) => {
        const val = values[attr.slug];
        const isEditing = editingSlug === attr.slug;

        return (
          <div
            key={attr.id}
            className="group flex items-start gap-2 rounded-md px-3 py-2 hover:bg-muted/30"
          >
            {/* Label */}
            <div className="w-40 shrink-0 pt-0.5">
              <span className="text-sm text-muted-foreground">{attr.title}</span>
            </div>

            {/* Value */}
            <div className="relative min-h-[28px] flex-1">
              {isEditing ? (
                <AttributeEditor
                  type={attr.type}
                  value={val}
                  options={attr.options}
                  statuses={attr.statuses}
                  onSave={(newVal) => {
                    onUpdate(attr.slug, newVal);
                    setEditingSlug(null);
                  }}
                  onCancel={() => setEditingSlug(null)}
                />
              ) : (
                <div
                  className="flex min-h-[28px] cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50"
                  onClick={() => setEditingSlug(attr.slug)}
                >
                  <AttributeCell
                    type={attr.type}
                    value={val}
                    options={attr.options}
                    statuses={attr.statuses}
                  />
                  <Pencil className="h-3 w-3 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/50" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
