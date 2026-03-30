# PestFlow Pro — Task Queue

## Sessions 1–9 (Complete)
All prior sessions complete. See PESTFLOW-SKILL.md SESSION LOG for details.

---

## Session 10 — Admin Polish, Social AI, Locations Overhaul, Reports

### TASK 10.1 — Delete Dang Pest Control artifacts
Search the entire codebase for any remaining references to:
- "Dang Pest Control" / "dangpestcontrol" / "dang-pest-control"
- "dang123" / "admin@dangpestcontrol.com"
- "Kirk" / "kirk@dangpestcontrol.com"
- "Apex Pest Solutions"
- Any image URLs pointing to dangpestcontrol.com CDN

Replace image URL references with Pexels equivalents already in pestVideos.ts
or use placeholder Pexels image URLs. Do NOT leave any broken image links.

git add . && git commit -m "cleanup: remove all Dang Pest Control references" && git push

---

### TASK 10.2 — Fix: ScrollToTop on route change
Create src/components/ScrollToTop.tsx:

```tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}
```

In App.tsx, add <ScrollToTop /> as first child inside <BrowserRouter>,
before all <Routes>.

git add . && git commit -m "fix: scroll to top on every route change" && git push

---

### TASK 10.3 — Fix: Template save does not persist on refresh
Read src/components/admin/settings/SettingsBranding.tsx.

The template selection is not persisting after save + refresh.

Root cause is likely one of:
A) upsert missing onConflict: 'tenant_id,key'
B) branding object not including template field in the upsert value
C) useTemplate() hook not re-reading from Supabase after save

Fix all three potential issues:
1. Upsert must be: .upsert({tenant_id, key:'branding', value: form}, {onConflict:'tenant_id,key'})
2. form object must include template field
3. After save, invalidate any cached template value so hook re-reads from DB

Also fix useTemplate() hook if it is reading from localStorage or a stale cache
instead of always fetching fresh from Supabase on mount.

Test: select Clean template → Save → refresh page → Clean template should still be selected.

git add . && git commit -m "fix: template selection now persists after save and refresh" && git push

---

### TASK 10.4 — Fix: Pest page VideoImage play buttons not showing
Read src/components/VideoImage.tsx and src/pages/SpiderControl.tsx.

The pest page intro sections have images but no play button is appearing.

Check:
1. VideoImage component — does it accept and use videoUrl prop?
2. SpiderControl.tsx — is videoUrl prop being passed to VideoImage?
3. src/data/pestVideos.ts — does it exist and have video URLs in it?

If pestVideos.ts is empty (no Pexels API key was available when script ran),
populate it with these known working Pexels video URLs as fallback:
```typescript
export const PEST_VIDEOS = {
  hero: [
    {
      url: 'https://videos.pexels.com/video-files/3997800/3997800-hd_1280_720_25fps.mp4',
      thumbnail: 'https://images.pexels.com/videos/3997800/free-video-3997800.jpg',
    }
  ],
  general: [
    {
      url: 'https://videos.pexels.com/video-files/5878674/5878674-hd_1280_720_30fps.mp4',
      thumbnail: 'https://images.pexels.com/videos/5878674/free-video-5878674.jpg',
    },
    {
      url: 'https://videos.pexels.com/video-files/3065488/3065488-hd_1280_720_30fps.mp4',
      thumbnail: 'https://images.pexels.com/videos/3065488/free-video-3065488.jpg',
    }
  ],
  mosquito: [{ url: 'https://videos.pexels.com/video-files/5878674/5878674-hd_1280_720_30fps.mp4', thumbnail: 'https://images.pexels.com/videos/5878674/free-video-5878674.jpg' }],
  termite: [{ url: 'https://videos.pexels.com/video-files/3997800/3997800-hd_1280_720_25fps.mp4', thumbnail: 'https://images.pexels.com/videos/3997800/free-video-3997800.jpg' }],
  spider: [{ url: 'https://videos.pexels.com/video-files/3065488/3065488-hd_1280_720_30fps.mp4', thumbnail: 'https://images.pexels.com/videos/3065488/free-video-3065488.jpg' }],
  rodent: [{ url: 'https://videos.pexels.com/video-files/5878674/5878674-hd_1280_720_30fps.mp4', thumbnail: 'https://images.pexels.com/videos/5878674/free-video-5878674.jpg' }],
} as const
```

