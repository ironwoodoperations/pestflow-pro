## S160.8 follow-up — Dang carve-out

S160.6 changed resolver output for all tenants. Dang is under a freeze rule until Kirk's DNS cutover — its rendering must be preserved. Added a slug-based carve-out at line 29 so Dang keeps returning 'modern-pro' (pre-S160.6 behavior) while the fix stays live for every other tenant. Carve-out is to be removed after DNS cutover.

**Retro lesson added:** When applying a fix to a shared resolver, explicitly verify EACH tenant the fix could affect — not just the ones known to be broken. The freeze rule's intent covers any code path whose output changes for that tenant, not just edits to that tenant's shell directory.
