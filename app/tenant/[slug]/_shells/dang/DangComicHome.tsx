// Dang comic shell — SCAFFOLD placeholder (home sections surface).
// Empty-but-selectable: the real comic home (hero templates, service cards,
// superhero trust section, etc.) is PR 4. No JSON-LD / seo_meta / faqs wiring
// here — that is deferred to PR 4 with the real design.
export function DangComicHome() {
  return (
    <div
      data-dang-scaffold="home"
      style={{ padding: '4rem 1rem', textAlign: 'center', fontFamily: 'sans-serif' }}
    >
      Dang comic shell — scaffold (home sections)
    </div>
  );
}
