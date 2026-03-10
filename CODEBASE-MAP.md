# OpenClaw CRM — Codebase Map

A file-by-file guide to what lives where and why.

---

## Root

| Path | Purpose |
|------|---------|
| `package.json` | Repo root; Turborepo scripts only (no runtime code) |
| `turbo.json` | Turborepo task pipeline (build, dev, db:*) |
| `pnpm-workspace.yaml` | Declares `apps/*` and `packages/*` as pnpm workspaces |
| `docker-compose.yml` | Dev environment: `db` (Postgres) + `web` (Next.js) |
| `docker-compose.prod.yml` | Production: same services, standalone Next.js output |
| `Dockerfile` | Multi-stage production build (dependencies → builder → runner) |
| `.env.example` | Template for `apps/web/.env`; documents all supported variables |

---

## `packages/shared/`

Shared code consumed by `apps/web` and available to any future package or external tooling.

| Path | Purpose |
|------|---------|
| `src/index.ts` | Barrel export for all shared types and constants |
| `src/types/attributes.ts` | `Attribute`, `SelectOption`, `Status`, `CreateAttributeInput` |
| `src/types/objects.ts` | `CrmObject`, `CrmObjectWithAttributes`, `CreateObjectInput` |
| `src/types/records.ts` | `CrmRecord`, `RecordValue`, `FlatRecord`, specialized value types (currency, location, personal name) |
| `src/types/api.ts` | `ApiResponse`, `FilterCondition`, `FilterGroup`, `SortConfig`, `QueryParams` |
| `src/constants/attribute-types.ts` | `ATTRIBUTE_TYPES` enum, `ATTRIBUTE_TYPE_COLUMN_MAP` (maps each type to its typed DB column) |
| `src/constants/standard-objects.ts` | `STANDARD_OBJECTS` (People, Companies, Deals with their built-in attributes), `DEAL_STAGES` |

---

## `apps/web/`

The entire Next.js application.

### Configuration files

| Path | Purpose |
|------|---------|
| `next.config.ts` | Transpiles `@openclaw-crm/shared`; enables standalone output via `NEXT_OUTPUT` env |
| `tsconfig.json` | TypeScript config; `@/*` path alias maps to `src/` |
| `drizzle.config.ts` | Drizzle Kit config (schema glob, migrations dir, DB connection) |
| `playwright.config.ts` | E2E test config; targets port 3000; uses `e2e/` test dir |
| `vercel.json` | Vercel deployment config (used for the hosted demo) |

---

### `src/app/` — Next.js App Router

#### Top-level

| Path | Purpose |
|------|---------|
| `layout.tsx` | Root HTML layout: Inter font, ThemeProvider, analytics scripts, cookie consent |
| `globals.css` | Tailwind CSS v4 base styles and CSS custom properties |
| `page.tsx` | Public landing page (hero, differentiators, AI demo, footer) |
| `robots.ts` | `/robots.txt` generation |
| `sitemap.ts` | `/sitemap.xml` generation |
| `opengraph-image.tsx` | Dynamic OG image |
| `twitter-image.tsx` | Dynamic Twitter card image |

#### `(auth)/`

Route group with no dashboard chrome; applies a centered card layout.

| Path | Purpose |
|------|---------|
| `(auth)/login/page.tsx` | Email/password + OAuth login form |
| `(auth)/register/page.tsx` | Account creation form |

#### `(dashboard)/`

All authenticated CRM pages. Layout wraps children in Sidebar + Topbar + CommandPalette.

| Path | Purpose |
|------|---------|
| `(dashboard)/layout.tsx` | Client layout: sidebar (responsive), topbar, command palette |
| `(dashboard)/home/page.tsx` | Dashboard: stats widgets, recent tasks, onboarding steps |
| `(dashboard)/objects/[slug]/page.tsx` | Object view: table + Kanban toggle, filter/sort toolbar, CSV import/export |
| `(dashboard)/objects/[slug]/[recordId]/page.tsx` | Record detail: attribute editor, related records, notes, tasks, activity timeline |
| `(dashboard)/lists/[listId]/page.tsx` | List view: filtered entry table with list-specific attributes |
| `(dashboard)/notes/page.tsx` | All notes browser |
| `(dashboard)/tasks/page.tsx` | All tasks list with completion, deadlines, assignees |
| `(dashboard)/chat/page.tsx` | AI chat interface |
| `(dashboard)/search/page.tsx` | Global search results |
| `(dashboard)/notifications/page.tsx` | In-app notification center |
| `(dashboard)/settings/page.tsx` | General workspace settings (name, slug) |
| `(dashboard)/settings/layout.tsx` | Settings sub-navigation |
| `(dashboard)/settings/members/page.tsx` | Workspace member management |
| `(dashboard)/settings/objects/page.tsx` | Create/manage custom objects and their attributes |
| `(dashboard)/settings/ai/page.tsx` | OpenRouter API key and model selection |
| `(dashboard)/settings/api-keys/page.tsx` | API key management (create, revoke) |
| `(dashboard)/settings/openclaw/page.tsx` | Generate SKILL.md + config for OpenClaw Bot integration |

