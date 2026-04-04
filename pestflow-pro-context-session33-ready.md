# PestFlow Pro — Project Context (Session 33 Ready)
_Maintained by Scott / Ironwood Operations Group_
_Do not let Claude Code overwrite this file — it is generated here and handed to Claude Code_

---

## ⚠️ SESSION RULES
- Stop and output a summary at 50% context window — do not go past this
- Keep responses short and action-focused
- After every Claude Code task: `git add . && git commit -m "description" && git push`
- Working directly on main — no PR needed
- **Follow the session roadmap exactly. Do not add unrequested features or refactors.
  Log conflicts in commit messages rather than deviating silently.**
- Do NOT generate a session 34 context file. End with a plain summary only.

---

## CRITICAL CONSTANTS (never change)

```
Live URL:       https://pestflow-pro.vercel.app
Admin URL:      https://pestflow-pro.vercel.app/admin/login
GitHub:         https://github.com/ironwoodoperations/pestflow-pro
Supabase URL:   https://biezzykcgzkrwdgqpsar.supabase.co
Supabase ID:    biezzykcgzkrwdgqpsar
Tenant ID:      9215b06b-3eb5-49a1-a16e-7ff214bf6783
Admin login:    admin@pestflowpro.com / pf123demo
Dev server:     npm run dev → localhost:8080
Model:          claude-sonnet-4-6 (ALWAYS — no exceptions)
Stack:          React 18 + TypeScript + Vite + Tailwind + Supabase + Vercel
```

---

## ⚠️ BUNDLE SIZE WARNING
Main bundle was at ~440 kB end of S32 — close to 450 kB limit.
- No new libraries in the main bundle
- All new components go inside shell directories (lazy-loaded via PublicShell)
- Run build after every task and report exact bundle size

---

## SHELL SYSTEM — CURRENT STATE

### What shells control TODAY (post S32)
- Navbar ✅
- Hero section ✅
- Footer ✅

### What shells DON'T control yet (S33 goal)
- Home page middle sections (services, testimonials, trust, CTA)
- These currently render the same regardless of shell

### Architecture extension for S33
Each shell gets a `ShellHomeSections.tsx` file.
PublicShell passes the active shell's HomeSections into the HomePage.
HomePage renders: ShellHero + ShellHomeSections + any static bottom content.

```
src/shells/
  modern-pro/
    ShellNavbar.tsx     ✅
    ShellHero.tsx       ✅
    ShellFooter.tsx     ✅
    ShellHomeSections.tsx  ← NEW S33
  bold-local/
    ShellNavbar.tsx     ✅
    ShellHero.tsx       ✅
    ShellFooter.tsx     ✅
    ShellHomeSections.tsx  ← NEW S33
  clean-friendly/
    ShellNavbar.tsx     ✅
    ShellHero.tsx       ✅
    ShellFooter.tsx     ✅
    ShellHomeSections.tsx  ← NEW S33
  rustic-rugged/
    ShellNavbar.tsx     ✅
    ShellHero.tsx       ✅
    ShellFooter.tsx     ✅
    ShellHomeSections.tsx  ← NEW S33
```

---

## FOUR GENUINELY DIFFERENT HOME PAGE LAYOUTS

All shells pull from the same DB data:
- business_info: name, phone, tagline, founded_year, num_technicians, license
- testimonials: author_name, review_text, rating (top 3 featured)
- page_content: services section content
- branding: primary_color, logo_url

### Shell 1 — Modern Pro
Current home page sections formalized into ShellHomeSections:
- 3-column services icon grid (emerald icons, dark cards)
- Why Choose Us: 3 stat cards (years, technicians, license)
- Testimonials: 3 cards in a row
- Bottom CTA banner: dark navy, emerald button

### Shell 2 — Corporate Authority (inspired by Terminix)
- Split hero already done
- Below hero: SERVICE CATEGORY BUTTONS — horizontal scrollable row of
  pill buttons (Residential, Commercial, Termites, Mosquitoes, Rodents)
  linking to pest pages. Dark bg, amber text.
- TRUST STRIP: 3 columns (icon + stat) — "X Years", "Licensed & Insured",
  "Same-Day Service". Light gray bg, heavy numbers.
- TESTIMONIALS CAROUSEL: Left panel dark charcoal with "What Our
  Customers Say" headline. Right side: 3 white review cards with
  Google G icon, name, stars, excerpt. Prev/Next arrows.
- GUARANTEE SECTION: 2-col layout. Left: bold headline "Your Satisfaction
  Guaranteed". Right: 2 bullet points from business guarantee copy.
  Amber left border accent.
- BOTTOM CTA: Full-width charcoal band. "Ready to get started?" +
  amber "Get a Free Estimate" button + phone number.

### Shell 3 — Local Champion (inspired by RID-X Tyler)
- Red utility bar at very top: "Serving [city] & surrounding areas" left,
  phone number right. Red bg, white text. (ABOVE HolidayBanner)
- Hero: full bleed image, strong overlay, phone number as primary CTA button
- SERVICE STRIPS: 3 dark horizontal strips below hero (Residential /
  Commercial / Termites), each with a Learn More arrow button.
  Full width, alternating dark shades.
- GOOGLE REVIEWS STRIP: horizontal scrolling row of 5 mini review cards
  with avatar circle, name, stars, 1-line excerpt. Reads from testimonials.
