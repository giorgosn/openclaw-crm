"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { AttributeType } from "@openclaw-crm/shared";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Star, Building2 } from "lucide-react";

interface AttributeEditorProps {
  type: AttributeType;
  value: unknown;
  options?: { id: string; title: string; color: string }[];
  statuses?: { id: string; title: string; color: string; isActive: boolean }[];
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

export function AttributeEditor({
  type,
  value,
  options,
  statuses,
  onSave,
  onCancel,
}: AttributeEditorProps) {
  switch (type) {
    case "text":
    case "email_address":
    case "phone_number":
    case "domain":
      return <TextEditor value={value as string} onSave={onSave} onCancel={onCancel} type={type === "email_address" ? "email" : type === "phone_number" ? "tel" : "text"} />;

    case "number":
    case "rating":
      if (type === "rating") {
        return <RatingEditor value={value as number} onSave={onSave} onCancel={onCancel} />;
      }
      return <NumberEditor value={value as number} onSave={onSave} onCancel={onCancel} />;

    case "currency":
      return <CurrencyEditor value={value as { amount?: number; currencyCode?: string }} onSave={onSave} onCancel={onCancel} />;

    case "date":
      return <DateEditor value={value as string} onSave={onSave} onCancel={onCancel} />;

    case "checkbox":
      // Toggle immediately
      onSave(!value);
      return null;

    case "select":
      return <SelectEditor value={value} options={options || []} onSave={onSave} onCancel={onCancel} />;

    case "status":
      return <StatusEditor value={value as string} statuses={statuses || []} onSave={onSave} onCancel={onCancel} />;

    case "personal_name":
      return <PersonalNameEditor value={value as { firstName?: string; lastName?: string; fullName?: string }} onSave={onSave} onCancel={onCancel} />;

    case "record_reference": {
      // Value may be { id, displayName } object or raw string UUID
      const refVal = value && typeof value === "object" && "id" in (value as Record<string, unknown>)
        ? (value as { id: string }).id
        : (value as string | null);
      return <RecordReferenceEditor value={refVal} onSave={onSave} onCancel={onCancel} />;
    }

    default:
      return <TextEditor value={String(value ?? "")} onSave={onSave} onCancel={onCancel} />;
  }
}

// ─── Sub-editors ─────────────────────────────────────────────────────

function TextEditor({ value, onSave, onCancel, type = "text" }: {
  value: string | null;
  onSave: (v: unknown) => void;
  onCancel: () => void;
  type?: string;
}) {
  const [text, setText] = useState(value ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <Input
      ref={ref}
      type={type}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave(text || null)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(text || null);
        if (e.key === "Escape") onCancel();
      }}
      className="h-7 text-sm"
    />
  );
}

function NumberEditor({ value, onSave, onCancel }: {
  value: number | null;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [num, setNum] = useState(value?.toString() ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <Input
      ref={ref}
      type="number"
      value={num}
      onChange={(e) => setNum(e.target.value)}
      onBlur={() => onSave(num ? Number(num) : null)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(num ? Number(num) : null);
        if (e.key === "Escape") onCancel();
      }}
      className="h-7 text-sm"
    />
  );
}

function CurrencyEditor({ value, onSave, onCancel }: {
  value: { amount?: number; currencyCode?: string } | null;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(value?.amount?.toString() ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  function save() {
    onSave(amount ? { amount: Number(amount), currencyCode: value?.currencyCode || "USD" } : null);
  }

  return (
    <Input
      ref={ref}
      type="number"
      step="0.01"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") onCancel();
      }}
      className="h-7 text-sm"
    />
  );
}

function DateEditor({ value, onSave, onCancel }: {
  value: string | null;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(value ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  return (
    <Input
      ref={ref}
      type="date"
      value={date}
      onChange={(e) => {
        setDate(e.target.value);
        onSave(e.target.value || null);
      }}
      onBlur={() => onSave(date || null)}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      className="h-7 text-sm"
    />
  );
}

function RatingEditor({ value, onSave, onCancel }: {
  value: number | null;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={onCancel}>
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          onClick={() => onSave(i + 1)}
          className="hover:scale-110 transition-transform"
        >
          <Star
            className={`h-4 w-4 ${i < (value ?? 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/40 hover:text-yellow-500"}`}
          />
        </button>
      ))}
    </div>
  );
}

