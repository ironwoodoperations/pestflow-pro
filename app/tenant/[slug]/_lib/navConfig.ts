// Slugs for legal/utility pages that live under the footer instead of the
// Services dropdown. They share the page_content table with regular pages,
// so excluding them by slug is the de-facto categorization (no schema flag).
export const CUSTOM_PAGE_SLUGS = ['accessibility', 'privacy', 'sms-terms', 'terms'] as const;

// Slugs that are not pest services (rendered elsewhere in nav, never the dropdown).
export const NON_SERVICE_SLUGS = ['home', 'about', 'contact', 'faq', 'quote'] as const;
