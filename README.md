# job-tracker

A personal tracker for a job search: which roles you're pursuing, where each one stands, and how the search is going overall. Domain terms follow [GLOSSARY.md](GLOSSARY.md); hosting decisions are in [docs/adr](docs/adr).

## Development

You need Node 24, pnpm 12 (`npm install --global pnpm`) and Docker.

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts a local Postgres in Docker, then the API on http://localhost:3000 and the web app on http://localhost:5173, both with hot reload. Open the web app's URL: it forwards `/api` to the API, so the browser sees one origin, as in production. Development only ever uses this local database.

## Running the production image

```bash
cp .env.example .env
```

Set `AUTH_SECRET` in `.env` (the file says how to generate one), then:

```bash
docker compose up
```

The app is then on http://localhost:3000, served by one image that holds both the API and the built web app. The example environment file starts a local Postgres too; to use your own database, remove `COMPOSE_PROFILES` and set `DATABASE_URL`. Anyone who can reach the app can sign up unless you set `INVITE_LIST`.

## Checks

| Command                 | What it runs                                                                |
| ----------------------- | --------------------------------------------------------------------------- |
| `pnpm lint`             | ESLint and Prettier                                                         |
| `pnpm typecheck`        | TypeScript in every package                                                 |
| `pnpm test:unit`        | Vitest unit tests for the domain rules in `shared`                          |
| `pnpm test:integration` | The API in-process through its app factory, against Postgres in a container |
| `pnpm test:e2e`         | Builds the Docker image, then runs Playwright against it                    |
| `pnpm test`             | Every test level                                                            |

Integration and end-to-end tests need Docker running. Before the first end-to-end run, install the browser with `pnpm exec playwright install chromium`. GitHub Actions runs all of these on every pull request.

## Layout

- `packages/shared`: Zod schemas, domain types and domain rules, used by both the API and the web app.
- `packages/api`: the Hono API. `createApp` in `src/app.ts` builds the whole app from its configuration and dependencies; production, tests and end-to-end runs all go through it.
- `packages/web`: the React app (Vite, TanStack Router and Query, Tailwind, shadcn/ui).
- `e2e`: Playwright tests against the built image.

## Database migrations

Migrations live in `packages/api/drizzle` and run when the app starts, under a Postgres advisory lock, so instances starting together apply them once. After changing `packages/api/src/database/schema.ts`, generate a migration with `pnpm --filter @job-tracker/api db:generate`. Migrations are additive only: never rename or drop a table or column. A copy of the app that finds migrations in the database newer than it knows refuses to start and asks to be updated.
