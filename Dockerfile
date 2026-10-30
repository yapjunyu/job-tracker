# syntax=docker/dockerfile:1

# Build the web app and bundle the API. Pinned to the build machine's own architecture: what
# this stage produces is platform-independent JavaScript, so a multi-architecture build runs
# this stage once instead of emulating it once per architecture.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch
COPY . .
RUN pnpm install --offline --frozen-lockfile --filter "@job-tracker/api..." --filter "@job-tracker/web..."
RUN pnpm --filter @job-tracker/web build && pnpm --filter @job-tracker/api build

# One image serves the API and the web app from the same origin. The API is bundled into a
# single file, so the image needs no node_modules.
FROM node:24-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    WEB_DIST_DIR=/app/web
WORKDIR /app
COPY --from=build /repo/packages/api/dist ./dist
COPY --from=build /repo/packages/api/drizzle ./drizzle
COPY --from=build /repo/packages/web/dist ./web
USER node
EXPOSE 3000
CMD ["node", "--enable-source-maps", "dist/main.js"]
