-- S336 ROLLBACK — drop the three merge functions.
--
-- SAFE WHILE NOTHING CALLS THEM, and only while that holds. As of S336 the
-- helper is NOT wired: provision-tenant still merges in TypeScript, no view or
-- generated column references these, and no RLS policy calls them. Dropping
-- them therefore changes no behaviour.
--
-- ONCE THE PROVISIONING RPC CALLS merge_setting_value, THIS FILE IS NO LONGER A
-- ROLLBACK. Dropping a function the RPC depends on breaks provisioning outright
-- (and CASCADE would silently drop the RPC with it). At that point the correct
-- rollback is whatever that change ships with, not this.
--
-- Deliberately NOT CASCADE: if something has come to depend on these, the drop
-- should FAIL and say so rather than quietly removing the dependent.

DROP FUNCTION IF EXISTS public.merge_setting_value(jsonb, jsonb, text);
DROP FUNCTION IF EXISTS public.jsonb_drop_empty_overwrites(jsonb, jsonb);
DROP FUNCTION IF EXISTS public.jsonb_is_empty_overlay(jsonb);

NOTIFY pgrst, 'reload schema';
