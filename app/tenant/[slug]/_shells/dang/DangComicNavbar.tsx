// Dang comic shell — SCAFFOLD placeholder (navbar surface).
// Empty-but-selectable: real comic navbar is PR 4. Accepts the same
// `servicePages` prop shape as the other shell navbars so the layout branch
// wires identically; the prop is intentionally unused in the scaffold.
interface ServiceLink {
  page_slug: string;
  title: string | null;
}
interface Props {
  servicePages: ServiceLink[];
}

export function DangComicNavbar({ servicePages }: Props) {
  return (
    <nav
      data-dang-scaffold="navbar"
      style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px dashed #ccc', fontFamily: 'sans-serif' }}
    >
      Dang comic shell — scaffold (navbar · {servicePages.length} service links)
    </nav>
  );
}
