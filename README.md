# job-tracker

A personal tracker for a job search: which roles you're pursuing, where each one stands, and how the search is going overall. Domain terms follow [GLOSSARY.md](GLOSSARY.md); hosting decisions are in [docs/adr](docs/adr).

## Development

You need Node 24, pnpm 12 (`npm install --global pnpm`) and Docker.

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts a local Postgres in Docker, then the API on http://localhost:3000 and the web app on http://localhost:5173, both with hot reload. Open the web app's URL: it forwards `/api` to the API, so the browser sees one origin, as in production. Development only ever uses this local database.

To run the production image from this source tree instead of a published release:

```bash
docker compose --file compose.yaml --file compose.build.yaml up --build
```

## Self-hosting

Every release publishes an image to GitHub Container Registry, so running your own copy is a pull rather than a build. You need Docker, plus this repo's `compose.yaml` and `.env.example`: clone the repo, or download just those two files.

```bash
cp .env.example .env
```

Set `AUTH_SECRET` in `.env` to a random string of at least 32 characters; the file says how to generate one. Everything else in the file has a working default. Then:

```bash
docker compose up --detach
```

The app is on http://localhost:3000, served by one image that holds both the API and the built web app. Set `APP_PORT` to publish it on another port, and `APP_URL` to the address people actually open, such as `https://jobs.example.com`, when something terminates HTTPS in front of it.

Anything the app has to tell you — a setting it won't accept, a database it won't start against — it writes to its log, which running detached doesn't put on screen:

```bash
docker compose logs --follow app
```

### The database

The example environment file keeps `COMPOSE_PROFILES=local-db`, which runs a Postgres container alongside the app and keeps its data in a Docker volume, so you need nothing else. To use a database you host elsewhere, such as Neon, delete the `COMPOSE_PROFILES` line and point `DATABASE_URL` at it.

### Who may sign up

Sign-up is open by default: anyone who can reach the app can create an account. Put your own addresses in `INVITE_LIST`, comma-separated, to make it invite-only; everyone else is then turned away with a message saying so.

### Filling fields with AI

Not in this version, so there is nothing to configure. When it arrives, filling an Application's fields from a job description you paste will run on your own AI provider key and stay optional: without a key you type the fields in yourself.

### Updating

```bash
docker compose pull
docker compose up --detach
```

`APP_IMAGE` in `.env` decides what that pulls. `latest` follows the newest release, so those two commands are the whole update. If you pinned a version instead, such as `ghcr.io/yapjunyu/job-tracker:1.2.0`, edit `APP_IMAGE` to the version you want before pulling — otherwise `pull` fetches the same image again and nothing changes. Either way the new version migrates the database as it starts, so there is no separate step for that.

### When a copy refuses to start

A copy that finds the database already migrated by a newer version of job-tracker stops rather than run against a schema it doesn't know, as a precaution against writing rows the newer version can't read. It says as much in its log and exits; because the compose file restarts the app unless you stop it, what you see from outside is a container starting over and over, so read the log to find out why:

```bash
docker compose logs app
```

The way out is to update that copy — `docker compose pull`, then `docker compose up --detach`, as above. This is worth knowing if you run more than one copy against one database, or pin different machines to different versions: update the copy that's behind, or keep them on the same version.

## Releases

Pushing a version tag publishes the image:

```bash
git tag v1.2.0
git push origin v1.2.0
```

`v1.2.0` publishes `1.2.0` and `latest` to `ghcr.io/yapjunyu/job-tracker`, for both `linux/amd64` and `linux/arm64`. Only the newest release takes `latest`: a prerelease such as `v1.3.0-rc.1`, or a patch tagged on an older line such as `v1.1.5` after `v1.2.0`, publishes its own version and leaves `latest` where it is. That matters because moving `latest` backwards would downgrade every copy following it, and a downgraded copy refuses to start against the database the newer one migrated. There are no rolling `1` or `1.2` tags for the same reason.

The very first publish creates the package as private: make it public once, in the package's settings on GitHub, or nobody can pull it.

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

Migrations live in `packages/api/drizzle` and run when the app starts, under a Postgres advisory lock, so instances starting together apply them once. After changing `packages/api/src/database/schema.ts`, generate a migration with `pnpm --filter @job-tracker/api db:generate`. Migrations are additive only: never rename or drop a table or column. A copy of the app that finds migrations in the database newer than it knows refuses to start and asks to be updated; [When a copy refuses to start](#when-a-copy-refuses-to-start) covers what that looks like from outside.
