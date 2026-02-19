"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { parseCSV, type ParsedCSV } from "@/lib/csv-utils";

interface AttributeDef {
  slug: string;
  title: string;
  type: string;
}

interface ImportResult {
  created: number;
  errors: { row: number; message: string }[];
  total: number;
}

interface CSVImportModalProps {
  open: boolean;
  onClose: () => void;
  objectSlug: string;
  objectName: string;
  attributes: AttributeDef[];
  onImportComplete: () => void;
}

export function CSVImportModal({
  open,
  onClose,
  objectSlug,
  objectName,
  attributes,
  onImportComplete,
}: CSVImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "map" | "importing" | "done">("upload");
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Record<number, string>>({}); // csvColIndex -> attributeSlug
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function reset() {
    setStep("upload");
    setParsed(null);
    setFileName("");
    setMapping({});
    setResult(null);
    setDragOver(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  const processFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const csv = parseCSV(text);
        setParsed(csv);

        // Auto-map columns by matching header names to attribute titles (case-insensitive)
        const autoMap: Record<number, string> = {};
        csv.headers.forEach((header, i) => {
          const normalized = header.trim().toLowerCase();
          const match = attributes.find(
            (a) =>
              a.title.toLowerCase() === normalized ||
              a.slug.toLowerCase() === normalized
          );
          if (match) {
            autoMap[i] = match.slug;
          }
        });
        setMapping(autoMap);
        setStep("map");
      };
      reader.readAsText(file);
    },
    [attributes]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      processFile(file);
    }
  }

  function updateMapping(csvIndex: number, attrSlug: string) {
    setMapping((prev) => {
      const next = { ...prev };
      if (attrSlug === "") {
        delete next[csvIndex];
      } else {
        next[csvIndex] = attrSlug;
      }
      return next;
    });
  }

  // Convert mapped value to the right type based on attribute type
  function coerceValue(raw: string, attr: AttributeDef): unknown {
    const trimmed = raw.trim();
    if (trimmed === "") return null;

    switch (attr.type) {
      case "number":
      case "rating": {
        const num = Number(trimmed);
        return isNaN(num) ? null : num;
      }
      case "checkbox":
        return ["true", "yes", "1"].includes(trimmed.toLowerCase());
      case "currency": {
        // Try to parse "100 USD" or just "100"
        const parts = trimmed.split(/\s+/);
        const amount = Number(parts[0]);
        if (isNaN(amount)) return null;
        return { amount, currency: parts[1] || "USD" };
      }
      case "personal_name": {
        const nameParts = trimmed.split(/\s+/);
        if (nameParts.length >= 2) {
          return {
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(" "),
            fullName: trimmed,
          };
        }
        return { firstName: trimmed, lastName: "", fullName: trimmed };
      }
      case "location": {
        // Simple: treat the whole string as line1
        return { line1: trimmed, city: "", state: "", country: "" };
      }
      default:
        return trimmed;
    }
  }

  async function handleImport() {
    if (!parsed) return;

    setStep("importing");

    // Build rows from CSV data using the mapping
    const rows = parsed.rows.map((csvRow) => {
      const record: Record<string, unknown> = {};
      for (const [colIndexStr, attrSlug] of Object.entries(mapping)) {
        const colIndex = Number(colIndexStr);
        const raw = csvRow[colIndex] ?? "";
        const attr = attributes.find((a) => a.slug === attrSlug);
        if (!attr) continue;
        const val = coerceValue(raw, attr);
        if (val !== null) {
          record[attrSlug] = val;
        }
      }
      return record;
    });

    try {
      const res = await fetch(`/api/v1/objects/${objectSlug}/records/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.data);
        setStep("done");
        onImportComplete();
      } else {
        const err = await res.json();
        setResult({
          created: 0,
          errors: [{ row: -1, message: err.error?.message ?? "Import failed" }],
          total: rows.length,
        });
        setStep("done");
      }
    } catch {
      setResult({
        created: 0,
        errors: [{ row: -1, message: "Network error" }],
        total: parsed.rows.length,
      });
      setStep("done");
    }
  }

  const mappedCount = Object.keys(mapping).length;
  const previewRows = parsed?.rows.slice(0, 5) ?? [];

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {objectName} Records</DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drop a CSV file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Maximum 1,000 rows per import
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              Choose File
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "map" && parsed && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{fileName}</span>
              <span>&mdash;</span>
              <span>
                {parsed.rows.length} row{parsed.rows.length !== 1 ? "s" : ""},{" "}
                {parsed.headers.length} column{parsed.headers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Mapping table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">CSV Column</th>
                    <th className="px-3 py-2 text-left font-medium">Maps To</th>
                    <th className="px-3 py-2 text-left font-medium">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.headers.map((header, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{header}</td>
                      <td className="px-3 py-2">
                        <select
                          value={mapping[i] ?? ""}
                          onChange={(e) => updateMapping(i, e.target.value)}
                          className="w-full rounded border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">-- Skip --</option>
                          {attributes.map((attr) => (
                            <option key={attr.slug} value={attr.slug}>
                              {attr.title} ({attr.type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-40">
                        {previewRows[0]?.[i] ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Preview rows */}
            {previewRows.length > 1 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Preview first {previewRows.length} rows
                </summary>
                <div className="mt-2 overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-2 py-1 text-left">#</th>
                        {parsed.headers.map((h, i) =>
                          mapping[i] ? (
                            <th key={i} className="px-2 py-1 text-left">
                              {attributes.find((a) => a.slug === mapping[i])?.title ?? h}
                            </th>
                          ) : null
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, ri) => (
                        <tr key={ri} className="border-b last:border-0">
                          <td className="px-2 py-1 text-muted-foreground">{ri + 1}</td>
                          {parsed.headers.map((_, ci) =>
                            mapping[ci] ? (
                              <td key={ci} className="px-2 py-1 truncate max-w-32">
                                {row[ci] ?? ""}
                              </td>
                            ) : null
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Step 3: Importing */}
        {step === "importing" && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-sm font-medium">Importing records...</p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a moment for large files
            </p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && result && (
          <div className="py-6 text-center space-y-3">
            {result.created > 0 ? (
              <CheckCircle2 className="h-10 w-10 mx-auto text-green-500" />
            ) : (
              <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
            )}
            <p className="text-sm font-medium">
              {result.created} of {result.total} records imported
            </p>
            {result.errors.length > 0 && (
              <div className="text-left mt-4 max-h-40 overflow-y-auto rounded border border-destructive/30 p-3">
                <p className="text-xs font-medium text-destructive mb-1">
                  {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}:
                </p>
                {result.errors.slice(0, 20).map((err, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {err.row >= 0 ? `Row ${err.row + 1}: ` : ""}
                    {err.message}
                  </p>
                ))}
                {result.errors.length > 20 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ...and {result.errors.length - 20} more errors
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === "map" && (
            <>
              <Button variant="ghost" onClick={reset}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={mappedCount === 0}
              >
                Import {parsed?.rows.length ?? 0} Records
                {mappedCount > 0 && (
                  <span className="ml-1 text-xs opacity-70">
                    ({mappedCount} column{mappedCount !== 1 ? "s" : ""} mapped)
                  </span>
                )}
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
