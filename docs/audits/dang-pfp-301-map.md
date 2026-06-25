# Dang Pest Control → PestFlow Pro (`dang-pfp`) — Full 1:1 301 Redirect Map

**Phase:** 1 (S276) — lock the redirect set before any build.
**Status:** Documentation + data artifact. **No redirects implemented, no DNS, no deploy** — this is the map Phase 2 drops into `vercel.json` / middleware at cutover.
**Source of truth:** `docs/audits/dang-pfp-teardown-baseline.md` (PR #224) §2 (URL inventory + 301 map) + §7 (sitemap); 15 live blog slugs enumerated from a read-only `SELECT` against `blog_posts` (tenant `1611b16f-381b-4d4f-ba3a-fbde56ad425b`) this session.
**Old host:** `https://dangpestcontrol.com` → **New render:** `dang-pfp` tenant on `pestflow-pro` Next.js, **same host** post-cutover.

---

## Strategy (teardown decision #4 — like-for-like slugs)

> **Every live path keeps its EXACT slug on `dang-pfp`. Map all 56 sitemap URLs 1:1 first; expand later.** No path renames — slugs were inherited from the prior web vendor and are ranking; preserving them = zero equity risk.

- **56 live URLs** = 7 core + 12 service + 18 location + 4 legal + 15 blog (teardown §2, §7).
- **+1 explicit non-identity redirect:** `/quote` → `/contact` (preserve existing client-side redirect; the nav "Get Your Quote" button targets `/quote`, so it is live-traffic-bearing — carry forward as a 301). **Total redirect entries = 57.**
- **Excluded from the redirect set** (per task + teardown §2): `/admin`, `/admin/`, `/api/`, and `sitemap.xml` / `robots.txt`. `robots.txt` keeps `Disallow: /admin*`, `/api/`.
- **Draft/orphan blog rows excluded:** only the **15 live** posts (`published_at IS NOT NULL AND archived_at IS NULL`, 15 of 23) are mapped. The 9 draft/orphan rows have no live URL and are out of scope (decision #7) — NOT in this map.

### Host / scheme normalization (documented rule — applies to ALL paths)

These are global canonicalization rules, applied **before** path matching. They are NOT enumerated per-path; the per-path table below is the slug-level 1:1 set.

| From | To | Type |
|---|---|---|
| `http://dangpestcontrol.com/<path>` | `https://dangpestcontrol.com/<path>` | 301 (force HTTPS) |
| `http(s)://www.dangpestcontrol.com/<path>` | `https://dangpestcontrol.com/<path>` | 301 (apex canonical host) |
| any non-canonical host alias → | `https://dangpestcontrol.com/<path>` | 301 |
| `…/<path>/` (trailing slash) | `…/<path>` (no trailing slash) | 301 (normalize) |

### ⚠️ Same-host identity note (read before implementing)

The cutover keeps the **same host** (`dangpestcontrol.com`). Because every live path maps to its **identical** slug, the 56 path rows below are **identity** maps (`source === destination`) — they document that no slug changes, NOT that a path-level 301 fires. On a same-host cutover, an identity path is **served in place**; emitting a literal `/x` → `/x` 301 would create a redirect loop. **Phase 2 must:**
1. Implement the **host/scheme normalization** rules above (these DO fire), and
2. Implement the **non-identity** redirects (`/quote` → `/contact`), and
3. **Serve all identity slugs in place** (filter out `source === destination` rows before writing `vercel.json`, or rely on Next.js routing — do not emit self-redirects).

The full 57-entry JSON below is the complete authoritative set for traceability/parity; the helper note after it shows how to derive the loop-safe subset Phase 2 actually writes.

---

## §1. Human-readable map (56 live URLs, grouped)

### Core (7)

| Old URL | New path | Type | Note |
|---|---|---|---|
| `https://dangpestcontrol.com/` | `/` | 301 | Identity (home; served in place — see note) |
| `https://dangpestcontrol.com/about` | `/about` | 301 | Identity |
| `https://dangpestcontrol.com/contact` | `/contact` | 301 | Identity |
| `https://dangpestcontrol.com/service-area` | `/service-area` | 301 | Identity |
| `https://dangpestcontrol.com/reviews` | `/reviews` | 301 | Identity |
| `https://dangpestcontrol.com/blog` | `/blog` | 301 | Identity (blog index) |
| `https://dangpestcontrol.com/faq` | `/faq` | 301 | Identity |

### Service (12)

| Old URL | New path | Type | Note |
|---|---|---|---|
| `https://dangpestcontrol.com/pest-control` | `/pest-control` | 301 | Identity |
| `https://dangpestcontrol.com/ant-control` | `/ant-control` | 301 | Identity |
| `https://dangpestcontrol.com/termite-control` | `/termite-control` | 301 | Identity |
| `https://dangpestcontrol.com/termite-inspections` | `/termite-inspections` | 301 | Identity |
| `https://dangpestcontrol.com/spider-control` | `/spider-control` | 301 | Identity |
| `https://dangpestcontrol.com/wasp-hornet-control` | `/wasp-hornet-control` | 301 | Identity (live slug `-hornet-`; `wasp-control` is orphan, not a route) |
| `https://dangpestcontrol.com/scorpion-control` | `/scorpion-control` | 301 | Identity |
| `https://dangpestcontrol.com/rodent-control` | `/rodent-control` | 301 | Identity |
| `https://dangpestcontrol.com/mosquito-control` | `/mosquito-control` | 301 | Identity |
| `https://dangpestcontrol.com/flea-tick-control` | `/flea-tick-control` | 301 | Identity |
| `https://dangpestcontrol.com/roach-control` | `/roach-control` | 301 | Identity |
| `https://dangpestcontrol.com/bed-bug-control` | `/bed-bug-control` | 301 | Identity |

### Location (18)

| Old URL | New path | Type | Note |
|---|---|---|---|
| `https://dangpestcontrol.com/kilgore-tx` | `/kilgore-tx` | 301 | Identity |
| `https://dangpestcontrol.com/canton-tx` | `/canton-tx` | 301 | Identity |
| `https://dangpestcontrol.com/henderson-tx` | `/henderson-tx` | 301 | Identity |
| `https://dangpestcontrol.com/flint-tx` | `/flint-tx` | 301 | Identity |
| `https://dangpestcontrol.com/athens-tx` | `/athens-tx` | 301 | Identity |
| `https://dangpestcontrol.com/chapel-hill-tx` | `/chapel-hill-tx` | 301 | Identity |
| `https://dangpestcontrol.com/gladewater-tx` | `/gladewater-tx` | 301 | Identity |
| `https://dangpestcontrol.com/hideaway-tx` | `/hideaway-tx` | 301 | Identity |
| `https://dangpestcontrol.com/chandler-tx` | `/chandler-tx` | 301 | Identity |
| `https://dangpestcontrol.com/gilmer-tx` | `/gilmer-tx` | 301 | Identity |
| `https://dangpestcontrol.com/noonday-tx` | `/noonday-tx` | 301 | Identity |
| `https://dangpestcontrol.com/arp-tx` | `/arp-tx` | 301 | Identity |
| `https://dangpestcontrol.com/tyler-tx` | `/tyler-tx` | 301 | Identity |
| `https://dangpestcontrol.com/bullard-tx` | `/bullard-tx` | 301 | Identity |
| `https://dangpestcontrol.com/jacksonville-tx` | `/jacksonville-tx` | 301 | Identity |
| `https://dangpestcontrol.com/lindale-tx` | `/lindale-tx` | 301 | Identity |
| `https://dangpestcontrol.com/whitehouse-tx` | `/whitehouse-tx` | 301 | Identity |
| `https://dangpestcontrol.com/longview-tx` | `/longview-tx` | 301 | Identity |

### Legal (4)

| Old URL | New path | Type | Note |
|---|---|---|---|
| `https://dangpestcontrol.com/privacy-policy` | `/privacy-policy` | 301 | Identity (DB read-key `privacy`) |
| `https://dangpestcontrol.com/terms-of-service` | `/terms-of-service` | 301 | Identity (DB read-key `terms`) |
| `https://dangpestcontrol.com/sms-policy` | `/sms-policy` | 301 | Identity (DB read-key `sms-terms`) |
| `https://dangpestcontrol.com/accessibility` | `/accessibility` | 301 | Identity |

### Blog (15 live)

| Old URL | New path | Type | Note |
|---|---|---|---|
| `https://dangpestcontrol.com/blog/wed-rather-pay-you-than-google-dang-pest-control-referral-program` | `/blog/wed-rather-pay-you-than-google-dang-pest-control-referral-program` | 301 | Identity |
| `https://dangpestcontrol.com/blog/rodents-are-still-a-problem-in-tyler-tx-during-summer` | `/blog/rodents-are-still-a-problem-in-tyler-tx-during-summer` | 301 | Identity |
| `https://dangpestcontrol.com/blog/brown-recluse-black-widow-spiders-east-texas-tyler` | `/blog/brown-recluse-black-widow-spiders-east-texas-tyler` | 301 | Identity |
| `https://dangpestcontrol.com/blog/ant-invasions-east-texas-tyler-homeowners-pest-control` | `/blog/ant-invasions-east-texas-tyler-homeowners-pest-control` | 301 | Identity |
| `https://dangpestcontrol.com/blog/why-mosquitoes-are-exploding-in-tyler-tx` | `/blog/why-mosquitoes-are-exploding-in-tyler-tx` | 301 | Identity |
| `https://dangpestcontrol.com/blog/memorial-weekend-bbq-mosquito-control-tyler-tx` | `/blog/memorial-weekend-bbq-mosquito-control-tyler-tx` | 301 | Identity |
| `https://dangpestcontrol.com/blog/top-10-pest-problems-homeowners-face-in-tyler-texas` | `/blog/top-10-pest-problems-homeowners-face-in-tyler-texas` | 301 | Identity |
| `https://dangpestcontrol.com/blog/stop-mosquitoes-at-the-source-eliminate-standing-water` | `/blog/stop-mosquitoes-at-the-source-eliminate-standing-water` | 301 | Identity |
| `https://dangpestcontrol.com/blog/stop-rats-and-mice-before-they-take-over-your-home-or-business` | `/blog/stop-rats-and-mice-before-they-take-over-your-home-or-business` | 301 | Identity |
| `https://dangpestcontrol.com/blog/a-fresh-start-begins-with-professional-rodent-control-in-tyler` | `/blog/a-fresh-start-begins-with-professional-rodent-control-in-tyler` | 301 | Identity |
| `https://dangpestcontrol.com/blog/a-seasonal-guide-for-winter-bed-bug-treatments` | `/blog/a-seasonal-guide-for-winter-bed-bug-treatments` | 301 | Identity |
| `https://dangpestcontrol.com/blog/5-effective-rodent-control-tips-for-a-pest-free-home` | `/blog/5-effective-rodent-control-tips-for-a-pest-free-home` | 301 | Identity |
| `https://dangpestcontrol.com/blog/say-goodbye-to-crickets-with-expert-cricket-control` | `/blog/say-goodbye-to-crickets-with-expert-cricket-control` | 301 | Identity |
| `https://dangpestcontrol.com/blog/tyler-pest-control-services-that-work` | `/blog/tyler-pest-control-services-that-work` | 301 | Identity |
| `https://dangpestcontrol.com/blog/why-are-there-so-many-pests-in-tyler-texas` | `/blog/why-are-there-so-many-pests-in-tyler-texas` | 301 | Identity |

### Non-identity redirect (preserve)

| Old URL | New path | Type | Note |
|---|---|---|---|
| `https://dangpestcontrol.com/quote` | `/contact` | 301 | Preserve existing redirect; nav "Get Your Quote" → `/quote` (live-traffic-bearing) |

**Live-URL rows:** 56 (7 + 12 + 18 + 4 + 15). **+ 1 non-identity (`/quote`). Total = 57.**

---

## §2. Machine-usable block (57 entries — drop-in for `vercel.json` redirects / middleware)

`source`/`destination` are path-only (Next.js / Vercel convention). All `permanent: true` (301). The 56 identity entries plus the `/quote` → `/contact` redirect. See the **identity note** above: Phase 2 should serve identity slugs in place and only emit the non-identity + host/scheme rules — the full set is provided here for parity traceability.

```json
[
  { "source": "/", "destination": "/", "permanent": true },
  { "source": "/about", "destination": "/about", "permanent": true },
  { "source": "/contact", "destination": "/contact", "permanent": true },
  { "source": "/service-area", "destination": "/service-area", "permanent": true },
  { "source": "/reviews", "destination": "/reviews", "permanent": true },
  { "source": "/blog", "destination": "/blog", "permanent": true },
  { "source": "/faq", "destination": "/faq", "permanent": true },
  { "source": "/pest-control", "destination": "/pest-control", "permanent": true },
  { "source": "/ant-control", "destination": "/ant-control", "permanent": true },
  { "source": "/termite-control", "destination": "/termite-control", "permanent": true },
  { "source": "/termite-inspections", "destination": "/termite-inspections", "permanent": true },
  { "source": "/spider-control", "destination": "/spider-control", "permanent": true },
  { "source": "/wasp-hornet-control", "destination": "/wasp-hornet-control", "permanent": true },
  { "source": "/scorpion-control", "destination": "/scorpion-control", "permanent": true },
  { "source": "/rodent-control", "destination": "/rodent-control", "permanent": true },
  { "source": "/mosquito-control", "destination": "/mosquito-control", "permanent": true },
  { "source": "/flea-tick-control", "destination": "/flea-tick-control", "permanent": true },
  { "source": "/roach-control", "destination": "/roach-control", "permanent": true },
  { "source": "/bed-bug-control", "destination": "/bed-bug-control", "permanent": true },
  { "source": "/kilgore-tx", "destination": "/kilgore-tx", "permanent": true },
  { "source": "/canton-tx", "destination": "/canton-tx", "permanent": true },
  { "source": "/henderson-tx", "destination": "/henderson-tx", "permanent": true },
  { "source": "/flint-tx", "destination": "/flint-tx", "permanent": true },
  { "source": "/athens-tx", "destination": "/athens-tx", "permanent": true },
  { "source": "/chapel-hill-tx", "destination": "/chapel-hill-tx", "permanent": true },
  { "source": "/gladewater-tx", "destination": "/gladewater-tx", "permanent": true },
  { "source": "/hideaway-tx", "destination": "/hideaway-tx", "permanent": true },
  { "source": "/chandler-tx", "destination": "/chandler-tx", "permanent": true },
  { "source": "/gilmer-tx", "destination": "/gilmer-tx", "permanent": true },
  { "source": "/noonday-tx", "destination": "/noonday-tx", "permanent": true },
  { "source": "/arp-tx", "destination": "/arp-tx", "permanent": true },
  { "source": "/tyler-tx", "destination": "/tyler-tx", "permanent": true },
  { "source": "/bullard-tx", "destination": "/bullard-tx", "permanent": true },
  { "source": "/jacksonville-tx", "destination": "/jacksonville-tx", "permanent": true },
  { "source": "/lindale-tx", "destination": "/lindale-tx", "permanent": true },
  { "source": "/whitehouse-tx", "destination": "/whitehouse-tx", "permanent": true },
  { "source": "/longview-tx", "destination": "/longview-tx", "permanent": true },
  { "source": "/privacy-policy", "destination": "/privacy-policy", "permanent": true },
  { "source": "/terms-of-service", "destination": "/terms-of-service", "permanent": true },
  { "source": "/sms-policy", "destination": "/sms-policy", "permanent": true },
  { "source": "/accessibility", "destination": "/accessibility", "permanent": true },
  { "source": "/blog/wed-rather-pay-you-than-google-dang-pest-control-referral-program", "destination": "/blog/wed-rather-pay-you-than-google-dang-pest-control-referral-program", "permanent": true },
  { "source": "/blog/rodents-are-still-a-problem-in-tyler-tx-during-summer", "destination": "/blog/rodents-are-still-a-problem-in-tyler-tx-during-summer", "permanent": true },
  { "source": "/blog/brown-recluse-black-widow-spiders-east-texas-tyler", "destination": "/blog/brown-recluse-black-widow-spiders-east-texas-tyler", "permanent": true },
  { "source": "/blog/ant-invasions-east-texas-tyler-homeowners-pest-control", "destination": "/blog/ant-invasions-east-texas-tyler-homeowners-pest-control", "permanent": true },
  { "source": "/blog/why-mosquitoes-are-exploding-in-tyler-tx", "destination": "/blog/why-mosquitoes-are-exploding-in-tyler-tx", "permanent": true },
  { "source": "/blog/memorial-weekend-bbq-mosquito-control-tyler-tx", "destination": "/blog/memorial-weekend-bbq-mosquito-control-tyler-tx", "permanent": true },
  { "source": "/blog/top-10-pest-problems-homeowners-face-in-tyler-texas", "destination": "/blog/top-10-pest-problems-homeowners-face-in-tyler-texas", "permanent": true },
  { "source": "/blog/stop-mosquitoes-at-the-source-eliminate-standing-water", "destination": "/blog/stop-mosquitoes-at-the-source-eliminate-standing-water", "permanent": true },
  { "source": "/blog/stop-rats-and-mice-before-they-take-over-your-home-or-business", "destination": "/blog/stop-rats-and-mice-before-they-take-over-your-home-or-business", "permanent": true },
  { "source": "/blog/a-fresh-start-begins-with-professional-rodent-control-in-tyler", "destination": "/blog/a-fresh-start-begins-with-professional-rodent-control-in-tyler", "permanent": true },
  { "source": "/blog/a-seasonal-guide-for-winter-bed-bug-treatments", "destination": "/blog/a-seasonal-guide-for-winter-bed-bug-treatments", "permanent": true },
  { "source": "/blog/5-effective-rodent-control-tips-for-a-pest-free-home", "destination": "/blog/5-effective-rodent-control-tips-for-a-pest-free-home", "permanent": true },
  { "source": "/blog/say-goodbye-to-crickets-with-expert-cricket-control", "destination": "/blog/say-goodbye-to-crickets-with-expert-cricket-control", "permanent": true },
  { "source": "/blog/tyler-pest-control-services-that-work", "destination": "/blog/tyler-pest-control-services-that-work", "permanent": true },
  { "source": "/blog/why-are-there-so-many-pests-in-tyler-texas", "destination": "/blog/why-are-there-so-many-pests-in-tyler-texas", "permanent": true },
  { "source": "/quote", "destination": "/contact", "permanent": true }
]
```

**Loop-safe subset for Phase 2** (derive, don't hand-maintain): `redirects.filter(r => r.source !== r.destination)` → yields exactly the 1 non-identity entry (`/quote` → `/contact`). Combine that with the host/scheme normalization rules; serve all 56 identity slugs in place via Next.js routing.

---

## Count check

| Set | Count |
|---|---|
| Live URLs mapped 1:1 (core 7 + service 12 + location 18 + legal 4 + blog 15) | 56 |
| Non-identity preserve (`/quote` → `/contact`) | 1 |
| **Total JSON redirect entries** | **57** |
| Of which actually fire on same-host cutover (non-identity) | 1 |

Excluded by design: `/admin`, `/admin/`, `/api/`, `sitemap.xml`, `robots.txt`, and the 9 draft/orphan blog rows.
