# OpenClaw CRM — Feature Roadmap

This roadmap is derived from codebase analysis and community-requested features. Items are ordered by priority within each tier. Effort estimates assume a single experienced contributor.

---

## Tier 1 — Do First
> High impact. Architecture already supports them. Low risk of scope creep.

### 1. Webhook Integrations
**Effort:** 1–2 weeks | **Status:** Not started

Outbound HTTP calls triggered by CRM events (record created/updated/deleted, task assigned, deal stage changed). Enables the entire "workflow automations" use case via external tools (Zapier, Make, n8n) without building a custom engine.

**Foundation already in place:**
- Notifications table with `type` and `metadata` columns
- Service layer functions (`createRecord`, `updateRecord`, etc.) are the natural trigger points
- `getAuthContext` covers inbound auth for future inbound webhooks

**What needs building:**
- `webhooks` DB table (`url`, `events[]`, `secret`, `isActive`)
- `triggerWebhooks(event, payload)` helper called at the end of service mutations
- HMAC-SHA256 signature header on every delivery
- `settings/webhooks` page (follows existing `settings/*` pattern)
- Delivery log with retry on failure

---

### 2. API Key Scope Enforcement
**Effort:** 1 week | **Status:** Partially built (column exists, never checked)

The `api_keys` table has a `scopes` column (JSON, defaulting to `["*"]`) but scopes are never validated at the route level. Every key effectively has full access.

**What needs building:**
- Scope constants (`records:read`, `records:write`, `tasks:write`, `notes:write`, `admin`, etc.)
- `requireScope(ctx, scope)` helper in `lib/api-utils.ts`
- Wire `requireScope` into each API route handler
- Scope selector UI in `settings/api-keys` on key creation

---

### 3. Rate Limiting
**Effort:** 1 week | **Status:** Not started

No rate limiting exists on any endpoint. Most urgent on auth routes (brute force), AI chat completions (runaway OpenRouter spend), and bulk write endpoints.

**What needs building:**
- Sliding-window rate limiter in `src/middleware.ts` (in-memory for single-node; optional Redis/Upstash for multi-instance)
- Configurable limits per endpoint category via env vars (`RATE_LIMIT_AUTH`, `RATE_LIMIT_API`, `RATE_LIMIT_CHAT`)
- 429 response with `Retry-After` header

---

### 4. Additional Attribute Types
**Effort:** 2 days – 3 weeks each | **Status:** Not started

The attribute type system is the easiest extension point in the codebase. The pattern is fully established: add to `attributeTypeEnum`, `ATTRIBUTE_TYPES`, `ATTRIBUTE_TYPE_COLUMN_MAP`, `attribute-cell.tsx`, `attribute-editor.tsx`, and `filter-utils.ts`.

**Candidates in order of effort:**

| Type | Effort | Notes |
|------|--------|-------|
| `url` | 2 days | Maps to `text_value`; needs a link renderer |
| `attachment` / file | 2 weeks | Requires S3-compatible file storage integration |
| `formula` / computed | 2–3 weeks | Formula parser, no DB change, significant UI |

---

## Tier 2 — High Value, Plan Before Starting
> Meaningful features with non-trivial scope. Partial foundations exist.

### 5. Bulk Operation API Endpoints (Agent-Optimized)
**Effort:** 2–3 weeks | **Status:** Partial (CSV importer is the reference implementation)

Current AI tools (`create_record`, `update_record`, `delete_record`) are single-record. An agent processing a list of leads makes N sequential confirmed writes. The CSV importer already does batch Drizzle inserts — the service layer pattern exists.

**What needs building:**
- `bulk_create_records` and `bulk_update_records` tool definitions in `ai-chat.ts`
- Corresponding batch service functions (modelled on `importRecords` in `records.ts`)
- "Bulk confirm" UX — preview table of pending changes with approve-all / reject-all
- `POST /api/v1/objects/:slug/records/bulk` REST endpoint

---

### 6. Custom SKILL.md / Agent Framework Variants
**Effort:** 1–2 weeks | **Status:** Strong foundation (`toolDefinitions` is already OpenAI format)

`settings/openclaw` generates a SKILL.md for OpenClaw Bot. The same page can offer exports for other frameworks. No backend changes needed — this is template and UI work.

**Target formats:**

| Format | Notes |
|--------|-------|
| OpenAI function-calling JSON | Direct export of `toolDefinitions` array — already compatible |
| Anthropic `tool_use` | Minor structural transformation |
| MCP (Model Context Protocol) | Growing ecosystem; worth prioritising |
| LangChain / LlamaIndex tool spec | Python dict template |

