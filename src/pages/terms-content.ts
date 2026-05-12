export interface Section {
  heading: string;
  body: string | string[];
  isTable?: boolean;
}

export const termsMeta = {
  title: "TERMS OF SERVICE & END USER LICENSE AGREEMENT",
  subtitle: "PestFlow Pro Platform — Effective upon electronic acceptance",
  date: "Effective upon electronic acceptance",
};

export const planTable = [
  { plan: "Starter", fee: "$149 / mo", features: "Website, CRM, basic SEO, locations (up to 3), team" },
  { plan: "Grow",    fee: "$249 / mo", features: "All Starter + full SEO suite, blog, social scheduling" },
  { plan: "Pro",     fee: "$349 / mo", features: "All Grow + AI tools, advanced reports, campaigns" },
  { plan: "Elite",   fee: "$499 / mo", features: "All Pro + social analytics, Buffer, live reviews" },
];

export const termsSections: Section[] = [
  {
    heading: "1. ACCEPTANCE OF TERMS",
    body: "These Terms of Service (\"Terms\") constitute a legally binding agreement between Ironwood Operations Group LLC (\"Provider,\" \"we,\" \"us\") and you (\"Client,\" \"you\"). By electronically accepting these Terms during the onboarding process, you agree to all terms contained herein. If you do not agree, do not proceed with onboarding.",
  },
  {
    heading: "2. THE PLATFORM",
    body: "PestFlow Pro is a white-label SaaS platform that provides pest control and home services businesses with a professional website, lead management CRM, SEO tools, social media scheduling, AI content generation, and business management features. Access is provided via a subscription model as described in Section 6.",
  },
  {
    heading: "3. ACCOUNT REGISTRATION & SECURITY",
    body: [
      "3.1 You are responsible for maintaining the confidentiality of your admin login credentials. You agree to notify Provider immediately of any unauthorized access.",
      "3.2 You are responsible for all activity that occurs under your account.",
      "3.3 Provider reserves the right to suspend accounts with suspicious activity.",
    ],
  },
  {
    heading: "4. LICENSE",
    body: "Subject to payment of applicable fees, Provider grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for your internal business purposes only. You may not sublicense, resell, or white-label the Platform to any third party.",
  },
  {
    heading: "5. INTELLECTUAL PROPERTY",
    body: [
      "5.1 The Platform, including all software, design systems, website themes, AI tools, automation workflows, source code, and proprietary features, is and remains the exclusive intellectual property of Ironwood Operations Group LLC.",
      "5.2 You retain ownership of all business content you provide (business name, contact info, testimonials, blog posts, photos). You grant Provider a limited license to use this content solely to operate the Platform on your behalf.",
      "5.3 All four website theme designs (Modern Pro, Bold & Local, Clean & Friendly, Rustic & Rugged) are Provider's proprietary Template Designs and are not transferred to you under any circumstances.",
    ],
  },
  {
    heading: "6. SUBSCRIPTION FEES",
    body: "A one-time setup fee of $2,000 is due at onboarding. Monthly fees are billed on the first of each month. Non-payment within ten (10) days may result in suspension.",
    isTable: true,
  },
  {
    heading: "7. ACCEPTABLE USE",
    body: [
      "You agree NOT to use the Platform to:",
      "• Send unsolicited commercial messages or spam",
      "• Violate any applicable law, including TCPA, CAN-SPAM, GDPR, or state consumer protection laws",
      "• Upload malicious code or harmful content",
      "• Infringe third-party intellectual property rights",
      "• Attempt to access, copy, or reverse-engineer any part of the Platform",
      "• Misrepresent your business, credentials, or services to consumers",
      "• Use the Platform to compete against Provider or to build a competing product",
    ],
  },
  {
    heading: "8. SMS COMMUNICATIONS",
    body: "The Platform includes SMS notification features. By enabling SMS features, you represent and warrant that: (a) all recipients have provided prior express written consent in compliance with TCPA; (b) you will honor opt-out requests immediately; (c) you will not use SMS features for marketing without proper consent documentation. Provider is not liable for your TCPA compliance.",
  },
  {
    heading: "9. AI-GENERATED CONTENT",
    body: "The Platform uses AI tools to assist with content creation, social media captions, keyword research, and related features. You are solely responsible for reviewing, editing, and approving all AI-generated content before publication. Provider makes no warranty that AI-generated content is accurate, complete, or appropriate for your specific use.",
  },
  {
    heading: "10. DATA & PRIVACY",
    body: [
      "10.1 Provider collects and stores business information, lead data, and usage data necessary to operate the Platform. This data is stored securely via Supabase and is not sold to third parties.",
      "10.2 Lead data (customer names, emails, phone numbers) collected through your website belongs to you. Provider does not use your customer data for any purpose other than operating the Platform.",
      "10.3 Upon termination, you may export all your data within 60 days. After 60 days, data may be deleted.",
      "10.4 Provider uses industry-standard security practices. However, no system is 100% secure, and Provider is not liable for unauthorized access resulting from Client's negligence.",
    ],
  },
  {
    heading: "11. THIRD-PARTY SERVICES",
    body: "The Platform integrates with third-party services including but not limited to: Supabase (database), Vercel (hosting), Resend (email), Textbelt/Twilio (SMS), Facebook Graph API, Buffer, and Google APIs. Your use of these integrations is also subject to those providers' terms of service. Provider is not responsible for third-party service outages or policy changes.",
  },
  {
    heading: "12. SERVICE AVAILABILITY",
    body: "Provider will use commercially reasonable efforts to maintain 99% uptime. Provider is not liable for downtime caused by third-party infrastructure, scheduled maintenance, or circumstances beyond Provider's control (force majeure).",
  },
  {
    heading: "13. TERMINATION",
    body: "Either party may terminate with thirty (30) days written notice. Provider may terminate immediately for cause including non-payment, AUP violations, or fraudulent activity. Upon termination, Platform access ceases and data export rights apply per Section 10.3.",
  },
  {
    heading: "14. DISCLAIMER OF WARRANTIES",
    body: "THE PLATFORM IS PROVIDED \"AS IS\" WITHOUT WARRANTY OF ANY KIND. PROVIDER DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. PROVIDER DOES NOT WARRANT THAT THE PLATFORM WILL MEET YOUR SPECIFIC BUSINESS REQUIREMENTS OR GENERATE ANY PARTICULAR BUSINESS RESULTS.",
  },
  {
    heading: "15. LIMITATION OF LIABILITY",
    body: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROVIDER'S TOTAL LIABILITY SHALL NOT EXCEED AMOUNTS PAID BY CLIENT IN THE THREE (3) MONTHS PRECEDING THE CLAIM. PROVIDER IS NOT LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES.",
  },
  {
    heading: "16. INDEMNIFICATION",
    body: "You agree to indemnify and hold harmless Ironwood Operations Group LLC, its officers, employees, and agents from any claims, damages, or expenses (including attorney's fees) arising from: (a) your use of the Platform in violation of these Terms; (b) your violation of any applicable law; (c) your infringement of any third-party rights; or (d) any content you publish through the Platform.",
  },
  {
    heading: "17. ELECTRONIC ACCEPTANCE",
    body: "By checking the acceptance box during onboarding, you acknowledge that: (a) you have read and understood these Terms; (b) you have authority to bind your business to these Terms; (c) electronic acceptance is legally equivalent to a handwritten signature under applicable law. Provider records the acceptance timestamp, IP address, and selected plan as proof of agreement.",
  },
  {
    heading: "18. GOVERNING LAW & DISPUTES",
    body: "These Terms are governed by the laws of the State of Texas. Any disputes shall be resolved in Cherokee County, Texas. You waive any objection to jurisdiction or venue in such courts.",
  },
  {
    heading: "19. MODIFICATIONS",
    body: "Provider may update these Terms with thirty (30) days notice via email. Continued use of the Platform after the effective date of changes constitutes acceptance. If you object to changes, your sole remedy is to terminate your subscription.",
  },
  {
    heading: "20. CONTACT",
    body: "Ironwood Operations Group LLC\nEmail: scott@homeflowpro.ai\nGoverning Jurisdiction: Cherokee County, Texas",
  },
];
