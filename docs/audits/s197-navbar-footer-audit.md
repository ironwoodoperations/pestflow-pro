# S197 audit — navbar/footer death-audit findings

**Probe date:** 2026-05-07
**Probe scope:** read-only inventory of navbar/footer components, link surfaces, and routing prefix bugs across all 5 shell variants. No code changes.

---

## 1. Executive summary

- **Architecture shape: A** — five separate Navbar files + five separate Footer files. Canonical paths: `app/tenant/[slug]/_shells/<shell>/<Shell>{Navbar,Footer}.tsx` for 4 of 5 shells; metro-pro lives at `app/tenant/[slug]/_components/Metro{Navbar,Footer}.tsx` (anomaly). All 10 components are under 200 LOC and dispatched from `app/tenant/[slug]/layout.tsx` via `theme` switch.
- **RusticRugged routing-prefix bug: NOT REPRODUCED.** All RusticRugged hrefs are root-relative (`/about`, `/blog`, etc.) — same shape as the other 4 shells. The S167-era bug appears closed during the Next.js migration (S192–S194). **Stop-on-fail #2 fired** — surfacing for review.
- **Legal trio (privacy/terms/sms-terms) is universal.** All 5 footers include `<Link href="/privacy|/terms|/sms-terms">`. The S167 baseline gap "missing from clean-friendly + bold-local" is also closed.
- **Accessibility footer link: missing from all 5 shells.** This is the only legal-link gap and the primary fix target of this arc.
- **Total broken/missing matrix cells: 9** (all `MISSING`, no `BROKEN-PREFIX` or `BROKEN-OTHER`). Well under the 25-cell split threshold. Single PR fits comfortably.
- **Recommended commit count: 4–5 atomic commits, single PR, single session.**

---

## 2. Architecture sanity (Step 7)

| Check | Status |
|---|---|
| `src/shells/` contains only `_shared/` | ✅ confirmed (only `_shared/` subdir present) |
| No new shell directories outside the 5 variants | ✅ confirmed (5 expected: bold-local, clean-friendly, modern-pro, rustic-rugged, metro-pro) |
| Tenant-public surface is Next.js only | ✅ confirmed (no Vite shells render tenant-public anymore post-PR-44) |

**Anomaly:** `src/components/Navbar.tsx` and `src/components/Footer.tsx` exist but have **zero consumers** in `src/` or `app/`. Orphan Vite leftovers — captured in section 9.

---

## 3. Component inventory (Step 1)

| Shell | Navbar | LOC | Footer | LOC |
|---|---|---|---|---|
| metro-pro | `app/tenant/[slug]/_components/MetroNavbar.tsx` | 166 | `app/tenant/[slug]/_components/MetroFooter.tsx` | 95 |
| modern-pro | `app/tenant/[slug]/_shells/modern-pro/ModernProNavbar.tsx` | 148 | `app/tenant/[slug]/_shells/modern-pro/ModernProFooter.tsx` | 82 |
| clean-friendly | `app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyNavbar.tsx` | 120 | `app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyFooter.tsx` | 99 |
| bold-local | `app/tenant/[slug]/_shells/bold-local/BoldLocalNavbar.tsx` | 119 | `app/tenant/[slug]/_shells/bold-local/BoldLocalFooter.tsx` | 87 |
| rustic-rugged | `app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedNavbar.tsx` | 141 | `app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedFooter.tsx` | 83 |

