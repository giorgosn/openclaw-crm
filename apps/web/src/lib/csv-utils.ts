/**
 * Client-safe CSV utilities for export and import.
 */

// ─── CSV Export ──────────────────────────────────────────────────────

interface AttributeDef {
  slug: string;
  title: string;
  type: string;
  options?: { id: string; title: string }[];
  statuses?: { id: string; title: string }[];
}

interface RecordRow {
  id: string;
  values: Record<string, unknown>;
}

/** Escape a CSV cell value — quote if it contains comma, newline, or double-quote */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Convert a typed attribute value to a plain string for CSV export */
function formatValue(value: unknown, attr: AttributeDef): string {
  if (value === null || value === undefined) return "";

  switch (attr.type) {
    case "personal_name": {
      const pn = value as { fullName?: string; firstName?: string; lastName?: string };
      return pn.fullName ?? [pn.firstName, pn.lastName].filter(Boolean).join(" ");
    }
    case "currency": {
      const c = value as { amount?: number; currency?: string };
      if (c.amount !== undefined) return `${c.amount} ${c.currency ?? ""}`.trim();
      return String(value);
    }
    case "location": {
      const loc = value as { line1?: string; city?: string; state?: string; country?: string };
      return [loc.line1, loc.city, loc.state, loc.country].filter(Boolean).join(", ");
    }
    case "select": {
      const opt = attr.options?.find((o) => o.id === value);
      return opt?.title ?? String(value);
    }
    case "status": {
      const st = attr.statuses?.find((s) => s.id === value);
      return st?.title ?? String(value);
    }
    case "checkbox":
      return value ? "true" : "false";
    case "interaction": {
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    }
    default:
      if (Array.isArray(value)) {
        return value.map((v) => formatValue(v, attr)).join("; ");
      }
      return String(value);
  }
}

/** Generate CSV string from records and attributes */
export function generateCSV(
  records: RecordRow[],
  attributes: AttributeDef[]
): string {
  // Header row
  const headers = attributes.map((a) => escapeCSV(a.title));
  const lines = [headers.join(",")];

  // Data rows
  for (const record of records) {
    const cells = attributes.map((attr) => {
      const val = record.values[attr.slug];
      return escapeCSV(formatValue(val, attr));
    });
    lines.push(cells.join(","));
  }

  return lines.join("\n");
}

/** Trigger a file download in the browser */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── CSV Import (Parsing) ───────────────────────────────────────────

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
}

/** Parse a CSV string into headers + rows */
export function parseCSV(text: string): ParsedCSV {
  const lines: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(cell);
        cell = "";
      } else if (ch === "\r" && next === "\n") {
        current.push(cell);
        cell = "";
        lines.push(current);
        current = [];
        i++; // skip \n
      } else if (ch === "\n") {
        current.push(cell);
        cell = "";
        lines.push(current);
        current = [];
      } else {
        cell += ch;
      }
    }
  }

  // Last cell/line
  if (cell || current.length > 0) {
    current.push(cell);
    lines.push(current);
  }

  // Filter out empty trailing lines
  while (lines.length > 0 && lines[lines.length - 1].every((c) => c === "")) {
    lines.pop();
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  return {
    headers: lines[0],
    rows: lines.slice(1),
  };
}
