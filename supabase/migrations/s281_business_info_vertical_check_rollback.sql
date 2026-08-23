-- S281 ROLLBACK — reverses 20260823210305_s281_business_info_vertical_check.sql.
--
-- DELIBERATELY has no timestamp prefix. A file named <timestamp>_*.sql in this
-- directory is a migration the CLI will APPLY, so a timestamped rollback sitting
-- after the constraint would drop it on the next `supabase db push` — the exact
-- opposite of what it is for. The CLI skips files that do not match the
-- timestamp convention, and this directory already contains fourteen such files,
-- so an untimestamped rollback is inert until someone runs it by hand.
--
-- Run only on purpose, against a named environment.

alter table public.settings drop constraint if exists settings_business_info_vertical_valid;

notify pgrst, 'reload schema';
