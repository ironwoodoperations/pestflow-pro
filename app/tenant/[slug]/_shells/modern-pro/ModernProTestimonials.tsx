// S-PLS-7 / PR 5a: DB rows or nothing. The previous hardcoded REVIEWS array
// was three invented customers rendered for every modern-pro tenant — the
// `detail` line ("Verified Customer" etc.) had no DB column behind it and is
// dropped, not replaced.

export interface Testimonial {
  id: string;
  author_name: string;
  review_text: string;
  rating: number;
  // S311: the curation flag. getTestimonials() has always selected '*' so this
  // column was present on every row — the component simply never read it, so
  // the rows a tenant deliberately marked featured had no effect on what
  // rendered. Optional/nullable because hand-built literals omit it and the
  // column is nullable.
  featured?: boolean | null;
}

// S311 — deterministic selection, replacing a bare `testimonials.slice(0, 3)`.
//
// getTestimonials() orders by created_at DESC and by nothing else, which is not
// a total order. pls's 50 Google-imported rows all share ONE created_at (a
// single bulk insert), so the head of that list was a 50-way tie: which three
// cards rendered was whatever order Postgres happened to return, and it could
// change on any ISR rebuild. Rows with an empty review_text were eligible too
// — 10 of those 50 have none — so a blank quote card under a real customer's
// name could render. Two were rendering on pls, and one on dang.
//
// The comparator is TOTAL: `id` is compared last and ids are unique, so no two
// rows ever compare equal. The result therefore cannot depend on the input
// order, on sort stability, or on what the database returned this time.
export function selectTestimonials(testimonials: Testimonial[]): Testimonial[] {
  // rating is nullable and unconstrained; a NaN here would make the comparator
  // inconsistent (NaN - NaN is NaN, which sorts as 0 in some spots and not
  // others) and quietly reintroduce order-dependence.
  const ratingOf = (t: Testimonial) => {
    const n = Number(t.rating);
    return Number.isFinite(n) ? n : 0;
  };
  const textOf = (t: Testimonial) =>
    typeof t.review_text === 'string' ? t.review_text.trim() : '';

  // .filter() returns a fresh array, so the .sort() below never mutates the
  // caller's rows — page.tsx passes the same array to other consumers.
  return testimonials
    .filter((t) => textOf(t).length > 0)
    .sort(
      (a, b) =>
        Number(b.featured === true) - Number(a.featured === true) ||
        ratingOf(b) - ratingOf(a) ||
        textOf(b).length - textOf(a).length ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
    .slice(0, 3);
}

export function ModernProTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const selected = selectTestimonials(testimonials);
  // The early exit now tests the SELECTED set rather than the raw input. A
  // tenant whose every row has an empty review_text would otherwise render the
  // heading above an empty grid. An empty input still exits here, since
  // selecting from [] yields [].
  if (selected.length === 0) return null;

  return (
    <section style={{ background: 'var(--color-bg-cta)' }} className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#ffffff' }}>
            TESTIMONIALS
          </p>
          <h2 className="text-3xl font-bold" style={{ color: '#ffffff' }}>
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {selected.map((r) => {
            // rating is nullable (default 5) and the table has no CHECK
            // constraint — an out-of-range value must not throw at render.
            const stars = Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0)));
            return (
            <div
              key={r.id}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div className="text-lg mb-3" style={{ color: '#fbbf24' }}>
                {'★'.repeat(stars) + '☆'.repeat(5 - stars)}
              </div>
              <p className="text-sm italic leading-relaxed mb-4" style={{ color: '#ffffff' }}>
                &ldquo;{r.review_text}&rdquo;
              </p>
              <p className="font-semibold" style={{ color: '#ffffff' }}>{r.author_name}</p>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
