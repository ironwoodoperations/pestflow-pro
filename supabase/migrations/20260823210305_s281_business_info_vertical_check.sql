-- S281: restrict settings.business_info.vertical to the copy-complete verticals.
--
-- getVerticalCopy() and getSchemaVocabulary() both THROW on an unknown vertical,
-- and both are called from app/tenant/[slug]/layout.tsx. A JSONB edit setting a
-- vertical with no preset therefore takes an entire tenant site down with no
-- deploy involved. This constraint makes that edit fail at the database instead.
--
-- NULL is permitted deliberately: eight of nine tenants have no vertical set and
-- rely on the code default. Tightening to NOT NULL is a separate step, valid
-- only once every tenant has a preset to declare.
--
-- Widen the IN list in the SAME migration that adds a new preset to
-- src/shells/_shared/verticalCopy.ts. Code first, then this.
alter table public.settings
  add constraint settings_business_info_vertical_valid
  check (
    key <> 'business_info'
    or value->>'vertical' is null
    or value->>'vertical' in ('pest', 'irrigation')
  );

notify pgrst, 'reload schema';
