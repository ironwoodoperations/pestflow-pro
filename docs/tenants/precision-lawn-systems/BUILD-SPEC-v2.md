# BUILD SPEC v2 — Precision Lawn Systems

**Supersedes v1.** v1 assumed a from-scratch build at unlimited scope. This version is scoped to what the platform actually permits at Growth, and to a **theme reskin of an existing shell**, not a new template.

**Tenant:** Precision Lawn Systems LLC
**Vertical:** irrigation / drainage / pumps / sod — **do not file under "lawn"** (§0.1)
**Plan:** Growth (entitlement 2)
**Repo:** `pestflow-pro` — manual merge, paying-tenant repo
**Approach:** reskin an existing shell + theme. Do not build a one-off.

---

## 0. Read first

### 0.1 Never file this under "lawn"

This engagement exists because Google, the BBB, and four directories read this company as a lawn-care business when it is an irrigation contractor. If any slug, taxonomy value, seed copy, or `business_info.industry` string carries "lawn," the error is re-encoded in the system built to fix it.

Legal name (*Precision Lawn Systems LLC*), domain, and footer copyright keep "lawn." Nothing else does.

### 0.2 Retaining walls are out of scope

Client discontinued the service. Four service lines only. **Consequence:** the Jim & Lois Lane testimonial is mostly about retaining walls, decking, and steps — it may be used **only** on the drainage page, and only its drainage sentence. Never as a general or homepage testimonial. Do not edit a customer's words; excerpt or omit.

### 0.3 Platform constraints — verified in repo, not negotiable in code

| Constraint | Value at Growth | Source |
|---|---|---|
| Location page cap | **5** | `enforce_location_cap()` trigger, S264. Ladder: ent 1=3, 2=5, 3=10, 4+=unlimited. Hard `RAISE EXCEPTION` on insert. |
| AI social campaigns | **Blocked** | `PRO_TIER = 3` in `generate-social-batch` and `process-campaign-job`, double-gated |
| AI caption writing | **Blocked** | S262 moved `composer_captions` to tier 3 |
| Social scheduling | **Allowed** | S262 set `content_queue_schedule` to tier 2 |
| `metro-pro` theme | **Unavailable** | Pro/Elite only per `shellThemes.ts` |

Do not attempt to work around any of these. They are the upgrade path.

---

## 1. Business facts (verified — safe to render)

| Field | Value |
|---|---|
| Legal name | Precision Lawn Systems LLC |
| Owner | Dathan Johnson |
| Founded | December 2017 |
| Base | Hawkins, TX 75765 (Wood County) |
| Phone | 903-747-7150 |
| TX Irrigator License | LI23001 |
| Warranty | Free 2-year warranty on every system installed |
| BBB | A+, accredited |
| GTM container | GTM-542MMSL (reuse) |

### 1.1 Must NOT render
- **"10 years of experience"** — contradicts the 2017 founding on the client's own current homepage. Render "Serving East Texas since 2017."
- **PO Box 859** — see §6.1, unresolved.
- **Any competitor by name** in warranty comparisons. "Most companies in this market warranty six months" is verified and safe.
- **Equipment brand names** — client has not confirmed what he stocks. Do not infer.
- **Business hours** — unconfirmed.
- **The Yahoo email address.**

---

## 2. Positioning

**Primary:** Sprinkler systems, drainage, and pump systems for East Texas.
**Support:** We solve both sides of your water problem — getting water where you want it, and getting it away from where you don't.

**Proof stack:** free 2-year warranty (best verified in market) → licensed TX irrigator LI23001 → since 2017, licensed and insured, BBB A+ → lake/pond/well pump work.

**Vocabulary rule:** "irrigation" must appear in the homepage `<title>`, `<h1>`, and first 100 words. "Lawn" appears only in the legal entity name, the domain, and the footer copyright — never in a heading, title, meta, alt text, or schema description.

---

## 3. Theme selection

The approved renders use a deep water-teal and clay palette. Closest available at Growth:

**Recommended: `modern-pro` + palette `mp-2` (Forest & Cream)** — primary `#2d6a4f`, hero `#1a3d2a`, Oswald headings. Deep green reads as water-and-earth and carries the licensed-trade authority the renders were going for.

**Alternate: `clean-friendly` + `cf-2` (Teal & Light)** — primary `#0d9488`. Brighter, lighter hero. Pick this if Dathan reacts against the dark hero.

`metro-pro` + `mtp-4` (Forest & White, `#1B4332`/`#52B788`) is the closest match to the renders and is **Pro/Elite gated**. Note it as an upgrade carrot; do not attempt to enable it at Growth.

