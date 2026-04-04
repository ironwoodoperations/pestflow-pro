export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-slate">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service &amp; License Agreement</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: April 1, 2026 &nbsp;|&nbsp; Last Updated: April 2026</p>

        <p>By completing the onboarding process and clicking "Launch My Site," you ("Client") agree to be bound by these Terms of Service &amp; License Agreement ("Agreement") with Ironwood Operations Group LLC ("Provider," "we," or "us"), the operator of the PestFlow Pro platform.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. What Is PestFlow Pro</h2>
        <p>PestFlow Pro is a white-label software-as-a-service (SaaS) platform that provides Client with a fully managed website, customer relationship management (CRM) tools, SEO utilities, social scheduling, and related features tailored for home services businesses.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. License Grant</h2>
        <p>Provider grants Client a limited, non-exclusive, non-transferable, revocable license to access and use the Platform solely for Client's internal business purposes during the subscription term. This is a license to access, not a transfer of ownership. Client does not acquire any ownership interest in the Platform, its shells, templates, code, or underlying technology.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Subscription Plans &amp; Pricing</h2>
        <p>The following recurring monthly subscription tiers are available:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>Starter — $149/month:</strong> Website, CRM, and basic SEO tools</li>
          <li><strong>Grow — $249/month:</strong> Full SEO, Blog, and Social scheduling</li>
          <li><strong>Pro — $349/month:</strong> AI content tools, campaigns, and advanced reports</li>
          <li><strong>Elite — $499/month:</strong> All platforms, live reviews, and priority support</li>
        </ul>
        <p className="mt-3">All prices are in USD and subject to change with 30 days' notice.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Setup Fee</h2>
        <p>A one-time setup fee of <strong>$2,000</strong> is due upon agreement execution. This fee covers onboarding, initial configuration, content seeding, and platform launch. <strong>The setup fee is non-refundable under all circumstances.</strong></p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Subscription Term &amp; Cancellation</h2>
        <p>Subscriptions are month-to-month with no fixed term. Either party may cancel by providing <strong>30 days' written notice</strong> to the other party. Written notice may be delivered by email to scott@ironwoodoperationsgroup.com. Cancellation takes effect at the end of the current billing cycle following the notice period. No partial-month refunds are issued.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Ownership of Content</h2>
        <p>Client retains ownership of all content uploaded or created by Client within the Platform, including business information, photos, blog posts, and lead data ("Client Content"). Provider retains full ownership of the Platform, all design shells, templates, source code, and proprietary technology. Client grants Provider a limited license to store and display Client Content solely to operate the Platform on Client's behalf.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Acceptable Use</h2>
        <p>Client agrees not to:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Use the Platform for any unlawful purpose</li>
          <li>Send unsolicited commercial messages (spam) in violation of the CAN-SPAM Act or TCPA</li>
          <li>Reverse engineer, decompile, or attempt to extract the Platform's source code</li>
          <li>Resell or sublicense access to the Platform to third parties</li>
          <li>Interfere with the security or integrity of the Platform or its infrastructure</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PROVIDER'S TOTAL LIABILITY FOR ANY CLAIM ARISING FROM OR RELATED TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL FEES PAID BY CLIENT IN THE THREE (3) MONTHS PRECEDING THE CLAIM. PROVIDER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF REVENUE, LOSS OF DATA, OR LOSS OF BUSINESS OPPORTUNITY.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Governing Law &amp; Jurisdiction</h2>
        <p>This Agreement shall be governed by and construed in accordance with the laws of the State of Texas, without regard to conflict of law principles. Any disputes shall be resolved exclusively in the courts of Cherokee County, Texas.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Modifications</h2>
        <p>Provider reserves the right to modify these Terms at any time. Changes will be communicated via email to the address on file. Continued use of the Platform after the effective date of changes constitutes acceptance of the updated Terms.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Contact</h2>
        <p>Questions regarding these Terms should be directed to:</p>
        <p className="text-gray-700">
          Ironwood Operations Group LLC<br />
          Email: <a href="mailto:scott@ironwoodoperationsgroup.com" className="text-emerald-700 underline">scott@ironwoodoperationsgroup.com</a>
        </p>
      </div>
    </div>
  )
}
