// Vertical copy presets (PR A, expanded in PR B). The registry half of
//   vertical preset (code) → tenant DB override → render
// so one set of shells serves every vertical instead of one hardcoded trade.
// Mirrors getServiceEntry's discipline: a single accessor, no shell reaches
// into the map directly, and the pest values are the CURRENT production
// strings copied verbatim so nothing rendered can move.
//
// WHAT MAY LIVE IN A PRESET (read before adding a string):
// A preset may contain ONLY what is true of the whole TRADE. A fact about a
// particular business belongs in the DB, never here. Precision's 2-year
// warranty, licence LI23001, "East Texas" and "BBB A+" are tenant facts and
// are deliberately absent from the irrigation preset even though they appear
// on that tenant's site. Capability claims are held to the same bar: the pest
// city FAQ promises same-day scheduling, and the irrigation FAQs deliberately
// do not, because no such commitment exists. Locked by tests.
import type { Vertical } from './serviceEntry';

/** Token substituted at render time in any slot documented as city-tokenized. */
export const CITY_TOKEN = '{city}';

/** Replace the {city} token in preset copy. Global — a slot may use it twice. */
export function withCity(template: string, city: string): string {
  return template.split(CITY_TOKEN).join(city);
}

export interface CityFaq { q: string; a: string }
export interface Feature { title: string; desc: string }
export interface ProcessStep { title: string; desc: string }
export interface ServiceStep { num: string; title: string; desc: string }

/**
 * Copy slots resolved per vertical.
 *
 * Additive by design: a new slot is a new required field here plus a value in
 * each populated preset. TypeScript then flags every preset missing it, which
 * is the same completeness guarantee the Vertical registry gives consumers.
 */
export interface VerticalCopy {
  /** Appended to a city in location hero titles: `${city} ${locationHeroSuffix}`. */
  locationHeroSuffix: string;
  /** Location hero subtitle used when the tenant has no business name. */
  locationSubtitleGeneric: string;
  /** Location H2 used when the tenant has no business name. */
  locationH2Generic: string;
  /** Location intro paragraphs, city-tokenized. Used only when the DB row has no intro. */
  locationIntroFallback: string[];
  /** Primary CTA on the location hero. */
  locationPrimaryCta: string;
  /** Location FAQ accordion. Both q and a are city-tokenized. */
  cityFaqs: CityFaq[];
  /** WhyChooseUs feature grid. */
  whyChooseFeatures: Feature[];
  /** The Process section's h2. */
  processHeading: string;
  /** Process section steps; the displayed number is the 1-based position. */
  processSteps: ProcessStep[];
  /** Verb phrase before the service name: `${serviceProcessVerb} ${service}`. */
  serviceProcessVerb: string;
  /** Heading over the "what we actually do" column on a service page. */
  serviceSolutionLabel: string;
  /** modern-pro service-page process block. */
  serviceSteps: ServiceStep[];
  /** Service-area hero subtitle, used when the DB has no override. */
  serviceAreaStrapline: string;
  /** Quote page h1. */
  quoteHeroTitle: string;
  /** Metadata description tail: `${businessName} — ${metadataFallbackDesc}`. */
  metadataFallbackDesc: string;
  /** Blog index h1, used when the DB has no override. */
  blogHeading: string;
  /** Blog index hero subtitle, used when the DB has no override. */
  blogSubtitle: string;
  /** Newsletter block body on the blog index. */
  blogNewsletterCopy: string;
  /** CTA banner intro, ONLY for a tenant with no business name set. */
  ctaGenericIntro: string;
  /** CTA banner trailing sentence. Conduct claims only — never a capacity promise. */
  ctaStrapline: string;
  /** CTA banner primary button label. */
  ctaPrimaryLabel: string;
  /**
   * Fallback image for a blog card with no intro_image, and for the about-page
   * body image. NULL means RENDER NOTHING — never point these at an asset that
   * does not exist in public/, and never borrow another vertical's photography.
   */
  blogCardFallbackImage: string | null;
  aboutImageFallback: string | null;
}