**Layout dispatcher:** `app/tenant/[slug]/layout.tsx` lines 12–23 import all 10 components; lines 92–171 switch on `theme`. Implicit fallback at lines 181–183 uses ModernPro (per S194 PR #42 soft-fallback fix).

**Anomaly:** metro-pro lives under `_components/` while the other 4 use `_shells/<shell>/`. Inconsistent organization but not a bug.

---

## 4. Link inventory per component (Step 2)

All href values are root-relative. Format: `<Link href="/<path>">` resolves correctly because Next.js middleware rewrites tenant subdomain → `/tenant/<slug>/<path>` while the visitor-facing URL stays at `<slug>.pestflowpro.com/<path>`.

### Navbars — `NAV_LINKS` arrays

| Shell | Links |
|---|---|
| metro-pro | About, Blog, Reviews, FAQ, Contact |
| bold-local | About, Service Area, Blog, Reviews, FAQ, Contact |
| clean-friendly | About, Service area, Blog, Reviews, FAQ, Contact |
| modern-pro | Locations (`/service-area`), Blog, Reviews, FAQ, About, Contact |
| rustic-rugged | About, Service Area, Blog, Reviews, FAQ, Contact |

All navbars also dispatch a Services dropdown via `serviceLinks` (built from `servicePages` prop or `DEFAULT_SERVICE_LINKS`) and a Quote CTA (`/quote`). Phone CTA varies (see Step 6).

### Footers — link arrays + hardcoded legal

| Shell | Service array | Company/Quick array | Legal trio (hardcoded) | Accessibility |
|---|---|---|---|---|
| metro-pro | (none — uses NAV_LINKS) | NAV_LINKS: Home, Services, About, Contact, Blog, Reviews, FAQ, Get a Quote | privacy, terms, sms-terms | ❌ missing |
| modern-pro | DEFAULT_SERVICE_LINKS (in nav) | QUICK_LINKS: Home, Services, About, Blog, Reviews, Contact, Get a Quote, Service Area, FAQ | privacy, terms, sms-terms | ❌ missing |
| clean-friendly | SERVICE_LINKS: 6 pest pages | COMPANY_LINKS: About us, Our process (`/#how-it-works`), Service area, Blog, Reviews, FAQ, Contact | privacy, terms, sms-terms | ❌ missing |
| bold-local | SERVICE_LINKS: 6 pest pages | (none) | privacy, terms, sms-terms | ❌ missing |
| rustic-rugged | (none — contact-info-only layout) | (none) | privacy, terms, sms-terms | ❌ missing |

**Notable href shapes:** all `relative-shell` (root-relative absolute paths). Zero `BROKEN-PREFIX`, zero `interpolated`, zero `bad-prefix`. External-only matches: `https://pestflowpro.com` "Powered by" badge (correct, per non-negotiable rule #N).

---

## 5. RusticRugged bug analysis (Step 3) — STOP-ON-FAIL #2

**The S167 "every link in rustic-rugged is broken via wrong base prefix" bug is NOT present in the current codebase.** Every Link in `RusticRuggedNavbar.tsx` (lines 82, 86, 98, 109, 119, 131, 133, 135) uses root-relative hrefs identical in shape to the other 4 shells (`/`, `/about`, `/quote`, `/service-area`, `/blog`, `/reviews`, `/faq`, `/contact`, `/<service>`).

**Likely cause of the S167 finding being closed:** the Next.js migration (S192–S194) rewrote all tenant-public surfaces, normalizing href patterns across all shells. The old Vite RusticRugged shell — which lived at `src/shells/rustic-rugged/` — was deleted during S192 Stage B / PR #41. The current `app/tenant/[slug]/_shells/rustic-rugged/` files are net-new for Next.js.

**Implementation impact:** the planned "RusticRugged routing prefix fix" commit can be **dropped from the implementation plan**. No bug to fix.

---

## 6. Gap matrix (Step 4)

Cell values: `OK` (present, correct), `MISSING` (link not present in component). No `BROKEN-PREFIX` or `BROKEN-OTHER` cells found.

```
                       | About | Services | ServiceArea | Blog | Reviews | FAQ | Contact | Privacy | Terms | SMS  | Access |
-----------------------|-------|----------|-------------|------|---------|-----|---------|---------|-------|------|--------|
metro-pro Nav          |  OK   |    --    |     --      |  OK  |   OK    | OK  |   OK    |   --    |  --   |  --  |   --   |
metro-pro Footer       |  OK   |    OK    |     --      |  OK  |   OK    | OK  |   OK    |   OK    |  OK   |  OK  | MISS   |
bold-local Nav         |  OK   |    --    |     OK      |  OK  |   OK    | OK  |   OK    |   --    |  --   |  --  |   --   |
bold-local Footer      |  --   |    OK    |     --      |  --  |   --    | --  |   --    |   OK    |  OK   |  OK  | MISS   |
clean-friendly Nav     |  OK   |    --    |     OK      |  OK  |   OK    | OK  |   OK    |   --    |  --   |  --  |   --   |
clean-friendly Footer  |  OK   |    OK    |     OK      |  OK  |   OK    | OK  |   OK    |   OK    |  OK   |  OK  | MISS   |
modern-pro Nav         |  OK   |    --    |     OK      |  OK  |   OK    | OK  |   OK    |   --    |  --   |  --  |   --   |
modern-pro Footer      |  OK   |    OK    |     OK      |  OK  |   OK    | OK  |   OK    |   OK    |  OK   |  OK  | MISS   |
rustic-rugged Nav      |  OK   |    --    |     OK      |  OK  |   OK    | OK  |   OK    |   --    |  --   |  --  |   --   |
rustic-rugged Footer   |  --   |    --    |     --      |  --  |   --    | --  |   --    |   OK    |  OK   |  OK  | MISS   |
```

`--` = "intentionally absent / not part of this surface" (e.g., legal trio not in navbars; primary nav links not in footer of contact-info-only RusticRugged design).

**Materially missing links: 5** (one per footer × 5 footers = Accessibility everywhere).
**Total `MISSING` cells: 5.** All same content (Accessibility footer link).

S167 baseline gaps that are CLOSED:
- ✅ FAQ already present in all 5 navbars
- ✅ Privacy/TOS/SMS-terms already present in all 5 footers
- ✅ RusticRugged routing prefix not broken

S196 PR #50 delta still open:
- ❌ Accessibility footer link missing in all 5 footers (the route `/accessibility` exists; no surface points users to it)

---

## 7. Legal route surface (Step 5)

| Route | File | LOC | Renders content? |
|---|---|---|---|
| `/terms` | `app/tenant/[slug]/terms/page.tsx` | 124 | ✅ via `getPageContent(tenant.id, 'terms')` + boilerplate fallback |
| `/privacy` | `app/tenant/[slug]/privacy/page.tsx` | 146 | ✅ via `getPageContent(tenant.id, 'privacy')` + fallback |
| `/sms-terms` | `app/tenant/[slug]/sms-terms/page.tsx` | 136 | ✅ via `getPageContent(tenant.id, 'sms-terms')` + fallback |
| `/accessibility` | `app/tenant/[slug]/accessibility/page.tsx` | 49 | ✅ via `getPageContent(tenant.id, 'accessibility')` + minimal "coming soon" fallback |

All 4 use `LegalPageLayout`, all 4 read from `page_content` first then fall back. Footer href format `<Link href="/<slug>">` matches the Next.js page paths exactly. **No href/route mismatch bugs.**

---

## 8. Phone CTA observations (Step 6)

| Shell | Navbar phone | Format | Position | Footer phone | Position |
|---|---|---|---|---|---|
| metro-pro | ✅ `tel:` link | `formatPhone(phone)` | nav-text right side, hidden on mobile | ✅ `tel:` link | contact column |
| modern-pro | ❌ NO phone in nav | n/a | (only Quote button) | ✅ `tel:` link | contact column |
| clean-friendly | ⚠️ phone shown as text only — NOT a `tel:` link, NOT clickable | `formatPhone(phone)` | nav-text right side | ✅ `tel:` link | contact column with sky color |
| bold-local | ✅ `tel:` link | raw digits, prominent button | accent-bg button, top-right | ✅ `tel:` link | contact column accent color |
| rustic-rugged | ✅ `tel:` link | `📞 ${formatPhone(phone)}` | text right side + emoji | ✅ `tel:` link | contact column with 📱 emoji |

**Observations only — no recommendations per probe scope:**
- modern-pro nav has no phone affordance at all (deferred to "maybe Commit 5" per kickoff)
- clean-friendly nav phone is non-clickable plain text (deferred — same)
- Footer phone CTAs are universally present and `tel:`-linked across all 5 shells

---

## 9. Anomalies (Step 8)

1. **`src/components/Navbar.tsx` and `src/components/Footer.tsx` are orphan Vite leftovers.** Zero consumers anywhere in `src/` or `app/`. Candidate for deletion in a future cleanup PR (not this arc).
2. **metro-pro lives under `_components/` while other 4 use `_shells/<shell>/`.** Inconsistent organization. Cosmetic but worth noting.
3. **clean-friendly Navbar phone is plain text, not a `tel:` link.** Likely an oversight — every other shell makes phone clickable.
4. **modern-pro Navbar has zero phone affordance.** Quote button is the only CTA; phone is footer-only.
5. **bold-local Footer has only `SERVICE_LINKS` array** — no About/Blog/Reviews/Contact/etc. links. This is structurally minimal compared to clean-friendly's 2-array layout. Likely intentional (bold-local visual-density choice) but a usability concern — mobile footer is the only navigation path back to main pages on a deep service page.
6. **rustic-rugged Footer has NO link arrays at all.** Contact-info-only layout (phone, address, biz name, social icons) + legal-trio ribbon. Zero internal page links. Same usability concern as bold-local but more pronounced.
7. **clean-friendly COMPANY_LINKS contains `/#how-it-works`** — a hash-anchor link to a section that may or may not exist on the home page. Pre-existing, not in scope, but flagging.
8. **MetroFooter's `NAV_LINKS` contains `Home, Services, About, Contact, Blog, Reviews, FAQ, Get a Quote`** — same 8 links as ModernPro's `QUICK_LINKS` but different ordering. Two separate arrays for the same conceptual link set. Could be unified but out of scope.

---

## 10. Recommended implementation plan

Per Step 5/6 findings, the originally-anticipated 4–5 commit arc collapses to **3 atomic commits + 1 optional**:

### Commit 1 — Add Accessibility footer link to all 5 footers (REQUIRED)

Files touched (5):
- `app/tenant/[slug]/_components/MetroFooter.tsx`
- `app/tenant/[slug]/_shells/bold-local/BoldLocalFooter.tsx`
- `app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyFooter.tsx`
- `app/tenant/[slug]/_shells/modern-pro/ModernProFooter.tsx`
- `app/tenant/[slug]/_shells/rustic-rugged/RusticRuggedFooter.tsx`

Change shape: insert one `<Link href="/accessibility">Accessibility</Link>` next to existing privacy/terms/sms-terms hardcoded links in each footer's legal ribbon. Match each shell's existing styling.

Smoke test: navigate to `<any-master-tenant-subdomain>/` → scroll to footer → confirm Accessibility link present → click → confirm `/accessibility` page renders.

### Commit 2 — (DROPPED) RusticRugged routing prefix fix

The S167-era bug is not reproducible in the current codebase (post-Next.js-migration). Drop this commit.

### Commit 3 — (Optional) clean-friendly Navbar: make phone clickable (`tel:` link)

File touched (1): `app/tenant/[slug]/_shells/clean-friendly/CleanFriendlyNavbar.tsx`

Change shape: wrap the existing `formatPhone(phone)` text in `<a href={\`tel:${phone.replace(/\D/g, '')}\`}>...`. Mirror metro-pro/bold-local pattern.

Smoke test: navigate to a clean-friendly tenant → confirm phone is clickable in nav.

### Commit 4 — (Optional) modern-pro Navbar: add phone affordance

File touched (1): `app/tenant/[slug]/_shells/modern-pro/ModernProNavbar.tsx`

Change shape: add a `tel:` link next to the Quote CTA button on desktop, and to the mobile menu. Match modern-pro's typography/color tokens.

Smoke test: navigate to a modern-pro tenant → confirm phone shows in nav and is clickable.

### Commit 5 — (DEFERRED) Wire footer link parity for bold-local + rustic-rugged

Out of this arc. Both footers omit primary navigation links by design (visual style); whether to add them is a UX call, not a parity-fix call. Surface to Scott as a separate decision.

### Suggested PR title
`S197 — Footer accessibility link parity (5 shells)` if Commit 1 only.
`S197 — Navbar/footer parity (accessibility + phone CTA fixes)` if Commits 1+3+4.

### Session count: 1
Single PR, single session. The arc is small (5–7 files touched, ~5–15 LOC delta total). Validator gate skippable per low-risk dead-link-add scope.
