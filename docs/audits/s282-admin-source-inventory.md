# S282 — Admin SPA source inventory (Phase 2, layer 1)

*Discovery only. No component was modified, no preset file created, no public-site
registry read, imported, or extended. This document records what the admin SPA
says today so Phase 3 can decide what to do about it.*

---

## Scope and method

**Scanned:** `src/components/admin/**` — 139 `.ts`/`.tsx` files, 15,579 lines — plus the
admin-only lib and hook modules those files import.

**Out of scope and untouched:** `src/shells/**`, `app/**`, and every public-site
vertical registry. The admin gets its OWN preset file in Phase 3; nothing here reads
or extends `src/shells/_shared/verticalCopy.ts`.

### The classification rule

| Class | Test |
|---|---|
| **VERTICAL** | every company in this trade would say it, no company in another trade would |
| **TENANT** | two companies in the SAME trade would say it differently → belongs in the DB |
| **PLATFORM** | it describes the software, not the business |
| **AMBIGUOUS** | genuinely unclear — recorded with a reason rather than guessed |

### How the table was produced, and what that means for trust

Strings were extracted mechanically (JSX text nodes, user-visible props, constant
arrays, template literals, toast messages), then classified by lexicon. **The
VERTICAL and TENANT rows were then read by hand; the PLATFORM rows were spot-checked,
not individually reviewed.** Rows are marked `PLATFORM?` and `TENANT?` with a question
mark to keep that distinction honest — a `?` means the lexicon said so and no human
confirmed it. `VERTICAL` rows carry no `?`: every one was eyeballed.

The classifier was wrong twice before it was right, and both bugs were found by
reading its output rather than its count:

1. `\b(spider|wasp|…)\b` missed **every plural** — `Spiders`, `Wasps`, `Roaches`,
   `Mosquitoes`. Only `Ants` came back from `FAQ_CATEGORIES`, which is what gave it away.
2. The fix (`\w*`) then over-matched: `rat` hit *"Rating"*, *"rate-limited"*,
   *"Engagement Rate"*, and `pest` hit the **product name** *"PestFlow Pro"*, which is
   PLATFORM. Both are excluded explicitly now.

A count alone would have looked fine at every stage.

### Totals

| Class | Rows |
|---|---:|
| VERTICAL | 84 |
| TENANT? | 20 |
| PLATFORM? | 1380 |
| **Total** | **1484** |

Distinct strings: 1,124 across 123 files.

---

## 1. Tab and route structure

The admin SPA mounts at `src/pages/admin/Dashboard.tsx`, which rewrites from `/admin`
via `middleware.ts`. `TABS` (`Dashboard.tsx:32-47`) is the registry; every tab but
`dashboard` is `React.lazy`-loaded.

| Tab key | Label | Root component |
|---|---|---|
| `dashboard` | Dashboard | `dashboard/DashboardHome.tsx` |
| `content` | Content | `ContentTab.tsx` |
| `seo` | SEO | `SEOTab.tsx` |
| `blog` | Blog | `BlogTab.tsx` |
| `media` | Media | `MediaTab.tsx` |
| `social` | Social | `SocialTab.tsx` |
| `testimonials` | Testimonials | `TestimonialsTab.tsx` |
| `locations` | Locations | `LocationsTab.tsx` |
| `analytics` | Analytics | `analytics/AnalyticsSection.tsx` |
| `crm` | CRM | `CRMTab.tsx` |
| `team` | Team | `team/TeamTab.tsx` |
| `billing` | Billing | `BillingTab.tsx` |
| `support` | Support | `SupportTab.tsx` |
| `settings` | Settings | `settings/SettingsTab.tsx` |

Not in `TABS`, reached by other routes: `FaqTab.tsx` (rendered inside Content),
`ReviewsTab.tsx`, `ReportsTab.tsx`, `tabs/OnboardingTab.tsx`, the 6-step
`client-setup/ClientSetupWizard.tsx`, and the 6-step `onboarding/` flow
(`src/pages/admin/Onboarding.tsx`).

### Sub-component counts by directory

| Directory | Files |
|---|---:|
| `(root)` | 27 |
| `social` | 25 |
| `seo` | 19 |
| `reports` | 14 |
| `client-setup` | 13 |
| `settings` | 12 |
| `dashboard` | 8 |
| `onboarding` | 7 |
| `analytics` | 5 |
| `team` | 3 |
| `crm` | 3 |
| `common` | 2 |
| `tabs` | 1 |

---

## 2. Every user-visible string

Sorted VERTICAL first, then TENANT, then PLATFORM. `kind` is one of: `literal`,
`constant-array`, `template-literal`, `placeholder`, `aria/alt`, `error-message`.