// Frozen for the same reason PEST_CONTROL_VOCABULARY is: these objects are
// handed out by reference, so an unfrozen preset could be mutated process-wide
// by any caller and would corrupt every later render.
//
// Partial, NOT Record: a vertical may be registered (routable, type-valid)
// before anyone has written its copy. Registration and copy are separate facts.
const VERTICAL_COPY: Partial<Record<Vertical, VerticalCopy>> = Object.freeze({
  // VERBATIM from production — every string below was diffed character by
  // character against the source it came from. Changing any of them moves live
  // pest tenants. Sources:
  //   locationHeroSuffix       [service]/page.tsx:95   `${city} Pest Control`
  //   locationSubtitleGeneric  [service]/page.tsx:118
  //   locationH2Generic        [service]/page.tsx:145
  //   locationIntroFallback    [service]/page.tsx:149-150
  //   locationPrimaryCta       [service]/page.tsx:120
  //   cityFaqs                 [service]/page.tsx:106-109
  //   whyChooseFeatures        _components/sections/WhyChooseUs.tsx:1-8
  //   processHeading/Steps     _components/sections/Process.tsx:1-7,15
  //   serviceProcessVerb       _shells/modern-pro/ModernProPestPage.tsx:53
  //   serviceSolutionLabel     _shells/modern-pro/ModernProPestPage.tsx:82
  //   serviceSteps             _shells/modern-pro/ModernProPestPage.tsx:16-21
  //   serviceAreaStrapline     service-area/page.tsx:25
  //   quoteHeroTitle           _components/forms/QuoteForm.tsx:92
  //   metadataFallbackDesc     layout.tsx:42
  pest: Object.freeze({
    locationHeroSuffix: 'Pest Control',
    locationSubtitleGeneric: 'Professional pest control for',
    locationH2Generic: 'Professional Pest Control',
    locationIntroFallback: Object.freeze([
      "Our licensed technicians provide comprehensive pest control services throughout {city}. Whether you're dealing with ants, roaches, rodents, termites, or mosquitoes, we have the solution.",
      'We combine local knowledge with professional-grade treatments to deliver lasting results for {city} homeowners and businesses.',
    ]) as unknown as string[],
    locationPrimaryCta: 'Schedule Inspection',
    cityFaqs: Object.freeze([
      { q: 'Do you service the {city} area?', a: 'Yes! We provide full pest control services throughout {city} and surrounding communities. Call us for scheduling.' },
      { q: 'What pests are most common in {city}?', a: 'Common pests in {city} include ants, roaches, rodents, mosquitoes, and spiders. Our local technicians are familiar with regional pest pressures and seasonal patterns.' },
      { q: 'How quickly can you get to my home in {city}?', a: 'Call us to check current availability for {city} and we will schedule an inspection.' },
      { q: 'Are your services available year-round in {city}?', a: 'Yes. Many pests remain active year-round in this area. We recommend quarterly service plans for continuous protection.' },
    ]) as unknown as CityFaq[],
    whyChooseFeatures: Object.freeze([
      { title: 'Custom Treatment Plans', desc: 'Every property is different. We tailor our approach to your specific pest pressures and property layout.' },
      { title: 'Family & Pet-Friendly Products', desc: 'EPA-approved, low-impact formulations that are safe for your children and pets when applied correctly.' },
      { title: 'Unlimited Callbacks', desc: 'If pests return between scheduled services, we come back at no additional cost — guaranteed.' },
      { title: 'Clear Scheduling', desc: 'We give you a firm appointment window, keep you posted if anything changes, and show up when we say we will.' },
      { title: 'Local Experts', desc: 'We know the local pest pressures in your area.' },
      { title: 'You Come First', desc: 'Our technicians take time to explain treatments, answer questions, and ensure your complete satisfaction.' },
    ]) as unknown as Feature[],
    processHeading: 'How Our Pest Control Process Works',
    processSteps: Object.freeze([
      { title: 'Inspection', desc: 'Thorough checks of all key entry points, harborage areas, and pest activity indicators.' },
      { title: 'Identification', desc: 'Precise pest identification to develop targeted, pest-specific treatment strategies.' },
      { title: 'Monitoring', desc: 'Installation of monitoring devices to track pest activity and treatment effectiveness.' },
      { title: 'Implementation', desc: 'Targeted, safe applications using the right products at the right concentration levels.' },
      { title: 'Evaluation', desc: 'Follow-up assessments to ensure lasting results and adjust strategies as needed.' },
    ]) as unknown as ProcessStep[],
    serviceProcessVerb: 'How we treat',
    serviceSolutionLabel: 'Treatment',
    serviceSteps: Object.freeze([
      { num: '01', title: 'Inspect', desc: 'Comprehensive site assessment to identify entry points, harborage, and risk factors.' },
      { num: '02', title: 'Engineer', desc: 'Treatment plan calibrated to species, severity, and structural conditions.' },
      { num: '03', title: 'Execute', desc: 'Targeted application using IPM-compliant materials and documented procedures.' },
      { num: '04', title: 'Verify', desc: 'Follow-up monitoring to confirm elimination and prevent recurrence.' },
    ]) as unknown as ServiceStep[],
    serviceAreaStrapline: 'Professional pest control in your community and surrounding areas.',
    quoteHeroTitle: 'Schedule a Free Inspection',
    metadataFallbackDesc: 'professional pest control services',
    //   blogHeading/blogSubtitle   blog/page.tsx:49-50
    //   blogNewsletterCopy         blog/page.tsx:100
    //   ctaGenericIntro/ctaStrapline/ctaPrimaryLabel
    //                              _components/sections/CtaBanner.tsx:13,17
    //   blogCardFallbackImage      blog/page.tsx:80
    //   aboutImageFallback         about/page.tsx:48
    blogHeading: 'Pest Control Blog',
    blogSubtitle: 'Tips, guides, and news from our pest control experts.',
    blogNewsletterCopy: 'Get pest control tips and seasonal alerts delivered to your inbox.',
    ctaGenericIntro: 'Professional pest control, on your schedule.',
    // PR D: was 'Same-day appointments available.' — a capacity promise no
    // tenant had verified, hardcoded as a platform default. Replaced with a
    // conduct claim grounded in this preset's own processSteps, whose first
    // step is 'Inspection'. Describes how the work is done, not how fast.
    ctaStrapline: 'Every visit starts with an inspection.',
    ctaPrimaryLabel: 'Schedule Inspection',
    blogCardFallbackImage: '/images/pests/pest_control.jpg',
    aboutImageFallback: '/images/pests/team.jpg',
  }) as unknown as VerticalCopy,

  // Trade-level only. No warranty term, no licence number, no region, no BBB
  // rating, and no scheduling promise — those are tenant facts and live in the
  // DB. Locked by tests asserting this preset matches none of them.
  irrigation: Object.freeze({
    locationHeroSuffix: 'Irrigation & Drainage',
    locationSubtitleGeneric: 'Professional irrigation and drainage for',
    locationH2Generic: 'Professional Irrigation & Drainage',
    locationIntroFallback: Object.freeze([
      'Our licensed crews install and repair sprinkler systems, build drainage that moves water away from your home, and size pump systems throughout {city}.',
    ]) as unknown as string[],
    locationPrimaryCta: 'Request a Quote',
    cityFaqs: Object.freeze([
      { q: 'Do you service the {city} area?', a: 'Yes. We install and repair sprinkler systems, drainage, and pump systems throughout {city} and the surrounding communities. Call us for scheduling.' },
      { q: 'What are the most common irrigation problems in {city}?', a: 'Dry patches between heads, a climbing water bill from an unseen leak, zones that will not come on, and standing water after rain. Local soil and pressure conditions drive most of it.' },
      { q: 'How quickly can you get to my property in {city}?', a: 'Call us to check current availability for {city} and we will schedule a site visit.' },
      { q: 'Do you work year-round in {city}?', a: 'Yes. Repairs, drainage work, and system checks continue year-round, and we handle seasonal startup and winterization.' },
    ]) as unknown as CityFaq[],
    whyChooseFeatures: Object.freeze([
      { title: 'Designed for Your Property', desc: 'Zones sized to real pressure and flow, with head spacing set for even coverage — no guesswork, no dry patches.' },
      { title: 'Documented Work', desc: 'Pressure readings, zone coverage, and as-built maps you keep, so you know what is in the ground.' },
      { title: 'Licensed & Insured', desc: 'Licensed irrigation work, fully insured, and permitted where required.' },
      { title: 'Clear Scheduling', desc: 'We give you a firm date, keep you posted if anything changes, and show up when we say we will.' },
      { title: 'Local Knowledge', desc: 'We know local soil, pressure, and drainage patterns, and have solved these problems on properties like yours.' },
      { title: 'You Come First', desc: 'Our crews explain the layout, answer questions, and walk the system with you before the job is called done.' },
    ]) as unknown as Feature[],
    processHeading: 'How Our Irrigation Process Works',
    processSteps: Object.freeze([
      { title: 'Assessment', desc: 'Site walk to check static pressure, flow, grade, and any existing zones or drainage.' },
      { title: 'Design', desc: "Zone layout, head spacing, and pipe sizing matched to the property's pressure and coverage needs." },
      { title: 'Installation', desc: 'Trenching, pipe, heads, valves, and controller set to plan, with depth and grade held throughout.' },
      { title: 'Testing', desc: 'Every zone run and adjusted for head-to-head coverage, with pressure checked at the last head.' },
      { title: 'Walkthrough', desc: 'We walk the system with you, hand over as-built maps, and set the schedule before we leave.' },
    ]) as unknown as ProcessStep[],
    serviceProcessVerb: 'How we approach',
    serviceSolutionLabel: 'The Work',
    serviceSteps: Object.freeze([
      { num: '01', title: 'Inspect', desc: 'Site assessment: static pressure, flow rate, grade, and the condition of what is already in the ground.' },
      { num: '02', title: 'Design', desc: 'A plan sized to the property — zones, head spacing, pipe runs, and drainage routes.' },
      { num: '03', title: 'Install', desc: 'Work done to plan, at depth and to grade, with materials rated for the job.' },
      { num: '04', title: 'Verify', desc: 'Every zone tested and adjusted, results documented, and the system walked with you.' },
    ]) as unknown as ServiceStep[],
    serviceAreaStrapline: 'Professional irrigation and drainage in your community and surrounding areas.',
    quoteHeroTitle: 'Request a Free Estimate',
    metadataFallbackDesc: 'professional irrigation and drainage services',
    blogHeading: 'Irrigation & Drainage Blog',
    blogSubtitle: 'Guides and updates on sprinkler systems, drainage, and pump work.',
    blogNewsletterCopy: 'Get seasonal irrigation and drainage tips delivered to your inbox.',
    ctaGenericIntro: 'Professional irrigation and drainage, planned around your property.',
    // Conduct, not capacity: describes how the work starts, promises no window.
    ctaStrapline: 'Every job starts with a site walk.',
    ctaPrimaryLabel: 'Request an Estimate',
    // NULL, not a borrowed pest photo and not a path to a file that does not
    // exist. public/images/pls/ holds only the five service tiles — there is no
    // irrigation team or generic photo — so these render nothing until one exists.
    blogCardFallbackImage: null,
    aboutImageFallback: null,
  }) as unknown as VerticalCopy,

  // Lawn vertical (S323 PR A). Trade-level only, held to the same bar as
  // irrigation and then some: no licence, no region, no warranty term, no
  // rating, no response time, and no offer. The two live examples this preset
  // is written against sit in the IRRIGATION content map today — 'Licensed
  // since 2017' and a 'free 2-year warranty' — both true of one company and of
  // no other irrigation business. Nothing of that shape is here. Locked by
  // tests in this directory and in src/lib/__tests__/lawnCatalog.test.ts.
  //
  // NOTE ON quoteHeroTitle / ctaPrimaryLabel: 'Request an Estimate', NOT
  // 'Request a FREE Estimate'. Irrigation's says free; that is an OFFER, and an
  // offer is a tenant fact. Deliberately not copied across.
  lawn: Object.freeze({
    locationHeroSuffix: 'Lawn Care',
    locationSubtitleGeneric: 'Professional lawn care for',
    locationH2Generic: 'Professional Lawn Care',
    locationIntroFallback: Object.freeze([
      'Our crews handle turf treatment, mowing and landscape maintenance throughout {city} — seasonal feeding and weed control, aeration and seeding, and the routine upkeep that keeps a property in shape between visits.',
    ]) as unknown as string[],
    locationPrimaryCta: 'Request a Quote',
    cityFaqs: Object.freeze([
      { q: 'Do you service the {city} area?', a: 'Yes. We provide lawn care and landscape maintenance throughout {city} and the surrounding communities. Call us for scheduling.' },
      { q: 'What are the most common lawn problems in {city}?', a: 'Thin turf that weeds move into, compacted soil that sheds water instead of taking it in, grub and chinch bug damage mistaken for drought, and fungal patches after warm, humid weather. Local soil and grass type drive most of it.' },
      { q: 'When should lawn treatments be applied in {city}?', a: 'Timing follows the growing season and the grass type rather than a fixed calendar — pre-emergent before soil temperatures bring weed seed up, feeding through active growth, and aeration and seeding while the turf can still recover. Call us to talk through the schedule for your lawn.' },
      { q: 'Do you work year-round in {city}?', a: 'Yes. The work changes with the season — treatment and mowing through the growing months, cleanups and pruning outside them — but the schedule runs year-round.' },
    ]) as unknown as CityFaq[],
    whyChooseFeatures: Object.freeze([
      { title: 'Treated to the Lawn, Not the Calendar', desc: 'Rates and timing set from grass type, soil conditions and what the turf is actually doing.' },
      { title: 'Diagnosis Before Treatment', desc: 'Drought, grubs and turf disease look alike from the drive. We identify the cause before we treat it.' },
      { title: 'Documented Visits', desc: 'What was applied, at what rate, and what comes next — recorded so the season reads as one plan.' },
      { title: 'Clear Scheduling', desc: 'We give you a firm date, keep you posted if anything changes, and show up when we say we will.' },
      { title: 'Local Knowledge', desc: 'We know the grass types, soils and seasonal pressures in this area.' },
      { title: 'You Come First', desc: 'Our crews explain what the lawn needs, answer questions, and walk the property with you.' },
    ]) as unknown as Feature[],
    processHeading: 'How Our Lawn Care Process Works',
    processSteps: Object.freeze([
      { title: 'Assessment', desc: 'A walk of the property to identify grass type, soil condition, weed pressure, and anything already damaging the turf.' },
      { title: 'Diagnosis', desc: 'Soil testing and identification of insects or disease, so treatment answers the cause rather than the symptom.' },
      { title: 'Plan', desc: 'A seasonal schedule for feeding, weed control and cultural work, set to the grass type and the growing season.' },
      { title: 'Service', desc: 'Applications and maintenance carried out on that schedule, at rates set for the conditions on the day.' },
      { title: 'Follow-up', desc: 'Results read at the next visit and the schedule adjusted to what the lawn is doing.' },
    ]) as unknown as ProcessStep[],
    serviceProcessVerb: 'How we approach',
    serviceSolutionLabel: 'The Work',
    serviceSteps: Object.freeze([
      { num: '01', title: 'Assess', desc: 'Property walk: grass type, soil condition, weed pressure, and the cause of any damage already showing.' },
      { num: '02', title: 'Plan', desc: 'A seasonal schedule matched to the grass type, the soil, and the growing season.' },
      { num: '03', title: 'Treat', desc: 'Applications and maintenance carried out on schedule, at rates set for the conditions.' },
      { num: '04', title: 'Follow Up', desc: 'Results read at the next visit, and the schedule adjusted to what the turf is doing.' },
    ]) as unknown as ServiceStep[],
    serviceAreaStrapline: 'Professional lawn care and landscape maintenance in your community and surrounding areas.',
    quoteHeroTitle: 'Request an Estimate',
    metadataFallbackDesc: 'professional lawn care and landscape maintenance',
    blogHeading: 'Lawn Care Blog',
    blogSubtitle: 'Guides and updates on turf treatment, maintenance and landscape work.',
    blogNewsletterCopy: 'Get seasonal lawn care tips delivered to your inbox.',
    ctaGenericIntro: 'Professional lawn care, on a schedule that fits the season.',
    // Conduct, not capacity: grounded in this preset's own processSteps, whose
    // first step is Assessment. Promises no window and no turnaround.
    ctaStrapline: 'Every plan starts with a look at the lawn.',
    ctaPrimaryLabel: 'Request an Estimate',
    // NULL, not a borrowed pest photo and not a path to a file that does not
    // exist. There is no lawn photography in public/ — these render nothing
    // until there is.
    blogCardFallbackImage: null,
    aboutImageFallback: null,
  }) as unknown as VerticalCopy,

  // pool, hvac, roof, trailer: registered in VERTICALS, deliberately ABSENT
  // here. No placeholder copy — a pool tenant silently rendering pest
  // copy is the exact failure this architecture exists to prevent, so the
  // accessor throws instead. Fail at build/dev, not quietly in production.
});

