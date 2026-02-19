"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/v1/workspace")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setWorkspace(data.data);
          setName(data.data.name);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/v1/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-6">General Settings</h1>

      <div className="space-y-6">
        {/* Workspace Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Workspace Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Workspace Slug (read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Workspace Slug</label>
          <input
            type="text"
            value={workspace.slug}
            disabled
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            The slug is used in URLs and cannot be changed.
          </p>
        </div>

        {/* Workspace ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Workspace ID</label>
          <input
            type="text"
            value={workspace.id}
            disabled
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground font-mono text-xs"
          />
        </div>

        {/* Created */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Created</label>
          <p className="text-sm text-muted-foreground">
            {new Date(workspace.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || name === workspace.name}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          {saved && (
            <span className="text-sm text-green-500">Saved</span>
          )}
        </div>
      </div>
    </div>
  );
}
