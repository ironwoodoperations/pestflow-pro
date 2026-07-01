// Dang comic shell — SCAFFOLD placeholder (pest / service page surface).
// Empty-but-selectable: the real comic service page is PR 4. Mirrors the
// other shells' PestPage prop shape (tenant, pestSlug, content) so the
// [service] branch wires identically. Only `pestSlug` is surfaced, as a
// visible scaffold marker.
import type { Tenant } from '../../../../../shared/lib/tenant/types';

type PageContent = { title?: string; subtitle?: string; intro?: string; hero_headline?: string } | null;
interface Props {
  tenant: Tenant;
  pestSlug: string;
  content?: PageContent;
}

export function DangComicPestPage({ pestSlug }: Props) {
  return (
    <div
      data-dang-scaffold="pest-page"
      style={{ padding: '4rem 1rem', textAlign: 'center', fontFamily: 'sans-serif' }}
    >
      Dang comic shell — scaffold (pest page: {pestSlug})
    </div>
  );
}