#### `api/auth/`

| Path | Purpose |
|------|---------|
| `api/auth/[...all]/route.ts` | Better Auth catch-all handler (login, logout, session, OAuth callbacks) |

#### `api/v1/` — REST API (41 route handlers)

All routes call `getAuthContext(req)` first and return `{ data }` / `{ error }` JSON.

| Route | Methods | Purpose |
|-------|---------|---------|
| `objects/` | GET, POST | List all objects; create custom object |
| `objects/[slug]/` | GET, PATCH, DELETE | Get/update/delete an object definition |
| `objects/[slug]/attributes/` | GET, POST | List or add attributes to an object |
| `objects/[slug]/attributes/options/` | GET | Load select/status options for attributes |
| `objects/[slug]/records/` | GET, POST | List or create records |
| `objects/[slug]/records/query/` | POST | Filter and sort records with `FilterGroup` + `SortConfig` body |
| `objects/[slug]/records/import/` | POST | Bulk CSV import with column mapping and type coercion |
| `objects/[slug]/records/reorder/` | POST | Update `sortOrder` (Kanban drag-and-drop) |
| `objects/[slug]/records/[recordId]/` | GET, PATCH, DELETE | Single record CRUD |
| `objects/[slug]/records/[recordId]/related/` | GET | Records linked via `record_reference` attributes |
| `objects/[slug]/records/[recordId]/activity/` | GET | Activity timeline (value changes) |
| `objects/[slug]/records/[recordId]/notes/` | GET | Notes for a record |
| `objects/[slug]/records/[recordId]/tasks/` | GET | Tasks linked to a record |
| `records/browse/` | GET | Browse records across all object types (for reference pickers) |
| `lists/` | GET, POST | List all lists; create a list |
| `lists/[listId]/` | GET, PATCH, DELETE | List CRUD |
| `lists/[listId]/entries/` | GET, POST | List entries (records in the list) |
| `lists/[listId]/entries/[entryId]/` | DELETE | Remove a record from a list |
| `lists/[listId]/attributes/` | GET, POST | Manage list-specific attributes |
| `lists/[listId]/available-records/` | GET | Records not yet in the list (for "Add entry" picker) |
| `notes/` | GET, POST | All notes; create note |
| `notes/[noteId]/` | GET, PATCH, DELETE | Note CRUD |
| `tasks/` | GET, POST | All tasks; create task |
| `tasks/[taskId]/` | GET, PATCH, DELETE | Task CRUD |
| `search/` | GET | Full-text search across records and lists |
| `workspace/` | GET, PATCH | Get/update current workspace settings |
| `workspaces/` | GET, POST | List user's workspaces; create workspace |
| `workspaces/switch/` | POST | Set the `active-workspace-id` cookie |
| `workspace-members/` | GET, POST | List members; invite member |
| `workspace-members/[memberId]/` | DELETE | Remove member |
| `notifications/` | GET | List notifications |
| `notifications/[notificationId]/` | PATCH | Mark read/unread |
| `notifications/mark-all-read/` | POST | Mark all as read |
| `api-keys/` | GET, POST | List keys; create key (returns plaintext once) |
| `api-keys/[keyId]/` | DELETE | Revoke key |
| `ai-settings/` | GET, PATCH | Get/update workspace AI config (model, key) |
| `ai-settings/test/` | POST | Validate OpenRouter key and model |
| `chat/completions/` | POST | Stream AI response (SSE); processes tool calls up to 10 rounds |
| `chat/conversations/` | GET, POST | List or create conversations |
| `chat/conversations/[conversationId]/` | GET, DELETE | Get history or delete conversation |
| `chat/tool-confirm/` | POST | Approve or reject a pending AI write tool call |

#### `blog/`, `compare/`, `docs/`

Marketing and SEO pages. Static content served from `public/` markdown files (blog posts, API docs). Not part of the CRM application.

---

### `src/middleware.ts`

Runs on every request matching the config matcher. Enforces:

1. Session cookie presence (redirects to `/login` if absent)
2. Active workspace cookie presence (redirects to `/select-workspace` if absent)
3. Bypasses for public paths, static assets, Bearer-token API calls, and public spec files

---

### `src/db/`

