# Dang Pest Control → PestFlow Pro (`dang-pfp`) — Comic-Shell Visual Design Spec

**Date:** 2026-06-25 · **Phase:** 2 build reference (PR 4 — shell build).
**Status:** Documentation only. Verified design truth decoded from the live `dangpestcontrol.com` site + brand assets + 39 screenshots.
**Relationship to the teardown baseline:** Where this spec conflicts with `docs/audits/dang-pfp-teardown-baseline.md`, the **correction is noted explicitly** (and all corrections are collected in §8). This file is the authority for the comic shell's visual system; the teardown baseline remains the authority for content/SEO/decisions except where corrected here.

> **Scope guard:** This is a design reference, NOT a build instruction. No shell code, no component build. The comic shell is built in **Phase 2 PR 4**, which sequences AFTER PR 1 (`seo_meta` metadata infra), PR 2 (JSON-LD infra), and PR 3 (shell registration). See STATUS at the end.

---

## 1. Brand color system — **CORRECTION: four brand colors, not two**

The teardown baseline §4.2 token table lists orange + cyan + yellow (and a brown/dark text ramp) but **omits green**. The decoded comic system uses **four** brand colors plus the black/white ink pair:

| Color | Value | Role |
|---|---|---|
| **Orange** | `#F26B0F` (HSL `28 100% 50%`) | **PRIMARY** — hero fields, primary CTA, section fills, service tiles, social circles. **CANONICAL.** |
| **Cyan / teal** | (teal) | Burst outlines, testimonial band, step-3 process accent, video-embed borders. |
| **Yellow** | (yellow) | DANG! wordmark, ribbon banners, yellow CTAs, angled-section fills, step-2 process accent, 5-star ratings. |
| **Green** | (green) | **CORRECTION — 4th brand color.** Superhero shield outline (guarantee seal), step-4 process accent. |
| **Black** | ink | Heavy outlines on everything (bursts, clouds, cards, bug silhouettes). |
| **White** | surface | Comic clouds, card surfaces, scrolled-header background. |

- `#F26B0F` is canonical brand orange. **DB `branding.primary_color = #F97316` is shadowed — IGNORE it** (do not let it flow into the palette).
- **Authority pattern:** the comic shell gets its **own hardcoded `--dang-*` token block** (following the bold-local `--bl-*` precedent — see `dang-pfp-shell-mechanism-audit.md` §4), **NOT** `computeShellCssVars` palette derivation. All four brand colors are hardcoded literals in the block; `branding.primary_color` is bypassed via a guard branch in `computeShellCssVars` (the bold-local guard is the template).

---

## 2. Typography

- **Display:** `Bangers, cursive` → `--font-display`. Italic lean, frequently with a dark outline/stroke. Used on **all** headings, eyebrows, and the `.text-comic` utility (uppercase + italic on most instances).
- **Body:** `Open Sans` → `--font-body`. Weights **400 / 600 / 700**.
- **Google Fonts:** `family=Bangers&family=Open+Sans:wght@400;600;700`.

---

## 3. Comic device vocabulary (the signature — decoded from brand assets)

The shell's identity is a fixed kit of comic devices. Sections transition with **shapes, not flat lines**.

- **Burst / starburst:** jagged **cyan-outline + orange-fill** explosion with red/black halftone dots. **The DANG! wordmark IS this burst.** Reused as: logo, footer centerpiece, video-thumbnail watermark.
- **Halftone dots:** fading dot fields (orange → transparent) and scattered dot accents. The core texture signature — appears in section backgrounds, cloud dividers, and behind bursts.
- **Cloud / puff dividers:** white comic clouds with heavy black outline used as section **bottom edges** (orange → white transitions).
- **Section dividers — full set:**
  - (a) white cloud puffs;
  - (b) angled diagonal cut — **orange** variant;
  - (c) angled diagonal cut — **yellow** variant;
  - (d) **teal halftone band with sunburst rays** (testimonials section).
- **Shield motif:** green-outlined superhero shield (the guarantee seal / "Super-Powered Guarantee").
- **Ribbon / banner:** yellow folded-ribbon with star bullets + black **bug silhouettes** (ant / spider / mosquito / roach).
- **Heavy black ink outlines** throughout (the unifying comic treatment).

