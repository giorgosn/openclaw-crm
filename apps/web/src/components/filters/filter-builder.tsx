"use client";

import { useState } from "react";
import type { FilterCondition, FilterGroup } from "@openclaw-crm/shared";
import type { AttributeType } from "@openclaw-crm/shared";
import { getOperatorsForType, OPERATOR_LABELS } from "@/lib/filter-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────

interface AttributeDef {
  id: string;
  slug: string;
  title: string;
  type: AttributeType;
  options?: { id: string; title: string; color: string }[];
  statuses?: { id: string; title: string; color: string; isActive: boolean }[];
}

interface FilterBuilderProps {
  attributes: AttributeDef[];
  filter: FilterGroup;
  onChange: (filter: FilterGroup) => void;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────

export function FilterBuilder({
  attributes,
  filter,
  onChange,
  onClose,
}: FilterBuilderProps) {
  // Only show filterable attributes
  const filterableAttrs = attributes.filter(
    (a) => a.type !== "interaction"
  );

  function addCondition() {
    const firstAttr = filterableAttrs[0];
    if (!firstAttr) return;

    const operators = getOperatorsForType(firstAttr.type);
    const newCond: FilterCondition = {
      attribute: firstAttr.slug,
      operator: operators[0],
      value: "",
    };

    onChange({
      ...filter,
      conditions: [...filter.conditions, newCond],
    });
  }

  function updateCondition(index: number, updates: Partial<FilterCondition>) {
    const newConditions = [...filter.conditions];
    const current = newConditions[index] as FilterCondition;
    newConditions[index] = { ...current, ...updates };

    // If attribute changed, reset operator and value
    if (updates.attribute && updates.attribute !== current.attribute) {
      const attr = filterableAttrs.find((a) => a.slug === updates.attribute);
      if (attr) {
        const ops = getOperatorsForType(attr.type);
        (newConditions[index] as FilterCondition).operator = ops[0];
        (newConditions[index] as FilterCondition).value = "";
      }
    }

    onChange({ ...filter, conditions: newConditions });
  }

  function removeCondition(index: number) {
    const newConditions = filter.conditions.filter((_, i) => i !== index);
    onChange({ ...filter, conditions: newConditions });
  }

  function toggleOperator() {
    onChange({
      ...filter,
      operator: filter.operator === "and" ? "or" : "and",
    });
  }

  return (
    <div className="w-[480px] space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {filter.conditions.length > 0 && (
        <div className="space-y-2">
          {filter.conditions.map((cond, index) => {
            // Skip nested groups for now
            if ("conditions" in cond) return null;
            const condition = cond as FilterCondition;
            const attr = filterableAttrs.find(
              (a) => a.slug === condition.attribute
            );

            return (
              <div key={index} className="flex items-center gap-2">
                {/* AND/OR toggle for 2nd+ condition */}
                {index === 0 ? (
                  <span className="w-12 shrink-0 text-xs text-muted-foreground text-right">
                    Where
                  </span>
                ) : (
                  <button
                    onClick={toggleOperator}
                    className="w-12 shrink-0 text-xs font-medium text-primary hover:text-primary/80 text-right uppercase"
                  >
                    {filter.operator}
                  </button>
                )}

                {/* Attribute select */}
                <select
                  value={condition.attribute}
                  onChange={(e) =>
                    updateCondition(index, { attribute: e.target.value })
                  }
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs min-w-[120px]"
                >
                  {filterableAttrs.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {a.title}
                    </option>
                  ))}
                </select>

                {/* Operator select */}
                <select
                  value={condition.operator}
                  onChange={(e) =>
                    updateCondition(index, {
                      operator: e.target.value as FilterCondition["operator"],
                    })
                  }
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs min-w-[100px]"
                >
                  {attr &&
                    getOperatorsForType(attr.type).map((op) => (
                      <option key={op} value={op}>
                        {OPERATOR_LABELS[op]}
                      </option>
                    ))}
                </select>

                {/* Value input (skip for is_empty / is_not_empty) */}
                {condition.operator !== "is_empty" &&
                  condition.operator !== "is_not_empty" && (
                    <FilterValueInput
                      attribute={attr}
                      value={condition.value}
                      onChange={(val) => updateCondition(index, { value: val })}
                    />
                  )}

                {/* Remove button */}
                <button
                  onClick={() => removeCondition(index)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {filter.conditions.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">
          No filters applied. Add a filter to narrow down records.
        </p>
      )}

      <Button variant="ghost" size="sm" onClick={addCondition} className="text-xs">
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add filter
      </Button>
    </div>
  );
}

// ─── Value Input ─────────────────────────────────────────────────────

function FilterValueInput({
  attribute,
  value,
  onChange,
}: {
  attribute?: AttributeDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  if (!attribute) return null;

  // Select/status: dropdown of options
  if (attribute.type === "select" && attribute.options) {
    return (
      <select
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs min-w-[100px]"
      >
        <option value="">Select...</option>
        {attribute.options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.title}
          </option>
        ))}
      </select>
    );
  }

  if (attribute.type === "status" && attribute.statuses) {
    return (
      <select
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs min-w-[100px]"
      >
        <option value="">Select...</option>
        {attribute.statuses.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
    );
  }

  // Checkbox: true/false
  if (attribute.type === "checkbox") {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value === "true")}
        className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs min-w-[80px]"
      >
        <option value="">Select...</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  // Number/currency/rating
  if (
    attribute.type === "number" ||
    attribute.type === "currency" ||
    attribute.type === "rating"
  ) {
    return (
      <Input
        type="number"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        className="h-8 flex-1 text-xs min-w-[80px]"
        placeholder="Value"
      />
    );
  }

  // Date/timestamp
  if (attribute.type === "date" || attribute.type === "timestamp") {
    return (
      <Input
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 flex-1 text-xs min-w-[120px]"
      />
    );
  }

  // Default: text input
  return (
    <Input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 flex-1 text-xs min-w-[100px]"
      placeholder="Value"
    />
  );
}
