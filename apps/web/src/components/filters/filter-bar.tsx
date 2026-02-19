"use client";

import type { FilterCondition, FilterGroup } from "@openclaw-crm/shared";
import type { AttributeType } from "@openclaw-crm/shared";
import { OPERATOR_LABELS } from "@/lib/filter-utils";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AttributeDef {
  id: string;
  slug: string;
  title: string;
  type: AttributeType;
  options?: { id: string; title: string; color: string }[];
  statuses?: { id: string; title: string; color: string; isActive: boolean }[];
}

interface FilterBarProps {
  filter: FilterGroup;
  attributes: AttributeDef[];
  onRemoveCondition: (index: number) => void;
  onClearAll: () => void;
}

export function FilterBar({
  filter,
  attributes,
  onRemoveCondition,
  onClearAll,
}: FilterBarProps) {
  if (!filter.conditions || filter.conditions.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {filter.conditions.map((cond, index) => {
        if ("conditions" in cond) return null;
        const condition = cond as FilterCondition;
        const attr = attributes.find((a) => a.slug === condition.attribute);
        if (!attr) return null;

        const displayValue = formatFilterValue(condition, attr);

        return (
          <Badge
            key={index}
            variant="secondary"
            className="gap-1 pl-2 pr-1 py-0.5 text-xs font-normal"
          >
            {index > 0 && (
              <span className="text-muted-foreground uppercase text-[10px] mr-1">
                {filter.operator}
              </span>
            )}
            <span className="text-muted-foreground">{attr.title}</span>
            <span>{OPERATOR_LABELS[condition.operator]}</span>
            {displayValue && (
              <span className="font-medium">{displayValue}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveCondition(index);
              }}
              className="ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}

      {filter.conditions.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-foreground ml-1"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

function formatFilterValue(
  condition: FilterCondition,
  attr: AttributeDef
): string {
  if (
    condition.operator === "is_empty" ||
    condition.operator === "is_not_empty"
  ) {
    return "";
  }

  const value = condition.value;
  if (value === null || value === undefined || value === "") return "";

  // Resolve select/status option title
  if (attr.type === "select" && attr.options) {
    const opt = attr.options.find((o) => o.id === value);
    if (opt) return opt.title;
  }

  if (attr.type === "status" && attr.statuses) {
    const status = attr.statuses.find((s) => s.id === value);
    if (status) return status.title;
  }

  if (attr.type === "checkbox") {
    return value === true ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}