Then ensure ALL 12 pest pages pass videoUrl to VideoImage using the appropriate
PEST_VIDEOS key. Pattern:
```tsx
import { PEST_VIDEOS } from '../data/pestVideos'
<VideoImage src={introImage} alt="..." videoUrl={PEST_VIDEOS.general[0]?.url} />
```

git add . && git commit -m "fix: pest page VideoImage play buttons now functional" && git push

---

### TASK 10.5 — Fix: Blog post images missing
Read src/pages/BlogPage.tsx and src/components/admin/BlogTab.tsx.

Blog posts are showing in the listing but without images.

1. If blog_posts table does not have an intro_image column, add it via Supabase MCP:
   ```sql
   alter table public.blog_posts add column if not exists intro_image text;
   ```

2. In BlogTab.tsx, add an "Intro Image URL" field to the create/edit form.

3. In BlogPage.tsx listing, show the intro_image if present, fall back to a
   Pexels pest control placeholder image:
   Fallback: https://images.pexels.com/photos/5591664/pexels-photo-5591664.jpeg?w=600

4. Update the 6 seeded blog posts via Supabase MCP to add intro_image URLs.
   Use these Pexels photo URLs (free, no attribution required):
   - Blog 1 (termites): https://images.pexels.com/photos/6543034/pexels-photo-6543034.jpeg?w=600
   - Blog 2 (mosquito): https://images.pexels.com/photos/1000067/pexels-photo-1000067.jpeg?w=600
   - Blog 3 (DIY): https://images.pexels.com/photos/5591664/pexels-photo-5591664.jpeg?w=600
   - Blog 4 (prepare): https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?w=600
   - Blog 5 (bed bugs): https://images.pexels.com/photos/6543034/pexels-photo-6543034.jpeg?w=600
   - Blog 6 (rodent): https://images.pexels.com/photos/4591871/pexels-photo-4591871.jpeg?w=600

git add . && git commit -m "fix: blog post images — add intro_image column, seed URLs" && git push

---

### TASK 10.6 — ContentTab: Populate with live site copy + Revert to Original

Read src/components/admin/ContentTab.tsx.

1. POPULATE: For each page in the page selector list, if no content exists in
   page_content table, show the actual hardcoded default copy from the component
   as the editable starting value. This way the admin can see exactly what is on
   the site and edit from there.

   Pages to populate via Supabase MCP upsert (if not already present):
   - home: title="East Texas's Most Trusted Pest Control", subtitle="Licensed, certified, and family-owned since 2009.", intro="Protecting East Texas homes and businesses..."
   - about: pull from About.tsx hardcoded content
   - spider-control, mosquito-control, termite-control: pull from respective .tsx files
   - contact: pull from ContactPage.tsx

2. REVERT TO ORIGINAL: Add a "↩ Revert to Original" button in the right edit panel.
   - On first save of any page, if no snapshot exists, save the original to page_snapshots
     BEFORE overwriting: {tenant_id, page_slug, snapshot_type:'original', snapshot_data: original_content}
   - Revert button: shows a confirm dialog "This will restore the original content. Are you sure?"
   - On confirm: restore from page_snapshots where snapshot_type='original'
   - If no snapshot exists: show toast "No original snapshot found for this page."

3. HOWTO DROPDOWN: At the top of ContentTab, add an expandable "How to use this section"
   panel (use existing PageHelpBanner or a similar pattern):
   ```
   📝 How to use the Content Editor
   ▼ (click to expand)

   This is where you can change the words on your website pages.
   Here's how it works:

   1. PICK A PAGE from the list on the left — like "Home" or "Spider Control"
   2. EDIT the Title, Subtitle, or Intro text on the right
   3. HIT SAVE — your website updates instantly
   4. MADE A MISTAKE? Hit "Revert to Original" to go back to what we set up for you

   💡 Tip: The Title is the big headline. The Subtitle is the smaller text under it.
      The Intro is the paragraph that explains what the page is about.
   ```

