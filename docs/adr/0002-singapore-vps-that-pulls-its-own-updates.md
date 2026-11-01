# Host on a Singapore VPS that pulls its own updates

The app ships as one Docker image that serves both the API and the built React app. The maintainer's
copy runs on a small VPS in Singapore behind Caddy at `tracker.yapjunyu.com`, against the same free
Neon Postgres in `aws-ap-southeast-1` that ADR-0001 chose; anyone else runs the same image with
docker compose and their own database. A timer on the server pulls a new image from GHCR every few
minutes, so a merge to `main` reaches the hosted copy without any deployment credential being stored
anywhere. This supersedes ADR-0001: an always-on server has no cold start, costs a fixed known amount
a year rather than a metered one, and deploys through the same image and compose file a self-hoster
already uses, so there is one deployment path instead of two. The price is that the maintainer now
patches an operating system.

## Considered Options

- **Cloud Run scaled to zero (ADR-0001)**: metered to near nothing inside the free tier, but every
  visit after about 15 minutes idle paid a cold start, and it needed Workload Identity Federation,
  Artifact Registry and a spend cap — machinery that serves only the hosted copy and that no
  self-hoster shares.
- **Pushing deploys over SSH from GitHub Actions**: deploys would land in seconds and report success
  or failure in the Actions tab, but a private key to the server would live in a public repository's
  settings. A server that polls GHCR needs no inbound access and no stored key.
- **Postgres on the VPS instead of Neon**: there is memory enough for it and a query would lose a
  network hop, but it turns a managed database into something to back up, restore and upgrade, and
  makes losing the machine mean losing the search.
- **A free subdomain, or the hosting provider's default hostname**: a certificate is obtainable
  either way, but a subdomain of a domain already owned costs nothing and is a name Google's OAuth
  client will accept.

## Consequences

- The hosted copy is always running, so there is no cold start. Neon's free tier still sleeps, so
  the first query of a session can still wait.
- Background work is possible again. ADR-0001 ruled out background workers because Cloud Run only
  gives a container CPU while a request is in flight; a VPS has no such constraint, so cron jobs,
  queues and email polling are open to later features.
- Nothing on the server is precious: the image comes from GHCR, the compose file and Caddyfile from
  this repository, and the data from Neon. A destroyed machine is rebuilt from the repository rather
  than restored from a backup.
- Neon's free plan keeps only a six-hour history window, so a weekly `pg_dump` onto the server is
  the real protection against a mistake noticed a day late.
- Updates arrive silently: nothing reports to GitHub whether one landed. The app therefore exposes
  the version it is running, so a deploy that did not arrive is visible.
- Cost is fixed and annual, so there is nothing to cap and nothing that can spike. The invite list
  stays, to protect Neon's free quotas and the AI providers'.
- Operating-system patching, the firewall and SSH hardening are the maintainer's job now.
