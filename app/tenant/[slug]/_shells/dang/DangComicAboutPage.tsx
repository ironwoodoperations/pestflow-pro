// Dang comic shell — SCAFFOLD placeholder (about page surface).
// Empty-but-selectable: the real comic about page is PR 4. Mirrors the
// bold-local AboutPage prop shape so the about branch wires identically;
// only `businessName` is surfaced as a visible scaffold marker.
interface TeamMember {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  photo_url?: string;
}
interface Props {
  heroTitle: string;
  heroSub: string;
  heroImageUrl?: string | null;
  aboutImage: string;
  team: TeamMember[];
  foundedYear?: string;
  businessName: string;
  licenseNumber?: string;
  introParagraphs: string[];
}

export function DangComicAboutPage({ businessName }: Props) {
  return (
    <div
      data-dang-scaffold="about-page"
      style={{ padding: '4rem 1rem', textAlign: 'center', fontFamily: 'sans-serif' }}
    >
      Dang comic shell — scaffold (about: {businessName})
    </div>
  );
}
