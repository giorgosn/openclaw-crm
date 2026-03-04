# OpenClaw CRM — Risks, Tech Debt & Red Flags

Severity scale: **Low** = papercut / cosmetic | **Medium** = real friction or hidden bug risk | **High** = data loss or security concern

---

## Security

### [HIGH] `BETTER_AUTH_SECRET` has a weak default

**File:** `docker-compose.yml` line ~20, `.env.example`

```yaml
BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET:-change-me-to-a-random-secret-at-least-32-chars}
```

The `:-` fallback means the container starts with a hardcoded secret if the env var is not set. A misconfigured deployment would have a known, predictable signing secret for all session tokens.

**Fix:** Remove the fallback. Fail loudly on startup if the secret is not set (or generate a random one at first boot and persist it).

---

### [MEDIUM] No rate limiting on auth or API endpoints

No middleware or library enforces request rate limits. The login endpoint, registration, and the AI chat completion endpoint (`/api/v1/chat/completions`) are all unbounded.

**Risk:** Brute-force login, account enumeration, runaway OpenRouter billing.

**Fix:** Add rate limiting at the Next.js middleware layer (e.g. `@upstash/ratelimit` with Redis, or simple in-memory for single-node deployments).

---

### [MEDIUM] API key is returned in plaintext only once but never validated for entropy

`api-keys.ts` generates a token prefixed `oc_sk_` — but there is no assertion on the randomness or length of what comes after the prefix. If a bug caused a short/predictable suffix the hashing would not compensate.

**Fix:** Assert minimum byte length when creating keys (e.g. `crypto.randomBytes(32)`).

---

### [LOW] `TRUSTED_ORIGINS` is undocumented in `.env.example`

`lib/auth.ts` reads `TRUSTED_ORIGINS` for Better Auth CORS, but it is not mentioned in `.env.example` or the README. Deployments behind a reverse proxy or custom domain may see auth failures.

**Fix:** Add the variable with a comment to `.env.example`.

---

## Reliability & Correctness

### [HIGH] `process.env.DATABASE_URL!` — non-null assertion will crash at runtime

**File:** `apps/web/src/db/index.ts` line 5

```ts
const connectionString = process.env.DATABASE_URL!;
```

If the variable is missing (misconfigured deploy), this produces an opaque connection error deep in the postgres driver rather than a clear startup failure.

**Fix:** Add an explicit check:
```ts
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
```

---

### [MEDIUM] AI tool loop has a hard cap of 10 rounds with no backoff or partial failure recovery

**File:** `src/services/ai-chat.ts`

The streaming loop that processes tool calls iterates up to 10 times. If a tool call produces an error mid-stream, the error is appended to the message history and the loop continues. There is no exponential backoff, no dead-letter, and the partial state is persisted to the `messages` table. A flaky tool could consume all 10 rounds and leave the conversation in a confusing state.

**Fix:** Track per-tool failure counts; abort the loop and surface a clean error to the user after consecutive tool failures.

---

### [MEDIUM] `listEntryValues.numberValue` is `text` not `numeric`

**File:** `apps/web/src/db/schema/lists.ts`

```ts
numberValue: text("number_value"),  // should match records.ts: numeric("number_value")
```

The `recordValues` table correctly uses `numeric` for `numberValue`, but `listEntryValues` uses `text`. This means list-level number attributes can't be reliably sorted or compared numerically at the SQL level.

**Fix:** Change `text("number_value")` to `numeric("number_value")` in `listEntryValues` and generate a migration.

---

### [LOW] `migrate-workspaces.ts` is a one-off script left in the source tree

**File:** `apps/web/src/db/migrate-workspaces.ts`

This appears to be a migration utility for moving data between workspaces, not a repeatable migration. Leaving ad-hoc scripts in `src/db/` alongside the schema creates confusion about what is part of the normal DB lifecycle.

**Fix:** Move to `scripts/` or delete if no longer needed.

---

## Testing

### [HIGH] E2E dashboard tests are globally skipped

**File:** `apps/web/e2e/dashboard.spec.ts` line 5

```ts
test.skip(true, "Requires authenticated session - run with seeded test user");
```

The entire dashboard test suite is disabled. CI gives a false green for all dashboard behaviour.

**Fix:** Implement a `storageState`-based authenticated session fixture (standard Playwright pattern) and remove the `test.skip`.

---

### [MEDIUM] No unit or integration tests

There is no Jest/Vitest setup. The services layer (`records.ts`, `query-builder.ts`, `ai-chat.ts`, etc.) has zero automated coverage. Complex logic like the typed EAV filter builder and the AI tool confirmation flow are only tested manually or via the skipped E2E suite.