function SelectEditor({ value, options, onSave, onCancel }: {
  value: unknown;
  options: { id: string; title: string; color: string }[];
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onCancel]);

  return (
    <div ref={ref} className="absolute z-50 mt-1 max-h-48 w-48 overflow-auto rounded-md border bg-popover p-1 shadow-lg">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSave(opt.id)}
          className={cn(
            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
            value === opt.id && "bg-accent"
          )}
        >
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
          {opt.title}
          {value === opt.id && <Check className="ml-auto h-3.5 w-3.5" />}
        </button>
      ))}
    </div>
  );
}

function StatusEditor({ value, statuses, onSave, onCancel }: {
  value: string | null;
  statuses: { id: string; title: string; color: string; isActive: boolean }[];
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onCancel]);

  return (
    <div ref={ref} className="absolute z-50 mt-1 max-h-48 w-48 overflow-auto rounded-md border bg-popover p-1 shadow-lg">
      {statuses.map((s) => (
        <button
          key={s.id}
          onClick={() => onSave(s.id)}
          className={cn(
            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
            value === s.id && "bg-accent"
          )}
        >
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
          {s.title}
          {value === s.id && <Check className="ml-auto h-3.5 w-3.5" />}
        </button>
      ))}
    </div>
  );
}

function PersonalNameEditor({ value, onSave, onCancel }: {
  value: { firstName?: string; lastName?: string; fullName?: string } | null;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [first, setFirst] = useState(value?.firstName ?? "");
  const [last, setLast] = useState(value?.lastName ?? "");
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  function save() {
    if (!first && !last) { onSave(null); return; }
    onSave({
      firstName: first || undefined,
      lastName: last || undefined,
      fullName: [first, last].filter(Boolean).join(" "),
    });
  }

  return (
    <div className="flex gap-1">
      <Input
        ref={firstRef}
        value={first}
        onChange={(e) => setFirst(e.target.value)}
        placeholder="First"
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") onCancel();
        }}
        className="h-7 text-sm"
      />
      <Input
        value={last}
        onChange={(e) => setLast(e.target.value)}
        placeholder="Last"
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") onCancel();
        }}
        className="h-7 text-sm"
      />
    </div>
  );
}

const OBJECT_COLORS: Record<string, string> = {
  companies: "bg-blue-500",
  people: "bg-purple-500",
  deals: "bg-orange-500",
};

function RecordReferenceEditor({ value, onSave, onCancel }: {
  value: string | null;
  onSave: (v: unknown) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { recordId: string; displayName: string; objectSlug: string; objectName: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ref.current?.focus();
    // Load initial results
    fetch("/api/v1/records/browse?limit=15")
      .then((r) => r.json())
      .then((data) => setResults(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) onCancel();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onCancel]);

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) {
      fetch("/api/v1/records/browse?limit=15")
        .then((r) => r.json())
        .then((data) => setResults(data.data || []))
        .catch(() => {});
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

  return (
    <div ref={wrapperRef} className="absolute z-50 mt-1 w-64 rounded-md border bg-popover shadow-lg">
      <div className="p-1.5 border-b border-border">
        <Input
          ref={ref}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Search records..."
          className="h-7 text-sm"
        />
      </div>
      <div className="max-h-48 overflow-auto p-1">
        {loading && results.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">Loading...</p>
        )}
        {!loading && results.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No records found</p>
        )}
        {/* Clear option */}
        {value && (
          <button
            onClick={() => onSave(null)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent mb-0.5"
          >
            Clear
          </button>
        )}
        {results.map((rec) => (
          <button
            key={rec.recordId}
            onClick={() => onSave(rec.recordId)}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
              value === rec.recordId && "bg-accent"
            )}
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
            {value === rec.recordId && <Check className="ml-auto h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
