# PestFlow Pro — Handoff S293 (the vertical arc reaches the public site — deployed, and verified in production)

*Session S293 · four PRs merged (#287, #288, #289, #290) · an unrecorded vertical now claims nothing in
JSON-LD, in generated copy, or on a map · **the second consecutive close where nothing is left inert**.*

---

## Read this first: everything is deployed AND verified in production

S290 was the first close where nothing was left waiting. **This is the second.** Merged, applied,
deployed, and — for the map — looked at with human eyes on the live site.

| thing | state | how verified |
|---|---|---|
| S293C migration | **APPLIED** | `location_data` has **15 columns** (the 12 originals in order, plus `state`, `latitude`, `longitude`); `service_areas_coordinates_range` CHECK present |
| `state` reaching the render path | **46 rows** | the `"City, ST"` branch in `locationLabel()` had **never once run** before this |
| `service-area-map` edge function | **DEPLOYED**, bundled clean at **71.47 kB** | Supabase CLI |
| `GOOGLE_MAPS_STATIC_KEY` / `GOOGLE_MAPS_SIGNING_SECRET` | **set** in Edge Function Secrets | Google Cloud project `lateral-shift-496601-h3` (homeflowpro.ai org), Maps Static API only |
| pls's map | **LIVE AND CORRECT** | five markers — Hawkins, Holly Lake Ranch, Lindale, Longview, Tyler — numbered legend matching the pins, auto-fit viewport, Google attribution intact, **no pin on the business address**. Verified visually in production |
| pls's coordinates | **written** | `805 W Broadway St, Big Sandy, TX 75755`, `32.5832 / -95.1284`, `geocode_source 'manual'`. The Hawkins placeholder is retired |
| pls's `profiles` row | **inserted** | the half-binding that made Locations show 0 of 5 |

Independently re-verified from this session before writing this document: 15 columns, 3 new, CHECK
present, 46 rows carrying `state`, 5 rows geocoded, 1 `service_area_map` pointer. The numbers above are
read from the live database, not from the report that supplied them.

### The API key has NO HTTP-referrer restriction, deliberately

That is normally a smell, so it is recorded with its reason: the key is called **server-side from an
edge function**, which has no browser origin to check. A referrer allowlist there would restrict
nothing and break everything. It is restricted to the **Maps Static API alone**, which is the control
that actually applies.

This is the same reasoning that killed the browser-key design in the first place: tenants live on
wildcard `*.pestflowpro.ai` **and** on arbitrary custom domains, and a referrer allowlist cannot name a
domain that does not exist yet.

---

## The one genuinely unverified thing in PR C is now answered — and it is a precedent

PR C shipped with exactly one thing I could not check: it was the **first edge function in the repo to
import from `shared/lib/`**. `npx esbuild --bundle` resolved the graph, but that is a parse-and-resolve
check, not a deploy test, and it was labelled as such rather than presented as proof.

**The Supabase CLI follows imports out of `supabase/functions/` into `shared/lib/`.** No re-export shim
was needed. Bundle 71.47 kB.

> **Precedent: edge functions can share code with the Next app rather than duplicating it.**

This matters beyond one function. Every previous "shared" module in `supabase/functions/_shared/` that
duplicates something in `shared/lib/` did so on an assumption nobody had tested. The four deliberately
separate vertical modules stay separate for a **design** reason — different consumers, different slots —
not because the bundler forced them apart. That distinction is now established rather than assumed.

---

## What shipped

| PR | |
|---|---|
| #287 | **S292** — merge `business_info` instead of replacing it. Fourteen keys, and the class. |
| #288 | **S293 PR A** — an unrecorded vertical claims nothing in JSON-LD or page metadata. |
| #289 | **S293 PR B** — the admin SEO / AIO / page-creation surfaces. |
| #290 | **S293 PR C** — the service-area map: markers on the tenant's own cities. |

`main` green after each. **Lint baseline held at 223** throughout. Test count **918 → 1001**.

---

## PR C — what was on the page before

`ServiceAreaPage.tsx:52` rendered a hardcoded `/demo-coverage-map.svg` — **the same image for every
tenant** — captioned `alt="{businessName} service area"`. An abstract blob with dashed lines and
scattered dots: a drawing of a territory nobody has, presented as a specific business's coverage.

So PR C did not add a coverage claim to a page that had none. **It removed a fabricated one.**

### Why markers and not a radius ring

A ring is a **coverage commitment to every point inside it**. pls's furthest named city is Longview,
23.3 straight-line miles from Big Sandy; a ring at that distance sweeps in Gladewater, Kilgore, White
Oak, Winona, Mineola and most of two counties, none of which he listed. Five towns named, a few dozen
asserted.

Markers render exactly the claim the tenant made. Five cities in, five pins out.

### Two traps in the data path, both live

1. **The render path does not read `service_areas`.** `getAllLocations` reads the **`location_data`
   view**, and that view **enumerates its columns** rather than `SELECT *`. Adding `latitude` /
   `longitude` to the table alone would have left them invisible to every page that would use them.
2. **`state` had never reached the public site.** It has existed on `service_areas` all along and the
   view never exposed it — while `ServiceAreaPage` carried a `state?: string | null` field and a
   `locationLabel()` that formats `"City, ST"`. **That branch had never once run.** The same view
   replace fixed it, and 46 rows now carry a state through to the page.

### The design constraint the brief could not have known

A Static Maps `label:` is **one alphanumeric character**. "Numbered markers 1..N" is unachievable past
9, and dang has 18 live cities. Implemented as `1-9` then `A-Z` — 35 distinct labels. Past 35 the
markers go **unlabelled rather than repeating**, because a duplicated label is a wrong label.

---

## Two corrections to record — both the reviewer's, both caught by CC

Recorded with attribution because the tally only works if it catches everyone.

### 1. "`service_radius_miles` is 0 for every tenant" — FALSE

There is no such column. The field lives in `settings.schema_config`, and **seven of nine tenants have
a real value**: dang 50, heartland 50, urban-strike 40, apex 35, pestflow-pro 30, coastal 25, metro 20.
The two without one are pls and vita-glow.

The "0" was a **hardcoded literal at `layout.tsx:132`**, passed into the JSON-LD builder. **A code
default was read back as though it were data.** (The builder never reads the field — `areaServed` maps
the named cities.)

**The no-circle decision survives on its own reasoning**, which is why the correction matters rather
than embarrasses: a ring is a coverage commitment, and none of those seeded numbers was ever vetted as
a promise to a visitor. Had the decision rested on "there is no radius stored", finding dang's 50 in six
months would have reopened it. The reasoning is now recorded in the migration file itself.

### 2. "Dang's site has no map either" — wrong about Dang

`dangpestcontrol.com` **does** have an interactive Maps JavaScript map. The check was a curl of the
page: 3,412 bytes, zero iframe hits, conclusion "no map".

**That site is a client-rendered Vite SPA, and curl gets the empty shell.** The raw HTML of a
single-page app was checked and the absence read as evidence.

This is **occurrence 13** in the tally below, and it is filed as its own entry rather than under the
vacuity form — because the remedy is different. See the note there: the same curl is *correct* against
this platform and *wrong* against Dang's site, and the difference is hydration.

**The static-image decision still stands for the platform** — Dang's site is already an SPA; this one is
not, and this one is 100% static with no client-side map JS today.

---

## THE DURABLE LESSON — THIRTEENTH occurrence, and the split matters

> **A guard's scope quietly stops matching its claim.** A green guard with the wrong scope reads as
> proof and is not.

The running tally, with authorship marked:

| # | occurrence | committed by |
|---|---|---|
| 1 | `seo_meta` / `service_areas` / `settings.seo` — data, not source | author |
| 2 | Vita Glow's pest metadata — `generateMetadata`, not body copy | author |
| 3 | `BoldLocalAboutPage`'s `4,200+ Customers` — source, split across two object fields | author |
| 4 | The vitest suite itself (S284) — 535 tests that had never gated a PR | author |
| 5 | S285's slug lists — scoping to `src/app/shared` would have dropped four suites | author |
| 6 | S281's own DB sweep — "0 remaining", correct about the three tables it scanned | author |
| 7 | S287's stat-pair guard — tested per line, so one Prettier reflow silenced it | author |
| 8 | S289's city assertion — an alternation, green on output covering two of five cities | author |
| 9 | The S290 handoff's own first draft — cited `tenant_role_binding_drift` for a shape it scans the opposite direction for | author |
| 10 | The S292 key count — "twelve", then "seven", from a two-tenant sample reported as the universe. It is fourteen | **reviewer** |
| 11 | **S285's own vertical-preset guard** — it switched `SeoKeywordsTab`'s **page list** to the preset and left the **prompt one line below it** hardcoded to "a pest control company in East Texas" | author |
| 12 | **`service_radius_miles` "0 for every tenant"** — a hardcoded code default read back as data | **reviewer** |
| 13 | **"Dang's site has no map either"** — concluded from a curl of `dangpestcontrol.com`: 3,412 bytes, zero iframe hits. It is a **Vite SPA**, so curl returns the empty shell. The map is there | **reviewer** |

**Three of the last four are the reviewer's** (10, 12, 13). That ratio is left visible because it is the
honest count and it is the entire point of marking authorship: a tally that only catches one party
stops being a check and becomes a defence. The reviewer's entries are, if anything, the more
instructive — each was stated with more confidence than the author's were.

Occurrence 11 is the sharpest illustration of the whole class: **the fix and the defect were one line
apart.** S285 correctly de-pested the page list and did not look down.

### The stricter form: a guard that CANNOT FAIL is not evidence

| | what happened |
|---|---|
| S287 M5 | Gutting the file walk entirely **failed no test.** Zero offenders, so the scan passed without scanning |
| S289 M6 | Dedupe **could not fire** on any real tenant's inputs |
| S289 M20 | An alternation passed on output covering **two of five cities** |
| **S293 PR C · N2 and N3** | "No image" and "no cities" were each being rejected by the **revision** check, so neither had a guard of its own. Both mutations passed. Now pinned with a *matching* revision, so only the check under test can reject them |
| **S293 PR C · S3** | URL-safe base64 was asserted via a signature that **happened** not to contain `+` or `/`. That is luck, not a guard. Now asserted on vectors chosen to produce both characters |
| **S293 PR C · M4** | `toContain('<ol')` passes for `<ol hidden>` |

Six of PR C's 38 mutations came back **green on the first sweep**. Four were real weaknesses in the
assertions, listed above; two were badly-chosen mutations, re-run properly and red. All are in the PR
body, because a sweep that only reports its successes is not a sweep.

### Occurrence 13 has a different remedy, which is why it is filed separately

Vacuity's remedy is *"make the assertion able to fail."* That action does not apply here, and filing
this under vacuity would bury an instruction nobody could act on. The remedy for #13 is:

> **Verify at the layer where the thing actually renders.**

The sharper version, and the reason this is worth a numbered entry rather than a footnote:

**The same instrument was correct for one site and wrong for the other.** A curl of
`pls.pestflowpro.ai` returns real, trustworthy HTML, because this platform is **server-rendered**. The
identical curl of `dangpestcontrol.com` returns an empty shell, because that site is a **Vite SPA**.
Same command, same confidence, opposite validity.

The lesson is **not** "don't trust curl." It is **know whether what you are checking exists before or
after hydration** — and note that the two sites in this account are on opposite sides of that line, so
a habit formed on one is wrong on the other.

### The structural answers so far

| session | answer |
|---|---|
| S286 | **Anti-drift check** — the tables the sweep says it covers must equal the tables it queries |
| S287 | **Injectable reader** — the file walk's own removal becomes detectable |
| S290 | **Non-trivial-corpus assertion** — an empty corpus would pass all 49 forbidden-pattern assertions |
| S292 | **Spy-wiring proof** — the reader rejects, and the upsert is asserted NOT called |
| **S293 A** | **Byte-identity vacuity check** — the "unchanged for pest tenants" claim is asserted as deep-equality against the previous output, so a change that quietly alters both sides cannot pass |
| **S293 B** | **Marked ban-list regions** — the claim scan excises `// BAN-LIST START/END` by explicit markers rather than sniffing for negations. A heuristic wide enough to spare `- free offers, discounts, or prices` is wide enough to spare *"Mention our free inspection"* |
| **S293 C** | **Same-slicer vacuity** — the guard proving the handler-body slicer isolates one handler uses the **same** slicer as the assertion. The first version had a private copy and passed while the real one handed every handler the whole file |

> The question is never "does this pass?" but **"what would I have to delete for this to stop
> passing?"** If the answer is "nothing", it is not evidence.

---

## The second lesson: substring over-match, now FIVE occurrences

Every one against **this codebase's own vocabulary**:

| pattern | matched | where |
|---|---|---|
| `/pest/i` | **Pest**Flow Pro | S283 narration guard |
| `/pest/i` | **Pest**Flow Pro | S282 admin classifier (shipped with it) |
| `/free/i` | **free**ze | S286 first-pass offer guard |
| `/radius/` | border-**radius**`:0.75rem` | S293 PR C, first draft |
| — | a guard tripping on **its own comment naming the asset it deleted** | S293 PR C, first draft |

Two notes worth carrying:

- **A hyphen is a word boundary.** `\bradius\b` matches `border-radius` on its own. Word boundaries are
  not sufficient here; the fix was to scope the scan to **visible text with tags stripped**, which is
  also the honest target — a coverage claim is words a visitor reads, not CSS.
- **A guard that forbids naming the thing you deleted is a guard that gets deleted.** The
  `demo-coverage-map` check was rescoped to an actual reference (`src=`, `from`), not the string
  anywhere in the file.

---

## Open / pending (carried to next)

### The map, now that it is live

- **Big Sandy is not one of pls's service areas.** His own town has no page and no pin. The map is
  correct — it renders what he listed — but the omission is his to decide on.
- **Dang's 18 cities are not geocoded.** **Nine have no `state` recorded**, and "Arp" without a state is
  ambiguous worldwide. This is the case where a geocoder can land somewhere **wrong** rather than
  returning nothing, so his pins need checking **individually**. Do not assume them from pls passing —
  pls's five all carry a state.
- **Dang's two conflicting coordinate sets.** `business_info` (32.2692, -95.2603) vs
  `integrations.google_business_*` (32.246042, -95.2952175), ~2 miles apart. Which is canonical for
  public display is undecided. Not blocking — this PR pins no business address — but it blocks anything
  that maps a business location.
- **Interactive vs static map**, if anyone ever asks to pan it. Its own brief, its own validator gate.

### Reported not fixed in PR C

- **`ServiceAreaPage.tsx:78`** — a hardcoded `aria-label="Pest control in {city}"`, on every
  service-area city link and **read aloud to screen-reader users**. PR B's class, in the public shell.
- **`StructuredData.tsx:29`** — `areaServed: 'East Texas'`. Used only by the admin 404 page.
- **`GoogleMapEmbed.tsx`** — dead code, zero usages, holding a browser-exposed `VITE_GOOGLE_MAPS_API_KEY`
  and using the Embed API the validator gate eliminated. Candidate for deletion.

### Infrastructure

- **CI does NOT typecheck `src/`.** The root `tsconfig.json` excludes it — which is how a broken
  `LocationsTab` import reached the Vite build in PR B. `tsconfig.app.json` has **36 pre-existing
  errors**, so it cannot be gated without its own cleanup. Its own PR.
- **Google Cloud MFA is required by 20 October 2026** or console access is lost — which would mean
  losing the ability to rotate the Maps key. Dated, external, and unforgiving.

### Content and accounts

- **pls content gap** — 1 of 8 pages has any image; the blog is empty. The nav correctly hides the Blog
  link at zero posts.
- **pls has 54 testimonials** (50 from Google, 4.89 average), pulled by briefly raising him to Elite and
  returning him to Pro. **The rows persist; the gate is on the refresh, not the stored data.**
- **Two accounts remain half-bound** — `dang` (role `user`) and `vita-glow` (role **ADMIN**). PLS's row
  is now inserted. Vita Glow's is the tenant admin, so if that project unparks it will present exactly
  PLS's symptoms. Fix before the project restarts, not after.
- **The vertical→brand item is now visible to a client.** The admin sidebar reads
  **"PestFlow Pro / OPERATIONS PLATFORM"** on an irrigation tenant's dashboard.