Design reference lives at `docs/tenants/precision-lawn-systems/design-reference/`. Treat it as intent for layout and hierarchy — the spec strip of technical facts, the town chips, the warranty callout — not as literal markup to port. The shell's existing components win on structure.

---

## 4. Service catalog

Services live in `src/shells/_shared/pestContent.ts` as a static `PEST_CONTENT_MAP`. This is **shared with the Dang tenant** — do not mutate existing entries. See §8 for the approach decision.

The `PestEntry` shape maps to irrigation better than its naming suggests:

| Field | Irrigation meaning |
|---|---|
| `displayName` | Service name |
| `pluralNoun` | Awkward but usable — the service in plural |
| `blurb` | What the service is and why it matters |
| `signs` | **Signs you need this** — standing water, dry patches, high water bill |
| `treatment` | How the work is actually done |
| `cta` · `metaTitle` · `metaDescription` | Unchanged in meaning |

### Four services

| Slug | Display | `signs` examples |
|---|---|---|
| `sprinkler-systems` | Sprinkler System Installation & Repair | Dry patches or brown spots between heads · water bill climbing with no change in use · heads not popping up or spraying sideways · zones that won't come on |
| `drainage` | Drainage & Erosion Control | Water standing in the yard days after rain · soil washing out after storms · water running toward the foundation · soggy ground near downspouts |
| `pump-systems` | Pump Systems for Lake, Pond & Well | Pump won't prime or loses pressure · irrigation weak at the far zones · pump running constantly · intake clogging with debris |
| `sod-dirt-work` | Sod Installation & Dirt Work | Bare ground after a project · yard that won't drain because of grade · low spots holding water · new construction needing site prep |

`treatment` copy for each must describe the actual process — trench, gravel, sock pipe, backfill for drains; zone layout and head spacing for sprinklers — not adjectives.

---

## 5. Page inventory (Growth)

| Group | Count | Note |
|---|---|---|
| Home | 1 | |
| Service pages | 4 | One per §4 slug |
| **Location pages** | **5** | **Hard cap.** Tyler · Longview · Lindale · Hawkins · Holly Lake Ranch |
| Projects | 1 + n | Rebuilt from the client's photo library |
| FAQ | 1 | |
| About / credentials | 1 | |
| Contact | 1 | |
| Legal | 3 | |

**Location selection rationale:** Tyler and Longview are the two largest markets. Lindale and Holly Lake Ranch each have a real named testimonial attached. Hawkins is home base and has a direct competitor (Winters Landscape & Irrigation, 18 Google reviews) to displace.

**Deferred to Pro (10) / Elite (unlimited):** Mineola, Quitman, Winnsboro, Big Sandy, Gilmer, Whitehouse, Bullard, Flint, Van, Grand Saline, plus the lake-community pages (Lake Fork, Lake Hawkins, Lake Holbrook, Hideaway). Keep this list in the account record — it is the upgrade conversation.

**Open question for the platform review:** do service × location pages consume `service_areas` rows? If they do, they cannot exist at Growth. Confirm before planning any.

---

## 6. Blockers — resolve before launch

### 6.1 Address conflict — blocks Google Business Profile
Website says PO Box 859. BBB, YellowPages, and researchGiant all say 700 Francis St. A PO Box cannot verify a GBP. Confirm with the client which is real and whether to display it or run as a hidden-address service-area business. **Behind one config value, unset until confirmed.**

### 6.2 License verification
LI23001 is displayed on the client's current site and the format is consistent with peer licenses in this market. Not yet verified against the TCEQ licensee database. Verify before rendering it as a trust claim.

### 6.3 No Google Business Profile exists
Three Google Places queries — name, name plus street address, category plus geography — returned nothing. **Highest-value item in the engagement**, and it is off-site work, not a build task. Claim, verify, set primary category to *Lawn Sprinkler System Contractor*, correct the BBB category off *Landscape Contractors*, load photos, begin weekly posts.

### 6.4 Email migration
Move off `@yahoo.com` before launch.

---

## 7. Settings — `business_info`

The social AI has **no pest vocabulary in it**. `process-campaign-job` builds its prompt from `settings` key `business_info`, and the system prompt is already generic ("social media copywriter for local home-services businesses"). The entire vertical retooling is this one value:

```
industry: "irrigation and sprinkler system installation and repair, yard drainage
and french drains, lake and pond pump systems, sod and grading — East Texas"
```

Write it long. That string is the only context the model gets about what this business does.

Note the AI campaign feature itself is Pro-gated (§0.3), so this value has no effect until upgrade — set it correctly now so it is right on day one of Pro.

---

## 8. Decisions needed before code

