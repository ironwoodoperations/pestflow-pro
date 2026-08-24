import { resolveServiceAreaMap, cityLabel, type ServiceAreaRow, type StoredServiceAreaMap } from '../../../../shared/lib/serviceAreaMap';

// S293 PR C — ONE shared server component. Not four parallel shell branches.
//
// This surface turned out to need no such branching: ServiceAreaPage is already
// a single shared component and no shell overrides it, so eligibility, marker
// construction and caching live here and the shells contribute only the
// surrounding section styling, as they already did.
//
// It replaces a hardcoded /demo-coverage-map.svg — an abstract blob with dashed
// lines that every tenant has been showing as their "coverage". A drawing of a
// territory nobody has is the same class of claim this arc has been removing;
// this component renders the tenant's own cities or renders nothing.

interface Props {
  areas: ServiceAreaRow[];
  stored: StoredServiceAreaMap | null;
  businessName: string;
}

export function ServiceAreaMap({ areas, stored, businessName }: Props) {
  const map = resolveServiceAreaMap({ areas, stored, businessName });

  // RENDER NOTHING. Not a placeholder, not an empty frame, not a spacer — the
  // section itself does not exist. Absent data means absent output, the same
  // rule PR A applied to JSON-LD. vita-glow has zero service areas and will
  // take this branch on every render.
  if (!map) return null;

  return (
    <section className="py-12 px-6" style={{ backgroundColor: 'var(--color-bg-section)' }}>
      <div className="max-w-5xl mx-auto">
        <div
          className="rounded-xl border"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-heading) 12%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--color-bg-section) 92%, var(--color-heading) 8%)',
            // NO overflow:hidden. Static Maps bakes Google's attribution into
            // the bottom pixels of the image and cropping it breaks the Maps
            // terms. The previous markup clipped its child; this must not.
            overflow: 'visible',
          }}
        >
          {/* A plain <img>, not next/image: the file is already a fixed-size PNG
              on our own CDN with an immutable cache key, so the optimizer would
              add a hop and re-encode Google imagery for no gain.
              width/height are the intrinsic pixels — they reserve the box and
              hold layout, so this contributes no CLS. */}
          <img
            src={map.url}
            alt={map.alt}
            width={map.width}
            height={map.height}
            loading="lazy"
            decoding="async"
            style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '0.75rem' }}
          />
        </div>

        {/* The list is the CONTENT; the image reinforces it. Coverage
            information must never exist only inside a picture — a screen
            reader, a blocked image and a failed CDN all land here. The labels
            match the markers exactly. */}
        <ol
          className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 list-none p-0"
          aria-label="Cities shown on the map"
        >
          {map.cities.map((c) => (
            <li key={c.slug || c.city} className="flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              <span
                aria-hidden="true"
                className="inline-flex items-center justify-center rounded-full font-bold"
                style={{
                  width: 22, height: 22, flexShrink: 0, fontSize: 12,
                  backgroundColor: 'var(--color-accent)', color: 'var(--color-btn-text, #ffffff)',
                }}
              >
                {c.label}
              </span>
              <span style={{ color: 'var(--color-heading)' }}>{cityLabel(c)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
