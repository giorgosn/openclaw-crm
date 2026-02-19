# Contributing to OpenClaw CRM

Thanks for your interest in contributing to OpenClaw CRM! This guide will help you get started.

## Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/openclaw-crm.git
cd openclaw-crm

# 2. Install dependencies
pnpm install

# 3. Start PostgreSQL
docker compose up db -d

# 4. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and BETTER_AUTH_SECRET
# (symlinked into apps/web/.env automatically)

# 5. Push schema and seed data
pnpm db:push
pnpm db:seed

# 6. Start dev server (runs on port 3001)
pnpm dev
```

Open http://localhost:3001 and create an account to start testing.

## Project Structure

```
openclaw-crm/
├── apps/web/                  # Next.js 15 application
│   ├── src/
│   │   ├── app/               # App Router pages & API routes
│   │   ├── components/        # React components (shadcn/ui)
│   │   ├── db/                # Drizzle schema, migrations, seed
│   │   ├── lib/               # Auth, utils, query builder
│   │   └── services/          # Business logic layer
│   └── e2e/                   # Playwright E2E tests
├── packages/shared/           # Shared types and constants
└── turbo.json                 # Turborepo config
```

## What to Work On

- Check [open issues](https://github.com/giorgosn/openclaw-crm/issues) for bugs and feature requests
- Issues labeled `good first issue` are great starting points
- Issues labeled `help wanted` are where we especially need contributions
- See [DIFFERENCES.md](./DIFFERENCES.md) for the roadmap of planned improvements

## Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b fix/your-description
   # OR
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following the code style below

3. **Test locally**:
   ```bash
   # Run type checking
   pnpm build

   # Run E2E tests (optional)
   cd apps/web
   pnpm test:e2e
   ```

4. **Commit** with a clear message describing what and why:
   ```bash
   git commit -m "fix: resolve issue with task due dates"
   # OR
   git commit -m "feat: add column calculations to table view"
   ```

5. **Push and open a pull request**:
   ```bash
   git push origin fix/your-description
   ```

## Branch Naming

- `fix/` — Bug fixes
- `feat/` — New features
- `docs/` — Documentation updates
- `refactor/` — Code improvements with no behavior change
- `test/` — Adding or updating tests
- `chore/` — Build scripts, dependencies, tooling

## Pull Request Guidelines

- **Keep PRs focused** — one feature or fix per PR
- **Include a clear description** of what changed and why
- **Add screenshots** for UI changes
- **Make sure `pnpm build` passes** before submitting
- **Link related issues** using "Fixes #123" or "Closes #456"
- **Add tests** if applicable (especially for bug fixes)

## Code Style

- **TypeScript everywhere** — no plain JavaScript
- **Use existing patterns** — look at similar files before creating new ones
- **shadcn/ui for UI components** — see `components/ui/`
- **Drizzle ORM for database queries** — see `db/schema/`
- **API routes follow REST** — `/api/v1/*` with standard HTTP methods
- **Auth via Better Auth** — use `getAuthContext(req)` in API routes

### Component patterns

```tsx
// Server components by default
export default async function MyPage() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Client components when needed
"use client";
export function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>...</button>;
}
```

### API route pattern

```ts
// apps/web/src/app/api/v1/my-endpoint/route.ts
import { getAuthContext } from "@/lib/api-utils";

export async function GET(req: Request) {
  const { workspace, user } = await getAuthContext(req);
  // ... query database
  return Response.json({ data });
}
```

## Database Changes

If you modify the Drizzle schema in `apps/web/src/db/schema/`:

```bash
# Generate migration file
pnpm db:generate

# Apply to local database
pnpm db:push
```

Include the migration files in your PR.

### Schema patterns

- All tables use `id` (serial) as primary key
- `workspaceId` foreign key for multi-workspace support
- `createdAt` and `updatedAt` timestamps
- Use `jsonb` for flexible settings/metadata
- Use typed EAV pattern for record values (see `record_values` table)

## Running Tests

```bash
cd apps/web

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run specific test file
pnpm test:e2e tests/auth.spec.ts
```

## Reporting Bugs

Open an issue with:
- **What you expected to happen**
- **What actually happened**
- **Steps to reproduce** (1, 2, 3...)
- **Environment**: Browser, OS, OpenClaw version, deployment method
- **Screenshots** if applicable
- **Console errors** from browser DevTools

Use the [Bug Report template](https://github.com/giorgosn/openclaw-crm/issues/new?template=bug_report.md).

## Feature Requests

Open an issue describing:
- **The problem** you're trying to solve
- **Your proposed solution**
- **Alternatives** you've considered
- **Screenshots or mockups** if applicable

Use the [Feature Request template](https://github.com/giorgosn/openclaw-crm/issues/new?template=feature_request.md).

## Development Tips

### Port Configuration
The dev server runs on port **3001** by default. Make sure your `.env` has:
```
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Database Inspection
```bash
# Connect to PostgreSQL
docker compose exec db psql -U postgres -d openclaw

# Or use Drizzle Studio (visual DB browser)
pnpm db:studio
```

### Debugging API Routes
Use the Network tab in DevTools to inspect API calls. API responses include error messages and stack traces in development mode.

### Common Issues

**Build fails with TypeScript errors**
```bash
# Clear Next.js cache
cd apps/web
rm -rf .next

# Rebuild
pnpm build
```

**Database connection fails**
```bash
# Make sure PostgreSQL is running
docker compose up db -d

# Check DATABASE_URL in apps/web/.env matches Docker config
```

**Port 3001 already in use**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

## Questions?

- Open a [discussion](https://github.com/giorgosn/openclaw-crm/discussions)
- Check existing issues and PRs
- Read the [README](./README.md) and [API documentation](https://openclaw-crm.402box.io/llms.txt)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
