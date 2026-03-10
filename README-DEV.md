# OpenClaw CRM — Developer Setup

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 20+ |
| pnpm | 9+ |
| Docker + Docker Compose | any recent version |
| PostgreSQL | 16+ (or use the Docker container) |

---

## 1. Install dependencies

```bash
pnpm install
```

This installs dependencies for all workspaces (`apps/web` and `packages/shared`) via Turborepo.

---

## 2. Configure environment

```bash
cp .env.example apps/web/.env
```

Then edit `apps/web/.env`. The minimum required values are:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/openclaw
NEXT_PUBLIC_APP_URL=http://localhost:3001
BETTER_AUTH_SECRET=<random string, at least 32 chars>
```

Generate a secret:

```bash
openssl rand -base64 32
```

> **Note:** The dev server runs on port **3001** (not 3000). Make sure `NEXT_PUBLIC_APP_URL` matches.

### Optional environment variables

| Variable | Purpose |
|----------|---------|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Enable GitHub OAuth login |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Enable Google OAuth login |
| `RESEND_API_KEY` | Transactional email (password reset, etc.) |
| `OPENROUTER_API_KEY` | Fallback AI key if not set per-workspace in Settings |
| `OPENROUTER_MODEL` | Default AI model (e.g. `anthropic/claude-sonnet-4`) |
| `TRUSTED_ORIGINS` | Comma-separated extra origins for Better Auth CORS |

---

## 3. Start PostgreSQL

```bash
docker compose up db -d
```

This starts a `postgres:16-alpine` container on port 5432 with:
- user: `postgres`
- password: `postgres`
- database: `openclaw`

To use an existing PostgreSQL instance instead, just update `DATABASE_URL` in `.env`.

---

## 4. Push the database schema

```bash
pnpm db:push
```

This runs `drizzle-kit push` which introspects `apps/web/src/db/schema/` and applies all table definitions directly to the database (no migration files needed for local dev).

---

## 5. Seed default data

```bash
pnpm db:seed
```

Seeds:
- One default workspace (`openclaw`)
- Three standard objects: **People**, **Companies**, **Deals** (with their system attributes)
- Default deal pipeline stages: Lead → Qualified → Proposal → Negotiation → Won / Lost

---

## 6. Start the development server

```bash
pnpm dev
```

Turborepo runs `next dev --turbopack -p 3001` inside `apps/web`.

Open **http://localhost:3001** and create an account.

---

## Useful scripts

All scripts are run from the repo root unless otherwise noted.

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server (port 3001) with Turbopack |
| `pnpm build` | Production build (also validates TypeScript) |
| `pnpm lint` | Run Next.js ESLint across all packages |
| `pnpm db:push` | Sync schema to DB without migrations (local dev) |
| `pnpm db:generate` | Generate a Drizzle migration file from schema changes |
| `pnpm db:migrate` | Apply pending migration files |
| `pnpm db:seed` | Seed standard objects and deal stages |

Run from `apps/web/` for test commands:

| Command | What it does |
|---------|-------------|
| `pnpm test:e2e` | Run Playwright E2E tests (headless) |
| `pnpm test:e2e:ui` | Run Playwright E2E tests with the interactive UI |

---

## Database tooling

```bash
# Open a psql session in the running container
docker compose exec db psql -U postgres -d openclaw

# Launch Drizzle Studio (visual DB browser in the browser)
cd apps/web
npx drizzle-kit studio
```

---

## Making schema changes

1. Edit files in `apps/web/src/db/schema/`.
2. For local dev, apply immediately with `pnpm db:push`.
3. For a change you want to track (for production deploys), generate a migration instead:

```bash
pnpm db:generate
pnpm db:migrate
```

Include the generated migration file in your pull request.

---

## Setting up AI chat

1. Get an API key from [OpenRouter](https://openrouter.ai).
2. In the app go to **Settings > AI**.
3. Enter the key and pick a model.
4. Navigate to **/chat** and start talking to your data.

Alternatively, set `OPENROUTER_API_KEY` in `.env` as a workspace-wide fallback.

---

## Docker (full stack)

```bash
# Start both PostgreSQL and the Next.js dev server
docker compose up

# Production build + run
export BETTER_AUTH_SECRET=$(openssl rand -base64 32)
docker compose -f docker-compose.prod.yml up --build -d
```

The production compose file uses `docker-compose.prod.yml` and expects `BETTER_AUTH_SECRET` to be set in the environment (or a `.env` file).

---

## Common issues

### Port 3001 already in use

```bash
lsof -ti:3001 | xargs kill -9
```

### Build fails with TypeScript errors

```bash
cd apps/web
rm -rf .next
pnpm build
```

### Database connection fails

```bash
# Check the container is running
docker compose ps

# Confirm the DATABASE_URL in apps/web/.env matches
cat apps/web/.env | grep DATABASE_URL
```

### Auth cookie not being set

Make sure `NEXT_PUBLIC_APP_URL` in `.env` matches the URL you are actually visiting. Better Auth uses this as its base URL, which affects cookie domain validation.

---

## Branch and commit conventions

| Prefix | Use for |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code improvements with no behavior change |
| `docs/` | Documentation updates |
| `test/` | Adding or updating tests |
| `chore/` | Tooling, dependencies, build scripts |

Commit message format: `type: short description` (e.g. `fix: resolve kanban drag reorder bug`).

Before opening a pull request, verify that `pnpm build` passes (it also runs type checking).
