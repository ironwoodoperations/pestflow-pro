export function getPrivacyPolicy(businessName: string): string {
  return `${businessName} ("we," "us," or "our") operates as a licensed pest control service provider. This Privacy Policy explains how we collect, use, and protect your information when you use our website or request services.

INFORMATION WE COLLECT

We collect personal information you voluntarily provide when requesting a quote, scheduling service, or contacting us:
• Name, phone number, and email address
• Service address and property details
• Payment information (processed securely through our payment processor — we do not store card numbers)
• Service history and treatment records

We also collect limited technical data automatically, including your browser type and the pages you visit, solely to improve website performance.

HOW WE USE YOUR INFORMATION

We use your information to:
• Schedule and perform pest control services at your property
• Send appointment reminders and follow-up communications
• Process payments and send invoices
• Respond to your questions and service requests
• Comply with licensing and record-keeping requirements

We do not sell, rent, or share your personal information with third parties for marketing purposes. Information may be shared only as required by law, to process payments, or to deliver services you requested.

COOKIES

Our website uses session cookies solely to support the customer login area. We do not use advertising, tracking, or analytics cookies. You may disable cookies in your browser settings without affecting your ability to request services.

DATA RETENTION

We retain customer records for as long as required to provide ongoing services or as required by applicable law. You may request deletion of your personal information by contacting us directly.

YOUR RIGHTS

You have the right to:
• Request a copy of the personal information we hold about you
• Request correction of inaccurate information
• Request deletion of your information (subject to legal retention requirements)

CONTACT US

For privacy questions or to exercise your rights, contact ${businessName} directly by phone or email as listed on our website. We will respond within a reasonable time.

This policy was last reviewed and is effective as of the date shown above.`
}

export function getTermsOfService(businessName: string): string {
  return `These Terms of Service ("Terms") govern your use of services provided by ${businessName} ("Company," "we," or "us"). By scheduling service or using our website, you agree to these Terms.

SERVICE AGREEMENT

${businessName} agrees to perform pest control services at the agreed-upon service address on the scheduled date(s). We will use commercially reasonable methods appropriate for the pest type and property conditions.

Pest control is not a guarantee of complete elimination. Pest activity is affected by weather, neighboring properties, sanitation conditions, and factors outside our control. We will re-treat at no charge if covered pests return between scheduled visits under an active service plan.

CUSTOMER RESPONSIBILITIES

You agree to:
• Provide accurate property and contact information
• Ensure access to the service area on scheduled dates
• Follow any preparation instructions provided prior to treatment
• Notify us of any health conditions, allergies, or pets that may affect treatment

PAYMENT TERMS

Payment is due at the time of service unless a billing arrangement has been established in advance. Recurring service plans are billed on the agreed schedule. Returned payments may be subject to a processing fee.

CANCELLATION POLICY

You may cancel a scheduled appointment with at least 24 hours' notice at no charge. Cancellations with less than 24 hours' notice or no-shows may be subject to a service call fee.

Service plan cancellations may be made at any time. Any prepaid services not yet rendered will be refunded on a pro-rated basis.

LIMITATION OF LIABILITY

To the fullest extent permitted by applicable law, ${businessName}'s liability for any claim arising from services rendered is limited to the cost of the service performed. We are not liable for indirect, incidental, or consequential damages.

We carry general liability insurance as required by our state license. A certificate of insurance is available upon request.

GOVERNING LAW

These Terms are governed by the laws of the State of Texas. Any disputes shall be resolved in the courts of Smith County, Texas, or through binding arbitration as mutually agreed.

CHANGES TO TERMS

We may update these Terms from time to time. Continued use of our services after changes are posted constitutes acceptance of the updated Terms.

If you have questions about these Terms, please contact ${businessName} directly.`
}

export function getSmsTerms(businessName: string): string {
  return `SMS TERMS & CONDITIONS

${businessName} operates an SMS messaging program to send appointment reminders, service updates, and promotional offers to customers who opt in.

OPT-IN

You may opt in to receive SMS messages from ${businessName} by:
• Providing your mobile number on our website quote form
• Texting START to our business number
• Verbally consenting during a service call

By opting in, you consent to receive text messages from ${businessName} at the mobile number provided.

MESSAGE FREQUENCY

Message frequency varies. You may receive up to 4 messages per month depending on your service schedule and any active promotions.

MESSAGE & DATA RATES

Standard message and data rates may apply depending on your mobile carrier and plan. ${businessName} does not charge for SMS messages, but your carrier's standard rates apply.

OPT-OUT

You may opt out at any time by replying STOP to any message you receive from us. After opting out, you will receive one final confirmation message and no further SMS messages will be sent.

HELP

Reply HELP to any message for assistance, or contact ${businessName} directly by phone or email.

PRIVACY

We do not share, sell, or transfer your mobile number or SMS opt-in information to third parties for marketing purposes. Your opt-in data is used solely to deliver the messages described above.

CARRIERS

${businessName}'s SMS program is compatible with most major US carriers. Carrier support and delivery are not guaranteed.

CONTACT

For questions about this SMS program, contact ${businessName} by phone or email as listed on our website.`
}
