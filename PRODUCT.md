# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One primary user: a university student running their own job search, currently applying for
software internships with a Jan–Jun 2027 availability window. They work across more than one
desktop PC and check in from a phone, and they treat the tracker as the authoritative record of
where every Application stands.

Secondary audience: self-hosters who run the same image with `docker compose` and their own
database. They see the identical app; nothing is tailored to them beyond the app working without
the hosted copy's invite list.

The owner uses the app on desktop and phone about equally, so both layouts carry equal design
investment. Desktop is where long sessions and keyboard work happen; the phone is where
Applications get added and Statuses get changed in the moment.

## Product Purpose

Keep track of which roles are being pursued, where each one stands, and how the search is going
overall, without the manual upkeep that kills a spreadsheet. Success is the owner trusting it
enough to stop keeping a parallel list, and being able to answer "what's coming this week" and
"which companies have gone quiet" without reading every row.

## Positioning

A self-hosted tracker where upkeep is automatic rather than remembered: Ghosted is computed from
silence instead of being a label someone sets, adding a Round moves the Status forward on its own,
and quick add fills the form from a pasted job description. Every Status Change is kept as history
rather than overwritten, so the record is a timeline and not a current-value snapshot. It runs
inside free tiers and the owner's own copy, so there is no subscription and no vendor holding the
data.

## Operating Context

- The owner's own copy runs on Google Cloud Run scaled to zero, so a cold start is expected on the
  first visit of a session. The database is a shared cloud Postgres, so the same data appears on
  every device.
- Applications arrive from LinkedIn, MyCareersFuture, company career sites, referrals and career
  fairs. The scene is usually a browser with a job posting open in another tab, which is what
  makes paste-and-fill and Ctrl+K matter.
- Phone use is short and interruptive: marking a rejection email, checking what is on this week.
  Desktop use is longer: triaging a batch of postings, reviewing a Company's history.
- The record is checked under time pressure before an interview, so "what is next and when" must
  be readable at a glance.

## Capabilities and Constraints

**Built today:** email/password accounts with 30-day sessions and an optional invite list;
Companies created implicitly from a typed name with case-insensitive matching, suggestions and
rename; Applications with full CRUD and a detail page; Status with its full nine-value vocabulary,
changed from the table, kept as Status Change history and editable; sorting, filtering, search and
keyboard navigation over the Applications table; a Company view.

**Specified and not yet built** (GitHub Issues #3, #5, #6, #12–#17): Board view with drag between
Status columns, Upcoming view of future Rounds, Rounds with automatic Status advance and undo,
Ghosted label with a filter and a per-user day threshold plus the Settings screen that threshold
needs, Ctrl+K command palette for quick add, AI fill from a pasted job description, Google
sign-in, Cloud Run deploy, GHCR images. The design must have room for these; they are coming into
it rather than after it.

**Constraints:** pnpm monorepo of `shared` (Zod schemas and domain rules), `api` (Hono) and `web`
(Vite, React 19, TanStack Router and Query, Tailwind 4, Base UI / shadcn components, Geist).
Domain rules live in `shared` and are shared by both ends. Migrations are additive only. Google
Cloud spend is capped at $10/month and AI providers must stay free. Statuses are a closed set and
any Status can follow any other.

**Terminology is binding.** `GLOSSARY.md` is the product's language and the UI must use it:
Application, Company, Source, Status, Status Change, Round, Assessment, Interview, Ghosted,
Response, Response Rate, Suggestion, Declined (turning down an Offer) as distinct from Withdrawn
(pulling out first). The glossary's _Avoid_ lists are also binding: no "job", "posting", "stage",
"column", "lead".

## Brand Commitments

- The name is **job-tracker**, lowercase, and it ships that way. It is to read as a deliberate
  lowercase developer-tool name, not an unfinished slug.
- Glossary vocabulary as above, including capitalised domain nouns in UI copy.
- The existing voice is plain, second-person, and explains rather than announces — code comments
  and UI copy both say what something is for ("Add the first role you're after"). No marketing
  register, no exclamation, no cleverness at the cost of clarity.
- Keyboard operation is an existing commitment, not a nice-to-have: `/`, `?`, `j`/`k`, arrows,
  `Home`/`End`, `Enter`, `s` are already implemented and documented in a shortcuts dialog, and
  Ctrl+K is specified. Anything new must be reachable from the keyboard.
- **Standing visual preference (chosen 2026-10-30):** the owner chose the category standard over
  every alternative direction offered, and named the **Stripe dashboard** as the single product
  this should sit alongside. Stripe's craft level is the bar: data-dense tables done
  exceptionally well, semantic colour coding per state, generous information hierarchy, hairline
  borders, small radii, depth reserved for overlays. Execute that convention at full fidelity —
  no irony, no smuggled quirk, no drift towards a more expressive world unless the owner asks.
- Both themes are first-class and the app follows the device by default, with a persisted
  override; neither theme is the "real" one.

## Evidence on Hand

Real: the owner's own Application data, the nine-Status vocabulary, the six Sources, and the
GLOSSARY definitions. No testimonials, no user counts, no case studies, no pricing, no benchmarks
and no third-party integrations exist — none may be invented. There is no logo, no custom
typeface licence and no illustration or photography budget; identity has to come from type,
colour, layout and motion that ship in code. A public demo account is wanted but does not exist
yet.

## Product Principles

1. **Usefulness beats impressiveness.** This is a tool the owner relies on during a real job
   search; nothing may exist only to look good in a screenshot.
2. **The app does the upkeep.** Anything that could be derived — Ghosted, a Status advancing from a
   Round, a Company from a typed name — is derived, never asked for.
3. **History is the record.** A Status Change is appended, not overwritten, and the timeline is
   first-class rather than hidden behind the current value.
4. **The keyboard is a first-class input.** Every action has a keyboard path, and the table is
   navigable without the mouse.
5. **Speak the glossary.** One name per concept, everywhere, in the user's own domain language.

## Accessibility & Inclusion

No external standard is contractually required, but the existing implementation sets the floor and
must not regress: labelled controls, `aria-sort` on sortable headers, `aria-keyshortcuts`,
`aria-pressed` on toggles, visible focus rings with `:focus-visible`, one row at a time in the tab
order, and screen-reader-legible Status and filter names. Colour may never be the only carrier of
Status or of Ghosted.
