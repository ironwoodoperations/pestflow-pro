// IronwoodSocial — social media posting for PestFlow Pro's own accounts.
// Reuses the existing SocialTab component; when the Ironwood admin is on
// pestflow-pro.pestflowpro.ai, TenantBootProvider resolves to that tenant
// (9215b06b-3eb5-49a1-a16e-7ff214bf6783 / slug: pestflow-pro) automatically.

import SocialTab from '../admin/SocialTab'

export default function IronwoodSocial() {
  return (
    <div className="p-6 bg-white min-h-full">
      <div className="max-w-5xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">PestFlow Pro — Social Media</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Post to PestFlow Pro's own social accounts (demo tenant).
          </p>
        </div>
        {/*
          S325 — demoActive={false} EXPLICITLY, not by omission.

          This is the OPERATOR tenant (pestflow-pro), whose settings.demo_mode
          is {active:false}, and the S325 brief is explicit that the operator
          tenant does not get demo affordances. Under the old hostname predicate
          it did: /ironwood is served from pestflowpro.ai, two labels, so the
          slug fell through to '' and the localhost hatch matched.

          Nothing observable changes here today — the operator is entitlement 4,
          and all five of SocialTab's isDemoTenant branches sit behind tier gates
          it exceeds (Starter copy, canAccess(3), canAccess(4), and
          ConnectionsModal's tier < 2 lock). Stated rather than relied on: if the
          operator's entitlement ever dropped, an omitted prop would look like an
          oversight instead of a decision.
        */}
        <SocialTab demoActive={false} />
      </div>
    </div>
  )
}
