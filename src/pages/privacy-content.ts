export interface Section {
  heading: string;
  body: string | string[];
}

export const privacyMeta = {
  title: "PRIVACY POLICY",
  subtitle: "PestFlow Pro Platform — How We Collect, Use, and Protect Your Data",
  date: "Last Updated: April 2026",
};

export const privacySections: Section[] = [
  {
    heading: "1. INFORMATION WE COLLECT",
    body: [
      "From Platform Subscribers (Business Clients):",
      "• Business name, address, phone, email, and contact information",
      "• Billing information (processed via third-party payment processor — we do not store card numbers)",
      "• Website content you create or upload (service descriptions, blog posts, photos, testimonials)",
      "• Platform usage data (features accessed, settings configured, login activity)",
      "• Integration credentials you provide (Google Analytics ID, Facebook Page ID, API keys)",
      "From Your Customers (End Users of Client Websites):",
      "• Contact information submitted via quote or contact forms (name, email, phone, address)",
      "• Service requests and messages",
      "• SMS consent records (whether a customer opted in to receive text messages)",
      "• IP address and browser data collected automatically via website analytics",
    ],
  },
  {
    heading: "2. HOW WE USE INFORMATION",
    body: [
      "Subscriber Data:",
      "• To operate and provide the Platform services",
      "• To send account notifications, billing reminders, and service updates",
      "• To improve Platform features and performance",
      "• To respond to support requests",
      "End Customer Data (Your Customers):",
      "• To populate the lead management CRM on your behalf",
      "• To trigger automated notifications (new lead emails, SMS alerts) that you have configured",
      "• To send review request emails when you trigger this feature",
      "• We do NOT use your customers' data for our own marketing or sell it to third parties",
    ],
  },
  {
    heading: "3. DATA STORAGE & SECURITY",
    body: "All Platform data is stored in Supabase (a SOC 2 compliant cloud database provider). Data is encrypted in transit (TLS) and at rest. Access is controlled via row-level security policies. We implement industry-standard security practices, but no system is 100% secure.",
  },
  {
    heading: "4. SMS COMMUNICATIONS & TCPA COMPLIANCE",
    body: [
      "The Platform includes SMS notification features. We are committed to TCPA compliance:",
      "• Customer SMS messages are only sent when the customer has checked the consent checkbox on quote or contact forms",
      "• Business owner alert SMS messages are sent to the phone number configured in your account settings",
      "• We honor opt-out requests. Customers may reply STOP to any SMS to unsubscribe",
      "• Message and data rates may apply for SMS recipients",
      "• Subscribers are responsible for ensuring their use of SMS features complies with all applicable laws",
    ],
  },
  {
    heading: "5. DATA SHARING",
    body: [
      "We do not sell your data or your customers' data. We share data only with:",
      "• Supabase: Database hosting and storage",
      "• Vercel: Website and application hosting",
      "• Resend: Email delivery (lead notifications, review requests, onboarding emails)",
      "• Textbelt / Twilio: SMS delivery",
      "• Anthropic: AI content generation (captions, keyword research) — prompts may include business info but not personal customer data",
      "• Facebook / Meta: Social post publishing when you connect your Facebook Page",
      "• Buffer: Multi-platform social publishing when you connect your Buffer account",
      "• Google APIs: Analytics, Maps, Search Console when you configure these integrations",
      "All third-party providers are contractually required to protect your data and use it only to provide their services.",
    ],
  },
  {
    heading: "6. DATA RETENTION",
    body: "We retain your data for as long as your subscription is active. Upon termination: (a) you may export all Client Content within 60 days; (b) after 60 days, your data may be deleted from our systems; (c) backups may persist for up to 90 days after deletion.",
  },
  {
    heading: "7. YOUR RIGHTS",
    body: "You have the right to: (a) access all data we hold about your account; (b) correct inaccurate data; (c) export your Client Content; (d) request deletion of your account and data (subject to legal retention requirements). Contact us at scott@homeflowpro.ai to exercise these rights.",
  },
  {
    heading: "8. COOKIES & ANALYTICS",
    body: "Client websites built on the Platform may use Google Analytics 4 if configured by the subscriber. Analytics data is governed by Google's Privacy Policy. We do not set tracking cookies on admin dashboard sessions beyond what is necessary for authentication.",
  },
  {
    heading: "9. CHILDREN'S PRIVACY",
    body: "The Platform is not intended for use by children under 13. We do not knowingly collect data from children. If you believe a child has submitted data through a client website, contact us immediately.",
  },
  {
    heading: "10. CHANGES TO THIS POLICY",
    body: "We may update this Privacy Policy with reasonable notice. The \"Last Updated\" date at the top indicates the most recent revision. Continued use of the Platform after changes constitutes acceptance.",
  },
  {
    heading: "11. CONTACT",
    body: "Questions about this Privacy Policy: scott@homeflowpro.ai\nIronwood Operations Group LLC — Cherokee County, Texas",
  },
];
