"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ObjectOption {
  slug: string;
  singularName: string;
  pluralName: string;
}

interface CreateListModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, objectSlug: string) => void;
}

export function CreateListModal({
  open,
  onClose,
  onSubmit,
}: CreateListModalProps) {
  const [name, setName] = useState("");
  const [objectSlug, setObjectSlug] = useState("");
  const [objects, setObjects] = useState<ObjectOption[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/v1/objects")
        .then((res) => res.json())
        .then((data) => {
          const objs = data.data || [];
          setObjects(objs);
          if (objs.length > 0 && !objectSlug) {
            setObjectSlug(objs[0].slug);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !objectSlug) return;
    onSubmit(name.trim(), objectSlug);
    setName("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg">
        <h2 className="text-sm font-semibold mb-4">Create List</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hot Leads, Enterprise Prospects"
              className="mt-1"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-xs">Object Type</Label>
            <select
              value={objectSlug}
              onChange={(e) => setObjectSlug(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              {objects.map((obj) => (
                <option key={obj.slug} value={obj.slug}>
                  {obj.pluralName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
