"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { AttributeType } from "@openclaw-crm/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface RecordCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
  attributes: AttributeDef[];
  objectName: string;
}

export function RecordCreateModal({
  open,
  onClose,
  onSubmit,
  attributes,
  objectName,
}: RecordCreateModalProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  function setValue(slug: string, val: unknown) {
    setValues((prev) => ({ ...prev, [slug]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
      setValues({});
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create {objectName}</DialogTitle>
          <DialogDescription>Fill in the fields to create a new record.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {attributes.map((attr) => (
            <FieldInput
              key={attr.id}
              attr={attr}
              value={values[attr.slug]}
              onChange={(val) => setValue(attr.slug, val)}
            />
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({
  attr,
  value,
  onChange,
}: {
  attr: AttributeDef;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const { type, title, isRequired, slug } = attr;

  return (
    <div className="space-y-1.5">
      <Label>
        {title}
        {isRequired && <span className="ml-1 text-destructive">*</span>}
      </Label>

      {type === "text" || type === "email_address" || type === "phone_number" || type === "domain" ? (
        <Input
          type={type === "email_address" ? "email" : type === "phone_number" ? "tel" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          required={isRequired}
        />
      ) : type === "number" ? (
        <Input
          type="number"
          value={value !== null && value !== undefined ? String(value) : ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          required={isRequired}
        />
      ) : type === "currency" ? (
        <Input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={(value as { amount?: number })?.amount?.toString() ?? ""}
          onChange={(e) =>
            onChange(
              e.target.value
                ? { amount: Number(e.target.value), currencyCode: "USD" }
                : null
            )
          }
          required={isRequired}
        />
      ) : type === "date" ? (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          required={isRequired}
        />
      ) : type === "checkbox" ? (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
        </div>
      ) : type === "select" ? (
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          required={isRequired}
        >
          <option value="">Select...</option>
          {attr.options?.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.title}
            </option>
          ))}
        </select>
      ) : type === "status" ? (
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          required={isRequired}
        >
          <option value="">Select...</option>
          {attr.statuses?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      ) : type === "rating" ? (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
            >
              <Star
                className={`h-5 w-5 ${i < ((value as number) ?? 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30 hover:text-yellow-500"}`}
              />
            </button>
          ))}
        </div>
      ) : type === "personal_name" ? (
        <div className="flex gap-2">
          <Input
            placeholder="First name"
            value={(value as { firstName?: string })?.firstName ?? ""}
            onChange={(e) => {
              const pn = (value as { firstName?: string; lastName?: string }) || {};
              const first = e.target.value;
              onChange({
                firstName: first || undefined,
                lastName: pn.lastName || undefined,
                fullName: [first, pn.lastName].filter(Boolean).join(" "),
              });
            }}
            required={isRequired}
          />
          <Input
            placeholder="Last name"
            value={(value as { lastName?: string })?.lastName ?? ""}
            onChange={(e) => {
              const pn = (value as { firstName?: string; lastName?: string }) || {};
              const last = e.target.value;
              onChange({
                firstName: pn.firstName || undefined,
                lastName: last || undefined,
                fullName: [pn.firstName, last].filter(Boolean).join(" "),
              });
            }}
          />
        </div>
      ) : type === "record_reference" ? (
        <RecordReferencePicker
          value={value as string | null}
          onChange={onChange}
        />
      ) : type === "actor_reference" ? (
        // Actor references are auto-set (current user), skip input
        null
      ) : (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      )}
    </div>
  );
}

// ─── Record Reference Picker ─────────────────────────────────────────

const OBJECT_COLORS: Record<string, string> = {
  companies: "bg-blue-500",
  people: "bg-purple-500",
  deals: "bg-orange-500",
};

function RecordReferencePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (val: unknown) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { recordId: string; displayName: string; objectSlug: string; objectName: string }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load display name for existing value
  useEffect(() => {
    if (!value) {
      setSelectedDisplay(null);
      return;
    }
    // Try to look up the record name
    fetch(`/api/v1/records/browse?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        const match = (data.data || []).find(
          (r: { recordId: string }) => r.recordId === value
        );
        if (match) setSelectedDisplay(match.displayName);
      })
      .catch(() => {});
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) {
      // Load browse results
      setLoading(true);
      fetch("/api/v1/records/browse?limit=20")
        .then((r) => r.json())
        .then((data) => setResults(data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}&limit=15`);
        if (res.ok) {
          const data = await res.json();
          setResults(
            (data.data || [])
              .filter((r: { type: string }) => r.type === "record")
              .map((r: { id: string; title: string; objectSlug: string; objectName: string }) => ({
                recordId: r.id,
                displayName: r.title,
                objectSlug: r.objectSlug,
                objectName: r.objectName,
              }))
          );
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  function handleFocus() {
    setShowDropdown(true);
    search(query);
  }

  function handleSelect(rec: typeof results[0]) {
    onChange(rec.recordId);
    setSelectedDisplay(rec.displayName);
    setShowDropdown(false);
    setQuery("");
  }

  function handleClear() {
    onChange(null);
    setSelectedDisplay(null);
    setQuery("");
  }

  if (value && selectedDisplay) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-input px-3 py-1.5">
        <span className="text-sm flex-1 truncate">{selectedDisplay}</span>
        <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          search(e.target.value);
        }}
        onFocus={handleFocus}
        placeholder="Search records..."
        className="h-9"
      />
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover shadow-lg">
          {loading && results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">Loading...</p>
          )}
          {!loading && results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No records found</p>
          )}
          {results.map((rec) => (
            <button
              key={rec.recordId}
              type="button"
              onClick={() => handleSelect(rec)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"
            >
              <div
                className={cn(
                  "h-4 w-4 rounded flex items-center justify-center shrink-0",
                  OBJECT_COLORS[rec.objectSlug] || "bg-muted-foreground"
                )}
              >
                <Building2 className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="truncate flex-1 text-left">{rec.displayName}</span>
              <span className="text-[10px] text-muted-foreground">{rec.objectName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
