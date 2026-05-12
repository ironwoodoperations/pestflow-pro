-- S213a: swap stale email addresses in master tenant (pestflow-pro) settings.
-- business_info.email: sales@pestflowpro.com → sales@homeflowpro.ai
UPDATE public.settings
SET value = jsonb_set(value, '{email}', '"sales@homeflowpro.ai"')
WHERE tenant_id = '9215b06b-3eb5-49a1-a16e-7ff214bf6783'
  AND key = 'business_info'
  AND value->>'email' = 'sales@pestflowpro.com';

-- notifications.monthly_report_email: sales@ironwoodoperationsgroup.com → sales@homeflowpro.ai
-- Applies to all tenants with the stale value.
UPDATE public.settings
SET value = jsonb_set(value, '{monthly_report_email}', '"sales@homeflowpro.ai"')
WHERE key = 'notifications'
  AND value->>'monthly_report_email' = 'sales@ironwoodoperationsgroup.com';
