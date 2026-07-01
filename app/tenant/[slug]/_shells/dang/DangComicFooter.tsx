// Dang comic shell — SCAFFOLD placeholder (footer surface).
// Empty-but-selectable: real comic footer is PR 4. Accepts the same
// `tenant` / `social` prop shape as the other shell footers; both are
// intentionally unused in the scaffold.
import type { Tenant } from '../../../../../shared/lib/tenant/types';

interface Social {
  facebook?: string;
  instagram?: string;
  google?: string;
}
interface Props {
  tenant: Tenant;
  social?: Social;
}

export function DangComicFooter({ tenant }: Props) {
  return (
    <footer
      data-dang-scaffold="footer"
      style={{ padding: '1rem', textAlign: 'center', borderTop: '1px dashed #ccc', fontFamily: 'sans-serif' }}
    >
      Dang comic shell — scaffold (footer · {tenant.business_name})
    </footer>
  );
}