1. **Service catalog placement.** `PEST_CONTENT_MAP` is a static file shared with Dang. Options: (a) add a parallel `irrigationContent.ts` with the same interface and switch on tenant/vertical, (b) generalize the map into a vertical-keyed structure, (c) move service content to the database. (c) is right long-term and wrong for this session. Recommend (a) — additive, zero risk to Dang. **Confirm before building.**
2. **Does `render_model` (S249) or the shell system already support a non-pest vertical**, or is this the first? That determines whether (a) is a clean seam or a hack.
3. **Do service × location pages consume `service_areas` rows?**
4. Theme: `mp-2` or `cf-2` (§3).

---

## 9. Structured data

- `LocalBusiness` — name, telephone, address (pending §6.1), `areaServed` over Smith, Wood, Upshur, Gregg, Van Zandt, `hasCredential` for LI23001, `foundingDate: 2017`
- `Service` per service page
- `FAQPage` on every page with an FAQ block
- `Review` for the three usable testimonials (§10)
- **No `AggregateRating`.** Zero Google reviews exist; four self-published testimonials do not support an aggregate rating, and emitting one would be a fabricated rating. Wire the field, leave it null.
- `BreadcrumbList` on nested routes

---

## 10. Content assets

**Usable testimonials:**
| Author | Town | Use |
|---|---|---|
| Nancy Bentley Bowen | Lindale | **Primary/homepage.** Sprinkler repair, names Dathan, ends on a lower water bill. |
| Larry Kellam | Tyler | Sprinkler repair pages, Tyler location page |
| Jay D. Wilson | Holly Lake Ranch | General trust, Holly Lake Ranch page |

**Restricted:** Jim & Lois Lane — drainage page only, drainage sentence only (§0.2).

**Photo library:** the client has real photos currently sitting behind an empty gallery page — the highest-leverage unused asset here. On intake: before/after pairs, town tag, service tag, **descriptive alt text on every image without exception** (the current site ships empty alt sitewide). Hero image is the LCP element — preload and size it properly.

---

## 11. Performance

Current site measured: mobile Lighthouse 44–46 from US regions, LCP 8.6–9.6s, CLS 0.33–0.35, no CrUX field data (insufficient traffic for Google to report on it).

Targets: LCP < 2.5s · CLS < 0.1 · mobile performance ≥ 90.

CI must fail on: any image missing alt text, any occurrence of `format-detection: telephone=no`, any page missing title or meta description, any hardcoded address outside the config value.

---

## 12. Dashboard attach — Growth

**Modules available:** SEO · AIO · social **scheduling and posting**. Content module off by design for this tenant; content changes route through Ironwood.

**Not available at Growth — do not build toward, do not promise:**
- AI social campaign generation (Pro)
- AI caption writing (Pro)
- More than 5 location pages (Pro = 10, Elite = unlimited)
- `metro-pro` theme (Pro/Elite)

Remi is not attached at this tier.

---

## 13. Redirects

| Old | New |
|---|---|
| `/` | `/` |
| `/services/` | `/services` |
| `/photo-gallery/` | `/projects` |
| `/testimonials/` | `/reviews` |
| `/contact/` | `/contact` |

301s, trailing-slash normalized. Preserve GTM-542MMSL. Verify the domain in Search Console **before** DNS cutover so there is a baseline.

---

## 14. Definition of done

- [ ] Tenant provisioned, entitlement = 2
- [ ] Theme applied, palette confirmed with client
- [ ] Four services rendering with irrigation copy
- [ ] Exactly 5 `service_areas` rows; 6th insert correctly rejected by the trigger
- [ ] "Lawn" appears only in legal name, domain, footer copyright
- [ ] "Irrigation" in homepage title, H1, first 100 words
- [ ] Zero retaining-wall references anywhere
- [ ] Tap-to-call on every page; sticky mobile call bar
- [ ] Estimate form on every page → Supabase, tenant-scoped, notifications firing
- [ ] JSON-LD validates; no `AggregateRating`
- [ ] Every image has descriptive alt text
- [ ] LCP < 2.5s mobile, verified from two regions
- [ ] `business_info.industry` set per §7
- [ ] 301s tested
- [ ] Address config set from a confirmed decision, not a guess
- [ ] Dang tenant unaffected — verify explicitly

---

## 15. Open questions for the client

1. Which address is real, and display or hide it?
2. Confirm TCEQ license LI23001 is current.
3. Which controller and equipment brands does he carry?
4. Business hours; does he take after-hours calls?
5. Confirm all four service lines are active.
6. Any towns on the deferred list he will not drive to?
7. Photo library handoff — how and when.
8. Domain email preference.
