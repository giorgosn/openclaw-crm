<p align="center">
  <strong>openclaw</strong> <em>CRM</em>
</p>

<p align="center">
  Open-source, self-hosted CRM. AI-powered. Privacy-first. No vendor lock-in.
</p>

<p align="center">
  <a href="https://openclaw-crm.402box.io">Live Demo</a> · <a href="https://openclaw-crm.402box.io/docs">Docs</a> · <a href="https://openclaw-crm.402box.io/llms.txt">API Reference</a>
</p>

---

## Features

### Core CRM

- **People & Companies** — Contacts and organizations with 17 attribute types (text, number, currency, date, select, status, rating, email, phone, domain, location, personal name, record references, and more)
- **Deals & Pipeline** — Drag-and-drop Kanban boards with customizable stages (dnd-kit)
- **Table View** — Sortable, filterable data tables with inline editing (TanStack Table)
- **Record Detail** — Full record pages with related records, activity timeline, notes, and tasks
- **Lists** — Custom filtered collections with list-specific attributes
- **Notes** — Rich text editor (TipTap) with auto-save, linked to any record
- **Tasks** — Deadlines, assignees, record linking, completion tracking
- **Search** — Full-text search across all records with `Ctrl+K` command palette
- **CSV Import/Export** — Bulk import with column mapping and type coercion
- **Filtering & Sorting** — Compound filters (AND/OR) with attribute-type-aware operators
- **Custom Objects** — Create your own object types beyond People/Companies/Deals
- **Notifications** — In-app notification system
- **Dark Mode** — Dark theme throughout
- **Responsive** — Mobile-friendly with collapsible sidebar

### AI Chat Agent

Talk to your CRM data in plain English. Powered by [OpenRouter](https://openrouter.ai) with support for Claude, GPT-4o, Llama, Gemini, and more.

- **8 read tools** (auto-execute) — search records, list objects, get record details, list tasks, get notes, browse lists
- **5 write tools** (require confirmation) — create/update/delete records, create tasks, create notes
- Streaming SSE responses with token-by-token output
- Multi-round tool calling (up to 10 rounds per message)
- Dynamic system prompt built from your workspace schema
- Configurable model selection per workspace

### API & Integrations

- **Full REST API** — 40+ endpoints covering objects, records, lists, notes, tasks, search, and more
- **API Keys** — Bearer token auth (`oc_sk_` prefix), create/revoke from settings
- **OpenClaw Ready** — Generate SKILL.md and config for the OpenClaw agent ecosystem (5,700+ community AI skills)
- **Public API Docs** — OpenAPI spec at `/openapi.json`, concise reference at `/llms.txt`, full reference at `/llms-full.txt`

### Workspace & Auth

- **Better Auth** — Email/password + GitHub/Google OAuth
- **Multi-domain** — Works across multiple domains with trusted origins
- **Member Management** — Invite members, role-based permissions (admin/member)
- **Workspace Settings** — Customize workspace name, manage objects and attributes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| UI | shadcn/ui + Tailwind CSS v4 |
| Tables | TanStack Table v8 |
| Kanban | dnd-kit |
| Rich Text | TipTap |
| AI | OpenRouter (multi-model) |
| Monorepo | Turborepo + pnpm |

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 16+ (or use Docker)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/giorgosn/openclaw-crm.git
cd openclaw-crm
pnpm install
```

### 2. Set up environment

```bash
cp .env.example apps/web/.env
```

Edit `apps/web/.env` with your database credentials and a random `BETTER_AUTH_SECRET`.

### 3. Start PostgreSQL

Using Docker (recommended):

```bash
docker compose up db -d
```

Or use an existing PostgreSQL instance and update `DATABASE_URL` in `.env`.

### 4. Push database schema

```bash
pnpm db:push
```

### 5. Seed default data

Seeds workspace, standard objects (People, Companies, Deals), and deal stages:

```bash
pnpm db:seed
```

### 6. Start development server

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) and create an account.

## Docker Deployment

### Development

```bash
docker compose up
```

This starts PostgreSQL and the Next.js dev server.

### Production

```bash
# Set required env vars
export BETTER_AUTH_SECRET=$(openssl rand -base64 32)

# Build and run
docker compose -f docker-compose.prod.yml up --build -d
```

See `.env.example` for all configurable environment variables.

## AI Chat Setup

1. Get an API key from [OpenRouter](https://openrouter.ai)
2. Go to **Settings → AI** in the app
3. Enter your OpenRouter API key and select a model
4. Navigate to **/chat** and start talking to your data

## Project Structure

```
openclaw-crm/
├── apps/web/                  # Next.js application
│   ├── src/
│   │   ├── app/               # App Router pages & API routes
│   │   │   ├── (auth)/        # Login, Register
│   │   │   ├── (dashboard)/   # All authenticated pages
│   │   │   ├── chat/          # AI chat interface
│   │   │   ├── docs/          # Documentation page
│   │   │   └── api/v1/        # REST API endpoints
│   │   ├── components/        # React components
│   │   ├── db/                # Drizzle schema, migrations, seed
│   │   ├── lib/               # Auth, utils, query builder
│   │   └── services/          # Business logic layer
│   ├── public/                # Static assets, API docs
│   │   ├── llms.txt           # Concise API reference
│   │   ├── llms-full.txt      # Full API reference
│   │   └── openapi.json       # OpenAPI specification
│   └── e2e/                   # Playwright E2E tests
├── packages/shared/           # Shared types & constants
├── docker-compose.yml         # Dev Docker config
├── docker-compose.prod.yml    # Production Docker config
└── Dockerfile                 # Multi-stage production build
```

## API

REST API at `/api/v1/` with Bearer token authentication.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/objects` | GET, POST | List/create objects |
| `/api/v1/objects/:slug` | GET, PATCH, DELETE | Object CRUD |
| `/api/v1/objects/:slug/attributes` | GET, POST | Manage attributes |
| `/api/v1/objects/:slug/records` | GET, POST | List/create records |
| `/api/v1/objects/:slug/records/query` | POST | Filter/sort records |
| `/api/v1/objects/:slug/records/:id` | GET, PATCH, DELETE | Record CRUD |
| `/api/v1/objects/:slug/records/import` | POST | Bulk CSV import |
| `/api/v1/lists` | GET, POST | List/create lists |
| `/api/v1/lists/:id` | GET, PATCH, DELETE | List CRUD |
| `/api/v1/lists/:id/entries` | GET, POST | List entries |
| `/api/v1/notes` | GET, POST | Notes |
| `/api/v1/tasks` | GET, POST | Tasks |
| `/api/v1/search` | GET | Full-text search |
| `/api/v1/workspace` | GET, PATCH | Workspace settings |
| `/api/v1/workspace-members` | GET, POST | Member management |
| `/api/v1/notifications` | GET | Notifications |
| `/api/v1/api-keys` | GET, POST | API key management |
| `/api/v1/chat/completions` | POST | AI chat (SSE stream) |
| `/api/v1/chat/conversations` | GET, POST | Chat conversations |
| `/api/v1/chat/tool-confirm` | POST | Approve/reject AI writes |

Full API documentation available at [`/llms.txt`](https://openclaw-crm.402box.io/llms.txt) and [`/openapi.json`](https://openclaw-crm.402box.io/openapi.json).

## Database Schema

Uses a **Typed EAV** (Entity-Attribute-Value) pattern where `record_values` has typed columns (`text_value`, `number_value`, `date_value`, `timestamp_value`, `boolean_value`, `json_value`, `referenced_record_id`) enabling native SQL filtering and indexing on each type.

## Running Tests

```bash
cd apps/web

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

## License

MIT