git add . && git commit -m "admin: ContentTab — live copy, revert to original, how-to" && git push

---

### TASK 10.7 — SEO Tab: Populate with real meta data for all pages

Read src/components/admin/SEOTab.tsx.

Via Supabase MCP, upsert seo_meta rows for all public pages using tenant_id.
Use these optimized values:

```sql
-- Home
INSERT INTO seo_meta (tenant_id, page_slug, meta_title, meta_description, user_edited)
VALUES (TENANT_ID, 'home',
  'Ironclad Pest Solutions | Pest Control Tyler TX | East Texas Exterminators',
  'Professional pest control in Tyler, TX and East Texas. Family-owned since 2009. Same-day service for mosquitoes, termites, rodents & more. Call (903) 555-0142.',
  false)
ON CONFLICT (tenant_id, page_slug) DO UPDATE SET meta_title=EXCLUDED.meta_title, meta_description=EXCLUDED.meta_description;
```

Pages to seed (write all as upserts):
- home, about, contact, faq, blog, reviews, service-area
- spider-control, mosquito-control, ant-control, wasp-hornet-control, roach-control
- flea-tick-control, rodent-control, scorpion-control, bed-bug-control
- pest-control, termite-control, termite-inspections
- tyler-tx, longview-tx, jacksonville-tx, lindale-tx, bullard-tx, whitehouse-tx

Each meta_title: "[Service/Page] | Ironclad Pest Solutions | [City], TX"
Each meta_description: 150–160 chars, location-specific, includes phone.

Also add howto dropdown to SEOTab using same pattern as ContentTab task above:
```
🔍 How to use SEO Settings
▼ (click to expand)

SEO is what helps Google find your website. Here's what each field does:

• META TITLE — The headline that shows up in Google search results.
  Keep it under 60 characters. Include your city name.
• META DESCRIPTION — The short description under your title in Google.
  Keep it under 160 characters. Make it sound like an ad.
• KEYWORDS — Words people type into Google to find you.
  Add 5–10 keywords per page. Use the AI button to get suggestions.

💡 The green SERP Preview shows exactly how your page looks in Google.
   Edit until it looks great, then hit Save.
```

git add . && git commit -m "admin: SEO tab populated with real meta data + how-to" && git push

---

### TASK 10.8 — Locations Tab Overhaul

Read src/components/admin/LocationsTab.tsx.

Current state: basic CRUD for location_data table.

New behavior:

1. LIST VIEW: Show all location_data rows with:
   - City name + slug
   - Live/Draft toggle (is_live)
   - "Edit" button
   - "View Page" link → opens /[slug] in new tab
   - "Delete" button with confirm

2. ADD NEW LOCATION: "Add New Location" button opens a modal with:
   - City name (text, required)
   - State (text, default "TX")
   - Slug (auto-generated from city name, editable)
   - Hero title (text, pre-filled: "[City], TX Pest Control Experts")
   - Intro paragraph (textarea, pre-filled with template copy mentioning city name)
   - Google Maps embed URL (text)
   - Is Live toggle (default off — must manually activate)

   On save:
   a. Insert row into location_data
   b. Auto-generate and upsert seo_meta for the new page:
      meta_title: "[City], TX Pest Control | Ironclad Pest Solutions"
      meta_description: "Expert pest control in [City], TX. Local technicians, same-day service..."
   c. Toast: "✅ Location page created! Toggle 'Live' when you're ready to publish."
   d. The new page is immediately accessible at /[slug] via SlugRouter/LocationPage

3. EDIT VIEW: Same fields as Add, plus:
   - "↩ Revert to Original" button (same page_snapshots pattern)
   - Auto-SEO button: regenerates meta_title + meta_description using AI