- WHY LOCAL MATTERS: 3-col section. Each col: icon + heading + 2 sentences.
  White bg, simple, clean.
- BOTTOM CTA: Red bg, white text, phone number large, "Schedule Service" button.

### Shell 4 — Minimal Edge
- Minimal white navbar (already done)
- Hero: split layout — LEFT: large headline + subtext + CTA.
  RIGHT: hero image in a rounded-xl frame with a floating
  "Free Quote" card overlapping bottom-left corner of image.
- PROCESS STEPS: numbered 1–4 horizontal strip.
  "1. Call Us → 2. Free Inspection → 3. Treatment Plan → 4. Guaranteed Results"
  Clean, minimal, slate colors.
- SERVICES: 2-col grid of large cards. Each card: service name in large
  text, 1-sentence description, arrow link. No icons — typography-led.
- FEATURED REVIEW: Full-width section. Large pull-quote in the center,
  reviewer name below, 5 stars. Single testimonial, high impact.
- BOTTOM CTA: Split — left half slate-800, right half emerald.
  Left: "Ready to protect your home?" Right: large email/phone CTA.

---

## DATA FETCHING PATTERN FOR ShellHomeSections

Each ShellHomeSections.tsx fetches on mount:
```ts
const tenantId = import.meta.env.VITE_TENANT_ID

// Testimonials (top 3 featured)
const { data: testimonials } = await supabase
  .from('testimonials')
  .select('author_name, review_text, rating')
  .eq('tenant_id', tenantId)
  .eq('featured', true)
  .order('rating', { ascending: false })
  .limit(3)

// Business info
const { data: bizSettings } = await supabase
  .from('settings')
  .select('value')
  .eq('tenant_id', tenantId)
  .eq('key', 'business_info')
  .maybeSingle()

const biz = bizSettings?.value ?? {}
```

No new tables needed. All data already exists.

---

## SETTINGS KEYS (JSONB)

```
business_info   → {name, phone, email, address, hours, tagline, industry,
                   license, certifications, founded_year, num_technicians}
branding        → {logo_url, primary_color, accent_color, template, cta_text}
customization   → {hero_headline, show_license, show_years,
                   show_technicians, show_certifications}
social_links    → {facebook, instagram, google, youtube}
integrations    → {google_place_id, facebook_page_id, facebook_access_token,
                   google_analytics_id, pexels_api_key,
                   textbelt_api_key, owner_sms_number, ayrshare_api_key}
```

---

## RULES (NEVER VIOLATE)

- Model is ALWAYS claude-sonnet-4-6
- Relative imports only — NO @/ aliases
- Single useState object for forms — never per-field state
- Use maybeSingle() not single() for settings queries
- All files <200 lines — split before editing any file at limit
- Working directly on main — no PR needed
- Footer "Powered by PestFlow Pro" badge on ALL shells
- HolidayBanner ABOVE Navbar — PublicShell handles this
- Follow the session roadmap exactly
- Do NOT generate a context file — plain summary only at end
- Watch bundle size — hard limit 450 kB main bundle

---

## PERMANENTLY OUT OF SCOPE

- Invoice generator / Customer portal / Technician calendar
- PDF reports / PDF export / Self-serve pricing page

---

## SESSION LOG

| Session | Date | Key Completions |
|---------|------|----------------|
| 1–29 | Mar–Apr 2026 | Full platform build |
| 30 | Apr 2026 | Shell infrastructure + Modern Pro + Bold & Local (24 files) |
| 31 | Apr 2026 | Clean & Friendly + Rustic & Rugged shells, all 4 wired |
| 32 | Apr 2026 | Customization layer (CTA text, hero headline, trust badges), Ayrshare posting in edge function, Facebook UX cleanup |

---

## ROADMAP

| Session | Focus |
|---------|-------|
| **S33** | 4 genuinely different home page layouts via ShellHomeSections ← this session |
| **S34** | Client Setup wizard pre-populates settings on export |

---

## BUILD STATUS (end of S32)

- Build: ✅ 0 errors
- Main bundle: ~440 kB (limit: 450 kB) ⚠️ close
- All 4 shells: Navbar + Hero + Footer live ✅
- Customization layer: hero headline, CTA text, trust badges live ✅
- Ayrshare posting: wired in publish-scheduled-posts ✅

---

## SESSION 33 STARTER BLOCK

```
Here is the full project context for PestFlow Pro. Read it completely before doing anything.

[paste full contents of this MD file]

Session 32 is complete. Customization layer live, Ayrshare posting wired,
Facebook UX improved. Build: ~440 kB, 0 errors.

Session 33 goals — follow this order exactly:
1. Read HomePage.tsx and PublicShell.tsx in full before touching anything
2. Extend PublicShell to pass ShellHomeSections component into HomePage
3. Build ShellHomeSections for all 4 shells — each must look genuinely
   different from the others
4. Wire into HomePage

Each ShellHomeSections file must be under 200 lines.
Split into sub-components if needed.
No new libraries. Tailwind + lucide-react only.
Watch bundle size — hard limit 450 kB main bundle.

Do NOT generate the session 34 context file. End with a plain summary only.
Follow the session roadmap exactly. Log any conflicts in commit messages.

⚠️ Stop and output a summary at 50% context window.
⚠️ Bundle size is critical — report exact number after build.
```
