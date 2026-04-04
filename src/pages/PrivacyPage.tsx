export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto prose prose-slate">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Effective Date: April 1, 2026 &nbsp;|&nbsp; Last Updated: April 2026</p>

        <p>This Privacy Policy describes how Ironwood Operations Group LLC ("Provider," "we," or "us") collects, uses, and protects information in connection with the PestFlow Pro platform ("Platform"). By using the Platform, you agree to the practices described in this Policy.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
        <p>We collect the following categories of information:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>Business Information:</strong> Name, phone number, email, address, industry, logo, branding preferences, and other details you provide during onboarding or through the admin dashboard.</li>
          <li><strong>Lead &amp; Customer Data:</strong> Contact information and service requests submitted by your website visitors through quote forms and contact pages.</li>
          <li><strong>Usage Data:</strong> Log data, browser type, IP address, pages visited, and actions taken within the admin dashboard, collected automatically to operate and improve the Platform.</li>
          <li><strong>Integration Credentials:</strong> Third-party access tokens (e.g., Facebook, Ayrshare) that you connect to the Platform to enable social posting and other features.</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Operate and maintain the Platform on your behalf</li>
          <li>Deliver lead notifications, reports, and other platform features</li>
          <li>Improve the Platform's performance and reliability</li>
          <li>Communicate with you about your subscription, billing, and platform updates</li>
        </ul>
        <p className="mt-3"><strong>We do not sell your data or your customers' data to any third party.</strong></p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. SMS &amp; TCPA Compliance</h2>
        <p>If you use the Platform's SMS features, you are solely responsible for ensuring compliance with the Telephone Consumer Protection Act (TCPA) and all applicable state laws. You must obtain proper written consent from your customers before sending SMS messages. Provider is not liable for any TCPA violations arising from your use of the Platform's communication tools.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Third-Party Service Providers</h2>
        <p>The Platform integrates with the following third-party service providers, each with their own privacy practices:</p>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><strong>Supabase</strong> — Database and authentication (supabase.com)</li>
          <li><strong>Vercel</strong> — Hosting and deployment (vercel.com)</li>
          <li><strong>Resend</strong> — Transactional email delivery (resend.com)</li>
          <li><strong>Textbelt</strong> — SMS delivery (textbelt.com)</li>
          <li><strong>Anthropic</strong> — AI content generation via Claude API (anthropic.com)</li>
          <li><strong>Facebook / Meta</strong> — Social media integration (meta.com)</li>
          <li><strong>Ayrshare</strong> — Multi-platform social scheduling (ayrshare.com)</li>
          <li><strong>Google</strong> — Google Reviews, Maps, and Analytics (google.com)</li>
        </ul>
        <p className="mt-3">We share only the minimum necessary data with these providers to operate the Platform. We do not authorize them to use your data for their own marketing purposes.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Data Retention &amp; Export</h2>
        <p>We retain your data for as long as your subscription is active. Upon cancellation, your data will remain accessible for a period of <strong>60 days</strong>, during which you may request an export. After 60 days, your data may be permanently deleted from our systems. To request a data export, contact us at scott@ironwoodoperationsgroup.com.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Security</h2>
        <p>We implement industry-standard security measures including row-level security (RLS) at the database level, encrypted connections (HTTPS/TLS), and role-based access controls. No system is completely secure, and we cannot guarantee absolute security of your data.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Changes will be communicated via email to the address on file. Continued use of the Platform after the effective date constitutes acceptance of the updated Policy.</p>

        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Contact</h2>
        <p>Questions or concerns about this Privacy Policy should be directed to:</p>
        <p className="text-gray-700">
          Ironwood Operations Group LLC<br />
          Email: <a href="mailto:scott@ironwoodoperationsgroup.com" className="text-emerald-700 underline">scott@ironwoodoperationsgroup.com</a>
        </p>
      </div>
    </div>
  )
}