4. Add howto dropdown:
   ```
   📍 How to use Locations
   ▼ (click to expand)

   This is where you manage the city pages on your website.
   Each city gets its own page that shows up when people search
   "[Your City] pest control" on Google.

   • ADD A LOCATION — Click "Add New Location", type the city name,
     and hit Save. A new page is created automatically.
   • GO LIVE — New locations start as "Draft". Toggle it to "Live"
     when you're ready for customers to see it.
   • VIEW PAGE — Click the link to see what the page looks like.
   • SEO — Each location gets its own Google search description automatically.
     You can edit it if you want.
   ```

git add . && git commit -m "admin: Locations tab overhaul — auto-create pages, SEO, how-to" && git push

---

### TASK 10.9 — Settings Tab: Seed + How-To Dropdowns

Read all settings tab components in src/components/admin/settings/.

1. SEED via Supabase MCP — upsert all settings keys for TENANT_ID with
   full Ironclad Pest Solutions demo data:

   business_info: full object (name, phone, email, address, hours, tagline,
   license, certifications, npma_member:true, tpca_member:true,
   founded_year:"2009", num_technicians:"12", service_radius:"100",
   after_hours_phone:"(903) 555-0199")

   branding: {logo_url:"", favicon_url:"", primary_color:"#10b981",
   accent_color:"#f5c518", template:"bold"}

   social_links: {facebook:"https://facebook.com/ironclad-pest",
   instagram:"https://instagram.com/ironclad_pest",
   google:"https://g.page/ironclad-pest",
   youtube:"https://youtube.com/@ironclad-pest",
   twitter:"https://twitter.com/ironclad_pest"}

   notifications: {lead_email:"info@ironclad-pest.com",
   cc_email:"", monthly_report_email:"info@ironclad-pest.com",
   notify_google_review:true, weekly_seo_digest:true}

2. Add howto dropdowns to each settings section:

   Business Info:
   ```
   🏢 Business Info — What is this?
   This is the information that shows up across your whole website —
   your phone number, address, hours, and so on. Fill this out once
   and it updates everywhere automatically.
   ```

   Branding:
   ```
   🎨 Branding — What is this?
   This controls how your website looks. You can:
   • Upload your logo (paste a link to your logo image)
   • Pick your colors
   • Choose a Template — Bold (orange, aggressive), Clean (blue, professional),
     Modern (dark, sleek), or Rustic (warm, established)
   After you save, refresh the site tab to see the change.
   ```

   Integrations:
   ```
   🔌 Integrations — What is this?
   These connect your website to other tools:
   • Google Place ID — lets us show and import your Google reviews
   • Facebook Token — lets you post to Facebook from this dashboard
   • Google Analytics ID — tracks how many people visit your site
   To find your Google Place ID, search your business on Google Maps,
   click your listing, and copy the ID from the URL.
   ```

git add . && git commit -m "admin: Settings seeded with demo data + how-to dropdowns" && git push

---

### TASK 10.10 — Social Tab: AI-Powered Marky-Style Composer

This is a major feature rebuild of SocialTab. Reference: mymarky.ai for UX inspiration.

Read src/components/admin/SocialTab.tsx.

Replace current stub with a full AI social media composer:

#### Layout (3 columns on desktop, stacked on mobile):
- LEFT: Composer panel
- CENTER: Post preview cards
- RIGHT: Scheduled/posted history

#### Composer Panel:
```
Topic or caption idea:
[text input — "e.g. Spring mosquito season tips"]

Or upload an image:
[drag & drop / file input → stores to Supabase storage bucket 'social-uploads']

Style Theme:
[4 option cards — click to select]
  🟧 Bold — High energy, orange accents, action verbs, urgency
  🟦 Professional — Clean, trustworthy, facts-first
  🌿 Educational — Tips & advice, friendly, helpful
  🎉 Seasonal — Tied to season/holiday, fun, timely

Platforms: (checkboxes — can select multiple)
  ☑ Facebook  ☑ Instagram  ☐ Google Business  ☐ YouTube  ☐ Twitter/X

Schedule:
  ○ Post Now
  ○ Schedule for: [datetime-local input]

[🤖 Generate Posts with AI]
```