**Priority targets for first unit tests:**
- `lib/query-builder.ts` — `buildFilterSQL` / `buildSortExpressions`
- `lib/csv-utils.ts` — CSV parsing and type coercion
- `services/ai-chat.ts` — tool routing and confirmation logic
- `services/display-names.ts` — name extraction for each attribute type

---

### [MEDIUM] Playwright config `baseURL` defaults to port 3000; dev server runs on 3001

**File:** `apps/web/playwright.config.ts` line 11

```ts
baseURL: process.env.BASE_URL || "http://localhost:3000",
```

The `dev` script starts Next.js on port 3001. Running `pnpm test:e2e` without `BASE_URL` set will attempt to connect to the wrong port.

**Fix:** Change the default to `3001` or document that `BASE_URL=http://localhost:3001` must be set.

---

## Developer Experience

### [MEDIUM] Port inconsistency across documentation and tooling

| File | Port |
|------|------|
| Dev server (`next dev -p 3001`) | **3001** |
| `.env.example` `NEXT_PUBLIC_APP_URL` | **3000** |
| `docker-compose.yml` (web service) | **3000** |
| `playwright.config.ts` default `baseURL` | **3000** |

A fresh dev from the README will have `NEXT_PUBLIC_APP_URL=http://localhost:3000` while the server runs on 3001, causing Better Auth cookie domain mismatches and OAuth callback failures.

**Fix:** Standardize on 3001 for local dev across all files, or pick 3000 and update the dev server port.

---

### [LOW] `CONTRIBUTING.md` references `DIFFERENCES.md` which does not exist

```
See [DIFFERENCES.md](./DIFFERENCES.md) for the roadmap of planned improvements.
```

The file is absent from the repository.

**Fix:** Create `DIFFERENCES.md` with the roadmap, or remove the reference.

---

### [LOW] `CONTRIBUTING.md` vs `README.md` inconsistency on `.env` setup

- **CONTRIBUTING.md** says: `cp .env.example .env` (root) with a symlink to `apps/web/.env`
- **README.md** says: `cp .env.example apps/web/.env`

The symlink approach is not documented anywhere and does not appear to be configured in the repo.

**Fix:** Pick one canonical approach and update both files.

---

### [LOW] `@neondatabase/serverless` listed as a direct dependency but not used

**File:** `apps/web/package.json`

`@neondatabase/serverless` appears in `dependencies` but no import of it exists in `apps/web/src/`. The app uses `postgres` (postgres.js) as its driver. This is likely a leftover from an earlier exploration of Neon compatibility.

**Fix:** Remove from `package.json` to reduce install size and avoid confusion.

---

## Scalability & Architecture

### [MEDIUM] No database connection pooling for high-concurrency deployments

**File:** `apps/web/src/db/index.ts`

A single `postgres(connectionString)` client is created at module load. In serverless or edge deployments this can exhaust Postgres connection limits. The `@neondatabase/serverless` package is already installed (suggesting this was considered) but not wired up.

**Fix:** For long-running Node.js deployments this is acceptable. For serverless (Vercel, etc.), switch to `@neondatabase/serverless` or a PgBouncer-compatible setup and document the trade-off.

---

### [LOW] Workspace settings stored as opaque JSONB with no schema validation

**File:** `apps/web/src/db/schema/workspace.ts`

```ts
settings: jsonb("settings").default({})
```

AI config (`openrouterApiKey`, `openrouterModel`) and any future settings are written and read as raw JSONB with no Zod schema validation at the service layer. A typo in a key silently produces `undefined`.

**Fix:** Define a `WorkspaceSettings` Zod schema and parse it on read/write.

---

## Summary Table

| Risk | Severity | Effort to fix |
|------|----------|---------------|
| Weak `BETTER_AUTH_SECRET` default in Docker | High | Low |
| `DATABASE_URL!` non-null assertion | High | Low |
| Dashboard E2E tests globally skipped | High | Medium |
| No unit/integration tests | Medium | High |
| No rate limiting | Medium | Medium |
| `listEntryValues.numberValue` wrong type | Medium | Low |
| AI loop no failure recovery | Medium | Medium |
| Port inconsistency (3000 vs 3001) | Medium | Low |
| Playwright default port wrong | Medium | Low |
| `@neondatabase/serverless` unused dep | Low | Low |
| No connection pooling docs | Low | Medium |
| `DIFFERENCES.md` missing | Low | Low |
| `.env.example` / CONTRIBUTING mismatch | Low | Low |
| `TRUSTED_ORIGINS` undocumented | Low | Low |
| `migrate-workspaces.ts` orphaned script | Low | Low |
| Workspace settings unvalidated JSONB | Low | Medium |
