"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Send,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const ALL_EVENTS = [
  { value: "record.created", label: "Record Created" },
  { value: "record.updated", label: "Record Updated" },
  { value: "record.deleted", label: "Record Deleted" },
  { value: "task.created", label: "Task Created" },
  { value: "task.updated", label: "Task Updated" },
  { value: "task.completed", label: "Task Completed" },
  { value: "task.deleted", label: "Task Deleted" },
  { value: "note.created", label: "Note Created" },
  { value: "note.deleted", label: "Note Deleted" },
] as const;

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface Delivery {
  id: string;
  event: string;
  status: string;
  responseStatus: number | null;
  attempts: number;
  deliveredAt: string | null;
  createdAt: string;
}

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Expanded delivery panels
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [deliveriesLoading, setDeliveriesLoading] = useState<string | null>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["*"]);
  const [creating, setCreating] = useState(false);

  // Secret reveal
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Test ping
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; status: number | null; body: string | null } | null>(null);

  const fetchHooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/webhooks");
      if (res.ok) {
        const data = await res.json();
        setHooks(data.data?.webhooks ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHooks();
  }, [fetchHooks]);

  async function fetchDeliveries(webhookId: string) {
    setDeliveriesLoading(webhookId);
    try {
      const res = await fetch(`/api/v1/webhooks/${webhookId}/deliveries?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setDeliveries((prev) => ({ ...prev, [webhookId]: data.data?.deliveries ?? [] }));
      }
    } finally {
      setDeliveriesLoading(null);
    }
  }

  function toggleExpanded(webhookId: string) {
    if (expanded === webhookId) {
      setExpanded(null);
    } else {
      setExpanded(webhookId);
      if (!deliveries[webhookId]) fetchDeliveries(webhookId);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          url: newUrl.trim(),
          events: newEvents,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRevealedSecret(data.data.secretPlaintext);
        setNewName("");
        setNewUrl("");
        setNewEvents(["*"]);
        setShowCreate(false);
        fetchHooks();
      } else {
        const data = await res.json();
        setError(data.error?.message ?? "Failed to create webhook");
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/webhooks/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setHooks((prev) => prev.filter((h) => h.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        const data = await res.json();
        setError(data.error?.message ?? "Failed to delete webhook");
      }
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(hook: Webhook) {
    const res = await fetch(`/api/v1/webhooks/${hook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !hook.isActive }),
    });
    if (res.ok) {
      setHooks((prev) =>
        prev.map((h) => (h.id === hook.id ? { ...h, isActive: !hook.isActive } : h))
      );
    }
  }

  async function handleTest(hook: Webhook) {
    setTestingId(hook.id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/v1/webhooks/${hook.id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult({
        id: hook.id,
        ok: data.data?.success ?? false,
        status: data.data?.responseStatus ?? null,
        body: data.data?.responseBody ?? null,
      });
      // Refresh deliveries if expanded
      if (expanded === hook.id) fetchDeliveries(hook.id);
    } finally {
      setTestingId(null);
    }
  }

  function toggleEvent(value: string) {
    if (value === "*") {
      setNewEvents(["*"]);
      return;
    }
    const withoutWildcard = newEvents.filter((e) => e !== "*");
    if (withoutWildcard.includes(value)) {
      const updated = withoutWildcard.filter((e) => e !== value);
      setNewEvents(updated.length === 0 ? ["*"] : updated);
    } else {
      setNewEvents([...withoutWildcard, value]);
    }
  }

  function copySecret() {
    if (revealedSecret) {
      navigator.clipboard.writeText(revealedSecret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  }

  function eventLabel(events: string[]): string {
    if (events.includes("*")) return "All events";
    if (events.length <= 3) return events.join(", ");
    return `${events.slice(0, 2).join(", ")} +${events.length - 2} more`;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Webhooks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Receive HTTP POST notifications when events happen in your workspace.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline hover:no-underline">
            dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : hooks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No webhooks yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add a webhook to receive real-time event notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {hooks.map((hook) => (
            <div key={hook.id} className="rounded-lg border bg-card">
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{hook.name}</span>
                    <Badge
                      variant={hook.isActive ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {hook.isActive ? "active" : "inactive"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{hook.url}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {eventLabel(hook.events)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {testResult?.id === hook.id && (
                    <span
                      className={`text-xs mr-1 ${testResult.ok ? "text-green-500" : "text-destructive"}`}
                    >
                      {testResult.ok
                        ? `✓ ${testResult.status}`
                        : `✗ ${testResult.status ?? "failed"}`}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    title="Send test ping"
                    disabled={testingId === hook.id}
                    onClick={() => handleTest(hook)}
                  >
                    {testingId === hook.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    title={hook.isActive ? "Disable" : "Enable"}
                    onClick={() => toggleActive(hook)}
                  >
                    {hook.isActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Delete"
                    onClick={() => setDeleteTarget(hook)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    title="Show deliveries"
                    onClick={() => toggleExpanded(hook.id)}
                  >
                    {expanded === hook.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Deliveries panel */}
              {expanded === hook.id && (
                <div className="border-t px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Recent Deliveries
                  </p>
                  {deliveriesLoading === hook.id ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (deliveries[hook.id] ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No deliveries yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {(deliveries[hook.id] ?? []).map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 text-xs py-1.5 border-b last:border-0"
                        >
                          <Badge
                            variant={d.status === "success" ? "default" : "destructive"}
                            className="text-[10px] px-1.5 py-0 shrink-0"
                          >
                            {d.status === "success"
                              ? `✓ ${d.responseStatus}`
                              : `✗ ${d.responseStatus ?? "err"}`}
                          </Badge>
                          <span className="font-mono text-muted-foreground">{d.event}</span>
                          <span className="text-muted-foreground/60 ml-auto shrink-0">
                            {new Date(d.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Signing info */}
      {hooks.length > 0 && (
        <div className="mt-6 rounded-md border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Verifying signatures</p>
          <p>
            Each request includes an <code className="font-mono">X-OpenClaw-Signature</code> header
            with format <code className="font-mono">sha256=&lt;hmac&gt;</code>, computed using
            HMAC-SHA256 over the raw JSON body with your webhook secret.
          </p>
          <p>
            Also check <code className="font-mono">X-OpenClaw-Event</code> (event name) and{" "}
            <code className="font-mono">X-OpenClaw-Delivery</code> (unique delivery ID).
          </p>
        </div>
      )}

      {/* ── Create dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              OpenClaw will send a POST request to your URL when selected events occur.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="wh-name">Name</Label>
                <Input
                  id="wh-name"
                  placeholder="e.g. Zapier, Slack notifier"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wh-url">Endpoint URL</Label>
                <Input
                  id="wh-url"
                  type="url"
                  placeholder="https://your-server.com/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEvents.includes("*")}
                      onChange={() => setNewEvents(["*"])}
                      className="rounded"
                    />
                    <span className="text-sm font-medium">All events</span>
                  </label>
                  <div className="ml-1 border-l pl-4 space-y-1">
                    {ALL_EVENTS.map((ev) => (
                      <label key={ev.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!newEvents.includes("*") && newEvents.includes(ev.value)}
                          onChange={() => toggleEvent(ev.value)}
                          className="rounded"
                        />
                        <span className="text-sm text-muted-foreground">{ev.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newName.trim() || !newUrl.trim()}>
                {creating && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Add Webhook
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Secret reveal dialog ── */}
      <Dialog
        open={!!revealedSecret}
        onOpenChange={() => {
          setRevealedSecret(null);
          setSecretCopied(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Created</DialogTitle>
            <DialogDescription>
              Save your signing secret now — it won&apos;t be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Signing Secret</Label>
              <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
                <code className="flex-1 break-all text-xs">{revealedSecret}</code>
                <Button variant="ghost" size="icon" onClick={copySecret} className="h-7 w-7 shrink-0">
                  {secretCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this secret to verify that incoming requests come from OpenClaw. Compute{" "}
              <code className="font-mono">HMAC-SHA256(secret, rawBody)</code> and compare with the{" "}
              <code className="font-mono">X-OpenClaw-Signature</code> header.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => { setRevealedSecret(null); setSecretCopied(false); }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? Deliveries will be
              removed and no further events will be sent to this endpoint.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
