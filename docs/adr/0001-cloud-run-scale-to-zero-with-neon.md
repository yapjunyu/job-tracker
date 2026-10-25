# Host on Cloud Run scaled to zero, with Neon Postgres in Singapore

The app ships as one Docker image that serves both the API and the built React app. The hosted copy runs on Google Cloud Run in `asia-southeast1` (minimum 0 instances, maximum 2) against a Neon free-tier Postgres in `aws-ap-southeast-1`; anyone else runs the same image with docker compose and their own database. We chose this because spending is capped at $10 a month (covered by existing Google Cloud credits), AI providers must always be free, and the data has to be the same on every device. The price is a cold start of a few seconds after about 15 minutes idle.

## Considered Options

- **Render, Koyeb or Fly.io free tiers**: Render's free tier takes about a minute to wake from sleep; Fly.io and Koyeb no longer offer free tiers to new accounts.
- **Local-only, pointed at a cloud database**: free, but other devices need their own install, and there is no public URL for Gmail push notifications.
- **Frontend on Cloudflare Pages, API on Cloud Run**: the page would appear instantly while the API wakes, but it needs an `/api` proxy so login cookies stay same-site. Deferred until cold starts are measured above about 1.5 s.
- **A US region**: outbound data within North America is free, but every request from Singapore pays about 200 ms of round trip.
- **Supabase**: free projects pause after a week of low activity.

## Consequences

- With request-based billing, Cloud Run only gives the container CPU while a request is in flight. There are no background workers in the hosted copy: background work such as email sync has to finish inside a request.
- Self-hosted copies have no public URL, so anything that relies on an incoming webhook needs a polling fallback.
- The hosted copy is invite-only, to protect free quotas and Gmail's 100-user lifetime cap for unverified apps. Self-hosted copies default to open sign-up.
- Cloud Run has a $10 monthly spend cap. Artifact Registry and Pub/Sub can't be capped, so they are kept inside their free allowances (keep the last 3 images; Gmail notifications are tiny).
