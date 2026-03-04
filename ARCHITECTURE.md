# OpenClaw CRM — Architecture

## Overview

OpenClaw CRM is a self-hosted, AI-first CRM built on Next.js 15 and PostgreSQL. It exposes a full REST API with Bearer-token auth so AI agents can manage CRM data through natural language, and ships a built-in AI chat assistant powered by OpenRouter.

---

## System Diagram

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              Browser / AI Agent                               │
└──────────────────────────┬──────────────────────────────────┬─────────────────┘
                           │ Cookie (web UI)                   │ Bearer oc_sk_* (API)
                           ▼                                   ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                         Next.js 15 — App Router                               │
│                                                                               │
│  ┌─────────────────────────┐    ┌──────────────────────────────────────────┐  │
│  │   Middleware             │    │   REST API  /api/v1/*                    │  │
│  │  • Session cookie check  │    │  • objects, records, lists, notes, tasks │  │
│  │  • Bearer token passthru │    │  • search, notifications, api-keys       │  │
│  │  • Workspace cookie check│    │  • chat/completions, chat/tool-confirm   │  │
│  └─────────────────────────┘    └──────────────────────────────────────────┘  │
│                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐    │
│  │  (auth) routes    │  │ (dashboard) routes│  │  Public routes           │    │
│  │  /login /register │  │  /home           │  │  / (landing)             │    │
│  └──────────────────┘  │  /objects/[slug]  │  │  /docs /blog /compare    │    │
│                        │  /objects/[slug]  │  │  /llms-api.txt           │    │
│                        │    /[recordId]    │  │  /openapi.json           │    │
│                        │  /chat /notes     │  └──────────────────────────┘    │
│                        │  /tasks /lists    │                                  │
│                        │  /settings/*      │                                  │
│                        └──────────────────┘                                  │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │  Services (business logic — no HTTP, callable from routes & AI tools)  │   │
│  │  records · objects · attributes · lists · notes · tasks · search       │   │
│  │  workspace · api-keys · notifications · display-names · ai-chat        │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │  Lib (pure utilities)                                                   │   │
│  │  auth · auth-client · api-utils · query-builder · filter-utils         │   │
│  │  display-name · csv-utils · content · utils · analytics                │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │  Drizzle ORM  ──────────────────────────────────►  PostgreSQL 16       │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
                                    │
                           ┌────────┴────────┐
                           │  OpenRouter API  │
                           │  (AI chat/tools) │
                           └─────────────────┘
```

---

## Monorepo Structure

Managed with **Turborepo** and **pnpm workspaces**.

| Package | Role |
|---------|------|
| `apps/web` | Next.js application — the entire product |
| `packages/shared` | Shared TypeScript types and constants; no runtime deps |

---

## Authentication & Authorization

- **Better Auth** handles sessions (email/password, optional GitHub/Google OAuth).
- Session stored in a cookie (`better-auth.session_token`).
- **Workspace context** resolved from the `active-workspace-id` cookie (web) or encoded in an API key (external).
- **API keys** use `oc_sk_` prefix, stored SHA-256 hashed, looked up by hash on every request.
- `getAuthContext(req)` in `lib/api-utils.ts` is the single entry point for auth in every API route handler.

### Auth flow (middleware)

```
Request
  └─ public path?           → pass through
  └─ Bearer oc_sk_*?        → pass through (checked in getAuthContext)
  └─ session cookie?
       └─ no  → redirect /login?redirect=...
       └─ yes
            └─ active-workspace-id cookie?
                 └─ no  → redirect /select-workspace
                 └─ yes → pass through
```

---

## Data Model

### Core tenancy

```
workspaces  1──* workspaceMembers *──1 users
```

### Dynamic schema (Object-Attribute-Record)

```
objects ──* attributes ──* selectOptions / statuses
   │
   └──* records ──* recordValues (typed EAV)
```

**Typed EAV** (`record_values`) uses separate columns per type:
`text_value`, `number_value`, `date_value`, `timestamp_value`,
`boolean_value`, `json_value`, `referenced_record_id`, `actor_id`.

Each column is independently indexed, enabling native SQL filtering without CAST overhead.

### Supporting entities

| Table | Description |
|-------|-------------|
| `notes` | TipTap JSON content, linked to a single record |
| `tasks` | Deadline, completion, M:N to records via `task_records`, M:N to users via `task_assignees` |
| `lists` | Named collections; own attributes (typed EAV via `list_entry_values`) |
| `conversations / messages` | AI chat history; `messages.tool_calls` stores raw OpenRouter tool call JSON |
| `api_keys` | Hashed API key tokens with expiry and revocation |
| `notifications` | In-app events, read/unread |

---

## REST API Design

Base path: `/api/v1/`

- Standard RESTful resources with GET / POST / PATCH / DELETE.
- All responses: `{ data: ... }` on success, `{ error: { code, message } }` on failure.
- Filter/sort via POST `/objects/:slug/records/query` with a `FilterGroup` + `SortConfig` body.
- AI chat via POST `/chat/completions` (SSE stream); write tools require a POST to `/chat/tool-confirm`.
- Machine-readable API docs at `/llms-api.txt` and `/openapi.json`.

---

## AI Chat Architecture

```
User message
  └─ POST /api/v1/chat/completions
       └─ buildSystemPrompt()  — workspace schema injected dynamically
       └─ OpenRouter API (SSE stream)
            └─ tool_calls detected
                 └─ read tools → auto-execute (up to 10 rounds)
                 └─ write tools → stream pendingToolCall to client
                      └─ user approves/rejects → POST /chat/tool-confirm
                           └─ tool executed, response appended
```

**Read tools (auto):** `search_records`, `list_objects`, `list_records`, `get_record`, `list_tasks`, `get_notes_for_record`, `list_lists`, `list_list_entries`

**Write tools (confirm):** `create_record`, `update_record`, `delete_record`, `create_task`, `create_note`

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Typed EAV over pure JSONB | Enables SQL indexing and filtering on individual attribute types without casting |
| Next.js API Routes for REST | Avoids a separate backend process; simplifies deployment |
| Services layer between routes and DB | Keeps route handlers thin; services are also called directly by the AI tool handlers |
| `packages/shared` for types | AI agents, external clients, and the app share the same type definitions |
| Better Auth (not NextAuth) | More flexible adapter support and first-class Drizzle integration |
| OpenRouter for AI | Single endpoint supporting all major model providers; model swappable per workspace |