/**
 * The only way to read a preset. Throws — loudly, naming the vertical — rather
 * than falling back to pest, so a vertical that reaches render without copy is
 * a caught bug and never a wrong-trade page served to a real customer.
 */
/**
 * Resolve copy from a RAW, possibly-absent vertical. NULL means "trade not
 * recorded" and is a legitimate answer, not an error.
 *
 * The mirror of resolveSchemaVocabulary, and it exists for the same live defect:
 * layout.tsx's generateMetadata builds its description fallback from
 * getVerticalCopy(resolveVertical(tenant)), and resolveVertical ends `: 'pest'`.
 * vita-glow has vertical NULL and NO seo.meta_description, so that fallback
 * FIRES and its indexable <meta name="description"> reads "…professional pest
 * control services" for a medical-aesthetics business.
 *
 * This does NOT add a neutral copy preset. VerticalCopy has 21 slots and
 * inventing trade-neutral prose for all of them is a separate piece of work.
 * A caller that gets null omits the copy rather than substituting any — which
 * is the correct handling for the one slot that is currently reachable.
 */
export function resolveVerticalCopy(vertical: string | null | undefined): VerticalCopy | null {
  if (typeof vertical !== 'string') return null;
  const copy = (VERTICAL_COPY as Record<string, VerticalCopy | undefined>)[vertical];
  return copy ?? null;
}

export function getVerticalCopy(vertical: Vertical): VerticalCopy {
  const copy = VERTICAL_COPY[vertical];
  if (!copy) {
    throw new Error(
      `[getVerticalCopy] no copy preset registered for vertical "${vertical}". ` +
        `It is a registered key but has no copy yet — add a preset in ` +
        `src/shells/_shared/verticalCopy.ts. Refusing to fall back to pest copy.`,
    );
  }
  return copy;
}
