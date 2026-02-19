<p align="center">
  <strong>OpenClaw</strong> <em>CRM</em>
</p>

<p align="center">
  The CRM your AI agent already knows how to use.<br>
  Open-source. Self-hosted. Connect your OpenClaw Bot in 2 minutes.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://github.com/giorgosn/openclaw-crm/stargazers"><img src="https://img.shields.io/github/stars/giorgosn/openclaw-crm?style=social" alt="GitHub Stars"></a>
  <img src="https://img.shields.io/badge/TypeScript-100%25-3178C6" alt="TypeScript">
  <img src="https://img.shields.io/badge/Next.js-15-000000" alt="Next.js 15">
</p>

<p align="center">
  <a href="https://openclaw-crm.402box.io">Live Demo</a> · <a href="https://openclaw-crm.402box.io/docs">Docs</a> · <a href="https://openclaw-crm.402box.io/llms-api.txt">API Reference</a>
</p>

---

## Why OpenClaw CRM

Most CRMs are closed-source, expensive, and impossible for AI agents to work with natively. OpenClaw CRM is different: it ships with a full REST API, machine-readable docs, and first-class OpenClaw Bot integration. Your AI agent can search contacts, create deals, update records, and manage tasks without any glue code.

Self-host it on your own server. No vendor lock-in, no per-seat pricing, no data leaving your infrastructure.

## OpenClaw Bot Integration

OpenClaw CRM plugs directly into your [OpenClaw Bot](https://openclaw-crm.402box.io/docs#openclaw-bot). Generate a SKILL.md and config from **Settings > OpenClaw**, drop them into your bot's skills folder, and your agent can manage your CRM through natural language.

- 40+ REST API endpoints your bot can call
- Bearer token auth with `oc_sk_` prefix API keys
- Machine-readable docs at [`/llms-api.txt`](https://openclaw-crm.402box.io/llms-api.txt) and [`/openapi.json`](https://openclaw-crm.402box.io/openapi.json)

## Features

### Core CRM

- **People & Companies**: contacts and organizations with 17 attribute types (text, number, currency, date, select, status, rating, email, phone, domain, location, personal name, record references, and more)
- **Deals & Pipeline**: drag-and-drop Kanban boards with customizable stages
- **Table View**: sortable, filterable data tables with inline editing
- **Record Detail**: full record pages with related records, activity timeline, notes, and tasks
- **Lists**: custom filtered collections with list-specific attributes
- **Notes**: rich text editor with auto-save, linked to any record
- **Tasks**: deadlines, assignees, record linking, completion tracking
- **Search**: full-text search across all records with `Ctrl+K` command palette
- **CSV Import/Export**: bulk import with column mapping and type coercion
- **Filtering & Sorting**: compound filters (AND/OR) with attribute-type-aware operators
- **Custom Objects**: create your own object types beyond People, Companies, and Deals
- **Notifications**: in-app notification system
- **Dark & Light Mode**: theme support throughout
- **Responsive**: mobile-friendly with collapsible sidebar

### Built-in AI Chat Agent

Talk to your CRM data in plain English. Powered by [OpenRouter](https://openrouter.ai) with support for Claude, GPT-4o, Llama, Gemini, and more.

- 8 read tools (auto-execute): search records, list objects, get record details, list tasks, get notes, browse lists
- 5 write tools (require confirmation): create/update/delete records, create tasks, create notes
- Streaming responses with token-by-token output
- Multi-round tool calling (up to 10 rounds per message)
- Dynamic system prompt built from your workspace schema
- Configurable model selection per workspace

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
2. Go to **Settings > AI** in the app
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
│   │   ├── llms.txt           # Product overview for LLMs
│   │   ├── llms-api.txt       # Concise API reference
│   │   ├── llms-full.txt      # Full product + API docs
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

Full API documentation at [`/llms-api.txt`](https://openclaw-crm.402box.io/llms-api.txt) and [`/openapi.json`](https://openclaw-crm.402box.io/openapi.json).

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

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and guidelines.

## License

MIT
