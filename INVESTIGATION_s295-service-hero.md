# INVESTIGATION — S295: the service-page hero never resolves on themed tenants

*Investigation only. No fix in this PR. Root cause confirmed at source and against the live database.*

---

## Symptom

On `pls` (`/drainage`, template `modern-pro`), the service-page hero renders a flat gradient. It renders
that gradient regardless of database state: a page-level hero image is stored, a master hero image is
stored, and neither reaches the page.

Expected: the stored `page_hero_image_url` renders as the hero background.
Actual: `linear-gradient(135deg,#1B2A4E,#0B1220)`, always.

## Confirmed live state (re-verified, 2026-08-25)

| fact | value |
|---|---|
| tenant | `pls` — `840b6ad1-590f-491e-a9ef-0b439d6846c1` |
| `branding.theme` | `modern-pro` |
| `page_content.drainage.page_hero_image_url` | **populated** (Supabase Storage URL) |
| `settings.hero_media.master_hero_image_url` | **populated** |
| `branding.apply_hero_to_all_pages` | `false` |

Both available images are present. The save path is clean and is not implicated.

---

## Hypotheses considered

| # | hypothesis | verdict |
|---|---|---|
| 1 | The admin save path never wrote `page_hero_image_url` | **REJECTED** — the column is populated; the storage object exists and the bucket is public |
| 2 | Storage/bucket permissions block the image | **REJECTED** — `tenant-assets` is public; the object is a 125,134-byte `image/jpeg` |
| 3 | `resolveHeroImage` rule 1 short-circuits to `null` (`apply_hero_to_all_pages` true with an empty master) | **REJECTED for pls** — the flag is `false`. Kept below as a latent hazard |
| 4 | The `apply_hero_to_all_pages` two-bag mismatch makes rule 1 unreachable | **REJECTED — see the correction below** |
| 5 | The route never passes `heroMedia` to the themed branch | **CONFIRMED** |

---

## Confirmed root cause

**`app/tenant/[slug]/[service]/page.tsx` is the only tenant route that does not resolve the hero at the
route level.**

It fetches `heroMedia` at line 194–197, then passes it to exactly one of its seven render branches:

```
line 201  clean-friendly  → CleanFriendlyPestPage  content only
line 215  bold-local      → BoldLocalPestPage      content + stats
line 218  modern-pro      → ModernProPestPage      content only        ← pls
line 221  rustic-rugged   → RusticRuggedPestPage   content only
line 224  metro-pro       → MetroProPestPage       content only
line 235  dang-comic      → DangComicPestPage      content + faqs
line 238  (fallback)      → DefaultPestPage        content + heroMedia ← the only one
```

`DefaultPestPage` (line 37) is also the only service-page component that calls `resolveHeroImage()`.
So on any themed tenant the resolver is never invoked, and no hero — page-level, master, or legacy
`content.image_url` — can render.

### Every other route does this correctly

`page.tsx` (home), `about`, `blog`, `contact`, `faq` and `reviews` all call `resolveHeroImage(content,
heroMedia)` in the route and pass `heroImageUrl` down. `[service]` is the sole exception: it delegates
resolution into one leaf component instead. That inconsistency is the defect.

### The amplifier: the working path is dead in production

`tenant.template` resolves as `branding.theme ?? 'modern-pro'` (`shared/lib/tenant/resolve.ts:30`).
All nine live tenants have an explicit `branding.theme`:

| theme | tenants |
|---|---|
| modern-pro | apex-protect, dang, **pls** |
| metro-pro | metro-pest-concierge, pestflow-pro |
| clean-friendly | coastal-pest |
| rustic-rugged | heartland-pest |
| bold-local | urban-strike |
| vita-glow | vita-glow |

Every one routes to a themed branch. **`DefaultPestPage` — the only branch that resolves a hero — is
reachable by zero tenants.** The one code path that works is unreachable, which is why this was never
noticed from the code alone.

### Why no test caught it

There is **no test for `_lib/heroImage.ts` and no test for the `[service]` route.** The resolver has
never been exercised by the suite.

---

## Two corrections to the brief

Both change what the fix should be, so they are recorded before the proposal.

### 1. `ModernProPestPage` does not render `ModernProHero`

The brief says to "plumb `heroImageUrl` into `ModernProHero` (which already accepts a `heroImageUrl`
prop)". `ModernProHero` does accept it — but it is the **home** hero, rendered once, at
`app/tenant/[slug]/page.tsx:196`. `ModernProPestPage` never imports it.

The service page's hero is its **own inline `<section>`** at `ModernProPestPage.tsx:34`, with the
hardcoded gradient. That is what must change. Swapping in `ModernProHero` instead would import a
different component with CTAs, a trust strip and a video player — a substantial visual change to a
launch page, not a scoped hero fix.

### 2. `apply_hero_to_all_pages` is NOT unreachable — the bags are already reconciled

The brief asks me to report that the flag "is stored in `settings.branding` but read from `heroMedia`
in rule 1", so "rule 1 can never evaluate true for any tenant."

**That is not what the code does.** `getHeroMedia()` reads the flag from **branding** and merges it into
the object it returns (`_lib/queries.ts:202–204`):