#### AI Generation:
When "Generate Posts with AI" is clicked:
1. Show loading spinner "Writing your posts..."
2. Call Anthropic API with this prompt:
```
You are a social media expert for a pest control company called [business_name].
Topic: [topic]
Style: [selected theme description]
Generate social media posts for each selected platform.
Respond ONLY with valid JSON like this:
{
  "facebook": { "caption": "...", "hashtags": ["...", "..."] },
  "instagram": { "caption": "...", "hashtags": ["...", "..."] },
  "google_business": { "caption": "..." },
  "youtube": { "title": "...", "description": "..." },
  "twitter": { "caption": "..." }
}
Write each caption in the [style] voice. Keep Twitter under 280 chars.
Facebook/Instagram 150-300 chars. Include call to action. Include phone number.
```
3. Parse JSON response
4. Show each platform's post as a preview card in CENTER panel
5. Each preview card has: platform icon, post text, character count, "Edit" button, "Remove" button

#### Preview Cards (CENTER):
- One card per selected platform
- Facebook card: shows post with image preview if uploaded
- Instagram card: shows square image crop preview
- Each card is editable inline (clicking Edit makes text editable)
- Show character limit warning if over limit

#### Publish/Schedule:
"Schedule All" button:
1. For each selected platform, insert row into social_posts table:
   {tenant_id, platform, caption, image_url, status:'scheduled' or 'published',
   scheduled_for, created_at}
2. If "Post Now" + Facebook: attempt Meta Graph API post using
   settings.integrations.facebook_access_token + facebook_page_id
3. If "Post Now" + Instagram: post via Instagram Graph API
4. Other platforms (YouTube, Twitter, Google): save as scheduled with note
   "Requires API connection in Settings → Integrations"
5. Toast: "✅ Posts scheduled for [date]!" or "✅ Posted to Facebook!"

#### History Panel (RIGHT):
- Shows last 20 social_posts rows for this tenant
- Each row: platform icon, caption preview, status badge, date
- Status: scheduled (blue) | published (green) | failed (red)
- "Delete" button on each row

#### How-to dropdown:
```
📱 Social Media — How to use this
▼ (click to expand)

This tool writes your social media posts FOR you using AI.
You don't have to be a social media expert. Here's how:

1. TYPE A TOPIC — like "mosquito season tips" or "why hire a pro"
   OR upload a photo of your work
2. PICK A STYLE — Bold for high energy, Professional for trust,
   Educational for tips, Seasonal for holidays
3. PICK YOUR PLATFORMS — check Facebook, Instagram, etc.
4. HIT GENERATE — AI writes all your posts at once
5. REVIEW — read them, edit anything you want to change
6. SCHEDULE — pick a date/time or post right now

💡 Tip: Posting 3x per week keeps your business visible on Google and Facebook.
   Try scheduling Monday, Wednesday, Friday morning posts.
```

git add . && git commit -m "admin: Social tab — AI Marky-style composer, all platforms, scheduler" && git push

---

### TASK 10.11 — Reports Tab: Full Analytics Dashboard

Read src/components/admin/ReportsTab.tsx.

Replace stub with a real reports dashboard. This is a premium feature — make it look great.

#### Sections:

1. LEADS REPORT (data from leads table):
   - Total leads this month vs last month (% change badge)
   - Leads by status pie/donut chart (new, contacted, quoted, won, lost)
   - Leads over time line chart (last 90 days)
   - Conversion rate: won / total leads %
   - Top pest types requested (from services field)
   - Export CSV button

2. WEBSITE TRAFFIC (Google Analytics):
   - If settings.integrations.google_analytics_id is set:
     Show a "Connect Google Analytics" button that opens
     https://analytics.google.com in a new tab with instructions
     (We cannot embed GA data without server-side auth — show setup instructions)
   - If NOT connected: show a prominent "Connect Google Analytics" card with steps:
     1. Go to analytics.google.com
     2. Create a property for your website
     3. Copy your Measurement ID (G-XXXXXXXXXX)
     4. Paste it in Settings → Integrations → Google Analytics ID
     5. Add the tracking script (show snippet they can copy)