---

## 4. Header — **TWO desktop states + a distinct mobile structure**

**Desktop, top-of-page:** orange band; yellow rounded **nav pill**; **DANG! burst centered, floating above** the pill; **Call us** + **Get Your Quote** (cyan pill) on the right.

**Desktop, scrolled:** background switches to **white**, same nav pill, the **burst shrinks inline** (no longer floating).

**Nav items:** Pests (dropdown) · Mosquitos · Termites (dropdown) · About (dropdown) · **DANG! logo (home)** · Call us **(903) 871-0550** · Get Your Quote.

**MOBILE — CORRECTION: distinct structure, not a desktop reflow.**
- **Three stacked orange buttons:** Call Us / **Text Us** / Get Your Quote. **"Text Us" is mobile-ONLY** (desktop has no Text Us button).
- Below the buttons: a **yellow strip with a hamburger**; **DANG! burst centered, floating above**.
- Hamburger opens a **white left-slide drawer**: accordion **Pests / Termites / About** + flat **Mosquitos / Get Your Quote**.
- Drawer **Pests** accordion lists: Ants, Spiders, Wasps & Hornets, Scorpions, Rodents, Mosquitos, Fleas & Ticks, Roaches, Bed Bugs, **View All**.

---

## 5. Homepage section order (verified against live)

1. **Hero** — orange field; H1 **"SUPER POWERED PEST CONTROL"** (yellow Bangers) on the left; **"Meet Kirk" VIDEO embed** on the right (cyan border, play button); intro copy; **"Refer & Earn $75" white-pill CTA** (→ `referdangpestcontrol.com`). *(CORRECTION: the referral program CTA and the video embed are not in the teardown baseline.)*
2. **Trust strip (white)** — Super-Powered Guarantee **shield seal** + **"Super Hero Response Team!"** (yellow headset icon) + **"Certified Expert"** (orange ribbon icon); 3-up with vertical dividers.
3. **"Expert Pest Control & Management Services around Tyler, TX"** — orange-bordered kitchen-tech photo left; copy + phone/quote CTAs right; halftone-dot background.
4. **"Our Pest Control Services"** — **yellow angled-top** section; "OUR SERVICES" eyebrow; **4-col grid of 11 orange rounded-square tiles** with black bug silhouettes + `.text-comic` titles; Get Your Quote pill. Tile order: General · Termite Control & Inspections · Ant · Spider / Wasp & Hornet · Scorpion · Rodent · Mosquito / Flea & Tick · Roach · Bed Bug.
5. **"Why Choose Dang Pest Control?"** — white; "WHY CHOOSE US" orange eyebrow; intro left + **5 trust cards** (Professional/Licensed · Family & Pet Friendly · How to Get Free Pest Service · Custom Plans · Super Powered Guarantee) with orange line-icons; halftone-dot bg.
6. **"Get Free Pest Control For Life!"** — **second VIDEO embed** (blue border).
7. **"Pest Extermination & More near Tyler, TX"** — copy left; exterior-treatment photo right (orange border).
8. **Testimonials** — **teal halftone + sunburst-rays band**; "WHAT OUR CUSTOMERS SAY"; white card carousel with black border; quote marks + yellow arrows + **5 yellow stars**; angled white edges top/bottom.
9. **"Get Your Quote Today"** — **orange angled** section; halftone; copy + service-area links (Longview / Jacksonville / Lindale / Bullard / Whitehouse) + phone/Refer pills; **white cloud-puff bottom**.
10. **Footer** — white; Services column + **DANG! burst centerpiece** + About column; brand blurb; **4 orange social circles** (FB / IG / LinkedIn / YT); legal row (Privacy / Terms / SMS / Accessibility); **© 2026 Dang Pest Control**.

---

## 6. Page-type templates (verified)