| file:line | string | kind | class | note |
|---|---|---|---|---|
| `ContentPageForm.tsx:187` | e.g. Professional Pest Control You Can Trust | placeholder | VERTICAL |  |
| `ContentTab.tsx:15` | pest-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:15` | termite-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:15` | termite-inspections | constant-array | VERTICAL |  |
| `ContentTab.tsx:16` | spider-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:16` | roach-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:16` | ant-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:16` | mosquito-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:17` | scorpion-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:17` | bed-bug-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:17` | flea-tick-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:17` | rodent-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:18` | wasp-hornet-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | spider-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | mosquito-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | ant-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | wasp-hornet-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | roach-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | flea-tick-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | rodent-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | scorpion-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | bed-bug-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | pest-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | termite-control | constant-array | VERTICAL |  |
| `ContentTab.tsx:28` | termite-inspections | constant-array | VERTICAL |  |
| `ContentTab.tsx:132` | You are a marketing copywriter for ${biz}, a pest control company based in ${city}, TX serving East Texas.\n\nWrite SEO-optimized copy for the "${pest} control" service page.\n\nRe | template-literal | VERTICAL | AI prompt — also hardcodes East Texas + Longview + Jacksonville |
| `ContentTab.tsx:134` | You are a copywriter for ${biz}, a pest control company in ${city}, TX (East Texas).\nWrite marketing copy for the "${selectedSlug}" page.\n\nRespond ONLY with a JSON object, no ma | template-literal | VERTICAL | AI prompt — also hardcodes East Texas |
| `FaqItemForm.tsx:4` | Ants | constant-array | VERTICAL | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:4` | Spiders | constant-array | VERTICAL | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:4` | Wasps & Yellow Jackets | constant-array | VERTICAL | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:5` | Scorpions | constant-array | VERTICAL | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:5` | Rodents | constant-array | VERTICAL | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:5` | Mosquitoes | constant-array | VERTICAL | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:5` | Fleas & Ticks | constant-array | VERTICAL | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:5` | Roaches | constant-array | VERTICAL | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:5` | Bed Bugs | constant-array | VERTICAL | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:37` | e.g. Are your treatments safe for pets? | placeholder | VERTICAL |  |
| `LocationsTab.tsx:76` | ${form.city} Pest Control | template-literal | VERTICAL | default hero_title written to service_areas |
| `LocationsTab.tsx:208` | ${form.city \|\| 'City'} Pest Control | template-literal | VERTICAL |  |
| `LocationsTab.tsx:216` | Pest Control in ${form.city \|\| 'City'}, TX \| Your Business | template-literal | VERTICAL | placeholder hardcodes , TX |
| `LocationsTab.tsx:224` | pest control ${form.city ? form.city.toLowerCase() : 'city'} tx | template-literal | VERTICAL | placeholder hardcodes tx |
| `client-setup/steps/Step1BusinessInfo.tsx:59` | Acme Pest Solutions | placeholder | VERTICAL |  |
| `client-setup/steps/Step1BusinessInfo.tsx:63` | ironclad-pest | placeholder | VERTICAL |  |
| `client-setup/steps/Step3Domain.tsx:44` | e.g. ironclad-pest.com | placeholder | VERTICAL |  |
| `onboarding/StepBusinessInfo.tsx:21` | Apex Pest Solutions | placeholder | VERTICAL |  |
| `onboarding/StepBusinessInfo.tsx:44` | Your local pest experts | placeholder | VERTICAL |  |
| `onboarding/StepBusinessInfo.tsx:53` | e.g. Pest Control, HVAC, Plumbing | placeholder | VERTICAL |  |
| `seo/SeoAioTab.tsx:68` | ${keywords.join(', ')} — professional pest control in East Texas. | template-literal | VERTICAL | written to seo_meta on save |
| `seo/SeoInlineEditor.tsx:190` | The one search term you most want this page to show up for (e.g. "pest control Tyler TX"). | literal | VERTICAL |  |
| `seo/SeoInlineEditor.tsx:191` | e.g. pest control Tyler TX | placeholder | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:8` | spider-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:8` | mosquito-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:8` | ant-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:8` | wasp-hornet-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:9` | roach-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:9` | flea-tick-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:9` | rodent-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:9` | scorpion-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:9` | bed-bug-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:10` | pest-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:10` | termite-control | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:10` | termite-inspections | constant-array | VERTICAL |  |
| `seo/SeoKeywordsTab.tsx:33` | You are an SEO expert for a pest control company in East Texas.\nGenerate 10 keyword suggestions for the page: "${page}"\nFocus topic: "${topic}"\nBusiness: local pest control serv | template-literal | VERTICAL | AI prompt — also hardcodes Tyler TX + East Texas |
| `seo/SeoKeywordsTab.tsx:67` | e.g. spider control | placeholder | VERTICAL |  |
| `seo/SeoOverviewTab.tsx:132` | Pest Pages | literal | VERTICAL |  |
| `seo/SeoPagesTab.tsx:100` | Pest Pages | literal | VERTICAL |  |
| `seo/useSeoTab.ts:19` | spider-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:19` | ant-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:19` | roach-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:19` | termite-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:20` | mosquito-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:20` | flea-tick-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:20` | wasp-hornet-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:20` | bed-bug-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:21` | scorpion-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:21` | rodent-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:21` | pest-control | constant-array | VERTICAL |  |
| `seo/useSeoTab.ts:21` | termite-inspections | constant-array | VERTICAL |  |
| `settings/HeroCustomizationSection.tsx:66` | Number of Technicians | constant-array | VERTICAL |  |
| `social/ComposerCaptionEditor.tsx:45` | e.g. mosquito season tips | placeholder | VERTICAL |  |
| `social/ComposerTemplates.tsx:11` | seasonal pest prevention tips for ${CURRENT_MONTH} from {businessName} | template-literal | VERTICAL |  |
| `social/NewCampaignModal.tsx:152` | e.g. Spring Termite Season | placeholder | VERTICAL |  |
| `social/NewCampaignModal.tsx:157` | e.g. Promote spring termite inspections and treatment deals | placeholder | VERTICAL |  |
| `team/TeamMemberModal.tsx:97` | e.g. Owner & Lead Technician | placeholder | VERTICAL |  |
| `ContentPageForm.tsx:200` | Subtitle or tagline | placeholder | TENANT? |  |
| `LocationsTab.tsx:61` | Your plan includes ${cap === Infinity ? 'unlimited' : cap} service area page${cap === 1 ? '' : 's'}. Upgrade for more locations. | template-literal | TENANT? |  |
| `LocationsTab.tsx:82` | Service area updated! | literal | TENANT? |  |
| `LocationsTab.tsx:86` | Your plan's limit of ${cap === Infinity ? 'unlimited' : cap} service areas has been reached. Upgrade for more. | template-literal | TENANT? |  |
| `LocationsTab.tsx:88` | Failed to add service area: ${error.message} | error-message | TENANT? |  |
| `LocationsTab.tsx:88` | Service area added! | literal | TENANT? |  |
| `LocationsTab.tsx:102` | Service area deleted. | literal | TENANT? |  |
| `LocationsTab.tsx:129` | 📍 Service Areas | literal | TENANT? |  |
| `LocationsTab.tsx:182` | No service areas yet. | literal | TENANT? |  |
| `LocationsTab.tsx:212` | Brief intro shown on the service area page | placeholder | TENANT? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:90` | Tagline | literal | TENANT? |  |
| `onboarding/StepBranding.tsx:29` | Don't have one yet? No problem — your business name will be used instead. | literal | TENANT? |  |
| `onboarding/StepBusinessInfo.tsx:20` | Business Name * | literal | TENANT? |  |
| `onboarding/StepBusinessInfo.tsx:43` | Tagline | literal | TENANT? |  |
| `onboarding/StepBusinessInfo.tsx:47` | License Number | literal | TENANT? |  |
| `seo/SeoOverviewTab.tsx:133` | Service Area Pages | literal | TENANT? |  |
| `seo/SeoPagesTab.tsx:101` | Service Area Pages | literal | TENANT? |  |
| `settings/HeroCustomizationSection.tsx:64` | License Number | constant-array | TENANT? |  |
| `settings/HeroCustomizationSection.tsx:82` | Leave blank to use your tagline | placeholder | TENANT? |  |
| `social/PostPreviewModal.tsx:59` | Your Business | literal | TENANT? |  |
| `BillingTab.tsx:34` | Paid | literal | PLATFORM? |  |
| `BillingTab.tsx:35` | Pending | literal | PLATFORM? |  |
| `BillingTab.tsx:36` | Cancelled | literal | PLATFORM? |  |
| `BillingTab.tsx:43` | Setup fee + ${plan} | template-literal | PLATFORM? |  |
| `BillingTab.tsx:94` | Billing & Subscription | literal | PLATFORM? |  |
| `BillingTab.tsx:101` | Plans | literal | PLATFORM? |  |
| `BillingTab.tsx:107` | relative bg-white rounded-xl border-2 p-5 flex flex-col ${isCurrent ? 'border-emerald-500 shadow-md' : plan.mostPopular ? 'border-purple-300' : 'border-gray-200'} | template-literal | PLATFORM? |  |
| `BillingTab.tsx:109` | Most popular | literal | PLATFORM? |  |
| `BillingTab.tsx:111` | Current Plan | literal | PLATFORM? |  |
| `BillingTab.tsx:124` | Current Plan | literal | PLATFORM? |  |
| `BillingTab.tsx:151` | Current Plan | literal | PLATFORM? |  |
| `BillingTab.tsx:152` | Your active PestFlow Pro subscription | literal | PLATFORM? |  |
| `BillingTab.tsx:157` | Loading... | literal | PLATFORM? |  |
| `BillingTab.tsx:192` | Payment History | literal | PLATFORM? |  |
| `BillingTab.tsx:196` | Loading... | literal | PLATFORM? |  |
| `BillingTab.tsx:198` | No payment history yet. | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:64` | ${tenantId}/blog/${Date.now()}.${ext} | template-literal | PLATFORM? |  |
| `BlogPostEditor.tsx:66` | Image upload failed. | error-message | PLATFORM? |  |
| `BlogPostEditor.tsx:70` | Image uploaded! | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:74` | Enter a topic first. | error-message | PLATFORM? |  |
| `BlogPostEditor.tsx:90` | Draft generated. Review and edit, then save. | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:98` | Title is required. | error-message | PLATFORM? |  |
| `BlogPostEditor.tsx:120` | Failed to save post: ${error.message} | error-message | PLATFORM? |  |
| `BlogPostEditor.tsx:155` | Upgrade to Pro to use AI draft generation | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:165` | Topic | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:170` | What should this post be about? e.g.  | placeholder | PLATFORM? |  |
| `BlogPostEditor.tsx:171` | ${inputClass} resize-none | template-literal | PLATFORM? |  |
| `BlogPostEditor.tsx:177` | Tone | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:184` | Informative | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:185` | Conversational | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:186` | Authoritative | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:190` | Word Count | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:210` | Generating… | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:220` | ~15 seconds | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:228` | Title | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:229` | Post title | placeholder | PLATFORM? |  |
| `BlogPostEditor.tsx:229` | ${inputClass} text-lg | template-literal | PLATFORM? |  |
| `BlogPostEditor.tsx:232` | Slug | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:233` | url-slug | placeholder | PLATFORM? |  |
| `BlogPostEditor.tsx:237` | Excerpt | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:238` | Brief summary shown in blog listing | placeholder | PLATFORM? |  |
| `BlogPostEditor.tsx:238` | ${inputClass} resize-none | template-literal | PLATFORM? |  |
| `BlogPostEditor.tsx:241` | Featured Image | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:244` | Featured | aria/alt | PLATFORM? |  |
| `BlogPostEditor.tsx:274` | Content | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:274` | (Supports HTML) | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:275` | Full post content... | placeholder | PLATFORM? |  |
| `BlogPostEditor.tsx:275` | ${inputClass} resize-none font-mono text-xs | template-literal | PLATFORM? |  |
| `BlogPostEditor.tsx:284` | Date: | literal | PLATFORM? |  |
| `BlogPostEditor.tsx:294` | Cancel | literal | PLATFORM? |  |
| `BlogTab.tsx:55` | Post restored. | literal | PLATFORM? |  |
| `BlogTab.tsx:93` | ✍️ Blog | literal | PLATFORM? |  |
| `BlogTab.tsx:103` | px-3 py-1.5 transition ${tab === 'active' ? 'bg-gray-100 text-gray-700 font-medium' : 'text-gray-400 hover:bg-gray-50'} | template-literal | PLATFORM? |  |
| `BlogTab.tsx:104` | Active | literal | PLATFORM? |  |
| `BlogTab.tsx:107` | px-3 py-1.5 transition ${tab === 'archived' ? 'bg-gray-100 text-gray-700 font-medium' : 'text-gray-400 hover:bg-gray-50'} | template-literal | PLATFORM? |  |
| `BlogTab.tsx:108` | Archived | literal | PLATFORM? |  |
| `BlogTab.tsx:125` | Loading... | literal | PLATFORM? |  |
| `BlogTab.tsx:149` | Archived | literal | PLATFORM? |  |
| `BlogTab.tsx:151` | px-2 py-0.5 rounded-full text-xs font-medium ${p.published_at ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'} | template-literal | PLATFORM? |  |
| `BlogTab.tsx:160` | Restore | literal | PLATFORM? |  |
| `BlogTab.tsx:165` | Edit | literal | PLATFORM? |  |
| `BlogTab.tsx:187` | "${undoTarget.title}" archived. | template-literal | PLATFORM? |  |
| `CRMTab.tsx:47` | Status updated | literal | PLATFORM? |  |
| `CRMTab.tsx:51` | ${import.meta.env.VITE_SUPABASE_URL \|\| 'https://biezzykcgzkrwdgqpsar.supabase.co'}/functions/v1/send-review-request | template-literal | PLATFORM? |  |
| `CRMTab.tsx:52` | Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY} | template-literal | PLATFORM? |  |
| `CRMTab.tsx:56` | Review request sent to ${lead?.name \|\|  | literal | PLATFORM? |  |
| `CRMTab.tsx:56` | Review request sent to ${lead?.name \|\| 'customer'} | template-literal | PLATFORM? |  |
| `CRMTab.tsx:111` | leads-${new Date().toISOString().split('T')[0]}.csv | template-literal | PLATFORM? |  |
| `CRMTab.tsx:112` | CSV exported! | literal | PLATFORM? |  |
| `CRMTab.tsx:122` | 📋 CRM — Lead Management | literal | PLATFORM? |  |
| `CRMTab.tsx:146` | ${ic} bg-white | template-literal | PLATFORM? |  |
| `CRMTab.tsx:147` | All Statuses | literal | PLATFORM? |  |
| `CRMTab.tsx:152` | to | literal | PLATFORM? |  |
| `CRMTab.tsx:154` | Search name, email, phone... | placeholder | PLATFORM? |  |
| `CRMTab.tsx:154` | ${ic} flex-1 min-w-[200px] | template-literal | PLATFORM? |  |
| `CRMTab.tsx:157` | px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${showArchived ? 'bg-gray-100 border-gray-400 text-gray-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'} | template-literal | PLATFORM? |  |
| `CRMTab.tsx:191` | ${undoTarget.name} archived. | template-literal | PLATFORM? |  |
| `ContentPageForm.tsx:38` | Image ${index + 1} | template-literal | PLATFORM? |  |
| `ContentPageForm.tsx:54` | ${tenantId}/pages/${slug}/image-${index}.${ext} | template-literal | PLATFORM? |  |
| `ContentPageForm.tsx:58` | Upload failed:  | error-message | PLATFORM? |  |
| `ContentPageForm.tsx:64` | Save failed:  | error-message | PLATFORM? |  |
| `ContentPageForm.tsx:67` | Image uploaded! | literal | PLATFORM? |  |
| `ContentPageForm.tsx:76` | Remove failed:  | error-message | PLATFORM? |  |
| `ContentPageForm.tsx:79` | Image removed. | literal | PLATFORM? |  |
| `ContentPageForm.tsx:90` | Remove image | literal | PLATFORM? |  |
| `ContentPageForm.tsx:99` | Recommended: 1200×600px. | literal | PLATFORM? |  |
| `ContentPageForm.tsx:125` | ${tenantId}/pages/${slug}/hero.${file.name.split('.').pop()} | template-literal | PLATFORM? |  |
| `ContentPageForm.tsx:128` | Upload failed:  | error-message | PLATFORM? |  |
| `ContentPageForm.tsx:134` | Save failed:  | error-message | PLATFORM? |  |
| `ContentPageForm.tsx:135` | Hero image uploaded! | literal | PLATFORM? |  |
| `ContentPageForm.tsx:144` | Remove failed:  | error-message | PLATFORM? |  |
| `ContentPageForm.tsx:145` | Hero image removed. | literal | PLATFORM? |  |
| `ContentPageForm.tsx:150` | Page Hero Image | literal | PLATFORM? |  |
| `ContentPageForm.tsx:162` | Remove | literal | PLATFORM? |  |
| `ContentPageForm.tsx:180` | Editing: | literal | PLATFORM? |  |
| `ContentPageForm.tsx:181` | Content changes will appear on the public page immediately after save. | literal | PLATFORM? |  |
| `ContentPageForm.tsx:182` | Loading... | literal | PLATFORM? |  |
| `ContentPageForm.tsx:186` | Hero Headline | literal | PLATFORM? |  |
| `ContentPageForm.tsx:192` | Page Title | literal | PLATFORM? |  |
| `ContentPageForm.tsx:193` | Page title | placeholder | PLATFORM? |  |
| `ContentPageForm.tsx:194` | Used for browser tab and SEO only — not shown on the page. | literal | PLATFORM? |  |
| `ContentPageForm.tsx:203` | Intro / Body | literal | PLATFORM? |  |
| `ContentPageForm.tsx:204` | ${inputClass} resize-none | template-literal | PLATFORM? |  |
| `ContentPageForm.tsx:207` | Video URL | literal | PLATFORM? |  |
| `ContentPageForm.tsx:214` | Additional Images | literal | PLATFORM? |  |
| `ContentPageForm.tsx:232` | AI-generated content. Review before saving. | literal | PLATFORM? |  |
| `ContentTab.tsx:14` | home | constant-array | PLATFORM? |  |
| `ContentTab.tsx:14` | about | constant-array | PLATFORM? |  |
| `ContentTab.tsx:19` | contact | constant-array | PLATFORM? |  |
| `ContentTab.tsx:105` | Enter a page title | error-message | PLATFORM? |  |
| `ContentTab.tsx:107` | A page with that slug already exists | error-message | PLATFORM? |  |
| `ContentTab.tsx:117` | Failed to create page: ${error.message} | error-message | PLATFORM? |  |
| `ContentTab.tsx:123` | Page  | literal | PLATFORM? |  |
| `ContentTab.tsx:123` | Page "/${slug}" created — add your content and save | template-literal | PLATFORM? |  |
| `ContentTab.tsx:149` | AI content generated — review and save when ready | literal | PLATFORM? |  |
| `ContentTab.tsx:150` | AI generation failed — check your API key | error-message | PLATFORM? |  |
| `ContentTab.tsx:181` | Save failed: ${error.message} | error-message | PLATFORM? |  |
| `ContentTab.tsx:189` | Content saved! | literal | PLATFORM? |  |
| `ContentTab.tsx:191` | Saved to DB — site refresh may take up to 60 min | literal | PLATFORM? |  |
| `ContentTab.tsx:194` | Content saved! | literal | PLATFORM? |  |
| `ContentTab.tsx:203` | No original snapshot found for this page. | error-message | PLATFORM? |  |
| `ContentTab.tsx:208` | Failed to revert. | error-message | PLATFORM? |  |
| `ContentTab.tsx:208` | Reverted to original content! | literal | PLATFORM? |  |
| `ContentTab.tsx:213` | 📝 Content Editor | literal | PLATFORM? |  |
| `ContentTab.tsx:218` | Pages | literal | PLATFORM? |  |
| `ContentTab.tsx:222` | Add a new custom page | literal | PLATFORM? |  |
| `ContentTab.tsx:229` | w-full text-left px-4 py-2.5 text-sm transition ${selectedSlug === slug ? 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-500' : 'text-gray-600 hover:text-gra | template-literal | PLATFORM? |  |
| `ContentTab.tsx:236` | Custom Pages | literal | PLATFORM? |  |
| `ContentTab.tsx:239` | w-full text-left px-4 py-2.5 text-sm transition ${selectedSlug === slug ? 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-500' : 'text-gray-600 hover:text-gra | template-literal | PLATFORM? |  |
| `ContentTab.tsx:252` | New Custom Page | literal | PLATFORM? |  |
| `ContentTab.tsx:257` | Page Title | literal | PLATFORM? |  |
| `ContentTab.tsx:260` | e.g. Commercial Services | placeholder | PLATFORM? |  |
| `ContentTab.tsx:266` | URL Slug | literal | PLATFORM? |  |
| `ContentTab.tsx:271` | commercial-services | placeholder | PLATFORM? |  |
| `ContentTab.tsx:276` | Auto-generated from title. Edit to customize. | literal | PLATFORM? |  |
| `ContentTab.tsx:280` | Cancel | literal | PLATFORM? |  |
| `DemoBanner.tsx:8` | 🎭 Demo Mode active — this data is for demonstration only. | literal | PLATFORM? |  |
| `FaqItemForm.tsx:4` | General | constant-array | PLATFORM? | FAQ_CATEGORIES — closed select, see section 5 |
| `FaqItemForm.tsx:27` | (e: React.ChangeEvent | literal | PLATFORM? |  |
| `FaqItemForm.tsx:33` | Question | literal | PLATFORM? |  |
| `FaqItemForm.tsx:41` | Answer | literal | PLATFORM? |  |
| `FaqItemForm.tsx:46` | Write the answer here... | placeholder | PLATFORM? |  |
| `FaqItemForm.tsx:51` | Category | literal | PLATFORM? |  |
| `FaqItemForm.tsx:60` | Order | literal | PLATFORM? |  |
| `FaqTab.tsx:37` | Question and answer are required. | error-message | PLATFORM? |  |
| `FaqTab.tsx:48` | Failed to save: ${error.message} | error-message | PLATFORM? |  |
| `FaqTab.tsx:51` | FAQ item added! | literal | PLATFORM? |  |
| `FaqTab.tsx:57` | Question and answer are required. | error-message | PLATFORM? |  |
| `FaqTab.tsx:64` | Failed to save: ${error.message} | error-message | PLATFORM? |  |
| `FaqTab.tsx:69` | FAQ item updated! | literal | PLATFORM? |  |
| `FaqTab.tsx:77` | Failed to delete: ${error.message} | error-message | PLATFORM? |  |
| `FaqTab.tsx:80` | FAQ item deleted. | literal | PLATFORM? |  |
| `FaqTab.tsx:95` | Loading... | literal | PLATFORM? |  |
| `FaqTab.tsx:99` | ❓ FAQ Manager | literal | PLATFORM? |  |
| `FaqTab.tsx:113` | New FAQ Item | literal | PLATFORM? |  |
| `FaqTab.tsx:118` | Save | literal | PLATFORM? |  |
| `FaqTab.tsx:124` | No FAQ items yet. Click "Add Question" to start. | literal | PLATFORM? |  |
| `FaqTab.tsx:142` | Save | literal | PLATFORM? |  |
| `FaqTab.tsx:155` | Edit | literal | PLATFORM? |  |
| `FaqTab.tsx:156` | Delete | literal | PLATFORM? |  |
| `LocationsTab.tsx:61` | Your plan includes ${cap === Infinity ?  | error-message | PLATFORM? |  |
| `LocationsTab.tsx:74` | City name is required. | error-message | PLATFORM? |  |
| `LocationsTab.tsx:82` | Failed to update: ${error.message} | error-message | PLATFORM? |  |
| `LocationsTab.tsx:86` | Your plan | error-message | PLATFORM? |  |
| `LocationsTab.tsx:92` | JSONB sync failed: ${syncErr} | error-message | PLATFORM? |  |
| `LocationsTab.tsx:105` | JSONB sync failed: ${syncErr} | error-message | PLATFORM? |  |
| `LocationsTab.tsx:116` | JSONB sync failed: ${syncErr} | error-message | PLATFORM? |  |
| `LocationsTab.tsx:124` | ${cap} included | template-literal | PLATFORM? |  |
| `LocationsTab.tsx:141` | Upgrade for more locations. | literal | PLATFORM? |  |
| `LocationsTab.tsx:145` | Loading... | literal | PLATFORM? |  |
| `LocationsTab.tsx:170` | px-3 py-1 rounded-full text-xs font-medium transition ${loc.is_live ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'} | template-literal | PLATFORM? |  |
| `LocationsTab.tsx:176` | Edit | literal | PLATFORM? |  |
| `LocationsTab.tsx:198` | City Name * | literal | PLATFORM? |  |
| `LocationsTab.tsx:199` | Tyler | placeholder | PLATFORM? |  |
| `LocationsTab.tsx:202` | Slug | literal | PLATFORM? |  |
| `LocationsTab.tsx:203` | tyler-tx | placeholder | PLATFORM? |  |
| `LocationsTab.tsx:207` | Hero Title | literal | PLATFORM? |  |
| `LocationsTab.tsx:211` | Intro Text | literal | PLATFORM? |  |
| `LocationsTab.tsx:212` | ${inputClass} resize-none | template-literal | PLATFORM? |  |
| `LocationsTab.tsx:215` | Meta Title | literal | PLATFORM? |  |
| `LocationsTab.tsx:219` | Meta Description | literal | PLATFORM? |  |
| `LocationsTab.tsx:220` | 150-160 char description for Google | placeholder | PLATFORM? |  |
| `LocationsTab.tsx:220` | ${inputClass} resize-none | template-literal | PLATFORM? |  |
| `LocationsTab.tsx:223` | Focus Keyword | literal | PLATFORM? |  |
| `LocationsTab.tsx:232` | Cancel | literal | PLATFORM? |  |
| `MediaTab.tsx:19` | ${item.tags.length} tags | template-literal | PLATFORM? |  |
| `MediaTab.tsx:70` | The Media Library holds photos only — to post a video, use  | error-message | PLATFORM? |  |
| `MediaTab.tsx:71` | Uploaded ${n} image${n === 1 ?  | literal | PLATFORM? |  |
| `MediaTab.tsx:71` | Uploaded ${n} image${n === 1 ? '' : 's'}. | template-literal | PLATFORM? |  |
| `MediaTab.tsx:82` | Image removed. | literal | PLATFORM? |  |
| `MediaTab.tsx:94` | Moved to "${value}". | template-literal | PLATFORM? |  |
| `MediaTab.tsx:114` | Tagging 0/${ids.length}… | template-literal | PLATFORM? |  |
| `MediaTab.tsx:130` | Tagging failed — hover the image badge for details. | error-message | PLATFORM? |  |
| `MediaTab.tsx:138` | Tagging failed. | error-message | PLATFORM? |  |
| `MediaTab.tsx:145` | Tagging ${i + 1}/${ids.length}… | template-literal | PLATFORM? |  |
| `MediaTab.tsx:151` | ${ok} tagged | template-literal | PLATFORM? |  |
| `MediaTab.tsx:152` | ${skipped} already tagged | template-literal | PLATFORM? |  |
| `MediaTab.tsx:153` | ${failed} failed | template-literal | PLATFORM? |  |
| `MediaTab.tsx:156` | ${summary} — see the failed badges. | error-message | PLATFORM? |  |
| `MediaTab.tsx:164` | Image tagged. | literal | PLATFORM? |  |
| `MediaTab.tsx:175` | relative rounded-xl ${dragOver ? 'ring-2 ring-emerald-500 ring-offset-2' : ''} | template-literal | PLATFORM? |  |
| `MediaTab.tsx:179` | 🖼️ Media Library | literal | PLATFORM? |  |
| `MediaTab.tsx:185` | Folder | literal | PLATFORM? |  |
| `MediaTab.tsx:192` | Unfiled | literal | PLATFORM? |  |
| `MediaTab.tsx:231` | Upload Photo or Video | literal | PLATFORM? |  |
| `MediaTab.tsx:236` | Drop images to upload | literal | PLATFORM? |  |
| `MediaTab.tsx:251` | No images yet. Click Upload or drag files here. | literal | PLATFORM? |  |
| `MediaTab.tsx:261` | absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[10px] font-medium ${b.cls} | template-literal | PLATFORM? |  |
| `MediaTab.tsx:285` | AI Vision tagging is a Pro feature | literal | PLATFORM? |  |
| `MediaTab.tsx:296` | Already tagged | literal | PLATFORM? |  |
| `MediaTab.tsx:306` | Tag with AI Vision | literal | PLATFORM? |  |
| `MediaTab.tsx:315` | Move to folder | literal | PLATFORM? |  |
| `MediaTab.tsx:322` | Remove | literal | PLATFORM? |  |
| `NotificationBell.tsx:9` | ${mins}m ago | template-literal | PLATFORM? |  |
| `NotificationBell.tsx:11` | ${hrs}h ago | template-literal | PLATFORM? |  |
| `NotificationBell.tsx:12` | ${Math.floor(hrs / 24)}d ago | template-literal | PLATFORM? |  |
| `NotificationBell.tsx:37` | New Leads | literal | PLATFORM? |  |
| `NotificationBell.tsx:41` | No new leads | literal | PLATFORM? |  |
| `ReportsTab.tsx:39` | = prevCutoff && d | literal | PLATFORM? |  |
| `ReportsTab.tsx:75` | 📊 Reports & Insights | literal | PLATFORM? |  |
| `ReportsTab.tsx:94` | Loading lead analytics... | literal | PLATFORM? |  |
| `ReportsTab.tsx:100` | px-3 py-1.5 rounded-lg text-sm font-medium transition ${range === r ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'} | template-literal | PLATFORM? |  |
| `ReportsTab.tsx:116` | Leads Over Time | literal | PLATFORM? |  |
| `ReportsTab.tsx:133` | Lead Status | literal | PLATFORM? |  |
| `ReportsTab.tsx:149` | Top Requested Services | literal | PLATFORM? |  |
| `ReportsTab.tsx:167` | No service data yet — leads with services will appear here. | literal | PLATFORM? |  |
| `ReportsTab.tsx:175` | Privacy-first analytics — all data stays in your database. No third-party tracking. | literal | PLATFORM? |  |
| `ReviewsTab.tsx:58` | Google API error: ${json.status} | template-literal | PLATFORM? |  |
| `ReviewsTab.tsx:94` | Elite Plan Feature | literal | PLATFORM? |  |
| `ReviewsTab.tsx:95` | Live Google Reviews sync is available on the Elite plan. Upgrade to unlock. | literal | PLATFORM? |  |
| `ReviewsTab.tsx:104` | ⭐ Live Google Reviews | literal | PLATFORM? |  |
| `ReviewsTab.tsx:107` | Live Google Reviews | literal | PLATFORM? |  |
| `ReviewsTab.tsx:117` | Loading Google reviews… | literal | PLATFORM? |  |
| `ReviewsTab.tsx:143` | No reviews found for this Place ID. | literal | PLATFORM? |  |
| `SEOTab.tsx:30` | Loading SEO data… | literal | PLATFORM? |  |
| `SEOTab.tsx:34` | 🔍 SEO Dashboard | literal | PLATFORM? |  |
| `SocialTab.tsx:70` | Loading social data… | literal | PLATFORM? |  |
| `SocialTab.tsx:74` | 📱 Social Media | literal | PLATFORM? |  |
| `SocialTab.tsx:82` | Starter plan — Hands On mode | literal | PLATFORM? |  |
| `SocialTab.tsx:87` | Upgrade to connect your accounts. | literal | PLATFORM? |  |
| `SocialTab.tsx:102` | Social Media | literal | PLATFORM? |  |
| `SocialTab.tsx:168` | What would you like to create? | literal | PLATFORM? |  |
| `SocialTab.tsx:169` | Choose a post type to get started. | literal | PLATFORM? |  |
| `SocialTab.tsx:170` | grid gap-4 mb-5 ${canAccess(3) ? 'grid-cols-2' : 'grid-cols-1'} | template-literal | PLATFORM? |  |
| `SocialTab.tsx:174` | Single Post | literal | PLATFORM? |  |
| `SocialTab.tsx:188` | Campaign | literal | PLATFORM? |  |
| `SocialTab.tsx:189` | Plan a series of posts around a theme or promotion. | literal | PLATFORM? |  |
| `SocialTab.tsx:190` | Start a Campaign → | literal | PLATFORM? |  |
| `SocialTab.tsx:195` | Upgrade to Pro to unlock AI Campaign creation. | literal | PLATFORM? |  |
| `SocialTab.tsx:197` | Cancel | literal | PLATFORM? |  |
| `SupportTab.tsx:72` | ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-support-ticket | template-literal | PLATFORM? |  |
| `SupportTab.tsx:76` | Bearer ${session.access_token} | template-literal | PLATFORM? |  |
| `SupportTab.tsx:87` | 🎟️ Support | literal | PLATFORM? |  |
| `SupportTab.tsx:113` | text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[t.priority] ?? PRIORITY_BADGE.normal} | template-literal | PLATFORM? |  |
| `SupportTab.tsx:116` | text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status] ?? STATUS_BADGE.open} | template-literal | PLATFORM? |  |
| `SupportTab.tsx:127` | PestFlow Pro replied: | literal | PLATFORM? |  |
| `SupportTab.tsx:142` | New Support Ticket | literal | PLATFORM? |  |
| `SupportTab.tsx:147` | Subject | literal | PLATFORM? |  |
| `SupportTab.tsx:152` | Brief description of your issue | placeholder | PLATFORM? |  |
| `SupportTab.tsx:156` | Description | literal | PLATFORM? |  |
| `SupportTab.tsx:162` | Describe the issue in detail... | placeholder | PLATFORM? |  |
| `SupportTab.tsx:166` | Priority | literal | PLATFORM? |  |
| `SupportTab.tsx:172` | Low | literal | PLATFORM? |  |
| `SupportTab.tsx:173` | Normal | literal | PLATFORM? |  |
| `SupportTab.tsx:174` | High | literal | PLATFORM? |  |
| `SupportTab.tsx:175` | Urgent | literal | PLATFORM? |  |
| `SupportTab.tsx:180` | Cancel | literal | PLATFORM? |  |
| `TestimonialCard.tsx:17` | Promise | literal | PLATFORM? |  |
| `TestimonialCard.tsx:39` | bg-white rounded-xl shadow-sm border p-5 transition ${r.featured ? 'border-l-4 border-l-emerald-500 border-t border-r border-b border-gray-100' : 'border-gray-100'} | template-literal | PLATFORM? |  |
| `TestimonialCard.tsx:43` | px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_BADGE[r.source] \|\| 'bg-gray-100 text-gray-600'} | template-literal | PLATFORM? |  |
| `TestimonialCard.tsx:47` | text-gray-600 text-sm cursor-pointer ${expanded ? '' : 'line-clamp-3'} | template-literal | PLATFORM? |  |
| `TestimonialCard.tsx:52` | text-xs font-medium px-2 py-1 rounded ${r.featured ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'} | template-literal | PLATFORM? |  |
| `TestimonialCard.tsx:55` | Edit | literal | PLATFORM? |  |
| `TestimonialCard.tsx:56` | Delete | literal | PLATFORM? |  |
| `TestimonialCard.tsx:63` | ✅ Sent | literal | PLATFORM? |  |
| `TestimonialCard.tsx:65` | Failed — try again | literal | PLATFORM? |  |
| `TestimonialModal.tsx:17` | Google | constant-array | PLATFORM? |  |
| `TestimonialModal.tsx:17` | Facebook | constant-array | PLATFORM? |  |
| `TestimonialModal.tsx:17` | Direct | constant-array | PLATFORM? |  |
| `TestimonialModal.tsx:17` | Yelp | constant-array | PLATFORM? |  |
| `TestimonialModal.tsx:29` | Author Name * | literal | PLATFORM? |  |
| `TestimonialModal.tsx:33` | Customer Email | literal | PLATFORM? |  |
| `TestimonialModal.tsx:33` | (for review requests) | literal | PLATFORM? |  |
| `TestimonialModal.tsx:34` | customer@example.com | placeholder | PLATFORM? |  |
| `TestimonialModal.tsx:37` | Review Text * | literal | PLATFORM? |  |
| `TestimonialModal.tsx:41` | Rating | literal | PLATFORM? |  |
| `TestimonialModal.tsx:51` | Source | literal | PLATFORM? |  |
| `TestimonialModal.tsx:62` | Cancel | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:27` | ${Math.floor(diffMs / 60_000)}m ago | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:28` | ${Math.floor(diffMs / 3_600_000)}h ago | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:29` | ${Math.floor(diffMs / 86_400_000)}d ago | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:119` | Session expired — please log in again. | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:122` | ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outscraper-reviews | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:127` | Bearer ${token} | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:139` | Manual refresh is rate-limited to once per 6 hours. | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:155` | ✅ Synced ${body.inserted_count ?? 0} new review${body.inserted_count !== 1 ?  | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:155` | ✅ Synced ${body.inserted_count ?? 0} new review${body.inserted_count !== 1 ? 's' : ''} from Google (${body.total_reviews ?? 0} total on profile) | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:158` | Refresh failed — network error. | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:173` | Name and review text are required. | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:178` | Failed to update: ${error.message} | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:179` | Review updated! | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:185` | Failed to add review: ${error.message} | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:186` | Review added! | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:197` | Review deleted. | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:214` | ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-review-request | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:217` | Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY} | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:223` | Add a Google Place ID in Settings → Integrations to send review requests. | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:225` | ✅ Review request sent to ${r.author_name} | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:234` | Session expired. Please log in again. | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:238` | Bearer ${token} | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:244` | No Google location linked. Add a Place ID in Settings → Integrations. | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:246` | Google returned an error. Check the Place ID or try again later. | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:248` | Failed to fetch Google reviews. | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:254` | No reviews found for this location. | error-message | PLATFORM? |  |
| `TestimonialsTab.tsx:269` | Imported ${imported} Google review${imported !== 1 ?  | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:269` | Imported ${imported} Google review${imported !== 1 ? 's' : ''}! | template-literal | PLATFORM? |  |
| `TestimonialsTab.tsx:289` | ⭐ Reviews — How to use this tab | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:299` | Google Reviews Auto-Sync | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:308` | Imported | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:314` | Last Synced | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:326` | Upgrade to Elite to enable manual refresh | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:330` | Elite plan only | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:339` | Next refresh available | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:380` | Loading... | literal | PLATFORM? |  |
| `TestimonialsTab.tsx:382` | No testimonials yet. Add your first review! | literal | PLATFORM? |  |
| `TierToggle.tsx:4` | Starter | constant-array | PLATFORM? |  |
| `TierToggle.tsx:5` | Growth | constant-array | PLATFORM? |  |
| `TierToggle.tsx:6` | Pro | constant-array | PLATFORM? |  |
| `TierToggle.tsx:7` | Elite | constant-array | PLATFORM? |  |
| `TierToggle.tsx:26` | Demo Tier | literal | PLATFORM? |  |
| `UpgradeCards.tsx:10` | Starter | constant-array | PLATFORM? |  |
| `UpgradeCards.tsx:10` | Website + hosting | constant-array | PLATFORM? |  |
| `UpgradeCards.tsx:10` | Lead capture form | constant-array | PLATFORM? |  |
| `UpgradeCards.tsx:10` | Content editor | constant-array | PLATFORM? |  |
| `UpgradeCards.tsx:10` | Basic SEO | constant-array | PLATFORM? |  |
| `UpgradeCards.tsx:69` | Plans | literal | PLATFORM? |  |
| `UpgradeCards.tsx:85` | bg-white rounded-xl border-2 p-5 flex flex-col ${isCurrent ? 'border-emerald-500 shadow-md' : 'border-gray-200'} | template-literal | PLATFORM? |  |
| `UpgradeCards.tsx:86` | Your plan | literal | PLATFORM? |  |
| `UpgradeCards.tsx:105` | Upgrade to ${t.name} | template-literal | PLATFORM? |  |
| `UpgradeCards.tsx:110` | mailto:support@pestflowpro.ai?subject=${encodeURIComponent( | template-literal | PLATFORM? |  |
| `analytics/AnalyticsHub.tsx:51` | SEO Analytics | literal | PLATFORM? |  |
| `analytics/AnalyticsHub.tsx:60` | Social Analytics | literal | PLATFORM? |  |
| `analytics/AnalyticsHub.tsx:68` | Blog Analytics | literal | PLATFORM? |  |
| `analytics/sections/BlogSection.tsx:12` | Blog Analytics | literal | PLATFORM? |  |
| `analytics/sections/SEOSection.tsx:17` | Site Performance | literal | PLATFORM? |  |
| `analytics/sections/SEOSection.tsx:30` | SEO Analytics | literal | PLATFORM? |  |
| `analytics/sections/SocialSection.tsx:13` | Social Analytics | literal | PLATFORM? |  |
| `client-setup/ClientSetupPayment.tsx:118` | ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session | template-literal | PLATFORM? |  |
| `client-setup/ClientSetupPayment.tsx:122` | Bearer ${authSession.access_token} | template-literal | PLATFORM? |  |
| `client-setup/ClientSetupPayment.tsx:147` | Payment & Setup Fee | literal | PLATFORM? |  |
| `client-setup/ClientSetupPayment.tsx:151` | Setup Type | literal | PLATFORM? |  |
| `client-setup/ClientSetupPayment.tsx:158` | Setup Fee | literal | PLATFORM? |  |
| `client-setup/ClientSetupPayment.tsx:165` | Monthly Plan | literal | PLATFORM? |  |
| `client-setup/ClientSetupPayment.tsx:173` | ${form.slug \|\| '—'}.pestflowpro.ai | template-literal | PLATFORM? |  |
| `client-setup/ClientSetupPayment.tsx:208` | Copy | literal | PLATFORM? |  |
| `client-setup/ClientSetupPayment.tsx:213` | Send this link to your client. Their site will be provisioned after payment. | literal | PLATFORM? |  |
| `client-setup/ClientSetupWizard.tsx:12` | Business | constant-array | PLATFORM? |  |
| `client-setup/ClientSetupWizard.tsx:12` | Branding | constant-array | PLATFORM? |  |
| `client-setup/ClientSetupWizard.tsx:12` | Domain | constant-array | PLATFORM? |  |
| `client-setup/ClientSetupWizard.tsx:12` | Social | constant-array | PLATFORM? |  |
| `client-setup/ClientSetupWizard.tsx:12` | Plan | constant-array | PLATFORM? |  |
| `client-setup/ClientSetupWizard.tsx:12` | Review | constant-array | PLATFORM? |  |
| `client-setup/ClientSetupWizard.tsx:44` | w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${done ? 'bg-emerald-500 text-white' : active ? 'bg-emerald-600 text-white ring-2 ring-emerald-20 | template-literal | PLATFORM? |  |
| `client-setup/ClientSetupWizard.tsx:47` | text-xs hidden sm:block ${active ? 'text-emerald-600 font-medium' : 'text-gray-400'} | template-literal | PLATFORM? |  |
| `client-setup/ClientSetupWizard.tsx:69` | = 1 && step | literal | PLATFORM? |  |
| `client-setup/_archived_ClientSetupPage.tsx:9` | Client Setup | literal | PLATFORM? |  |
| `client-setup/components/LogoUpload.tsx:21` | wizard/${sessionUuid.current}/${file.name} | template-literal | PLATFORM? |  |
| `client-setup/components/LogoUpload.tsx:43` | (PNG or SVG preferred) | literal | PLATFORM? |  |
| `client-setup/components/LogoUpload.tsx:48` | Logo preview | aria/alt | PLATFORM? |  |
| `client-setup/components/LogoUpload.tsx:59` | flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition ${uploading ? 'border-emerald-400 bg-emerald-50' : 'border-gray-30 | template-literal | PLATFORM? |  |
| `client-setup/components/PaletteSelector.tsx:12` | Color Palette | literal | PLATFORM? |  |
| `client-setup/components/PaletteSelector.tsx:31` | Active | literal | PLATFORM? |  |
| `client-setup/components/ShellSelector.tsx:9` | modern-pro | constant-array | PLATFORM? |  |
| `client-setup/components/ShellSelector.tsx:10` | Modern Pro | constant-array | PLATFORM? |  |
| `client-setup/components/ShellSelector.tsx:11` | Clean and professional. Dark navy with bold accents. | constant-array | PLATFORM? |  |
| `client-setup/components/ShellSelector.tsx:44` | Site Template | literal | PLATFORM? |  |
| `client-setup/components/ShellSelector.tsx:53` | text-left rounded-xl border-2 p-4 transition ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'} | template-literal | PLATFORM? |  |
| `client-setup/components/ShellSelector.tsx:56` | text-sm font-bold ${selected ? 'text-emerald-700' : 'text-gray-900'} | template-literal | PLATFORM? |  |
| `client-setup/components/ShellSelector.tsx:59` | Pro | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:5` | Monday | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:5` | Tuesday | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:5` | Wednesday | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:5` | Thursday | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:5` | Friday | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:5` | Saturday | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:5` | Sunday | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:6` | America/New_York | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:6` | America/Chicago | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:6` | America/Denver | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:6` | America/Los_Angeles | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:6` | America/Phoenix | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:6` | America/Anchorage | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:6` | Pacific/Honolulu | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:6` | America/Toronto | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:6` | America/Vancouver | constant-array | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:28` | Closed | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:29` | hours_structured.${i} | template-literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:39` | (e: React.ChangeEvent | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:54` | Business Info | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:55` | Core details about the client's business. | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:58` | Company Name * | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:62` | Site Slug * | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:66` | Your site will be at: | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:67` | Enter your company name above | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:73` | Phone * | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:77` | Email * | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:78` | owner@business.com | placeholder | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:82` | Address (legacy) * | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:83` | 123 Main St, Tyler TX 75701 | placeholder | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:86` | Business Hours (legacy) | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:87` | Mon–Fri 8am–6pm, Sat 9am–2pm | placeholder | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:91` | East Texas | placeholder | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:94` | Admin Password * | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:95` | Temporary password for client login | placeholder | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:96` | Client will use this to log in to their admin dashboard. | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:102` | Structured Address | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:121` | Geolocation | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:124` | Latitude | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:128` | Longitude | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:132` | Geocode Source | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:134` | — select — | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:135` | Manual | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:136` | Google Places | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:140` | Coming soon | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:140` | Geocode from address | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:147` | Timezone | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:149` | — select — | literal | PLATFORM? |  |
| `client-setup/steps/Step1BusinessInfo.tsx:156` | Business Hours (structured) | literal | PLATFORM? |  |
| `client-setup/steps/Step2PackageBranding.tsx:37` | Setup & Branding | literal | PLATFORM? |  |
| `client-setup/steps/Step2PackageBranding.tsx:38` | Select your setup type and visual identity. | literal | PLATFORM? |  |
| `client-setup/steps/Step2PackageBranding.tsx:49` | w-full text-left rounded-xl border-2 px-5 py-4 transition ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'} | template-literal | PLATFORM? |  |
| `client-setup/steps/Step2PackageBranding.tsx:52` | font-semibold text-sm ${selected ? 'text-emerald-700' : 'text-gray-900'} | template-literal | PLATFORM? |  |
| `client-setup/steps/Step2PackageBranding.tsx:53` | text-xs font-bold px-2 py-0.5 rounded-full ${selected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'} | template-literal | PLATFORM? |  |
| `client-setup/steps/Step2PackageBranding.tsx:106` | Your current website URL | literal | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:6` | GoDaddy | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:6` | Namecheap | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:6` | Google Domains | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:6` | Cloudflare | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:6` | Network Solutions | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:7` | Squarespace | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:7` | Wix | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:7` | Bluehost | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:7` | HostGator | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:7` | Other | constant-array | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:18` | Domain | literal | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:19` | Where does this client's domain live? | literal | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:29` | I don't have a domain yet | literal | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:39` | Current domain | literal | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:49` | Domain registrar | literal | PLATFORM? |  |
| `client-setup/steps/Step3Domain.tsx:55` | Select registrar… | literal | PLATFORM? |  |
| `client-setup/steps/Step4SocialLinks.tsx:11` | (e: React.ChangeEvent | literal | PLATFORM? |  |
| `client-setup/steps/Step4SocialLinks.tsx:16` | Social Links | literal | PLATFORM? |  |
| `client-setup/steps/Step4SocialLinks.tsx:17` | Fill in what you have — we can find the rest during setup. | literal | PLATFORM? |  |
| `client-setup/steps/Step4SocialLinks.tsx:18` | All fields optional. | literal | PLATFORM? |  |
| `client-setup/steps/Step4SocialLinks.tsx:21` | Facebook Page URL | literal | PLATFORM? |  |
| `client-setup/steps/Step4SocialLinks.tsx:25` | Google Business Profile URL | literal | PLATFORM? |  |
| `client-setup/steps/Step4SocialLinks.tsx:29` | Instagram URL | literal | PLATFORM? |  |
| `client-setup/steps/Step4SocialLinks.tsx:33` | YouTube Channel URL | literal | PLATFORM? |  |
| `client-setup/steps/Step5PlanSelection.tsx:13` | Select Plan | literal | PLATFORM? |  |
| `client-setup/steps/Step5PlanSelection.tsx:14` | Choose the monthly subscription for this client. | literal | PLATFORM? |  |
| `client-setup/steps/Step5PlanSelection.tsx:34` | text-base font-bold mb-0.5 ${selected ? 'text-emerald-700' : 'text-gray-900'} | template-literal | PLATFORM? |  |
| `client-setup/steps/Step5PlanSelection.tsx:35` | text-lg font-semibold mb-2 ${selected ? 'text-emerald-600' : 'text-gray-700'} | template-literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:31` | ${form.domain}${form.domain_registrar ? | template-literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:38` | Review Client Details | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:39` | Confirm everything looks correct, then proceed to generate the payment link. | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:42` | Business | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:43` | Site URL | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:44` | Contact | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:45` | Address | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:46` | Setup Type | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:52` | Template | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:53` | Palette | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:65` | Source site | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:67` | Logo | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:68` | Domain | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:69` | Social | literal | PLATFORM? |  |
| `client-setup/steps/Step6Review.tsx:70` | Plan | literal | PLATFORM? |  |
| `common/InfoTooltip.tsx:58` | relative inline-flex items-center align-middle ml-1 ${className} | template-literal | PLATFORM? |  |
| `common/InfoTooltip.tsx:61` | What is ${entry.label}? | template-literal | PLATFORM? |  |
| `common/InfoTooltip.tsx:78` | translateX(calc(-50% + ${offsetX}px)) | template-literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:16` | Lead Details | literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:20` | Name | literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:22` | Email | literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:23` | mailto:${lead.email}?subject=Following up on your quote request&body=Hi ${encodeURIComponent(lead.name)},%0A%0A | template-literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:25` | Email ${lead.name} | template-literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:31` | Phone | literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:32` | tel:${lead.phone} | template-literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:37` | Services | literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:38` | Message | literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:40` | Status | literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:42` | px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-emerald-500 cursor-pointer ${STATUS_BADGE[lead.status \|\| 'new']} | template-literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:46` | Submitted | literal | PLATFORM? |  |
| `crm/LeadDetailModal.tsx:49` | Close | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:54` | mailto:${l.email}?subject=Following up on your quote request&body=Hi ${encodeURIComponent(l.name)},%0A%0A | template-literal | PLATFORM? |  |
| `crm/LeadTable.tsx:56` | Email ${l.name} | template-literal | PLATFORM? |  |
| `crm/LeadTable.tsx:61` | tel:${l.phone} | template-literal | PLATFORM? |  |
| `crm/LeadTable.tsx:63` | Call ${l.name} | template-literal | PLATFORM? |  |
| `crm/LeadTable.tsx:73` | px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-emerald-500 cursor-pointer ${STATUS_BADGE[l.status \|\| 'new'] \|\| 'bg-gray-100 text-gray-600'} | template-literal | PLATFORM? |  |
| `crm/LeadTable.tsx:81` | Restore | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:82` | Delete | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:86` | Add/view notes | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:87` | View | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:88` | Archive lead | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:88` | Archive | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:103` | Add a note about this lead... | placeholder | PLATFORM? |  |
| `crm/LeadTable.tsx:106` | Saved ✓ | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:115` | No leads found. | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:123` | Prev | literal | PLATFORM? |  |
| `crm/LeadTable.tsx:124` | Next | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:51` | Loading dashboard... | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:58` | Complete your setup | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:59` | Finish onboarding to get your site ready for customers. | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:93` | No leads yet | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:94` | Your quote form is live and ready! Leads will appear here as they come in. | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:98` | Leads Per Month | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:112` | Quick Links | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:114` | 📋 View All Leads | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:115` | 📝 Edit Site Content | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:116` | 🔍 Manage SEO | literal | PLATFORM? |  |
| `dashboard/DashboardHome.tsx:117` | 🌐 View Live Site | literal | PLATFORM? |  |
| `dashboard/DashboardPlanCard.tsx:18` | relative bg-white rounded-xl ${borderCls} overflow-hidden flex flex-col | template-literal | PLATFORM? |  |
| `dashboard/DashboardPlanSection.tsx:25` | Your Plan | literal | PLATFORM? |  |
| `dashboard/DashboardSeoWidget.tsx:19` | SEO Rankings | literal | PLATFORM? |  |
| `dashboard/DashboardSeoWidget.tsx:40` | Loading… | literal | PLATFORM? |  |
| `dashboard/DashboardSeoWidget.tsx:47` | Last run failed: ${rankings.error.message \|\| 'error'} | template-literal | PLATFORM? |  |
| `dashboard/DashboardSeoWidget.tsx:62` | Tracked keywords | literal | PLATFORM? |  |
| `dashboard/DashboardSeoWidget.tsx:66` | Best position | literal | PLATFORM? |  |
| `dashboard/DashboardSocialWidget.tsx:17` | Social Engagement | literal | PLATFORM? |  |
| `dashboard/DashboardSocialWidget.tsx:39` | Loading… | literal | PLATFORM? |  |
| `dashboard/DashboardSocialWidget.tsx:45` | No social analytics yet — refreshes weekly. | literal | PLATFORM? |  |
| `dashboard/DashboardSocialWidget.tsx:59` | Engagement | literal | PLATFORM? |  |
| `dashboard/DashboardSocialWidget.tsx:63` | Reach | literal | PLATFORM? |  |
| `dashboard/DashboardSocialWidget.tsx:67` | Last refreshed: ${relativeTime(latestRun.ran_at)} | template-literal | PLATFORM? |  |
| `dashboard/DemoControls.tsx:26` | Load Demo Data | literal | PLATFORM? |  |
| `dashboard/PlanOverviewCard.tsx:21` | Current Plan | literal | PLATFORM? |  |
| `dashboard/PlanOverviewCard.tsx:31` | You&apos;re on our top plan 🎉 | literal | PLATFORM? |  |
| `dashboard/PlanOverviewCard.tsx:34` | Upgrade Options | literal | PLATFORM? |  |
| `dashboard/PlanOverviewCard.tsx:43` | mailto:scott@ironwoodoperations.com?subject=Upgrade to ${info.name} plan | template-literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:6` | bold-local | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:6` | Bold | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:6` | Dark navy backgrounds, emerald accents, Oswald display font | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:6` | from-emerald-600 to-gray-900 | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:7` | clean-friendly | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:7` | Clean | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:7` | White backgrounds, navy accents, professional serif headings | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:7` | from-white to-blue-900 | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:8` | modern-pro | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:8` | Modern | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:8` | Dark backgrounds, teal accents, monospace headings | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:8` | from-gray-800 to-gray-950 | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:9` | rustic-rugged | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:9` | Rustic | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:9` | Warm brown backgrounds, amber accents, serif headings | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:9` | from-amber-600 to-amber-950 | constant-array | PLATFORM? |  |
| `onboarding/StepBranding.tsx:23` | Branding & Design | literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:24` | Choose a look for your website. These settings control colors, fonts, and layout across all pages. | literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:27` | Logo URL | literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:27` | (optional) | literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:33` | Primary Color | literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:40` | Accent Color | literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:48` | Website Template | literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:52` | rounded-xl p-4 border-2 transition text-left ${form.template === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'} | template-literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:54` | h-8 flex-1 rounded-lg bg-gradient-to-r ${t.colors} | template-literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:64` | Back | literal | PLATFORM? |  |
| `onboarding/StepBranding.tsx:65` | Next → | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:16` | Business Information | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:17` | This is how customers will find and contact you. It appears on every page of your website. | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:25` | Phone Number | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:29` | Email Address | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:30` | info@apexpest.com | placeholder | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:34` | Street Address | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:35` | 123 Main St, Tyler, TX 75701 | placeholder | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:38` | Business Hours | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:39` | Mon–Fri 8am–6pm, Sat 9am–3pm | placeholder | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:48` | TPCL-12345 | placeholder | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:52` | Industry | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:54` | This customizes AI captions and social media content for your industry. | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:57` | Back | literal | PLATFORM? |  |
| `onboarding/StepBusinessInfo.tsx:58` | Next → | literal | PLATFORM? |  |
| `onboarding/StepLocations.tsx:18` | Service Locations | literal | PLATFORM? |  |
| `onboarding/StepLocations.tsx:19` | Each city gets its own SEO-optimized landing page. Add up to 6 — you can always add more later. | literal | PLATFORM? |  |
| `onboarding/StepLocations.tsx:23` | City name (e.g. Tyler) | placeholder | PLATFORM? |  |
| `onboarding/StepLocations.tsx:24` | URL slug (e.g. tyler-tx) | placeholder | PLATFORM? |  |
| `onboarding/StepLocations.tsx:24` | ${INPUT_CLASS} max-w-[180px] | template-literal | PLATFORM? |  |
| `onboarding/StepLocations.tsx:36` | Back | literal | PLATFORM? |  |
| `onboarding/StepLocations.tsx:38` | Skip for now | literal | PLATFORM? |  |
| `onboarding/StepLocations.tsx:39` | Next → | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:19` | Review & Launch | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:20` | Everything look good? You can change any of this later from your admin dashboard. | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:25` | Business | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:33` | Edit | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:37` | Social Links | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:41` | None added — you can add them later | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:44` | Edit | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:48` | Branding | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:55` | Edit | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:59` | Locations | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:67` | No locations added — you can add them later | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:70` | Edit | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:76` | Before launching, please confirm the following: | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:122` | Back | literal | PLATFORM? |  |
| `onboarding/StepReview.tsx:126` | font-semibold px-10 py-4 rounded-lg transition text-lg text-white ${allAccepted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 opacity-50 cursor-not-allowed'} | template-literal | PLATFORM? |  |
| `onboarding/StepSocialLinks.tsx:16` | Social Media Links | literal | PLATFORM? |  |
| `onboarding/StepSocialLinks.tsx:17` | Add your social profiles so customers can follow you. All fields are optional — skip any you don't have. | literal | PLATFORM? |  |
| `onboarding/StepSocialLinks.tsx:20` | Facebook Page URL | literal | PLATFORM? |  |
| `onboarding/StepSocialLinks.tsx:24` | Instagram Profile URL | literal | PLATFORM? |  |
| `onboarding/StepSocialLinks.tsx:28` | Google Business Profile URL | literal | PLATFORM? |  |
| `onboarding/StepSocialLinks.tsx:32` | YouTube Channel URL | literal | PLATFORM? |  |
| `onboarding/StepSocialLinks.tsx:36` | Back | literal | PLATFORM? |  |
| `onboarding/StepSocialLinks.tsx:38` | Skip for now | literal | PLATFORM? |  |
| `onboarding/StepSocialLinks.tsx:39` | Next → | literal | PLATFORM? |  |
| `reports/AIAuthorityTile.tsx:24` | flex items-center gap-0.5 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'} | template-literal | PLATFORM? |  |
| `reports/AIAuthorityTile.tsx:56` | Calibrating | literal | PLATFORM? |  |
| `reports/AIAuthorityTile.tsx:68` | Authority score · 8-week trend | literal | PLATFORM? |  |
| `reports/AIAuthorityTile.tsx:96` | Authority tracking coming soon | literal | PLATFORM? |  |
| `reports/AIAuthorityTile.tsx:115` | Loading AI authority data… | literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:34` | Blog Analytics | literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:50` | Blog Analytics | literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:53` | No blog posts found. Create your first post in the Blog tab. | literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:74` | Blog Analytics | literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:78` | Published Posts | literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:84` | Most Recent Post | literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:91` | No posts yet | literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:101` | Missing Excerpts | literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:102` | text-2xl font-bold ${missingExcerpts > 0 ? 'text-amber-700' : 'text-emerald-700'} | template-literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:105` | text-xs mt-0.5 ${missingExcerpts > 0 ? 'text-amber-600' : 'text-emerald-600'} | template-literal | PLATFORM? |  |
| `reports/BlogAnalyticsSection.tsx:106` | ${missingExcerpts} post${missingExcerpts > 1 ? 's' : ''} need an excerpt | template-literal | PLATFORM? |  |
| `reports/BlogAnalyticsTile.tsx:50` | Blog | literal | PLATFORM? |  |
| `reports/BlogAnalyticsTile.tsx:73` | Blog | literal | PLATFORM? |  |
| `reports/BlogAnalyticsTile.tsx:82` | Published | literal | PLATFORM? |  |
| `reports/BlogAnalyticsTile.tsx:83` | Last 30 Days | literal | PLATFORM? |  |
| `reports/BlogAnalyticsTile.tsx:85` | Most Recent | literal | PLATFORM? |  |
| `reports/LeadFunnel.tsx:6` | New | constant-array | PLATFORM? |  |
| `reports/LeadFunnel.tsx:7` | contacted | constant-array | PLATFORM? |  |
| `reports/LeadFunnel.tsx:7` | Contacted | constant-array | PLATFORM? |  |
| `reports/LeadFunnel.tsx:8` | quoted | constant-array | PLATFORM? |  |
| `reports/LeadFunnel.tsx:8` | Quoted | constant-array | PLATFORM? |  |
| `reports/LeadFunnel.tsx:9` | Won | constant-array | PLATFORM? |  |
| `reports/LeadFunnel.tsx:10` | lost | constant-array | PLATFORM? |  |
| `reports/LeadFunnel.tsx:10` | Lost | constant-array | PLATFORM? |  |
| `reports/LeadFunnel.tsx:17` | Lead Funnel | literal | PLATFORM? |  |
| `reports/LeadFunnel.tsx:18` | No leads yet. | literal | PLATFORM? |  |
| `reports/LeadFunnel.tsx:37` | Lead Funnel | literal | PLATFORM? |  |
| `reports/LeadFunnel.tsx:50` | h-full ${step.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2 | template-literal | PLATFORM? |  |
| `reports/LeadFunnel.tsx:63` | Conversion rate (won / won+lost) | literal | PLATFORM? |  |
| `reports/MonthlyReportViewer.tsx:60` | Close | aria/alt | PLATFORM? |  |
| `reports/MonthlyReportViewer.tsx:80` | Monthly SEO Report | literal | PLATFORM? |  |
| `reports/MonthlyReportsCard.tsx:29` | = 0 && idx | literal | PLATFORM? |  |
| `reports/MonthlyReportsCard.tsx:69` | Loading… | literal | PLATFORM? |  |
| `reports/MonthlyReportsCard.tsx:71` | Your first monthly report arrives on the 10th. | literal | PLATFORM? |  |
| `reports/ReportsStatCards.tsx:31` | flex items-center gap-0.5 text-xs font-medium ${s.trend > 0 ? 'text-emerald-600' : 'text-red-500'} | template-literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:22` | in ${diffDays} days | template-literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:34` | Next refresh available ${fmtNextAllowed(rateLimitedUntil)} | template-literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:43` | Refreshes ${fmtNextAllowed(rateLimitedUntil)} | template-literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:70` | Loading… | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:77` | It will retry automatically on the next weekly run. | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:82` | No data yet — runs weekly. | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:183` | Loading… | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:185` | No data yet — runs weekly. | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:190` | Keywords | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:194` | Competitors | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:198` | Opportunities | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:205` | Keyword Rankings | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:207` | Top keywords for ${target} | template-literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:218` | Keyword | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:218` | Position | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:218` | Volume | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:218` | URL | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:236` | Competitor Visibility | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:243` | Domain | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:243` | Avg Position | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:243` | Shared Keywords | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:243` | Visibility | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:261` | Keyword Opportunities | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:273` | Keyword | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:273` | Their Position | literal | PLATFORM? |  |
| `reports/SeoAnalyticsTile.tsx:273` | Volume | literal | PLATFORM? |  |
| `reports/SeoCoverageTile.tsx:38` | SEO Coverage | literal | PLATFORM? |  |
| `reports/SeoCoverageTile.tsx:40` | Loading… | literal | PLATFORM? |  |
| `reports/SeoCoverageTile.tsx:42` | No SEO metadata yet. | literal | PLATFORM? |  |
| `reports/SitePerformanceTile.tsx:53` | Loading PageSpeed data… | literal | PLATFORM? |  |
| `reports/SitePerformanceTile.tsx:56` | No PageSpeed data yet. | literal | PLATFORM? |  |
| `reports/SitePerformanceTile.tsx:57` | Run your first check | literal | PLATFORM? |  |
| `reports/SitePerformanceTile.tsx:65` | Retry | literal | PLATFORM? |  |
| `reports/SitePerformanceTile.tsx:71` | Performance | literal | PLATFORM? |  |
| `reports/SitePerformanceTile.tsx:72` | Accessibility | literal | PLATFORM? |  |
| `reports/SitePerformanceTile.tsx:73` | Best Practices | literal | PLATFORM? |  |
| `reports/SitePerformanceTile.tsx:74` | SEO | literal | PLATFORM? |  |
| `reports/SitePerformanceTile.tsx:84` | Run Now | literal | PLATFORM? |  |
| `reports/SocialAnalyticsTile.tsx:90` | Loading social analytics… | literal | PLATFORM? |  |
| `reports/SocialAnalyticsTile.tsx:97` | Check for updates | literal | PLATFORM? |  |
| `reports/SocialAnalyticsTile.tsx:105` | Retry | literal | PLATFORM? |  |
| `reports/SocialAnalyticsTile.tsx:111` | Platforms | literal | PLATFORM? |  |
| `reports/SocialAnalyticsTile.tsx:112` | Total Followers | literal | PLATFORM? |  |
| `reports/SocialAnalyticsTile.tsx:123` | Followers | literal | PLATFORM? |  |
| `reports/SocialAnalyticsTile.tsx:124` | Engagement | literal | PLATFORM? |  |
| `reports/SocialAnalyticsTile.tsx:125` | Reach | literal | PLATFORM? |  |
| `reports/SocialAnalyticsTile.tsx:130` | Run Now | literal | PLATFORM? |  |
| `reports/SocialPostsTile.tsx:50` | Social Posts | literal | PLATFORM? |  |
| `reports/SocialPostsTile.tsx:52` | Loading… | literal | PLATFORM? |  |
| `reports/SocialPostsTile.tsx:54` | No social posts yet. | literal | PLATFORM? |  |
| `reports/SocialPostsTile.tsx:65` | text-xl font-bold ${s.color} | template-literal | PLATFORM? |  |
| `reports/SocialPostsTile.tsx:74` | Platform | literal | PLATFORM? |  |
| `reports/SocialPostsTile.tsx:75` | Total | literal | PLATFORM? |  |
| `reports/SocialPostsTile.tsx:76` | Published | literal | PLATFORM? |  |
| `reports/SocialPostsTile.tsx:77` | Scheduled | literal | PLATFORM? |  |
| `reports/SocialPostsTile.tsx:78` | Drafts | literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:63` | Social Posts | literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:74` | text-xl font-bold ${s.color} | template-literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:82` | Platform | literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:83` | Total | literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:84` | Published | literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:85` | Scheduled | literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:86` | Drafts | literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:103` | No social posts yet. | literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:109` | SEO Coverage | literal | PLATFORM? |  |
| `reports/SocialSeoReport.tsx:132` | No SEO metadata yet. | literal | PLATFORM? |  |
| `reports/SocialVolumeChart.tsx:65` | No posts scheduled yet | literal | PLATFORM? |  |
| `seo/FixAllModal.tsx:22` | Fix all flagged pages | literal | PLATFORM? |  |
| `seo/FixAllModal.tsx:31` | No generated fixes are ready to apply yet. Generate a fix on a flagged page first. | literal | PLATFORM? |  |
| `seo/FixAllModal.tsx:54` | Apply ${items.length} fix${items.length === 1 ? '' : 'es'} | template-literal | PLATFORM? |  |
| `seo/GSCStatusPanel.tsx:13` | Google Search Console Connected | literal | PLATFORM? |  |
| `seo/GSCStatusPanel.tsx:32` | Google Search Console Not Connected | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:46` | Total Users | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:47` | Sessions | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:48` | Engagement Rate | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:49` | Page Views | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:56` | No data in this run. | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:66` | Traffic by Channel | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:71` | Channel | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:72` | Sessions | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:73` | Users | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:91` | Top Pages (Last 30 Days) | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:96` | Page | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:97` | Views | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:171` | Loading… | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:174` | Google Analytics 4 not connected | literal | PLATFORM? |  |
| `seo/Ga4AnalyticsTile.tsx:175` | Connect your Google account to see traffic, sessions, engagement rate, and top pages. | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:50` | Total Clicks | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:51` | Impressions | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:52` | Avg CTR | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:53` | Avg Position | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:60` | No data in this run. | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:67` | Top Search Queries | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:72` | Query | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:73` | Clicks | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:74` | Impressions | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:75` | Position | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:149` | Loading… | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:152` | Google Search Console not connected | literal | PLATFORM? |  |
| `seo/GscAnalyticsTile.tsx:153` | Connect your Google account to see clicks, impressions, CTR, and your top search queries. | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:67` | ${currentDesc} Keywords: ${missingKeywords.join(', ')}. | template-literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:78` | Failed to sync ${page_slug} | error-message | PLATFORM? |  |
| `seo/SeoAioTab.tsx:79` | Keywords synced to ${page_slug} | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:91` | All pages synced! | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:97` | Loading tracked keywords... | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:105` | No tracked keywords found. | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:106` | Use the AI Keyword Research tab to generate keywords and add them to the tracker first. | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:115` | Bulk Keyword Sync | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:116` | Push tracked keywords into SEO meta fields for each page. | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:124` | Syncing ${state.syncAllProgress}/${state.syncAllTotal}... | template-literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:144` | Page | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:145` | Keywords | literal | PLATFORM? |  |
| `seo/SeoAioTab.tsx:146` | Action | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:46` | Loading PageSpeed data… | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:52` | No PageSpeed data yet. Run your first check to populate real Lighthouse scores. | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:53` | Run first check | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:65` | Retry | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:74` | Performance | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:75` | Accessibility | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:76` | Best Practices | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:77` | SEO | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:85` | Mobile SEO: | literal | PLATFORM? |  |
| `seo/SeoConnectPreviews.tsx:90` | Run Check Now | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:11` | text-xs ${color} | template-literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:23` | ${len} characters — Google shows about 60, so trim ~${len - 60}. | template-literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:26` | ${len} characters — add ~${70 - len}; aim for 70–160. | template-literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:27` | ${len} characters — Google cuts this off; trim ~${len - 160} to fit 160. | template-literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:34` | text-xs mt-1 ${guidance.tone === 'warn' ? 'text-amber-600' : 'text-emerald-600'} | template-literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:64` | What this month's report flagged: | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:74` | mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${FINDING_DOT[f.severity]} | template-literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:91` | Your manual edit was kept. | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:104` | Suggested fix | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:106` | 🔒 Upgrade to Pro to apply this fix with one click. | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:109` | ✓ Applied — live site refreshed. | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:126` | Google preview | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:129` | text-sm leading-snug mt-0.5 line-clamp-2 ${shownDesc ? 'text-gray-600' : 'text-gray-400 italic'} | template-literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:156` | ✓ Generated — review and save | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:160` | Generating… | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:172` | Meta Title | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:175` | The headline Google shows in search results. | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:176` | Page title for Google (50–60 chars) | placeholder | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:181` | Meta Description | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:184` | The summary under your title in Google results. | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:185` | Page description for Google (150–160 chars) | placeholder | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:189` | Focus Keyword | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:196` | OG Title | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:199` | Social share title | placeholder | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:203` | OG Description | literal | PLATFORM? |  |
| `seo/SeoInlineEditor.tsx:206` | Social share description | placeholder | PLATFORM? |  |
| `seo/SeoInsightsTab.tsx:26` | text-xs px-2 py-0.5 rounded-full font-medium ${badgeStyles[status]} | template-literal | PLATFORM? |  |
| `seo/SeoInsightsTab.tsx:54` | Connect Data Sources | literal | PLATFORM? |  |
| `seo/SeoInsightsTab.tsx:55` | Each connection unlocks more insight into how your site is performing. | literal | PLATFORM? |  |
| `seo/SeoInsightsTab.tsx:58` | Google PageSpeed Insights | literal | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:8` | home | constant-array | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:10` | about | constant-array | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:10` | contact | constant-array | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:11` | quote | constant-array | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:11` | reviews | constant-array | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:11` | service-area | constant-array | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:11` | blog | constant-array | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:25` | Enter a focus topic first. | error-message | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:47` | Failed to add keyword: ${error.message} | error-message | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:47` | "${keyword}" added to tracker! | template-literal | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:56` | ✨ AI Keyword Research | literal | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:60` | Page | literal | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:61` | ${inputClass} bg-white | template-literal | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:66` | Focus Topic | literal | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:91` | px-2 py-0.5 rounded-full text-xs font-medium ${intentColor[kw.intent] \|\| 'bg-gray-100 text-gray-600'} | template-literal | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:92` | px-2 py-0.5 rounded-full text-xs font-medium ${diffColor[kw.difficulty] \|\| 'bg-gray-100 text-gray-600'} | template-literal | PLATFORM? |  |
| `seo/SeoKeywordsTab.tsx:93` | px-2 py-0.5 rounded-full text-xs font-medium ${prioColor[kw.priority] \|\| 'bg-gray-100 text-gray-600'} | template-literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:27` | ${barColor} h-1.5 rounded-full transition-all | template-literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:48` | ⚡ PageSpeed | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:50` | Run an audit on the Insights tab | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:54` | text-2xl font-bold ${scoreColor} | template-literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:57` | Performance | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:69` | 🔍 Search Console | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:71` | Loading… | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:73` | Not connected — see Insights tab | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:78` | Clicks | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:82` | Impressions | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:100` | 📈 SEO Analytics | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:102` | Loading… | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:104` | No data yet — see Insights tab | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:109` | Keywords | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:113` | Opportunities | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:130` | Content Coverage | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:134` | Blog Posts | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:135` | Static Pages | literal | PLATFORM? |  |
| `seo/SeoOverviewTab.tsx:141` | Data Overview | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:91` | Show missing → | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:97` | Search pages… | placeholder | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:97` | ${inputCls} flex-1 min-w-40 | template-literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:98` | ${inputCls} bg-white | template-literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:99` | All Types | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:102` | Blog Posts | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:103` | Static Pages | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:105` | ${inputCls} bg-white | template-literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:106` | All Status | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:107` | Live | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:108` | Draft | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:110` | ${inputCls} bg-white | template-literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:111` | All SEO | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:112` | Configured | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:113` | Missing | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:121` | Page | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:122` | URL | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:123` | Type | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:124` | Status | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:125` | SEO | literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:136` | text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_LABELS[page.type]?.color} | template-literal | PLATFORM? |  |
| `seo/SeoPagesTab.tsx:153` | Open issues from your latest monthly report | literal | PLATFORM? |  |
| `seo/SeoStatCards.tsx:15` | bg-white rounded-xl border p-4 flex items-start gap-3 shadow-sm ${colorClass} | template-literal | PLATFORM? |  |
| `seo/SeoStatCards.tsx:31` | Total Pages | literal | PLATFORM? |  |
| `seo/SeoStatCards.tsx:35` | Live Pages | literal | PLATFORM? |  |
| `seo/SeoStatCards.tsx:39` | SEO Configured | literal | PLATFORM? |  |
| `seo/SeoStatCards.tsx:44` | Issues Found | literal | PLATFORM? |  |
| `seo/pageSpeedShared.ts:17` | ${min} min ago | template-literal | PLATFORM? |  |
| `seo/pageSpeedShared.ts:19` | ${hr} hr${hr === 1 ? '' : 's'} ago | template-literal | PLATFORM? |  |
| `seo/pageSpeedShared.ts:21` | ${day} day${day === 1 ? '' : 's'} ago | template-literal | PLATFORM? |  |
| `seo/useSeoAiGenerate.ts:52` | AI generation failed. Please try again. | error-message | PLATFORM? |  |
| `seo/useSeoAudit.ts:6` | lighthouse_score_${tenantId} | template-literal | PLATFORM? |  |
| `seo/useSeoAudit.ts:7` | lighthouse_fetched_at_${tenantId} | template-literal | PLATFORM? |  |
| `seo/useSeoAudit.ts:36` | ?url=${encodeURIComponent(siteUrl)}&strategy=${auditMode}&key=${integrations.google_api_key} | template-literal | PLATFORM? |  |
| `seo/useSeoAudit.ts:50` | a.details?.type === 'opportunity' && a.score | literal | PLATFORM? |  |
| `seo/useSeoAudit.ts:56` | save ${Math.round(a.details.overallSavingsMs)}ms | template-literal | PLATFORM? |  |
| `seo/useSeoAudit.ts:79` | Lighthouse audit complete! | literal | PLATFORM? |  |
| `seo/useSeoAudit.ts:81` | Audit failed — check your Google API key | error-message | PLATFORM? |  |
| `seo/useSeoFixChain.ts:18` | Business: ${business}. City: ${city}. Page: ${pageLabel}. | template-literal | PLATFORM? |  |
| `seo/useSeoFixChain.ts:21` | ${ctx}\nWrite a 2–4 sentence intro paragraph for this page describing the service in a warm, local, professional tone. | template-literal | PLATFORM? |  |
| `seo/useSeoFixChain.ts:23` | ${ctx}\nWrite an SEO meta title of 50–60 characters. Include the city and the main keyword. | template-literal | PLATFORM? |  |
| `seo/useSeoFixChain.ts:25` | ${ctx}\nWrite an SEO meta description of 70–160 characters with a clear call to action. | template-literal | PLATFORM? |  |
| `seo/useSeoFixChain.ts:27` | ${ctx}\nGive a single 2–4 word focus keyword phrase this page should rank for. | template-literal | PLATFORM? |  |
| `seo/useSeoFixChain.ts:43` | Promise | literal | PLATFORM? |  |
| `seo/useSeoFixChain.ts:62` | AI returned an empty fix. Try again. | error-message | PLATFORM? |  |
| `seo/useSeoFixChain.ts:85` | Applying fixes needs the Pro plan. | error-message | PLATFORM? |  |
| `seo/useSeoFixChain.ts:100` | Fix applied and your live site refreshed. | literal | PLATFORM? |  |
| `seo/useSeoFixChain.ts:101` | Your manual edit was kept — regenerate to refresh the suggestion. | literal | PLATFORM? |  |
| `seo/useSeoFixChain.ts:102` | Could not apply the fix. | error-message | PLATFORM? |  |
| `seo/useSeoFixChain.ts:122` | Applied ${applied} fix${applied === 1 ?  | literal | PLATFORM? |  |
| `seo/useSeoFixChain.ts:122` | Applied ${applied} fix${applied === 1 ? '' : 'es'}${conflicts ? | template-literal | PLATFORM? |  |
| `seo/useSeoTab.ts:23` | home | constant-array | PLATFORM? |  |
| `seo/useSeoTab.ts:23` | about | constant-array | PLATFORM? |  |
| `seo/useSeoTab.ts:23` | contact | constant-array | PLATFORM? |  |
| `seo/useSeoTab.ts:23` | quote | constant-array | PLATFORM? |  |
| `seo/useSeoTab.ts:23` | reviews | constant-array | PLATFORM? |  |
| `seo/useSeoTab.ts:23` | service-area | constant-array | PLATFORM? |  |
| `seo/useSeoTab.ts:178` | Failed to save SEO data: ${error.message} | error-message | PLATFORM? |  |
| `seo/useSeoTab.ts:185` | Saved — your live site may take a few minutes to update. | literal | PLATFORM? |  |
| `seo/useSeoTab.ts:187` | SEO data saved! | literal | PLATFORM? |  |
| `seo/useSeoTab.ts:206` | Failed to save: ${error.message} | error-message | PLATFORM? |  |
| `seo/useSeoTab.ts:207` | Saved! | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:66` | Upload failed:  | error-message | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:71` | File uploaded — save to apply. | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:99` | Save failed:  | error-message | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:103` | Save failed — please log out and log back in. | error-message | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:107` | Hero flag save failed:  | error-message | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:112` | pfp_tenant_boot_v2:${window.location.hostname} | template-literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:113` | Hero media saved! | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:121` | Loading... | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:125` | Master Hero Image | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:126` | Set the default hero image shown across your entire site. Individual pages can override this by uploading their own Page Hero Image in the Content tab. | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:132` | px-4 py-2 rounded-lg text-sm font-medium border transition ${mode === m ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-300 hover:border-emer | template-literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:142` | Hero preview | aria/alt | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:151` | Confirm Remove | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:152` | Cancel | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:155` | Remove | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:165` | Recommended: 1920×1080px JPG or WebP | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:176` | px-3 py-1.5 rounded text-xs font-medium border transition ${videoSub === v ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-40 | template-literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:184` | YouTube URL | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:187` | Paste the full YouTube link | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:203` | Confirm Remove | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:204` | Cancel | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:207` | Remove | literal | PLATFORM? |  |
| `settings/BrandingHeroMedia.tsx:217` | MP4 recommended, max ~50MB | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:25` | Upload failed:  | error-message | PLATFORM? |  |
| `settings/BrandingLogo.tsx:29` | ${field ===  | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:29` | ${field === 'logo_url' ? 'Logo' : 'Favicon'} uploaded — save branding to apply. | template-literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:35` | ${field ===  | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:35` | ${field === 'logo_url' ? 'Logo' : 'Favicon'} removed — save branding to apply. | template-literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:42` | Logo | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:45` | Logo | aria/alt | PLATFORM? |  |
| `settings/BrandingLogo.tsx:55` | Confirm | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:56` | Cancel | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:59` | Remove | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:71` | Best: PNG transparent bg, 200×60px | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:76` | Favicon | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:79` | Favicon | aria/alt | PLATFORM? |  |
| `settings/BrandingLogo.tsx:89` | Confirm | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:90` | Cancel | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:93` | Remove | literal | PLATFORM? |  |
| `settings/BrandingLogo.tsx:109` | Best: PNG or ICO, 32×32px | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:66` | Failed to save branding settings: ${error.message} | error-message | PLATFORM? |  |
| `settings/BrandingSection.tsx:68` | pfp_tenant_boot_v2:${window.location.hostname} | template-literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:69` | Branding settings saved! | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:75` | Loading... | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:80` | 🎨 Branding — How to use this | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:82` | This controls how your website looks — your colors, logo, and style. | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:84` | LOGO | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:84` | — Upload your company logo. Best size: 200×60px, PNG with transparent background. | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:85` | PRIMARY COLOR | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:85` | — Your main brand color. Used for buttons and accents. | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:86` | TEMPLATE | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:86` | — Modern Pro \| Bold & Local \| Clean & Friendly \| Rustic & Rugged | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:92` | Branding | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:105` | Primary Color | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:109` | flex-1 ${inputClass} | template-literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:113` | Accent Color | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:117` | flex-1 ${inputClass} | template-literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:123` | Theme | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:127` | text-left p-4 rounded-xl border-2 transition ${form.theme === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'} | template-literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:135` | Pro | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:136` | Active | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:146` | Color Palette | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:158` | Pick a preset or use the color pickers below for custom colors. | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:162` | CTA Button Text | literal | PLATFORM? |  |
| `settings/BrandingSection.tsx:164` | Get a Free Quote | placeholder | PLATFORM? |  |
| `settings/BrandingSection.tsx:165` | The primary call-to-action button on your site | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:18` | Monday | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:18` | Tuesday | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:18` | Wednesday | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:18` | Thursday | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:18` | Friday | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:18` | Saturday | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:18` | Sunday | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:19` | America/New_York | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:19` | America/Chicago | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:19` | America/Denver | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:19` | America/Los_Angeles | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:19` | America/Phoenix | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:19` | America/Anchorage | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:19` | Pacific/Honolulu | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:19` | America/Toronto | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:19` | America/Vancouver | constant-array | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:21` | void; errors: Record | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:28` | hours_structured.${i} | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:32` | Closed | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:33` | hours_structured.${i} | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:33` | hs${i}e | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:34` | hs${i}e | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:35` | hs${i}e | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:100` | [data-field="${first}"] | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:112` | Failed to save: ${error.message} | error-message | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:113` | Business info saved! | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:117` | Loading... | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:142` | Business Information | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:147` | ${f.key as string}-err | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:148` | ${f.key as string}-err | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:154` | Structured Address & Location | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:159` | ${f.key}-err | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:160` | ${f.key}-err | template-literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:164` | Latitude | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:169` | Longitude | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:174` | Geocode Source | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:175` | — select — | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:175` | Manual | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:175` | Google Places | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:179` | Coming soon — todo: seo-option-c-upgrade | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:179` | Geocode from address | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:182` | Timezone | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:184` | — select — | literal | PLATFORM? |  |
| `settings/BusinessInfoSection.tsx:192` | Business Hours | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:28` | Failed to save domain settings: ${error.message} | error-message | PLATFORM? |  |
| `settings/DomainSection.tsx:28` | Domain settings saved! | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:31` | Loading... | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:36` | Custom Domain | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:37` | Connect your own domain to your PestFlow Pro website. | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:40` | Custom Domain | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:41` | acmepestcontrol.com | placeholder | PLATFORM? |  |
| `settings/DomainSection.tsx:42` | Your purchased domain (without www or https://) | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:45` | Subdomain | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:47` | acme | placeholder | PLATFORM? |  |
| `settings/DomainSection.tsx:48` | .pestflowpro.ai | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:50` | Free subdomain (used until custom domain is active) | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:56` | Domain registered: | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:65` | Need Help? | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:66` | ✉ Email: | literal | PLATFORM? |  |
| `settings/DomainSection.tsx:66` | scott@homeflowpro.ai | literal | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:54` | Failed to save customization: ${error.message} | error-message | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:55` | ✅ Customization saved | literal | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:65` | Years in Business | constant-array | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:67` | Certifications | constant-array | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:72` | Hero Customization | literal | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:73` | Controls the headline and trust badges shown on your homepage hero. | literal | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:76` | Hero Headline | literal | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:85` | The main headline visitors see on your homepage | literal | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:88` | Show in Hero | literal | PLATFORM? |  |
| `settings/HeroCustomizationSection.tsx:102` | Badge only appears if the corresponding value is set in Business Info | literal | PLATFORM? |  |
| `settings/HeroMediaSection.tsx:7` | 🖼 Master Hero Image | literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:30` | Failed to save: ${error.message} | error-message | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:31` | Holiday mode updated! | literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:43` | Loading... | literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:47` | Holiday Mode | literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:51` | Enable Holiday Banner | literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:52` | Shows a yellow banner on all public pages | literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:54` | relative w-11 h-6 rounded-full transition-colors ${form.enabled ? 'bg-emerald-500' : 'bg-gray-200'} | template-literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:55` | absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? 'left-[22px]' : 'left-0.5'} | template-literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:59` | Holiday Name | literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:60` | ${inputClass} bg-white | template-literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:61` | Select holiday... | literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:66` | Custom Message | literal | PLATFORM? |  |
| `settings/HolidayModeSection.tsx:67` | We may have modified hours. Call to confirm. | placeholder | PLATFORM? |  |
| `settings/NotificationsSection.tsx:28` | Failed to save notification settings: ${error.message} | error-message | PLATFORM? |  |
| `settings/NotificationsSection.tsx:28` | Notification settings saved! | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:31` | Loading... | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:36` | 🔔 Notifications — How to use this | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:38` | This controls where you get notified when something happens on your site. | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:40` | LEAD EMAIL | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:40` | — Where new quote requests get emailed. Use the inbox you check most. | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:41` | CC EMAIL | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:41` | — Optional second email to copy (like an office manager) | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:42` | SMS LEAD NOTIFICATIONS | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:42` | — Your mobile number to get a text the instant a new lead comes in | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:43` | MONTHLY REPORT EMAIL | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:43` | — Where your monthly summary report gets sent | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:45` | 💡 Set your lead email to a phone-connected inbox so you get a notification the moment a lead comes in. | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:49` | Notifications | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:52` | Lead Notification Email | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:53` | leads@yourbusiness.com | placeholder | PLATFORM? |  |
| `settings/NotificationsSection.tsx:56` | CC Email (optional) | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:57` | manager@yourbusiness.com | placeholder | PLATFORM? |  |
| `settings/NotificationsSection.tsx:60` | SMS Lead Notifications | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:65` | Monthly Report Email (optional) | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:66` | owner@yourbusiness.com | placeholder | PLATFORM? |  |
| `settings/NotificationsSection.tsx:70` | Notify on new lead | literal | PLATFORM? |  |
| `settings/NotificationsSection.tsx:74` | Weekly SEO digest email | literal | PLATFORM? |  |
| `settings/SettingsTab.tsx:17` | Business Info | constant-array | PLATFORM? |  |
| `settings/SettingsTab.tsx:17` | Branding | constant-array | PLATFORM? |  |
| `settings/SettingsTab.tsx:17` | Social Links | constant-array | PLATFORM? |  |
| `settings/SettingsTab.tsx:17` | Notifications | constant-array | PLATFORM? |  |
| `settings/SettingsTab.tsx:17` | Master Hero Image | constant-array | PLATFORM? |  |
| `settings/SettingsTab.tsx:17` | Holiday Mode | constant-array | PLATFORM? |  |
| `settings/SettingsTab.tsx:39` | ⚙️ Settings | literal | PLATFORM? |  |
| `settings/SocialLinksSection.tsx:36` | Failed to save: ${error.message} | error-message | PLATFORM? |  |
| `settings/SocialLinksSection.tsx:37` | Saved! | literal | PLATFORM? |  |
| `settings/SocialLinksSection.tsx:43` | Loading... | literal | PLATFORM? |  |
| `settings/SocialLinksSection.tsx:47` | Owner Cell / SMS Number | literal | PLATFORM? |  |
| `settings/SocialLinksSection.tsx:50` | Owner Cell / SMS Number | literal | PLATFORM? |  |
| `settings/SocialLinksSection.tsx:58` | Used for internal notifications only — not shown on your website. | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:37` | Failed to load team: ${error.message} | error-message | PLATFORM? |  |
| `settings/UsersSection.tsx:64` | A fresh invitation link was sent. | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:70` | 👥 Team — How to use this | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:72` | Invite the people who help run your site and choose what they can do. | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:74` | ADMIN | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:74` | — Full access, including this Users tab, Settings, and billing. | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:75` | MANAGER | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:75` | — Can edit website content (blog, SEO, social, team), but not Settings or billing. | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:76` | USER | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:76` | — View-only access to the dashboard. | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:78` | 💡 Seats are unlimited — invite as many teammates as you need. | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:84` | Invite a teammate | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:87` | Email | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:89` | teammate@yourbusiness.com | placeholder | PLATFORM? |  |
| `settings/UsersSection.tsx:92` | Role | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:94` | User | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:95` | Manager | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:96` | Admin | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:104` | Seats: | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:104` | Unlimited | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:109` | Team members | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:111` | Loading… | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:113` | No team members yet. Invite someone above. | literal | PLATFORM? |  |
| `settings/UsersSection.tsx:120` | text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_BADGE[m.role] \|\| ROLE_BADGE.user} | template-literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:12` | text-3xl font-bold ${color} | template-literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:37` | Total Posts | literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:38` | Published | literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:39` | Scheduled | literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:40` | Drafts | literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:47` | Facebook Posts | literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:51` | Instagram Posts | literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:57` | Engagement Analytics | literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:61` | Connect a social account to unlock engagement analytics | literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:62` | Real-time likes, comments, reach, and click data will appear here once you connect your social accounts. | literal | PLATFORM? |  |
| `social/AnalyticsTab.tsx:78` | Recent Activity | literal | PLATFORM? |  |
| `social/CampaignJobsPanel.tsx:49` | campaign_jobs:${tenantId} | template-literal | PLATFORM? |  |
| `social/CampaignJobsPanel.tsx:52` | tenant_id=eq.${tenantId} | template-literal | PLATFORM? |  |
| `social/CampaignJobsPanel.tsx:75` | Generation activity | literal | PLATFORM? |  |
| `social/CampaignJobsPanel.tsx:85` | ${job.posts_created} posts · ${job.posts_with_images} with images | template-literal | PLATFORM? |  |
| `social/CampaignJobsPanel.tsx:86` | ${job.posts_requested} posts requested | template-literal | PLATFORM? |  |
| `social/CampaignJobsPanel.tsx:90` | shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${s.cls} | template-literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:28` | Campaigns | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:41` | No campaigns yet | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:42` | Create your first campaign to organize your social media content. | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:53` | Title | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:54` | Goal | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:55` | Duration | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:56` | Platforms | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:57` | Status | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:58` | Posts | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:67` | font-medium text-left ${selectedCampaignId === c.id ? 'text-emerald-600 underline' : 'text-gray-800 hover:text-emerald-600'} | template-literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:81` | text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[c.status] \|\| 'bg-gray-100 text-gray-600'} | template-literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:88` | View Posts | literal | PLATFORM? |  |
| `social/CampaignsTab.tsx:102` | &times; Clear filter | literal | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:35` | Generate ${postsPerGeneration} Captions | template-literal | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:42` | AI Caption Generator | literal | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:45` | flex-1 ${inputClass} | template-literal | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:49` | Asking AI... | literal | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:61` | AI generation limit reached for today (${aiDailyCount}/${aiDailyLimit}). You can still write posts manually. | template-literal | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:70` | Use This Caption → | literal | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:81` | Write your caption here or pick one from AI above... | placeholder | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:81` | ${inputClass} resize-none mb-2 | template-literal | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:83` | text-xs ${charsRemaining < 0 ? 'text-red-500 font-medium' : 'text-gray-400'} | template-literal | PLATFORM? |  |
| `social/ComposerCaptionEditor.tsx:91` | Add ${emoji} | template-literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:72` | Photo or Video | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:73` | Upload a photo or video from your phone, gallery, or drive — use | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:73` | Upload Photo or Video | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:73` | for video. The Library holds photos only. | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:74` | You can post one video | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:74` | or | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:74` | photos — not both. Adding a video replaces a selected photo. | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:100` | text-xs mb-3 ${uploadNotice.type === 'error' ? 'text-red-600' : 'text-amber-600'} | template-literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:103` | Upload failed — please try again or paste an image URL below. | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:110` | Or paste image URL | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:119` | Preview | aria/alt | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:123` | Uploading… | literal | PLATFORM? |  |
| `social/ComposerImagePicker.tsx:130` | Clear image | aria/alt | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:2` | facebook | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:2` | Facebook | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:3` | instagram | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:3` | Instagram | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:4` | linkedin | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:4` | LinkedIn | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:5` | Google Business | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:6` | youtube | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:6` | YouTube | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:7` | tiktok | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:7` | TikTok | constant-array | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:24` | Platform | literal | PLATFORM? |  |
| `social/ComposerPlatformSelector.tsx:33` | Connect ${label} in the Connections tab | template-literal | PLATFORM? |  |
| `social/ComposerScheduler.tsx:38` | Schedule & Publish | literal | PLATFORM? |  |
| `social/ComposerScheduler.tsx:47` | Post scheduling is available on the Growth plan and above. | literal | PLATFORM? |  |
| `social/ComposerScheduler.tsx:86` | AI will pick the best day and time based on your industry. | literal | PLATFORM? |  |
| `social/ComposerScheduler.tsx:106` | flex-1 ${inputClass} | template-literal | PLATFORM? |  |
| `social/ComposerScheduler.tsx:107` | Try Again | literal | PLATFORM? |  |
| `social/ComposerTemplates.tsx:22` | why ${CURRENT_MONTH} is the best time for an HVAC tune-up | template-literal | PLATFORM? |  |
| `social/ComposerTemplates.tsx:33` | plumbing tips every homeowner should know in ${CURRENT_MONTH} | template-literal | PLATFORM? |  |
| `social/ComposerTemplates.tsx:44` | roof maintenance tips every homeowner needs in ${CURRENT_MONTH} | template-literal | PLATFORM? |  |
| `social/ComposerTemplates.tsx:55` | seasonal home maintenance tips every homeowner needs in ${CURRENT_MONTH} | template-literal | PLATFORM? |  |
| `social/ComposerTemplates.tsx:94` | Use → | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:28` | facebook | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:28` | Facebook | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:29` | instagram | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:29` | Instagram | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:30` | youtube | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:30` | YouTube | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:31` | googlebusiness | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:31` | Google Business | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:32` | linkedin | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:32` | LinkedIn | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:33` | tiktok | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:33` | TikTok | constant-array | PLATFORM? |  |
| `social/ConnectionsModal.tsx:60` | ${supabaseUrl}/functions/v1/zernio-connect | template-literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:72` | Could not reach social connection service. | error-message | PLATFORM? |  |
| `social/ConnectionsModal.tsx:86` | ${supabaseUrl}/functions/v1/zernio-connect | template-literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:93` | Could not get authorization URL for ${label}. | template-literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:100` | Failed to start ${label} connection. | error-message | PLATFORM? |  |
| `social/ConnectionsModal.tsx:109` | Connection status refreshed. | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:121` | Social Connections | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:124` | Upgrade to Growth to connect your social accounts and enable automated posting. | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:125` | Requires Growth — $249/mo | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:127` | Upgrade Plan → | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:128` | Upgrade Plan → | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:133` | Social connections are available on the Growth plan. Contact us to enable this feature. | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:134` | Contact us → | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:137` | Close | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:147` | Social Connections | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:148` | &times; | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:160` | Loading connections… | literal | PLATFORM? |  |
| `social/ConnectionsModal.tsx:244` | ${state.accounts.length} platform${state.accounts.length !== 1 ? 's' : ''} connected | template-literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:66` | ${draftIds.length} posts approved! | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:91` | Post restored. | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:109` | Post updated! | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:115` | No drafts to schedule. | error-message | PLATFORM? |  |
| `social/ContentQueueTab.tsx:120` | You are a social media scheduling expert. Suggest optimal posting times for ${drafts.length} posts for a home services company. Spread them over the next 7 days. Today is ${new Dat | template-literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:132` | Smart schedule applied! | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:135` | Smart scheduling failed. | error-message | PLATFORM? |  |
| `social/ContentQueueTab.tsx:144` | All Platforms | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:145` | Facebook | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:146` | Instagram | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:147` | LinkedIn | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:148` | Google Business | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:149` | YouTube | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:150` | TikTok | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:151` | FB + IG (legacy) | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:154` | All Status | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:155` | Draft | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:156` | Approved | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:157` | Scheduled | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:158` | Published | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:159` | Failed | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:162` | All Campaigns | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:173` | Approve All (${draftCount}) | template-literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:208` | Archived Posts | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:214` | No archived posts. | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:224` | Restore | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:225` | Delete Permanently | literal | PLATFORM? |  |
| `social/ContentQueueTab.tsx:242` | "${undoTarget.caption}…" archived. | template-literal | PLATFORM? |  |
| `social/EditPostModal.tsx:7` | Promise | literal | PLATFORM? |  |
| `social/EditPostModal.tsx:55` | Edit Post | literal | PLATFORM? |  |
| `social/EditPostModal.tsx:75` | Caption | literal | PLATFORM? |  |
| `social/EditPostModal.tsx:82` | Schedule | literal | PLATFORM? |  |
| `social/EditPostModal.tsx:100` | Status | literal | PLATFORM? |  |
| `social/EditPostModal.tsx:103` | Draft | literal | PLATFORM? |  |
| `social/EditPostModal.tsx:104` | Approved | literal | PLATFORM? |  |
| `social/EditPostModal.tsx:105` | Scheduled | literal | PLATFORM? |  |
| `social/ImageLibraryPicker.tsx:53` | Choose from Library | literal | PLATFORM? |  |
| `social/ImageLibraryPicker.tsx:54` | Close | aria/alt | PLATFORM? |  |
| `social/ImageLibraryPicker.tsx:65` | All folders | literal | PLATFORM? |  |
| `social/ImageLibraryPicker.tsx:66` | Unfiled | literal | PLATFORM? |  |
| `social/ImageLibraryPicker.tsx:74` | Search by filename | placeholder | PLATFORM? |  |
| `social/ImageLibraryPicker.tsx:90` | No images yet. Upload photos in the Media tab. | literal | PLATFORM? |  |
| `social/ImageLibraryPicker.tsx:94` | No matches. | literal | PLATFORM? |  |
| `social/ImageStrategyChooser.tsx:52` | Image attachment | literal | PLATFORM? |  |
| `social/ImageStrategyChooser.tsx:58` | border rounded-lg p-3 ${checked ? 'border-emerald-500 bg-emerald-50/40' : 'border-gray-200'} ${disabled ? 'opacity-50' : ''} | template-literal | PLATFORM? |  |
| `social/ImageStrategyChooser.tsx:59` | flex items-start gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} | template-literal | PLATFORM? |  |
| `social/ImageStrategyChooser.tsx:80` | Select a folder… | literal | PLATFORM? |  |
| `social/ImageStrategyChooser.tsx:84` | No folders yet — organize images into folders in the Media tab. | literal | PLATFORM? |  |
| `social/LegacyComposer.tsx:34` | Loading composer... | literal | PLATFORM? |  |
| `social/LegacyComposer.tsx:44` | New Post | literal | PLATFORM? |  |
| `social/LegacyComposer.tsx:45` | &times; | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:10` | facebook | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:10` | Facebook | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:11` | instagram | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:11` | Instagram | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:12` | linkedin | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:12` | LinkedIn | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:13` | Google Business | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:14` | youtube | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:14` | YouTube | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:15` | tiktok | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:15` | TikTok | constant-array | PLATFORM? |  |
| `social/NewCampaignModal.tsx:74` | Campaign title is required. | error-message | PLATFORM? |  |
| `social/NewCampaignModal.tsx:75` | Campaign topic is required. | error-message | PLATFORM? |  |
| `social/NewCampaignModal.tsx:76` | Select at least one platform. | error-message | PLATFORM? |  |
| `social/NewCampaignModal.tsx:78` | Pick a folder for the folder image strategy. | error-message | PLATFORM? |  |
| `social/NewCampaignModal.tsx:81` | Choose an image for the fixed image strategy. | error-message | PLATFORM? |  |
| `social/NewCampaignModal.tsx:116` | Campaign queued — generating ${selectedDuration.posts} posts. Track progress in the Campaigns tab. | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:128` | Starting generation… | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:129` | Queuing your campaign. Posts will appear as drafts when ready. | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:139` | New AI Campaign | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:150` | Campaign Title * | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:155` | Campaign Topic * | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:160` | Tone | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:162` | ${inputCls} bg-white | template-literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:163` | Casual | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:164` | Professional | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:165` | Urgent | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:166` | Friendly | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:167` | Educational | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:171` | Duration | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:173` | ${inputCls} bg-white | template-literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:184` | Platforms * | literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:191` | Connect ${label} in the Connections tab | template-literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:192` | flex items-center gap-1.5 text-sm cursor-pointer ${enabled ? 'text-gray-700' : 'text-gray-300 cursor-not-allowed'} | template-literal | PLATFORM? |  |
| `social/NewCampaignModal.tsx:208` | Start Date (optional) | literal | PLATFORM? |  |
| `social/PostCard.tsx:42` | text-xs px-2 py-0.5 rounded-full font-medium ${pf.bg} | template-literal | PLATFORM? |  |
| `social/PostCard.tsx:43` | text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ss} | template-literal | PLATFORM? |  |
| `social/PostCard.tsx:75` | Preview | literal | PLATFORM? |  |
| `social/PostCard.tsx:78` | Approve | literal | PLATFORM? |  |
| `social/PostCard.tsx:81` | Edit | literal | PLATFORM? |  |
| `social/PostCard.tsx:83` | &times; | literal | PLATFORM? |  |
| `social/PostPreviewModal.tsx:29` | &times; | literal | PLATFORM? |  |
| `social/PostPreviewModal.tsx:57` | YB | literal | PLATFORM? |  |
| `social/PostPreviewModal.tsx:60` | Just now · 🌐 | literal | PLATFORM? |  |
| `social/PostPreviewModal.tsx:72` | 👍 Like | literal | PLATFORM? |  |
| `social/PostPreviewModal.tsx:73` | 💬 Comment | literal | PLATFORM? |  |
| `social/PostPreviewModal.tsx:74` | ↗ Share | literal | PLATFORM? |  |
| `social/PostPreviewModal.tsx:84` | YB | literal | PLATFORM? |  |
| `social/PostPreviewModal.tsx:103` | Be the first to like this | literal | PLATFORM? |  |
| `social/SocialAnalyticsTab.tsx:58` | 📊 Social Analytics | literal | PLATFORM? |  |
| `social/SocialAnalyticsTab.tsx:72` | 📊 Social Analytics | literal | PLATFORM? |  |
| `social/SocialAnalyticsTab.tsx:83` | text-3xl font-bold ${s.color} | template-literal | PLATFORM? |  |
| `social/SocialAnalyticsTab.tsx:91` | Platform Breakdown | literal | PLATFORM? |  |
| `social/SocialAnalyticsTab.tsx:93` | No published posts yet. | literal | PLATFORM? |  |
| `social/SocialAnalyticsTab.tsx:115` | Best Performing Posts | literal | PLATFORM? |  |
| `social/SocialAnalyticsTab.tsx:116` | Connect Facebook to see reach &amp; engagement data | literal | PLATFORM? |  |
| `social/SocialAnalyticsTab.tsx:118` | No published posts yet. | literal | PLATFORM? |  |
| `social/SocialAnalyticsTab.tsx:123` | text-xs px-1.5 py-0.5 rounded capitalize font-medium flex-shrink-0 ${platformBadgeClass(p.platform)} | template-literal | PLATFORM? |  |
| `social/ZernioOnboardingBanner.tsx:6` | Facebook | constant-array | PLATFORM? |  |
| `social/ZernioOnboardingBanner.tsx:7` | Instagram | constant-array | PLATFORM? |  |
| `social/ZernioOnboardingBanner.tsx:8` | YouTube | constant-array | PLATFORM? |  |
| `social/ZernioOnboardingBanner.tsx:9` | Google Business | constant-array | PLATFORM? |  |
| `social/ZernioOnboardingBanner.tsx:10` | LinkedIn | constant-array | PLATFORM? |  |
| `social/ZernioOnboardingBanner.tsx:16` | Connect Your Social Media Accounts | literal | PLATFORM? |  |
| `social/ZernioOnboardingBanner.tsx:23` | How it works | literal | PLATFORM? |  |
| `social/useComposer.ts:33` | webm | constant-array | PLATFORM? |  |
| `social/useComposer.ts:35` | jpeg | constant-array | PLATFORM? |  |
| `social/useComposer.ts:35` | webp | constant-array | PLATFORM? |  |
| `social/useComposer.ts:150` | ${tenantId}/social/${filename} | template-literal | PLATFORM? |  |
| `social/useComposer.ts:175` | You are a social media expert for a ${industry.toLowerCase()} company called ${businessName} in East Texas. Generate exactly ${count} different Facebook/Instagram captions for a po | template-literal | PLATFORM? |  |
| `social/useComposer.ts:200` | You are a social media scheduling expert. A ${industry.toLowerCase()} business wants to post on ${form.platform}. Recommend the single best day and time to post this week. Today is | template-literal | PLATFORM? |  |
| `social/usePublishPost.ts:47` | Post saved! Copy this post and paste it to your Facebook page. | literal | PLATFORM? |  |
| `social/usePublishPost.ts:76` | ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/post-to-social | template-literal | PLATFORM? |  |
| `social/usePublishPost.ts:79` | Bearer ${token} | template-literal | PLATFORM? |  |
| `social/usePublishPost.ts:97` | Failed to reach posting service. Please try again. | error-message | PLATFORM? |  |
| `social/useSocialData.ts:48` | (p: PromiseLike | literal | PLATFORM? |  |
| `social/useSocialData.ts:48` | , label: string, ms = 8000): Promise | literal | PLATFORM? |  |
| `social/useSocialData.ts:52` | ${label} timed out after ${ms}ms | template-literal | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:7` | Payment received — Stripe confirmed | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:8` | DNS pointed to Vercel | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:9` | Logo uploaded and applied | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:10` | Colors / theme confirmed in admin Settings | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:11` | Business info reviewed and saved | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:12` | Integrations filled in (admin Integrations tab) | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:13` | Social links confirmed | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:14` | Test lead submitted from public site | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:15` | SMS notification tested | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:16` | Login credentials sent to client | constant-array | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:41` | onboarding_checklist_${tenantId}_${i} | template-literal | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:51` | onboarding_checklist_${tenantId}_${i} | template-literal | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:75` | Onboarding Checklist | literal | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:86` | Setup Tasks | literal | PLATFORM? |  |
| `tabs/OnboardingTab.tsx:98` | text-sm ${checked[i] ? 'line-through text-gray-400' : 'text-gray-700'} | template-literal | PLATFORM? |  |
| `team/TeamMemberCard.tsx:47` | Edit | literal | PLATFORM? |  |
| `team/TeamMemberCard.tsx:54` | Delete | literal | PLATFORM? |  |
| `team/TeamMemberModal.tsx:88` | Name * | literal | PLATFORM? |  |
| `team/TeamMemberModal.tsx:91` | e.g. Marcus Webb | placeholder | PLATFORM? |  |
| `team/TeamMemberModal.tsx:94` | Title | literal | PLATFORM? |  |
| `team/TeamMemberModal.tsx:100` | Bio | literal | PLATFORM? |  |
| `team/TeamMemberModal.tsx:103` | Short bio shown on your website… | placeholder | PLATFORM? |  |
| `team/TeamMemberModal.tsx:106` | Photo URL | literal | PLATFORM? |  |
| `team/TeamMemberModal.tsx:112` | Display Order | literal | PLATFORM? |  |
| `team/TeamTab.tsx:74` | Team | literal | PLATFORM? |  |
| `team/TeamTab.tsx:79` | Team Members | literal | PLATFORM? |  |
| `team/TeamTab.tsx:98` | No team members yet | literal | PLATFORM? |  |
| `team/TeamTab.tsx:99` | Add your team to build trust with potential customers. | literal | PLATFORM? |  |
| `useAiCaptionQuota.ts:11` | pfp_ai_caption_date_${tenantId} | template-literal | PLATFORM? |  |
| `useAiCaptionQuota.ts:12` | pfp_ai_caption_count_${tenantId} | template-literal | PLATFORM? |  |
| `useAiCaptionQuota.ts:27` | pfp_ai_caption_date_${tenantId} | template-literal | PLATFORM? |  |
| `useAiCaptionQuota.ts:28` | pfp_ai_caption_count_${tenantId} | template-literal | PLATFORM? |  |

---
## 3. Exported constant arrays of user-visible strings

The highest-value finds: one edit each, and every consumer moves together.

### 3a. The four hardcoded pest slug lists

**There are four separate copies of the pest service-slug list.** No shared constant;
each was written out by hand. Changing the trade means editing all four.

| Constant | file:line | Entries | Consumed by |
|---|---|---:|---|
| `STANDARD_SLUGS` | `ContentTab.tsx:13` | 16 (14 pest) | `ContentTab` page picker |
| `PEST_SLUGS` | `ContentTab.tsx:28` | 12 | `ContentTab` — gates the AI-copy button |
| `PEST_SLUGS` | `seo/useSeoTab.ts:18` | 12 | `useSeoTab` → `SeoPagesTab`, `SeoOverviewTab` |
| `PAGE_SLUGS` | `seo/SeoKeywordsTab.tsx:7` | 20 (12 pest) | `SeoKeywordsTab` page `<select>` |

`seo/useSeoTab.ts:23` `STATIC_SLUGS` and `ContentTab.tsx:13` also encode the public
route set, so a vertical with different service pages breaks both the Content picker
and the SEO page list, not just the wording.

### 3b. Every other user-visible constant array

| Constant | file:line | Class | Consumed by |
|---|---|---|---|
| `FAQ_CATEGORIES` | `FaqItemForm.tsx:3` | **VERTICAL** | `FaqItemForm` select; `FaqTab.tsx:85,92` grouping — **exported** |
| `INDUSTRY_TEMPLATES` | `social/ComposerTemplates.tsx:9` | **VERTICAL** (keyed) | `ComposerTemplates` — see 3c |
| `STEP_LABELS` | `client-setup/ClientSetupWizard.tsx:12` | PLATFORM | wizard stepper |
| `THEMES` | `client-setup/components/ShellSelector.tsx:7` | PLATFORM | shell picker |
| `REGISTRARS` | `client-setup/steps/Step3Domain.tsx:5` | PLATFORM | domain step |
| `DAYS` / `TIMEZONES` | `Step1BusinessInfo.tsx:5,6`, `settings/BusinessInfoSection.tsx:18,19` | PLATFORM | hours + tz pickers (duplicated) |
| `ALL_PLATFORMS` / `PLATFORMS` | `social/ComposerPlatformSelector.tsx:1`, `social/ConnectionsModal.tsx:27`, `social/ZernioOnboardingBanner.tsx:5`, `social/NewCampaignModal.tsx:9` | PLATFORM | social network pickers (4 copies) |
| `PRO_DURATIONS` / `ELITE_DURATIONS` | `social/NewCampaignModal.tsx:27,31` | PLATFORM | campaign length |
| `TIERS` | `TierToggle.tsx:3`, `UpgradeCards.tsx:9` | PLATFORM | plan tiers (2 copies) |
| `BASE_TABS` | `settings/SettingsTab.tsx:17` | PLATFORM | settings sub-tabs |
| `ITEMS` | `tabs/OnboardingTab.tsx:6` | PLATFORM | go-live checklist |
| `FUNNEL_STEPS` | `reports/LeadFunnel.tsx:5` | PLATFORM | lead funnel stages |
| `SOURCES` | `TestimonialModal.tsx:17` | PLATFORM | review source picker |
| `TEMPLATES` | `onboarding/StepBranding.tsx:5` | PLATFORM | shell picker (onboarding copy) |
| `IMAGE_COL` | `ContentPageForm.tsx:15` | PLATFORM | DB column names, not visible |
| `ACCEPTED_*` | `social/useComposer.ts:32-35` | PLATFORM | upload MIME allowlists |

### 3c. `INDUSTRY_TEMPLATES` — the admin already has a vertical registry

`social/ComposerTemplates.tsx:9` is a `Record<string, PostTemplate[]>` keyed by
industry: **`pest control`, `hvac`, `plumbing`, `roofing`, `generic`** — nine templates
each. Resolution at `:75-76`:

```ts
const key = industry.toLowerCase().trim()
const templates = INDUSTRY_TEMPLATES[key] || INDUSTRY_TEMPLATES['generic']
```

`industry` comes from `settings.business_info.industry` (`social/useComposer.ts:78`),
defaulting to `'Pest Control'` at `:60` when the key is absent.

**This is a working precedent for the Phase 3 admin preset** — an existing, independent,
admin-only registry with a safe fallback, matching CLAUDE.md rule 9 (social features are
vertical-agnostic; industry comes from the DB). An irrigation tenant gets `generic`,
which is correct-by-fallback rather than correct-by-design: there is no `irrigation` key.

---

## 4. Where the admin SEEDS content into the database

The brief asked whether a list like Dang's 10 pest-worded `ai_authority_prompts` rows
could originate here. **It cannot — and I checked rather than assumed:** `ai_authority_prompts`
has zero references anywhere in `src/`. Its only writer is
`supabase/functions/ai-authority-worker/index.ts`, an edge function outside this scope.

**But the SPA has four other seeding paths, and all four are pest- and region-locked.**
These generate content from a hardcoded prompt and write the result to tenant tables:

| # | Path | Prompt hardcodes | Writes to |
|---|---|---|---|
| 1 | `ContentTab.tsx:132` → `:173` | *"a pest control company based in ${city}, TX serving **East Texas**"*, plus **"Mention specific cities: ${city}, Longview, Jacksonville"** and *"${pest} infestation in East Texas homes"* | `page_content` upsert |
| 2 | `ContentTab.tsx:134` → `:173` | *"a pest control company in ${city}, TX (East Texas)"* | `page_content` upsert |
| 3 | `seo/SeoKeywordsTab.tsx:33` → `:46` | *"an SEO expert for a **pest control** company in **East Texas** … serving **Tyler TX**"*, with the example keyword `"spider control tyler tx"` | `keyword_tracker` insert |
| 4 | `src/lib/ai/generateBlogDraft.ts:34` | *"a content writer for a local **pest control** business"* | `blog_posts` insert via `BlogPostEditor.tsx:113` |

Two more write pest wording without an AI call:

| # | Path | Hardcodes | Writes to |
|---|---|---|---|
| 5 | `LocationsTab.tsx:76` → `:87`/`:81` | `hero_title` defaults to `` `${form.city} Pest Control` `` when the field is left blank | `service_areas` insert/update |
| 6 | `seo/SeoAioTab.tsx:68` → `:70` | fallback description `` `${keywords} — professional pest control in East Texas.` `` | `seo_meta` upsert |

And one hardcodes the industry itself:

| # | Path | Hardcodes | Writes to |
|---|---|---|---|
| 7 | `client-setup/ClientSetupPayment.tsx:63` | `industry: 'Pest Control'` in the wizard payload | `prospects.wizard_data` insert (`:107`) |

`settings/BusinessInfoSection.tsx:50,67` and `social/useComposer.ts:60` also default
`industry` to `'Pest Control'` in component state, and `onboarding/types.ts:15`
`INITIAL_FORM` does the same.

> **This is the S281 lesson repeating.** Every one of these writes tenant-visible
> content into the database from a prompt no DB guard scans and no code guard reads as
> user-facing copy. `East Texas`, `Tyler`, `Longview` and `Jacksonville` are TENANT
> facts — they are wrong for a Dallas pest company, not merely for an irrigation one.

---

## 5. `FAQ_CATEGORIES` — what the code actually does

Verified by reading `FaqItemForm.tsx` and `FaqTab.tsx` and by rendering the component
(`docs/audits/s282-rendered/FaqItemForm.edit-irrigation-category.html`).

**The list** (`FaqItemForm.tsx:3`, exported): `General`, `Ants`, `Spiders`,
`Wasps & Yellow Jackets`, `Scorpions`, `Rodents`, `Mosquitoes`, `Fleas & Ticks`,
`Roaches`, `Bed Bugs`. Nine of ten are pest species; `General` is the only
trade-neutral entry.

**The `pls` rows** carry `Sprinkler Systems`, `Drainage`, `Pump Systems`,
`Sod & Dirt Work` — none in the list.

### What the select renders when the value matches no option

The `<select>` is **controlled** (`value={form.category}`), and `form` is seeded once
from the `initial` prop, which `FaqTab.tsx:138` fills from the DB row. With
`category: 'Sprinkler Systems'`:

- the rendered markup contains **no `Sprinkler Systems` option and no `selected`
  attribute at all** — asserted in the render test, not inferred;

- the browser therefore reports `selectedIndex = -1` and **paints the control blank**.
  The editor shows an empty Category box, not the tenant's real category.

### Whether a save round-trips or overwrites

**Both, depending on whether the user touches the control:**

- **Untouched → round-trips intact.** `form.category` still holds `'Sprinkler Systems'`,
  and `handleSaveEdit` (`FaqTab.tsx:56-61`) writes `category: form.category` straight
  back. Editing the *question* of an irrigation FAQ preserves its category.

- **Touched → silently overwritten.** Any interaction fires `onChange` with a listed
  option, so the category becomes a pest species. There is no warning and no way to
  re-select the original — it is not in the list.

So the data is safe until someone clicks the box that looks empty and therefore looks
like it needs filling in.

### One thing that is already right

`FaqTab.tsx:92-93` builds `otherCats` — categories present in the data but absent from
`FAQ_CATEGORIES` — and renders them as their own groups. **The list view handles
unknown categories correctly.** Only the edit form's select does not. Whoever fixes
this should keep that behaviour and make the select match it.

*(Not fixed here. Discovery only.)*

---

## 6. RENDERED-ONLY strings

Strings present in rendered output but absent from the layer-1 source table — assembled
at render time, invisible to a literal grep. **6 found:**

| String | Component | Why it is not in the source table |
|---|---|---|
| Add FAQ | `FaqItemForm.default` | supplied as the `label` prop by `FaqTab.tsx:116` |
| Country Code | `client-setup.ClientSetupWizard` | nested step component reached only via the wizard |
| State (2-letter) | `client-setup.ClientSetupWizard` | nested step component reached only via the wizard |
| Voice AI Receptionist — Remi (optional add-on) | `RemiAddonStrip` | **from `src/lib/planCardContent.ts` — outside `src/components/admin/`** |
| ZIP Code | `client-setup.ClientSetupWizard` | nested step component reached only via the wizard |
| 🏠 Irrigation | `ComposerPlatformSelector` | `industry` prop interpolated into the header |

**The `RemiAddonStrip` row is the one that matters methodologically.** Its text lives
in `src/lib/planCardContent.ts`, an admin-only constants module *outside* the scanned
directory. The layer-1 scan would have missed it; the render caught it. I then swept
all twelve admin-only lib/hook modules — the only vertical-bearing string in them is
the `generateBlogDraft.ts:34` prompt already listed in section 4.

The other five are low-value: three are wizard-nested labels and two are props I
supplied to the render. **The layer's value here was one real find out of six**, and
that find was a scope hole, not a hidden string.

---
## 7. Rendered set (layer 2)

`src/components/admin/__tests__/adminRenderedStrings.test.tsx` renders 17 components
with `renderToStaticMarkup` and writes each to `docs/audits/s282-rendered/*.html`.

One module-boundary mock only: `src/lib/supabase`, because it constructs a real client
at import time from Vite env vars that do not exist under vitest, so any component whose
tree transitively imports it fails to load. **No admin component is mocked** — a stub
aggressive enough to make renders succeed trivially is the failure mode this layer exists
to avoid.

| File | Component | Notes |
|---|---|---|
| `FaqItemForm.default.html` | `FaqItemForm` | the ten pest options |
| `FaqItemForm.edit-pest-category.html` | `FaqItemForm` | `Rodents` — renders `selected` |
| `FaqItemForm.edit-irrigation-category.html` | `FaqItemForm` | `Sprinkler Systems` — **no option, no `selected`** |
| `PageHelpBanner.html` | `PageHelpBanner` | prop-driven, no literals |
| `DemoBanner.html` | `DemoBanner` | PLATFORM |
| `RemiAddonStrip.html` | `RemiAddonStrip` | text from `src/lib/planCardContent.ts` |
| `ComposerTemplates.pest-control.html` | `ComposerTemplates` | collapsed — see below |
| `ComposerTemplates.hvac.html` | `ComposerTemplates` | collapsed, byte-identical |
| `ComposerTemplates.irrigation-unmapped.html` | `ComposerTemplates` | collapsed, byte-identical |
| `ComposerPlatformSelector.html` | `ComposerPlatformSelector` | interpolates `industry` |
| `LeadFunnel.html` | `LeadFunnel` | PLATFORM, no pest vocabulary |
| `ShellSelector.html` | `ShellSelector` | shell names |
| `client-setup.Step1BusinessInfo.html` | `Step1BusinessInfo` | `Acme Pest Solutions`, `East Texas's Most Trusted Pest Control`, `Tyler` |
| `client-setup.Step3Domain.html` | `Step3Domain` | `ironclad-pest.com` |
| `client-setup.ClientSetupWizard.html` | `ClientSetupWizard` | step 1 only |
| `onboarding.StepBusinessInfo.html` | `StepBusinessInfo` | `Apex Pest Solutions`, `123 Main St, Tyler, TX 75701` |
| `onboarding.StepBranding.html` | `StepBranding` | shell names |

### A premise the render overturned

I expected the render to prove which template set an unmapped industry receives.
**It cannot.** `ComposerTemplates` renders **collapsed** behind `useState` — the entire
static output is `📋 Use a Template ▼`, and pest, HVAC and irrigation are byte-identical.
The registry in section 3c is real, but it is reachable only by clicking. That is
recorded as an assertion in the test and the expanded panel is listed for capture below,
rather than the claim being quietly dropped.

---

## 8. Screenshots needed — listed, not taken

Everything below is gated behind component state, a live session, or the router, so it
cannot be statically rendered. Component, tab, and the exact interaction to reach it.

| # | Component | Tab / route | Interaction to reach it |
|---|---|---|---|
| 1 | `ComposerTemplates` (expanded) | Social → Composer | Click **📋 Use a Template ▼**. Capture for a pest tenant *and* for `pls`, to show `generic` vs `pest control`. |
| 2 | `ComposerScheduler` smart-schedule panel | Social → Composer | Toggle **Smart Schedule**; AI call required |
| 3 | `NewCampaignModal` | Social → Campaigns | Click **New Campaign** (tier 3/4 only) |
| 4 | `ConnectionsModal` | Social → Connections | Click **Manage connections** |
| 5 | `PostPreviewModal` | Social → Posts | Click any post card |
| 6 | `ImageStrategyChooser` | Social → Campaign create | Reach step 2 of campaign creation |
| 7 | `SeoInlineEditor` (open) | SEO → Pages | Click **Edit** on any page row |
| 8 | `FixAllModal` | SEO → Pages | Click **Fix All** with ≥1 issue present |
| 9 | `SeoKeywordsTab` AI suggestions | SEO → Keywords | Click **Suggest keywords**; live AI call |
| 10 | `GSCStatusPanel` connected state | SEO → Overview | Requires a connected Google Search Console account |
| 11 | `Ga4AnalyticsTile` connected state | Analytics | Requires a connected GA4 property |
| 12 | `TierToggle` | Global header | Demo tenant only — reads `window.location.hostname`; also needs `usePlan` |
| 13 | `NotificationBell` dropdown | Global header | Click the bell with ≥1 notification |
| 14 | `ClientSetupWizard` steps 2–6 | Ironwood → Client Setup | Fill step 1, then **Next** ×5 |
| 15 | `onboarding` steps 3–6 | `/admin/onboarding` | Advance the wizard past Branding |
| 16 | `LeadDetailModal` | CRM | Click any lead row |
| 17 | `TeamMemberModal` | Team | Click **Add member** or any member card |
| 18 | `TestimonialModal` | Testimonials | Click **Add testimonial** |
| 19 | `BlogPostEditor` AI draft panel | Blog | Click **Generate with AI** — placeholder names *rodent invasions in East Texas* |
| 20 | `ContentTab` AI copy button | Content | Select a pest page, click **Generate copy** — prompt in section 4 |
| 21 | `FaqItemForm` (irrigation row, in situ) | Content → FAQ | Open `pls` → edit an FAQ with category `Sprinkler Systems`; capture the **blank** Category box |

---

## 9. What Phase 3 inherits

Not a plan — the brief is discovery only. These are the facts a plan would start from.

1. **Four duplicate pest slug lists** (section 3a) plus `FAQ_CATEGORIES`. One preset key
   each, four call sites to converge.
2. **`INDUSTRY_TEMPLATES` is a working admin registry already** (3c) with a `generic`
   fallback and DB-sourced industry. The admin preset should look like it, not like the
   public-site registry — and per the standing rule, must not share it.
3. **Seven DB-seeding paths** (section 4) carry pest wording *and* East Texas / Tyler /
   Longview / Jacksonville. The region strings are TENANT facts and wrong for any pest
   company outside East Texas, so they are not fixed by a vertical preset alone.
4. **`FAQ_CATEGORIES` loses data only on interaction** (section 5), and `FaqTab` already
   handles unknown categories correctly in its list view. The fix is to make the select
   agree with the list.
5. **`industry` defaults to `'Pest Control'`** in four places, so an unset tenant silently
   becomes pest in the admin exactly as `vertical` does on the public site.