| Path | Purpose |
|------|---------|
| `index.ts` | Creates and exports the `db` Drizzle instance (single postgres.js connection pool) |
| `schema/index.ts` | Barrel re-export of all schema files |
| `schema/auth.ts` | `users`, `sessions`, `accounts`, `verifications` (managed by Better Auth) |
| `schema/workspace.ts` | `workspaces`, `workspaceMembers` |
| `schema/objects.ts` | `objects`, `attributes`, `selectOptions`, `statuses`; defines `attributeTypeEnum` |
| `schema/records.ts` | `records`, `recordValues` (typed EAV with 7 typed columns + 8 indexes) |
| `schema/lists.ts` | `lists`, `listAttributes`, `listEntries`, `listEntryValues` |
| `schema/notes.ts` | `notes` (TipTap JSON stored in `content` jsonb column) |
| `schema/tasks.ts` | `tasks`, `taskRecords` (M:N record links), `taskAssignees` (M:N user links) |
| `schema/notifications.ts` | `notifications` |
| `schema/api-keys.ts` | `apiKeys` (key hash, expiry, last used, revoked at) |
| `schema/chat.ts` | `conversations`, `messages` (role enum, tool_calls jsonb) |
| `migrations/` | Drizzle-generated SQL migration files (used for production deploys) |
| `seed.ts` | Seeds workspace, standard objects, attributes, and deal stages |
| `migrate-workspaces.ts` | One-off utility for migrating data between workspaces |

---

### `src/services/`

Pure business logic. No direct HTTP; called from both API route handlers and AI tool handlers.

| File | Responsibilities |
|------|----------------|
| `records.ts` | `listRecords`, `getRecord`, `createRecord`, `updateRecord`, `deleteRecord`; handles typed EAV read/write, display name resolution, filter/sort |
| `objects.ts` | `listObjects`, `getObjectBySlug`, `getObjectWithAttributes`, `createObject`, `updateObject`, `deleteObject` |
| `attributes.ts` | Create/update/delete attributes; manage select options and statuses |
| `lists.ts` | CRUD for lists, list attributes, list entries, and list entry values |
| `notes.ts` | `getNotesForRecord`, `createNote`, `updateNote`, `deleteNote` |
| `tasks.ts` | `listTasks`, `createTask`, `updateTask`, `deleteTask`; resolves record and assignee links |
| `search.ts` | `globalSearch`; searches across `text_value`, `json_value`, display names |
| `workspace.ts` | Workspace settings read/write |
| `api-keys.ts` | Key creation (generates `oc_sk_*` token, stores hash), revocation, last-used update |
| `notifications.ts` | Create, list, and mark-read notifications |
| `display-names.ts` | `batchGetRecordDisplayNames`; resolves the primary display value for any record type |
| `ai-chat.ts` | `getAIConfig`, `buildSystemPrompt`, `toolDefinitions`, `toolHandlers`, `streamCompletion`; orchestrates full OpenRouter tool-call loop |

---

### `src/lib/`

Pure utility modules; no Drizzle, no HTTP.

| File | Purpose |
|------|---------|
| `auth.ts` | Better Auth server instance; configures email/password and social providers |
| `auth-client.ts` | Better Auth browser client (for login/register/session on the client side) |
| `api-utils.ts` | `getAuthContext` (cookie + Bearer), `unauthorized`, `notFound`, `forbidden`, `badRequest`, `success` helper functions |
| `query-builder.ts` | `buildFilterSQL`, `buildSortExpressions`; translates `FilterGroup`/`SortConfig` from `packages/shared` into Drizzle SQL fragments |
| `filter-utils.ts` | Client-side filter helpers (building empty conditions, display labels, operator lists per attribute type) |
| `display-name.ts` | `extractPersonalName`; parses `personal_name` JSON into display string |
| `csv-utils.ts` | `generateCSV`, `downloadCSV`, `parseCSV`; pure CSV generation and parsing for import/export |
| `content.ts` | `parseMarkdownFile`; uses `gray-matter` + `remark` to render markdown (used by blog/docs pages) |
| `utils.ts` | `cn()` (clsx + tailwind-merge), misc helpers |
| `analytics.ts` | `trackEvent()`; fires to Plausible and GA4 simultaneously |

---

### `src/components/`

#### `ui/`

shadcn/ui base components. Drop-ins from the shadcn CLI; generally not edited directly:
`button`, `input`, `dialog`, `dropdown-menu`, `popover`, `select`, `tabs`, `badge`, `card`, `label`, `separator`, `calendar`, `tooltip`, `toast`, etc.

#### `layout/`

| File | Purpose |
|------|---------|
| `sidebar.tsx` | Persistent left nav; links to objects, lists, notes, tasks, chat, settings; shows workspace name |
| `topbar.tsx` | Top bar with mobile menu button, search trigger, notifications, user menu |
| `command-palette.tsx` | `Ctrl+K` modal; searches records, navigates to pages |

