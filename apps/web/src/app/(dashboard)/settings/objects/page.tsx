"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Box,
  Lock,
} from "lucide-react";
import { ATTRIBUTE_TYPES } from "@openclaw-crm/shared";

interface Attribute {
  id: string;
  slug: string;
  title: string;
  type: string;
  isSystem: boolean;
  isRequired: boolean;
  isMultiselect: boolean;
  sortOrder: number;
}

interface ObjectDef {
  id: string;
  slug: string;
  singularName: string;
  pluralName: string;
  icon: string;
  isSystem: boolean;
}

export default function ObjectSettingsPage() {
  const [objects, setObjects] = useState<ObjectDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedObject, setExpandedObject] = useState<string | null>(null);
  const [objectAttrs, setObjectAttrs] = useState<Record<string, Attribute[]>>(
    {}
  );
  const [loadingAttrs, setLoadingAttrs] = useState<string | null>(null);

  // New attribute form state
  const [newAttrSlug, setNewAttrSlug] = useState("");
  const [newAttrTitle, setNewAttrTitle] = useState("");
  const [newAttrType, setNewAttrType] = useState("text");
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/v1/objects")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setObjects(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleObject(slug: string) {
    if (expandedObject === slug) {
      setExpandedObject(null);
      return;
    }
    setExpandedObject(slug);

    if (!objectAttrs[slug]) {
      setLoadingAttrs(slug);
      try {
        const res = await fetch(`/api/v1/objects/${slug}/attributes`);
        if (res.ok) {
          const data = await res.json();
          setObjectAttrs((prev) => ({ ...prev, [slug]: data.data ?? [] }));
        }
      } finally {
        setLoadingAttrs(null);
      }
    }
  }

  async function handleAddAttribute(objectSlug: string) {
    if (!newAttrSlug.trim() || !newAttrTitle.trim()) return;
    setAddingFor(objectSlug);
    setError("");

    try {
      const res = await fetch(`/api/v1/objects/${objectSlug}/attributes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newAttrSlug.trim().toLowerCase().replace(/\s+/g, "_"),
          title: newAttrTitle.trim(),
          type: newAttrType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setObjectAttrs((prev) => ({
          ...prev,
          [objectSlug]: [...(prev[objectSlug] ?? []), data.data],
        }));
        setNewAttrSlug("");
        setNewAttrTitle("");
        setNewAttrType("text");
      } else {
        const data = await res.json();
        setError(data.error?.message ?? "Failed to add attribute");
      }
    } finally {
      setAddingFor(null);
    }
  }

  async function handleDeleteAttribute(
    objectSlug: string,
    attributeId: string
  ) {
    const res = await fetch(
      `/api/v1/objects/${objectSlug}/attributes?attributeId=${attributeId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setObjectAttrs((prev) => ({
        ...prev,
        [objectSlug]: (prev[objectSlug] ?? []).filter(
          (a) => a.id !== attributeId
        ),
      }));
    } else {
      const data = await res.json();
      setError(data.error?.message ?? "Failed to delete attribute");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-6">Objects</h1>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 underline hover:no-underline"
          >
            dismiss
          </button>
        </div>
      )}

      <div className="space-y-2">
        {objects.map((obj) => {
          const isExpanded = expandedObject === obj.slug;
          const attrs = objectAttrs[obj.slug] ?? [];
          const isLoadingThis = loadingAttrs === obj.slug;

          return (
            <div
              key={obj.id}
              className="rounded-lg border border-border overflow-hidden"
            >
              {/* Object header */}
              <button
                onClick={() => toggleObject(obj.slug)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Box className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {obj.pluralName}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {obj.slug}
                  </span>
                </div>
                {obj.isSystem && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    System
                  </span>
                )}
              </button>

              {/* Expanded: attributes */}
              {isExpanded && (
                <div className="border-t border-border">
                  {isLoadingThis ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      {/* Attributes table */}
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="px-4 py-2 text-left font-medium">
                              Title
                            </th>
                            <th className="px-4 py-2 text-left font-medium">
                              Slug
                            </th>
                            <th className="px-4 py-2 text-left font-medium">
                              Type
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {attrs.map((attr) => (
                            <tr
                              key={attr.id}
                              className="border-b last:border-0"
                            >
                              <td className="px-4 py-2">
                                <span className="font-medium">
                                  {attr.title}
                                </span>
                                {attr.isRequired && (
                                  <span className="ml-1 text-xs text-destructive">
                                    *
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                                {attr.slug}
                              </td>
                              <td className="px-4 py-2">
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                  {attr.type}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                {attr.isSystem ? (
                                  <Lock className="inline h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      handleDeleteAttribute(obj.slug, attr.id)
                                    }
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {attrs.length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-4 text-center text-muted-foreground"
                              >
                                No attributes
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Add attribute form */}
                      <div className="flex items-end gap-2 border-t border-border px-4 py-3 bg-muted/20">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Title</label>
                          <input
                            type="text"
                            value={newAttrTitle}
                            onChange={(e) => {
                              setNewAttrTitle(e.target.value);
                              setNewAttrSlug(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, "_")
                                  .replace(/^_|_$/g, "")
                              );
                            }}
                            placeholder="Attribute title"
                            className="w-40 rounded border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Slug</label>
                          <input
                            type="text"
                            value={newAttrSlug}
                            onChange={(e) => setNewAttrSlug(e.target.value)}
                            placeholder="attribute_slug"
                            className="w-36 rounded border border-input bg-background px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Type</label>
                          <select
                            value={newAttrType}
                            onChange={(e) => setNewAttrType(e.target.value)}
                            className="rounded border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                          >
                            {ATTRIBUTE_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          size="sm"
                          className="text-xs"
                          disabled={
                            !newAttrTitle.trim() ||
                            !newAttrSlug.trim() ||
                            addingFor === obj.slug
                          }
                          onClick={() => handleAddAttribute(obj.slug)}
                        >
                          {addingFor === obj.slug ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="mr-1 h-3 w-3" />
                          )}
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
