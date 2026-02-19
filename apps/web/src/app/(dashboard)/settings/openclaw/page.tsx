"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Terminal,
  FileText,
} from "lucide-react";

interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function OpenClawPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [copied, setCopied] = useState<"skill" | "config" | "install" | null>(null);

  // Auto-detect instance URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      setInstanceUrl(window.location.origin);
    }
  }, []);

  // Load API keys
  useEffect(() => {
    async function fetchKeys() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/api-keys");
        if (res.ok) {
          const data = await res.json();
          const keys = data.data?.api_keys ?? [];
          setApiKeys(keys);
          if (keys.length > 0) {
            setSelectedKeyId(keys[0].id);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchKeys();
  }, []);

  const selectedKey = apiKeys.find((k) => k.id === selectedKeyId);

  // Generate SKILL.md content
  const skillMd = useMemo(() => {
    const url = instanceUrl || "https://your-openclaw-instance.com";
    return `---
name: openclaw
description: Interact with OpenClaw CRM CRM — manage workspaces, records, contacts, companies, deals, tasks, notes, and lists.
homepage: ${url}
user-invocable: true
metadata:
  clawdbot:
    requires:
      env:
        - OPENCLAW_API_URL
        - OPENCLAW_API_KEY
---

# OpenClaw CRM CRM Skill

You have access to an OpenClaw CRM CRM instance. Use its REST API to help users manage their workspaces, contacts, companies, deals, tasks, notes, and lists.

## Configuration

- **Base URL**: \`$OPENCLAW_API_URL\` (e.g. \`${url}\`)
- **Auth**: Bearer token via \`$OPENCLAW_API_KEY\`
- All requests use \`Authorization: Bearer $OPENCLAW_API_KEY\` header
- All responses use envelope format: \`{ "data": ... }\` on success, \`{ "error": { "code", "message" } }\` on error
- API keys are scoped to a single workspace — all data returned is from the key's workspace

## Core Concepts

- **Workspaces** isolate data, members, and settings. Each API key belongs to one workspace. Users can belong to multiple workspaces.
- **Objects** are entity types (People, Companies, Deals, or custom). Each has a slug (e.g. \`people\`, \`companies\`, \`deals\`).
- **Records** are instances of objects. Values are stored as key-value pairs keyed by attribute slug.
- **Attributes** define fields on objects. 17 types: text, number, currency, date, timestamp, checkbox, select, status, rating, email_address, phone_number, domain, location, personal_name, record_reference, actor_reference, interaction.
- **Lists** are collections of records with custom list-specific attributes (like stages for a sales pipeline).
- **Tasks** and **Notes** can be attached to records. Tasks are workspace-scoped.

## API Endpoints

### Workspace

\`\`\`
GET /api/v1/workspace
\`\`\`
Get the current workspace details (name, slug, settings).

\`\`\`
PATCH /api/v1/workspace
Content-Type: application/json
{ "name": "New Name" }
\`\`\`
Update workspace settings (admin only).

\`\`\`
GET /api/v1/workspace-members
\`\`\`
List all members of the workspace with their roles.

\`\`\`
POST /api/v1/workspace-members
Content-Type: application/json
{ "email": "user@example.com", "role": "member" }
\`\`\`
Add a user to the workspace by email (admin only). Role can be "admin" or "member".

### Objects

\`\`\`
GET /api/v1/objects
\`\`\`
List all objects in the workspace. Returns array of objects with id, slug, singularName, pluralName.

\`\`\`
GET /api/v1/objects/:slug
\`\`\`
Get a single object by slug. Includes attributes.

\`\`\`
GET /api/v1/objects/:slug/attributes
\`\`\`
List attributes for an object. Returns id, slug, title, type, config, isRequired, isUnique.

### Records

\`\`\`
GET /api/v1/objects/:slug/records?limit=50&offset=0&sort=created_at&order=desc
\`\`\`
List records for an object. Supports pagination, sorting, and filtering.

\`\`\`
POST /api/v1/objects/:slug/records
Content-Type: application/json
{ "values": { "name": "Acme Corp", "domain": "acme.com" } }
\`\`\`
Create a new record. Keys are attribute slugs, values match the attribute type.

\`\`\`
GET /api/v1/objects/:slug/records/:recordId
\`\`\`
Get a single record with all its values.

\`\`\`
PATCH /api/v1/objects/:slug/records/:recordId
Content-Type: application/json
{ "values": { "domain": "new-acme.com" } }
\`\`\`
Update a record. Only include attributes you want to change.

\`\`\`
DELETE /api/v1/objects/:slug/records/:recordId
\`\`\`
Delete a record permanently.

### Search

\`\`\`
GET /api/v1/search?q=acme&limit=10
\`\`\`
Full-text search across all records in the workspace. Returns matching records with their object type.

### Tasks

\`\`\`
GET /api/v1/tasks?showCompleted=false&limit=50&offset=0
\`\`\`
List tasks in the workspace. Set \`showCompleted=true\` to include completed tasks. Supports pagination.

\`\`\`
POST /api/v1/tasks
Content-Type: application/json
{ "content": "Follow up with Acme", "deadline": "2025-03-01", "recordIds": ["uuid"], "assigneeIds": ["uuid"] }
\`\`\`
Create a task. \`recordIds\` links it to records, \`assigneeIds\` assigns it to users.

\`\`\`
PATCH /api/v1/tasks/:taskId
Content-Type: application/json
{ "isCompleted": true }
\`\`\`
Update a task (mark complete, change content, deadline, recordIds, assigneeIds).

\`\`\`
DELETE /api/v1/tasks/:taskId
\`\`\`
Delete a task permanently.

\`\`\`
GET /api/v1/objects/:slug/records/:recordId/tasks
\`\`\`
Get all tasks linked to a specific record.

### Notes

\`\`\`
GET /api/v1/notes?limit=50&offset=0
\`\`\`
List all notes in the workspace. Supports pagination.

\`\`\`
GET /api/v1/notes/:noteId
\`\`\`
Get a single note by ID.

\`\`\`
GET /api/v1/objects/:slug/records/:recordId/notes
\`\`\`
Get notes for a specific record.

\`\`\`
POST /api/v1/notes
Content-Type: application/json
{ "recordId": "uuid", "title": "Meeting Notes", "content": "Discussed partnership..." }
\`\`\`
Create a note attached to a record.

\`\`\`
PATCH /api/v1/notes/:noteId
Content-Type: application/json
{ "title": "Updated Title", "content": "Updated content..." }
\`\`\`
Update a note.

\`\`\`
DELETE /api/v1/notes/:noteId
\`\`\`
Delete a note permanently.

### Lists

\`\`\`
GET /api/v1/lists
\`\`\`
List all lists in the workspace.

\`\`\`
GET /api/v1/lists/:listId
\`\`\`
Get list details including attributes and entry count.

\`\`\`
GET /api/v1/lists/:listId/entries?limit=50&offset=0
\`\`\`
Get entries in a list with their values.

\`\`\`
POST /api/v1/lists/:listId/entries
Content-Type: application/json
{ "recordId": "uuid", "values": {} }
\`\`\`
Add a record to a list. Optionally include list-specific values.

\`\`\`
PATCH /api/v1/lists/:listId/entries/:entryId
Content-Type: application/json
{ "values": { "stage": "qualified" } }
\`\`\`
Update list-specific values for an entry.

\`\`\`
DELETE /api/v1/lists/:listId/entries/:entryId
\`\`\`
Remove a record from a list.

### Notifications

\`\`\`
GET /api/v1/notifications?limit=30&unreadOnly=false
\`\`\`
Get notifications for the current user. Returns notifications and unreadCount.

\`\`\`
PATCH /api/v1/notifications/:notificationId
\`\`\`
Mark a notification as read.

\`\`\`
POST /api/v1/notifications/mark-all-read
\`\`\`
Mark all notifications as read.

## Value Formats by Attribute Type

When creating or updating records, use these value formats:

| Type | Format | Example |
|------|--------|---------|
| text | string | \`"Acme Corp"\` |
| number | number | \`42\` |
| currency | object | \`{ "value": 1500, "currency": "USD" }\` |
| date | ISO string | \`"2025-03-01"\` |
| timestamp | ISO string | \`"2025-03-01T10:00:00Z"\` |
| checkbox | boolean | \`true\` |
| select | string (option value) | \`"enterprise"\` |
| status | string (status value) | \`"active"\` |
| rating | number (1-5) | \`4\` |
| email_address | string | \`"john@acme.com"\` |
| phone_number | string | \`"+1-555-0100"\` |
| domain | string | \`"acme.com"\` |
| location | string | \`"San Francisco, CA"\` |
| personal_name | object | \`{ "first_name": "John", "last_name": "Smith" }\` |
| record_reference | UUID string | \`"uuid-of-target-record"\` |

## Best Practices

1. Always list objects first to discover available slugs before querying records.
2. **Check attributes for an object** to know valid field slugs and types — attribute slugs may differ from the type name (e.g. People use slug \`email_addresses\` for type \`email_address\`, and \`phone_numbers\` for type \`phone_number\`). For \`status\` attributes, the allowed values are returned in the \`statuses\` array on the attribute.
3. Use search for fuzzy lookups — it's faster than filtering records manually.
4. When creating records, check required attributes first to avoid validation errors.
5. For write operations (create, update, delete), confirm with the user before proceeding.
6. All data is scoped to the workspace the API key belongs to — no cross-workspace access is possible.
`;
  }, [instanceUrl]);

  // Generate openclaw.json config
  const openclawConfig = useMemo(() => {
    const url = instanceUrl || "https://your-openclaw-instance.com";
    return JSON.stringify(
      {
        skills: {
          openclaw: {
            enabled: true,
            env: {
              OPENCLAW_API_URL: url,
              OPENCLAW_API_KEY: selectedKey
                ? `${selectedKey.keyPrefix}...`
                : "<your-api-key>",
            },
          },
        },
      },
      null,
      2
    );
  }, [instanceUrl, selectedKey]);

  const installCmd = `mkdir -p ~/.openclaw/skills/openclaw && cp SKILL.md ~/.openclaw/skills/openclaw/SKILL.md`;

  function handleCopy(text: string, key: "skill" | "config" | "install") {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleDownload() {
    const blob = new Blob([skillMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SKILL.md";
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold">OpenClaw Integration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a skill file to connect your OpenClaw CRM instance with{" "}
          <a
            href="https://openclaw.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground inline-flex items-center gap-1"
          >
            OpenClaw
            <ExternalLink className="h-3 w-3" />
          </a>
          . This lets OpenClaw agents interact with your CRM data.
        </p>
      </div>

      {/* Step 1: Configuration */}
      <div className="space-y-6">
        <section className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              1
            </Badge>
            <h2 className="font-medium">Configure</h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="instance-url">Instance URL</Label>
              <Input
                id="instance-url"
                value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)}
                placeholder="https://your-crm.example.com"
              />
              <p className="text-xs text-muted-foreground">
                The URL where your OpenClaw CRM instance is accessible.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="api-key">API Key</Label>
              {apiKeys.length > 0 ? (
                <select
                  id="api-key"
                  value={selectedKeyId}
                  onChange={(e) => setSelectedKeyId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {apiKeys.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.name} ({key.keyPrefix})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  No API keys found.{" "}
                  <a
                    href="/settings/api-keys"
                    className="underline hover:text-foreground"
                  >
                    Create one first
                  </a>{" "}
                  to use with OpenClaw.
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                The API key OpenClaw will use to authenticate. Create keys in{" "}
                <a
                  href="/settings/api-keys"
                  className="underline hover:text-foreground"
                >
                  Settings &gt; API Keys
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Step 2: Skill File */}
        <section className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-mono">
                2
              </Badge>
              <h2 className="font-medium">Skill File</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(skillMd, "skill")}
              >
                {copied === "skill" ? (
                  <Check className="mr-1 h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="mr-1 h-3.5 w-3.5" />
                )}
                {copied === "skill" ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-2 left-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              SKILL.md
            </div>
            <pre className="rounded-md bg-muted p-3 pt-8 overflow-x-auto text-xs leading-relaxed max-h-80 overflow-y-auto">
              <code>{skillMd}</code>
            </pre>
          </div>
        </section>

        {/* Step 3: OpenClaw Config */}
        <section className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-mono">
                3
              </Badge>
              <h2 className="font-medium">OpenClaw Config</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(openclawConfig, "config")}
            >
              {copied === "config" ? (
                <Check className="mr-1 h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="mr-1 h-3.5 w-3.5" />
              )}
              {copied === "config" ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Add this to your <code className="text-xs bg-muted px-1 py-0.5 rounded">openclaw.json</code> or <code className="text-xs bg-muted px-1 py-0.5 rounded">moltbot.json</code> config file.
            Replace the API key placeholder with your actual key.
          </p>

          <div className="relative">
            <div className="absolute top-2 left-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              openclaw.json
            </div>
            <pre className="rounded-md bg-muted p-3 pt-8 overflow-x-auto text-xs leading-relaxed">
              <code>{openclawConfig}</code>
            </pre>
          </div>
        </section>

        {/* Step 4: Install */}
        <section className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-mono">
                4
              </Badge>
              <h2 className="font-medium">Install</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(installCmd, "install")}
            >
              {copied === "install" ? (
                <Check className="mr-1 h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="mr-1 h-3.5 w-3.5" />
              )}
              {copied === "install" ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            After downloading the SKILL.md, install it to your OpenClaw skills directory:
          </p>

          <div className="relative">
            <div className="absolute top-2 left-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Terminal className="h-3 w-3" />
              Terminal
            </div>
            <pre className="rounded-md bg-muted p-3 pt-8 overflow-x-auto text-xs leading-relaxed">
              <code>{installCmd}</code>
            </pre>
          </div>

          <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-sm space-y-2">
            <p className="font-medium text-blue-600 dark:text-blue-400">
              Quick start:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground text-xs">
              <li>Download the SKILL.md file above</li>
              <li>Place it at <code className="bg-muted px-1 py-0.5 rounded">~/.openclaw/skills/openclaw/SKILL.md</code></li>
              <li>Add the config snippet to your <code className="bg-muted px-1 py-0.5 rounded">openclaw.json</code></li>
              <li>Set your actual API key in the config (from Settings &gt; API Keys)</li>
              <li>Restart OpenClaw — the agent can now interact with your CRM</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
