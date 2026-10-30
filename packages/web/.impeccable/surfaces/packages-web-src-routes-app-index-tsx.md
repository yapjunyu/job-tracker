---
version: 1
slug: "packages-web-src-routes-app-index-tsx"
primary_target: "packages/web/src/routes/_app/index.tsx"
related_targets: ["packages/web/src/routes/_app.tsx", "packages/web/src/index.css"]
---

Scope: the whole signed-in web app (shell and navigation, Applications list, Application detail, Company view, dialogs) plus the signed-out auth screens. Visitor mode: Operate.

Audience: one job seeker running their own search across desktop and phone about equally, under time pressure, who already drives this app from the keyboard. Task: see where forty-odd Applications stand, change a Status in one action, and find one Application fast. Constraints: GLOSSARY.md vocabulary is binding; existing keyboard shortcuts and a11y attributes must not regress; Board, Upcoming, Settings, Ghosted and Ctrl+K are specified and arriving, so the shell must already have their slots.

## Direction contract

THESIS: A dense operations console for one person's job search, where the Status vocabulary is the colour system and the table is the product. It refuses the current arrangement — a bare 48px wordmark strip over a full-width unanchored table with no navigation, where nine Statuses collapse into three indistinguishable greys and nothing tells you how the search is going. The user took the standing exit over the dealt hand, so convention is the commitment: this is the category standard played straight at Stripe-dashboard craft, with no irony and no smuggled quirk.

OWN-WORLD: Stripe's dashboard register. A 240px white sidebar against a #F6F8FA canvas, white panels, #E3E8EE hairlines, 6px radii, layered soft shadows reserved for overlays only. Ink is #1A1F36 navy, never pure black; one accent, #635BFF, carries every primary action and active nav state. Nine Statuses take nine semantic badge pairs from Stripe's own badge palette — neutral, blue, teal, purple, green, solid green, red, slate — each with a leading dot and its glossary word, so colour is never the only carrier. Geist throughout at 14px body and 12px labels with tabular numerals; no second face, no mono costume. Both themes first-class, system-followed, toggle persisted.

STORY: The job seeker lands and reads the shape of their search in one glance — a counts row that is also the filter — then scans a dense table where Status is legible by hue and shape at a distance, and changes one in a single action. They understand that nothing here is waiting on their upkeep, and that Board, Upcoming and Settings are coming to slots that already exist.

FIRST VIEWPORT: Permanent left sidebar at lg+: accent mark and `job-tracker` wordmark at top; nav of Applications, Board, Upcoming, Settings with lucide icons at 13px, the three unbuilt routes carrying a quiet Soon chip; account row pinned at the bottom with email, theme toggle and sign out. The nav holds exactly the four views the user's scope answer named; Company views stay reachable from the table until a Companies index exists to point at, and that index is recorded as the follow-up rather than shipped as a dead nav item. Main pane: `Applications` at 20px/600 with the solid accent `Add Application` button opposite, on a white header band over the canvas. Beneath it a segmented counts row — Active, Assessment, Interviewing, Offer, Rejected, All with tabular counts — that filters on click; Active leads because it is the table's default view and All closes the row as the widening-out, so the row reads in the order the job seeker actually moves through it. Then the search and filter chips, then the table in a white panel: role title at 14px/500, Company, Status badge, Source, Last change with days-since, hairline row rules, 44px rows, hover tint. The keyboard cursor row takes an accent field with a hairline accent edge inside the row: the rest of the field deliberately does NOT drop back, because dimming the muted Company, Source and Last change columns puts them under 4.5:1, and the contrast floor outranks the effect. Role and Company share the table's slack and both truncate, so no column hoards it. Below lg the sidebar becomes a drawer behind a header hamburger, rows stack to two lines, and the counts and filter chips each ride one scrolling rail with a fade at the end.

FORM: The standing exit — the category standard, executed at the craft level of the Stripe dashboard, the single reference product the user named. Taken by the user over the full dealt hand (assigned direction Consignment, pick The Departures Board, competitive alternates Midnight Transit Diagram and Plate Section), so it overrides the roll by right. Seed key 9a18adc2.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
