-- =============================================================================
-- Fix EXECUTE privileges for block_famous_person_photo_report_and_clear
-- Ensure anon and PUBLIC do not have EXECUTE privileges.
-- Only authenticated, service_role, and postgres (owner) should execute.
-- =============================================================================

REVOKE ALL ON FUNCTION public.block_famous_person_photo_report_and_clear(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.block_famous_person_photo_report_and_clear(uuid, uuid, text) FROM anon;

GRANT EXECUTE ON FUNCTION public.block_famous_person_photo_report_and_clear(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_famous_person_photo_report_and_clear(uuid, uuid, text) TO service_role;