---

### 7. API Key Usage Analytics
**Effort:** 2–3 weeks | **Status:** Partial (`lastUsedAt` column exists)

Richer analytics: request counts per day, endpoint breakdown, error rates, AI token usage.

**What needs building:**
- `api_key_usage_log` table (`key_id`, `endpoint`, `method`, `status_code`, `timestamp`)
- Fire-and-forget log append in `getAuthContext` (mirrors existing `lastUsedAt` update)
- Retention policy (90-day auto-delete via DB scheduled function or cron)
- Analytics table/chart in `settings/api-keys`

---

### 8. Better Mobile Experience
**Effort:** 3–5 weeks | **Status:** Layout works; data-heavy views are rough

The dashboard shell is already responsive. The pain points are specific components.

**What needs fixing:**
- `RecordTable` (TanStack Table) — column pinning and horizontal scroll on narrow screens
- `RecordKanban` (dnd-kit) — touch drag-and-drop on mobile
- Filter/sort builder popovers — stack badly on small screens
- Record detail attribute editor — form layout on narrow viewports

Good candidate for parallel contributor work — each component is independent.

---

### 9. Workflow Automations (Native Engine)
**Effort:** 6–10 weeks | **Status:** Partial (filter logic in `query-builder.ts` is reusable)

A trigger → condition → action engine built into the CRM. **Implement webhooks (item 1) first** — they cover the majority of automation needs via external tools at a fraction of the cost.

**Minimum viable scope:**
- Triggers: record created, record updated (specific attribute), deal stage changed, task completed
- Conditions: reuse `FilterGroup` / `buildFilterSQL` from `lib/query-builder.ts`
- Actions: send webhook, create task, update record field, send in-app notification

**What needs building:**
- `automations` and `automation_runs` DB tables
- Trigger evaluation hooks in service functions (after mutations)
- Condition evaluator (wraps existing filter logic)
- Action executor
- Automation builder UI

---

## Tier 3 — Strategic, High Complexity
> Valuable long-term. Require significant new infrastructure. Plan carefully before starting.

### 10. Email Sync
**Effort:** 8–16 weeks | **Status:** Not started

No infrastructure exists for external OAuth mail scopes, email ingestion, thread modelling, or contact matching.

**Prerequisites:**
- Gmail OAuth (separate from login OAuth — needs `gmail.readonly` scope + token storage per user)
- Microsoft Graph / Outlook OAuth
- Email ingestion pipeline (IMAP polling or provider push webhooks)
- Thread/message data model (separate from `notes`)
- Contact matching by `email_address` attribute (foundation exists in People schema)

**Recommended lighter first step (1 week):** "Log email as note" — paste email content into a note linked to a record. Covers the core workflow for most users without the sync infrastructure.

---

### 11. Calendar Sync
**Effort:** 8–12 weeks | **Status:** Not started — depends on email OAuth infrastructure

Two-way sync between CRM tasks/activities and Google Calendar / Outlook Calendar.

**Foundation that exists:**
- `tasks.deadline` (timestamp) maps naturally to calendar event start time
- Task-record links provide the context for event descriptions

**What's missing:**
- Calendar OAuth token storage (same infrastructure needed for email sync — implement together)
- Calendar event data model
- Two-way sync engine with conflict resolution
- Sync settings UI

**Recommended lighter first step (2 days):** Export tasks as a read-only `.ics` calendar subscription URL. No OAuth required, usable immediately in any calendar app.

---

## Effort Summary

| # | Feature | Effort | Tier |
|---|---------|--------|------|
| 1 | Webhook integrations | 1–2 weeks | 1 |
| 2 | API key scope enforcement | 1 week | 1 |
| 3 | Rate limiting | 1 week | 1 |
| 4 | Additional attribute types | 2 days – 3 weeks | 1 |
| 5 | Bulk agent API endpoints | 2–3 weeks | 2 |
| 6 | Agent framework SKILL.md variants | 1–2 weeks | 2 |
| 7 | API key usage analytics | 2–3 weeks | 2 |
| 8 | Better mobile experience | 3–5 weeks | 2 |
| 9 | Workflow automations (native) | 6–10 weeks | 2 |
| 10 | Email sync | 8–16 weeks | 3 |
| 11 | Calendar sync | 8–12 weeks | 3 |

---

## How to Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and pull request guidelines.

Issues are labelled by feature area. If you want to work on something from this roadmap, open an issue first to align on scope before starting — especially for Tier 2 and Tier 3 items.