3. SEO PERFORMANCE (data from keyword_tracker + seo_meta):
   - Keywords tracked (count from keyword_tracker)
   - Pages with SEO meta filled vs missing
   - Top 10 keywords by volume (bar chart)
   - Pages missing meta descriptions (actionable list with "Fix" links)

4. BLOG PERFORMANCE:
   - Total published posts
   - Posts this month
   - Most recent 5 posts with publish dates

5. SOCIAL PERFORMANCE:
   - Posts scheduled this month
   - Posts published this month
   - Posts by platform (Facebook, Instagram, etc.) bar chart

Layout: card grid, dark admin theme, use recharts for all charts.
Each section has a howto info icon tooltip explaining what the data means.

#### How-to dropdown:
```
📊 Reports — How to use this
▼ (click to expand)

This page shows you how your business is doing online.

• LEADS — How many people filled out your quote form and what happened to them
• TRAFFIC — How many people visited your website (needs Google Analytics setup)
• SEO — How well your website shows up on Google
• BLOG — Your recent articles (more articles = better Google ranking)
• SOCIAL — Your recent social media posts

💡 The most important number: CONVERSION RATE.
   This is the % of people who asked for a quote and became customers.
   A good rate is 20-40%. If yours is lower, the AI can help you improve it.
```

git add . && git commit -m "admin: Reports tab — leads analytics, GA setup, SEO performance, charts" && git push

---

### TASK 10.12 — Leads Tab: Email/Call Actions + Conversion Tracking

Read src/components/admin/LeadsTab.tsx.

Add the following to the existing leads table:

1. EMAIL BUTTON: On each lead row, add a "📧 Email" button.
   Clicking it opens a mailto: link:
   mailto:[lead.email]?subject=Re: Your Pest Control Quote Request&body=Hi [lead.name], Thank you for reaching out to Ironclad Pest Solutions...

2. CALL BUTTON: Add a "📞 Call" button.
   On mobile: opens tel:[lead.phone]
   On desktop: shows a modal with the phone number to dial + copy button

3. STATUS DROPDOWN: If not already present, ensure each lead has a status
   dropdown: new → contacted → quoted → won → lost
   Auto-saves on change (no Save button needed).

4. CONVERSION STATS BAR above the table:
   Show 4 stat pills: Total | New | Quoted | Won | Conversion Rate %
   These update live based on current filtered view.

5. NOTES FIELD: Add a notes textarea in the lead detail/edit panel.
   Save to a notes column (add via Supabase MCP if missing):
   ```sql
   alter table public.leads add column if not exists notes text;
   alter table public.leads add column if not exists status text default 'new';
   ```

6. How-to dropdown:
   ```
   👥 Leads — How to use this
   ▼ (click to expand)

   Every time someone fills out your quote form, they show up here as a Lead.

   • NEW — They just submitted the form. Call or email them within 1 hour.
     (Leads contacted within 1 hour convert 7x more often!)
   • CONTACTED — You've reached out. Update status so you don't forget.
   • QUOTED — You sent them a price.
   • WON — They became a customer! 🎉
   • LOST — They went elsewhere. That's OK.

   💡 Your CONVERSION RATE is Won ÷ Total leads.
      If it's below 20%, ask your PestFlow Pro rep for tips.
   ```

git add . && git commit -m "admin: Leads tab — email/call actions, notes, conversion stats, how-to" && git push

---

### TASK 10.13 — Blog Tab: Sync admin posts + how-to

Read src/components/admin/BlogTab.tsx.

1. Ensure the 6 seeded blog posts appear in the blog tab list.
   If they don't, the query may be missing the tenant_id filter — fix it.

2. Add intro_image field to create/edit form (URL input + preview thumbnail).

