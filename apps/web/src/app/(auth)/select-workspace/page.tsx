"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Building2 } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

function SelectWorkspaceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wantCreate = searchParams.get("create") === "true";

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(wantCreate);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/v1/workspaces")
      .then((res) => res.json())
      .then((data) => {
        const list = data.data || [];
        setWorkspaces(list);

        // Only auto-select if user didn't explicitly ask to create
        if (!wantCreate) {
          if (list.length === 1) {
            selectWorkspace(list[0].id);
          }
          if (list.length === 0) {
            setShowCreate(true);
          }
        }
      })
      .catch(() => {
        setShowCreate(true);
      })
      .finally(() => setLoading(false));
  }, []);

  async function selectWorkspace(workspaceId: string) {
    const res = await fetch("/api/v1/workspaces/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });

    if (res.ok) {
      router.push("/home");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const res = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) {
        router.push("/home");
      } else {
        const data = await res.json();
        setError(data.error?.message || "Failed to create workspace");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const title = showCreate
    ? "Create a new workspace"
    : workspaces.length === 0
      ? "Create your workspace"
      : "Select a workspace";

  const description = showCreate
    ? "Each workspace has its own data, members, and settings"
    : workspaces.length === 0
      ? "Get started by creating your first workspace"
      : "Choose a workspace to continue";

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workspace list */}
        {workspaces.length > 0 && !showCreate && (
          <div className="space-y-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => selectWorkspace(ws.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ws.name}</p>
                  <p className="text-xs text-muted-foreground">{ws.role}</p>
                </div>
              </button>
            ))}

            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create new workspace
            </Button>
          </div>
        )}

        {/* Create workspace form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                type="text"
                placeholder="My Workspace"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              {workspaces.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreate(false)}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={creating || !newName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create workspace"
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function SelectWorkspacePage() {
  return (
    <Suspense>
      <SelectWorkspaceForm />
    </Suspense>
  );
}
