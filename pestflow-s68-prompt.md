# PestFlow Pro — S68 Claude Code Prompt
_Hand this to Claude Code. Work on main. Do not self-serve._

---

## SESSION RULES
- Read PESTFLOW-SKILL.md and TASKS.md at session start
- After every task: `git add . && git commit -m "task[N]: description" && git push`
- Dev server: `doppler run -- npm run dev` — never plain `npm run dev`
- All files under 200 lines — split if needed
- STOP at 50% context window and output plain summary
- Do NOT generate a context file — plain summary only at end
- Model: claude-sonnet-4-6 always

## CRITICAL CONSTANTS
```
Supabase ID:     biezzykcgzkrwdgqpsar
Demo Tenant ID:  9215b06b-3eb5-49a1-a16e-7ff214bf6783
Demo Admin:      admin@pestflowpro.com / pf123demo
Live URL:        https://pestflowpro.com
Client Admin:    https://[slug].pestflowpro.com/admin
```

---

## BACKGROUND

Three bugs are blocking the first real client delivery (Cypress Creek Pest Control).
Fix them in order. Do not change anything that is already correct.

---

## TASK 1 — Remove Pexels prompt from ContentTab permanently

**Problem:** Every page in the Content tab shows a yellow banner:
"Add your Pexels API key in Settings → Integrations to enable image search."
This must be removed entirely — Scott does not want clients to see this ever.

**Find:** `src/pages/admin/ContentTab.tsx` (may be split into sub-components).
Search for any reference to "Pexels", "pexels", "PEXELS", or the yellow banner text
"Add your Pexels API key".

**Fix:** Delete every Pexels-related UI element:
- The yellow/orange warning banner about Pexels
- Any Pexels image search input, button, or results panel
- Any conditional that shows/hides Pexels UI

**Keep:** The "Upload Image" button and its upload logic. Do not touch that.
**Keep:** The `page_image` / `image_urls` save logic. Do not touch that.

After removing, verify no Pexels UI renders on any page in ContentTab.

Commit: `git add . && git commit -m "task[1]: remove pexels prompt from ContentTab" && git push`

---

## TASK 2 — Fix content saves not appearing on the public site

**Problem:** Admin saves content (title, body, image) in ContentTab → clicks
"Save Content" → gets success confirmation → but the public-facing page still
shows the old content. The save writes to `page_content` in Supabase but the
public page is not reading from it correctly.

**Investigate in order:**

**Step A — Verify the save is writing the right tenant_id:**
In `ContentTab.tsx` (or its save handler), find the upsert call to `page_content`.
Confirm it is using the authenticated tenant's `tenant_id` from their profile,
NOT a hardcoded ID. Log the tenant_id and slug to console before saving.

**Step B — Verify the public page reads from page_content:**
Find the public page component that renders service/content pages.
Likely in `src/pages/public/` or `src/components/public/`.
Look for how it fetches page content — it should query `page_content` by
`tenant_id` AND `slug`. Confirm both filters are present.

**Step C — Check for stale cache or localStorage:**
If the public page caches content in localStorage or state that doesn't
refresh after a save, add a cache-busting mechanism or remove the cache.

**Step D — Fix whatever is wrong:**
Based on the above findings, fix the root cause. The requirement is:
- Admin saves content for slug "pest-control"
- Public page at /pest-control immediately shows that content on next load
- No manual cache clearing required

Commit: `git add . && git commit -m "task[2]: fix content saves not reflecting on public site" && git push`

---

## TASK 3 — Fix Billing tab upgrade: "client_email and slug are required"

**Problem:** In the client admin Billing tab, clicking "Upgrade" on a higher plan
calls `create-checkout-session` but the function returns an error:
"client_email and slug are required". The data exists in tenant settings but
is not being included in the request payload.

**File:** `src/pages/admin/BillingTab.tsx`

**Find:** The function that calls `create-checkout-session` when Upgrade is clicked.
Look at what it sends in the POST body.

**Fix:** Before calling the edge function, fetch the missing values from settings:
```typescript
// Get from already-loaded settings (branding/business_info)
const clientEmail =
  settings?.notifications?.lead_email ||
  settings?.business_info?.email ||
  '';

const slug = window.location.hostname.split('.')[0];
// e.g. "cypress-creek-pest-control" from "cypress-creek-pest-control.pestflowpro.com"
// Fallback: read from tenants table via supabase if needed
```

Include both in the POST body:
```typescript
body: JSON.stringify({
  priceId,
  tenantId,
  clientEmail,   // ADD THIS
  slug,          // ADD THIS
  ...otherFields
})
```

Add a guard before the fetch: if `clientEmail` is empty, show an inline error
"Could not find your email address — please update it in Settings → Business Info."
Do not call the edge function with an empty email.

Also apply the same session/token pattern used in PaymentLinkPanel.tsx:
```typescript
let { data: { session } } = await supabase.auth.getSession()
if (!session) {
  const { data: refreshData } = await supabase.auth.refreshSession()
  session = refreshData.session
}
if (!session) { setError('Session expired. Please refresh the page.'); return }
const accessToken = session.access_token
// headers: Authorization Bearer + apikey
```

Commit: `git add . && git commit -m "task[3]: fix billing upgrade missing client_email and slug" && git push`

---

## TASK 4 — Fix palette/theme not applying on provisioned public site

**Problem:** The provisioned client site renders with default colors instead of
the palette/branding chosen during onboarding. `applyShellTheme()` exists but
is not being called with the tenant's actual `branding.template`,
`branding.primary_color`, and `branding.accent_color` from the database.

**Find:** The public site entry point — likely `src/App.tsx` or a public layout
component. Look for where branding settings are fetched and where
`applyShellTheme()` is called.

**Verify this sequence exists and is correct:**
1. On mount, read `localStorage.getItem('pfp_template')` → call `applyShellTheme(cached)` immediately (prevents flash)
2. Then fetch `settings` for key `'branding'` from Supabase for this tenant
3. After fetch, call `applyShellTheme(branding.template, branding.primary_color, branding.accent_color)`
4. Store `branding.template` back to `localStorage('pfp_template')` for next visit

**Also verify:** The tenant resolution is correct — the public site must resolve
the tenant from the subdomain (e.g. `cypress-creek-pest-control` from the hostname),
query `tenants` table by slug, get the `tenant_id`, then fetch settings by that
`tenant_id`. If it is using a hardcoded tenant_id anywhere, that is the bug.

**Fix:** Whatever is missing or broken in the above sequence. After fix:
- Deploy to Vercel
- Verify on `https://cypress-creek-pest-control.pestflowpro.com` that the
  correct colors render without a flash

Commit: `git add . && git commit -m "task[4]: fix palette/theme not applying on provisioned public site" && git push`

---

## END OF SESSION

Output a plain summary of:
- What was completed
- What was NOT completed and why
- Any new bugs discovered
- Any files that need attention next session

Do NOT generate a context file. Plain text summary only.