```ts
const applyToAll = (brandingRes.data?.value as { apply_hero_to_all_pages?: boolean } | null)
  ?.apply_hero_to_all_pages ?? false;
if (!hero && !applyToAll) return null;
return { ...(hero ?? {}), apply_hero_to_all_pages: applyToAll };
```

So the answer to *which bag is correct*: **`branding` is the storage bag, `heroMedia` is the runtime
shape, and `getHeroMedia` is the reconciler.** `BrandingHeroMedia.tsx:90` writes it to branding and its
line-82 comment says so deliberately. `usePageHeroImage.ts:34` and `ContentTab.tsx:90` read it from
branding on the admin side. The design is consistent and needs no decision.

**Rule 1 works. It is not why pls has no hero** — pls's flag is `false`, so rule 2 (`page_hero_image_url`)
should have supplied the image, and would have if the resolver had been called at all.

### One latent hazard worth filing separately

`resolveHeroImage` rule 1 returns **`null`** when `apply_hero_to_all_pages` is `true` and the master is
empty — it does not fall through to the page hero. The doc comment above it describes only the
positive case, so the short-circuit is undocumented. No live tenant is in that state today (only pls
has the flag at all, set `false`). Filed, not fixed.

---

## Proposed fix — modern-pro only

Two files, matching the pattern the other six routes already use.

**1. `app/tenant/[slug]/[service]/page.tsx`** — in the `modern-pro` branch, resolve at the route level
and pass the result down:

```tsx
if (tenant.template === 'modern-pro') {
  const heroImageUrl = resolveHeroImage(content, heroMedia);
  return <ModernProPestPage tenant={tenant} pestSlug={params.service} content={content} heroImageUrl={heroImageUrl} />;
}
```

**2. `app/tenant/[slug]/_shells/modern-pro/ModernProPestPage.tsx`** — accept `heroImageUrl?: string | null`
and apply the treatment `DefaultPestPage` already uses: background image with a `rgba(0,0,0,0.55)`
scrim, falling back to the existing gradient unchanged when null.

Implementation note: the current hero `<section>` has no `position`, and its inner content `<div>` has
no `z-index`. Both are needed for the scrim to sit under the text rather than over it. That is the only
markup change; when `heroImageUrl` is null the rendered output must be **byte-identical to today**, and
a test should assert that.

### Explicitly NOT in the fix PR

- The other five themed branches. **Same defect, same evidence** — `clean-friendly`, `bold-local`,
  `rustic-rugged`, `metro-pro`, `dang-comic` are all affected. Filed here so they are not forgotten;
  each needs its own hero treatment decision, since each shell's hero markup differs.
- `revalidate`, schema, RLS, the save path, `ContentPageForm` — untouched.
- The `vita-glow` branch. It returns at line 69, **before `heroMedia` is fetched at all**, and renders
  `VitaGlowServicesPage`, not a `*PestPage`. Different shape, different question, out of scope.

---

## The guard

A source-level assertion over `[service]/page.tsx`: **every branch that renders a `*PestPage` must
receive either `heroMedia` or a resolved `heroImageUrl`.**

Its scope is stated in the guard itself: `*PestPage` branches only, because `VitaGlowServicesPage`
returns before the fetch and is deliberately excluded.

It must go **RED** under both mutations named in the brief:
1. a new branch is added that omits the prop;
2. the branch list is emptied.

The second matters because **this repo has hit the empty-list vacuity twice already** — most recently in
S294, where an emptied file list made a `for` loop generate zero tests and report success, and the same
defect then recurred one mutation later in a second list added without its own count. The guard will
carry an explicit length assertion for that reason.

---

## Risk

**Low.** One branch, one component, one prop.

- The null path must be byte-identical to today's render, asserted by test — so any tenant without a
  hero image sees no change.
- No schema, RLS, save-path, or `revalidate` change.
- The blast radius is the three `modern-pro` tenants (`pls`, `dang`, `apex-protect`) on service pages
  only. `dang` is the live paying customer and currently renders from its own separate Vite site, so
  the practical exposure is `pls` and `apex-protect`.

## Test plan

1. `resolveHeroImage` gains its first unit tests — all five rules, including the undocumented rule-1
   short-circuit.
2. `ModernProPestPage` rendered with a `heroImageUrl` emits the background image and the scrim.
3. `ModernProPestPage` rendered with `null` is **byte-identical** to the pre-change render.
4. The branch guard above, with both mutations proven RED.
5. Full gates: root `tsc`, `tsc -p tsconfig.app.json` by hand (CI does not typecheck `src/`), lint at
   the 223 baseline, `vitest run`, `npm run build`.

## Rollback

Revert the fix commit. The two changed files are additive — a removed prop returns the branch to its
current behaviour, which is the flat gradient. No data or schema is touched, so there is nothing to
undo beyond the code.

---

## Status

Root cause confirmed. **Awaiting approval of the proposed fix before any code is written**, per the
investigation protocol.

Note on protocol: the `/investigate` skill's steps 7 and 9 call for `gh pr merge --auto --squash`.
`CLAUDE.md` forbids enabling auto-merge, and this project's standing rule is that Scott reviews and
merges every PR manually. This PR is therefore a **draft with no auto-merge**, and the fix PR will be
too.