3. Add how-to dropdown:
   ```
   ✍️ Blog — How to use this
   ▼ (click to expand)

   Your blog is one of the best ways to show up on Google.
   Every article you publish is a new page Google can find.

   • TITLE — Make it sound like a question people would Google.
     Good: "How to Get Rid of Mosquitoes in Your Backyard"
   • CONTENT — Write at least 300 words. Use the AI button to help.
   • INTRO IMAGE — Add a photo to make the post look professional.
     Paste any image URL from Pexels.com (free photos).
   • PUBLISH — Toggle to Published when it's ready.

   💡 Aim for 2 new posts per month. After 20 posts, you'll notice
      a big jump in Google traffic.
   ```

git add . && git commit -m "admin: Blog tab — intro_image, sync fix, how-to dropdown" && git push

---

### TASK 10.14 — Testimonials Tab: Google Reviews deep link

Read src/components/admin/TestimonialsTab.tsx.

1. GOOGLE REVIEWS LINK: If settings.integrations.google_place_id is set,
   add a prominent button at the top:
   "⭐ View on Google" → opens
   https://search.google.com/local/reviews?placeid=[google_place_id]
   in a new tab.

2. WRITE A REVIEW button:
   "Ask Customers to Review" → copies this URL to clipboard:
   https://search.google.com/local/writereview?placeid=[google_place_id]
   Toast: "✅ Review link copied! Send it to your customers."
   If google_place_id not set: toast "Set your Google Place ID in Settings → Integrations first."

3. How-to dropdown:
   ```
   ⭐ Reviews — How to use this
   ▼ (click to expand)

   Reviews are one of the most important things for your business.
   90% of people read reviews before calling a company.

   • IMPORT FROM GOOGLE — Click the Import button to automatically pull
     your Google reviews in here. You need your Google Place ID set in
     Settings → Integrations first.
   • ADD MANUALLY — Click "Add Review" to type in a review by hand.
   • FEATURED — Toggle this ON for your best reviews. They show up on
     your homepage for everyone to see.
   • ASK FOR REVIEWS — Use the "Ask Customers to Review" button to get
     a link you can text or email to customers after each job.
   ```

git add . && git commit -m "admin: Testimonials — Google deep link, review request copy, how-to" && git push

---

### TASK 10.15 — Universal Revert to Original Button pattern

Ensure every editable section across the entire admin has a consistent
"↩ Revert to Original" button.

Check these files and add the revert pattern if missing:
- ContentTab.tsx (should exist from task 10.6)
- BlogTab.tsx — add revert on individual blog post edit
- SEOTab.tsx — add revert per page (restores original auto-generated meta)
- SettingsBusinessInfo.tsx — "↩ Reset to Demo Defaults" button
- SettingsBranding.tsx — "↩ Reset to Demo Defaults" button

Pattern for settings revert:
- "Reset to Demo Defaults" shows a confirm dialog
- On confirm: upserts the settings key with the full Ironclad demo defaults
- Toast: "✅ Reset to original demo settings."

This gives every user confidence they can experiment without fear of breaking anything.

git add . && git commit -m "admin: universal revert to original on all editable sections" && git push

---

### TASK 10.16 — Build check + SKILL.md update

1. Run: npm run build — fix ALL TypeScript errors. Zero errors required.

2. Open .env.local and verify VITE_TENANT_ID is set to:
   9215b06b-3eb5-49a1-a16e-7ff214bf6783

3. Update PESTFLOW-SKILL.md SESSION LOG:
   | 10 | Mar 2026 | Dang cleanup, scroll fix, template persist fix, video play buttons, blog images, ContentTab revert, SEO populated, Locations auto-create, Settings seeded, Social AI composer (Marky-style), Reports analytics dashboard, Leads email/call/notes, Blog sync, Google Reviews link, universal revert buttons |

4. Mark all Session 10 tasks [x] in TASKS.md

5. git add . && git commit -m "docs: Session 10 complete — SKILL.md + TASKS.md updated" && git push

Report:
- All files created/modified
- Any TypeScript errors and how resolved  
- Build status
- Any Supabase operations that failed
- Social tab: confirm AI generation works end-to-end
