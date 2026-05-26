-- suggested_at is AI suggestion metadata (see 20260402_suitcase_v2_evolution).
-- Manual user items must not require a suggestion timestamp.

ALTER TABLE public.suitcase_items
  ALTER COLUMN suggested_at DROP NOT NULL;

COMMENT ON COLUMN public.suitcase_items.suggested_at IS
  'Timestamp when the item was suggested by AI. NULL for manual user-created items.';
