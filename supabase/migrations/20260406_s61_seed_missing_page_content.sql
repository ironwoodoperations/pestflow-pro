-- S61: Seed missing page_content rows for demo tenant
-- These pages were blank in ContentTab because rows didn't exist
INSERT INTO page_content (tenant_id, page_slug, title, subtitle, intro)
VALUES
  ('9215b06b-3eb5-49a1-a16e-7ff214bf6783', 'scorpion-control',    'Scorpion Control',          'Safe, effective scorpion treatments.',                   ''),
  ('9215b06b-3eb5-49a1-a16e-7ff214bf6783', 'pest-control',        'Pest Control Services',     'Comprehensive pest management solutions.',               ''),
  ('9215b06b-3eb5-49a1-a16e-7ff214bf6783', 'termite-inspections', 'Termite Inspections',       'Thorough inspections by certified professionals.',       ''),
  ('9215b06b-3eb5-49a1-a16e-7ff214bf6783', 'faq',                 'Frequently Asked Questions','Answers to common questions.',                           ''),
  ('9215b06b-3eb5-49a1-a16e-7ff214bf6783', 'wasp-hornet-control', 'Wasp & Hornet Control',     'Fast removal of stinging insects from your property.',   ''),
  ('9215b06b-3eb5-49a1-a16e-7ff214bf6783', 'bed-bug-control',     'Bed Bug Treatment',         'Sleep easy again — bed bugs eliminated.',                ''),
  ('9215b06b-3eb5-49a1-a16e-7ff214bf6783', 'flea-tick-control',   'Flea & Tick Control',       'Protect your family and pets.',                          ''),
  ('9215b06b-3eb5-49a1-a16e-7ff214bf6783', 'rodent-control',      'Rodent Control',            'Exclusion and elimination, done right.',                 '')
ON CONFLICT (tenant_id, page_slug) DO NOTHING;