#### `records/`

| File | Purpose |
|------|---------|
| `record-table.tsx` | TanStack Table v8 data table; sortable columns, inline cell editing, column visibility |
| `record-kanban.tsx` | dnd-kit Kanban board; groups records by status attribute, drag-to-reorder and drag-between-columns |
| `record-detail.tsx` | Full record page layout: attribute form, related records, notes, tasks, timeline tabs |
| `attribute-editor.tsx` | Edit a single attribute value; renders the appropriate input for each of the 17 attribute types |
| `attribute-cell.tsx` | Read-only table cell renderer for each attribute type |
| `record-create-modal.tsx` | Dialog for creating a new record with required fields |
| `related-records.tsx` | Shows records linked via `record_reference` attributes |
| `activity-timeline.tsx` | Chronological log of attribute value changes |
| `choose-record-dialog.tsx` | Search-and-select dialog for linking records (used by `record_reference` attributes) |
| `csv-import-modal.tsx` | Multi-step CSV import: file upload → column mapping → type coercion → import |

#### `filters/`

| File | Purpose |
|------|---------|
| `filter-builder.tsx` | UI for constructing a `FilterGroup` (AND/OR conditions, per-attribute operators) |
| `filter-bar.tsx` | Compact display of active filters with remove buttons |
| `sort-builder.tsx` | UI for adding and ordering `SortConfig` entries |

#### `notes/`

| File | Purpose |
|------|---------|
| `note-editor.tsx` | TipTap rich-text editor instance (links, formatting, placeholder) |
| `note-editor-panel.tsx` | Full note editing UI with auto-save |
| `record-notes.tsx` | Notes list + new note button for a record detail page |

#### `tasks/`

| File | Purpose |
|------|---------|
| `task-dialog.tsx` | Create/edit task modal (content, deadline, assignees, record links) |
| `task-list.tsx` | Reusable task list with completion toggles |
| `record-tasks.tsx` | Tasks section on a record detail page |

#### `lists/`

| File | Purpose |
|------|---------|
| `create-list-modal.tsx` | Dialog to create a new list |
| `list-entry-table.tsx` | Table view for list entries with list-specific attribute columns |
| `add-entry-modal.tsx` | Search-and-add dialog for adding records to a list |

#### `chat/`

| File | Purpose |
|------|---------|
| `chat-input.tsx` | Textarea with send button; disabled during streaming |
| `message-list.tsx` | Renders conversation messages; handles `pendingToolCall` confirmation UI |
| `confirmation-card.tsx` | "Approve / Reject" card shown when the AI wants to execute a write tool |
| `conversation-list.tsx` | Sidebar list of past conversations |

#### Other components

| File | Purpose |
|------|---------|
| `theme-provider.tsx` | next-themes wrapper |
| `theme-toggle.tsx` | Light/dark mode button |
| `scroll-reveal.tsx` | Intersection Observer fade-in animation (landing page) |
| `json-ld.tsx` | Injects JSON-LD schema.org structured data |
| `analytics/plausible-script.tsx` | Injects Plausible script tag |
| `analytics/ga4-script.tsx` | Injects GA4 script tag (only when consent given) |
| `analytics/cookie-consent.tsx` | Cookie consent banner; gates GA4 loading |
| `analytics/tracked-link.tsx` | `<Link>` and `<a>` wrappers that call `trackEvent()` on click |
| `landing/terminal-demo.tsx` | Animated typewriter terminal on the landing page |
| `landing/rotating-chat.tsx` | Rotating AI chat demo on the landing page |
| `landing/landing-nav.tsx` | Scroll-aware sticky nav wrapper |

---

### `src/hooks/`

| File | Purpose |
|------|---------|
| `use-object-records.ts` | Central hook for the object view page: fetches object definition + records, exposes `createRecord`, `updateRecord`, `fetchData`, filter/sort state |
| `use-list.ts` | Hook for the list detail page: fetches list + entries, exposes CRUD operations |

---

### `e2e/`

Playwright end-to-end tests.

| File | Purpose |
|------|---------|
| `auth.spec.ts` | Login, register, logout flows |
| `dashboard.spec.ts` | Dashboard page structure tests (currently skipped — require seeded auth) |

---

### `public/`

Static files served at the root.

| File | Purpose |
|------|---------|
| `llms.txt` | Plain-text product overview for LLM context |
| `llms-api.txt` | Concise API reference for LLM consumption |
| `llms-full.txt` | Full product + API documentation for LLMs |
| `openapi.json` | OpenAPI 3.x specification for the REST API |
| `blog/*.md` | Blog post markdown files (parsed at request time) |
| `compare/*.md` | Comparison page markdown files |
| `docs/` | Documentation page content |