**Service page (×12):** orange hero with cloud-bottom, H1 **"{SERVICE} CONTROL"** (yellow Bangers); intro with bordered photo + dual CTA (phone outline + orange Get Your Quote); **"OUR {SERVICE} PROCESS"** — 4-step cards (colored top+bottom rule + colored solid icon square, **cycling orange / yellow / cyan / green**, "STEP N" label in matching color); deep content block; Why Choose Us 4-up flat cards with orange line-icons; **"More Than Just {X}"** cross-link block with inline service links + bordered photo; orange angled CTA **"{X}-FREE LIVING STARTS HERE"** with cloud bottom; **FAQ** (numbered, `.text-comic` questions); yellow angled closer **"PROTECT YOUR EAST TEXAS HOME TODAY"**.

**Location page (×18):** H1 **"PEST CONTROL SERVICES IN {CITY}, TX"**.

**About:** **"ABOUT US"** hero with cloud; **"FAMILY-OWNED, COMMUNITY-DRIVEN"** with owner+spouse photo (yellow border); **"EXPERTISE & PROVEN RESULTS"** orange section with cloud edges + dual CTA.

**Contact / Quote** (`/quote` → `/contact`): **"GET YOUR QUOTE"** yellow-Bangers hero with cloud; form fields: First / Last / Email / Phone / Street Address / City / State / ZIP + **Service(s) Requested checkbox grid** [General / Termite / Bed Bug / Spider / Hornet / Rodent / Termite Inspections | Mosquito / Flea & Tick / Ant / Wasp / Scorpion / Roach] + **Message (Optional)** + **2 consent checkboxes verbatim** + **"Submit Quote Request"** orange pill. **Carry both TCPA/SMS consent strings verbatim** from teardown baseline §5 (transactional + marketing).

**Reviews · FAQ · Blog index · Blog post · 4 legal pages** — same comic chrome (hero with cloud, comic dividers, footer).

---

## 7. Assets — **CORRECTION: split across TWO homes (critical build flag)**

The teardown baseline decision #6 states "all media already in DB/storage." **That is WRONG.** Assets are split, and the comic chrome lives in the **Vite repo**, not the DB:

**A. Supabase storage** (`tenant-assets/1611b16f-381b-4d4f-ba3a-fbde56ad425b/site-media/`) — present in DB:
- Hero photos; service-card images: `General.jpg`, `Termite.jpg`, `ant.jpg`, `spider.jpg`, `Wasps-Hornet.jpg`, `Scorpion.jpg`, `Rodent.jpg`, `Mosquito.jpg`, `Flea.jpg`, `Roach.jpg`, `Bed-Bug.jpg`; `dang-pest-homepage-img-1.webp`, `dang-pest-homepage-img2.webp`.

**B. Vite REPO `/assets` + `/public`** — **NOT in the DB. MUST be migrated to the PFP repo or storage BEFORE Vite retirement, or they vanish:**
- DANG! logo burst (hashed filename `dang-logo-D_aT5-gk.png` — actually a WebP), `dang-seal` shield, `cta-bg` cloud divider;
- `why-professional` / `why-family` / `why-referral` / `why-custom` / `why-superpowered.webp` icons;
- `interior-service`, `exterior-treatment`, `cta-bg`.

**C. Video embeds (×2):** "Meet Kirk" (hero) + "Get Free Pest Control For Life" — **carry as embeds, not static images.**

**Address:** `816 Riding Road, Tyler, TX 75703` — **schema / structured-data ONLY**, never in customer-facing copy, footer, or contact page (home-based SAB; Google-can-see-it / public-cannot).

---

## 8. Baseline corrections summary (full list)

1. **Green is a 4th brand color** — missing from teardown baseline §4.2 token table.
2. **Referral program** — "Refer & Earn $75" hero CTA + footer CTA (→ `referdangpestcontrol.com`) is **absent from the baseline entirely**.
3. **Comic art assets live in the Vite repo `/assets` + `/public`, NOT all in DB/storage** — baseline decision #6 ("all media already in DB/storage") is **WRONG**; the comic chrome must be migrated before Vite retirement.
4. **Mobile header has a "Text Us" button + a distinct 3-button structure** — it is not a desktop reflow.
5. **Hero "Meet Kirk" and "Get Free Pest Control For Life" are VIDEO embeds**, not static images.

---

STATUS: design reference for Phase 2 PR 4 (shell build). Not a build instruction; the build PR sequences after PR 1 (seo_meta metadata infra), PR 2 (JSON-LD infra), PR 3 (shell registration).
