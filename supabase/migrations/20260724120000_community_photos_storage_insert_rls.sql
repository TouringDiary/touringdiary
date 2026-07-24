-- =============================================================================
-- PROPOSED — NOT APPLIED (awaiting architectural review / PO approval)
-- =============================================================================
-- TEMP / REVIEW: community-photos storage INSERT RLS
--
-- Runtime failure fixed by this policy (when applied):
--   StorageApiError: new row violates row-level security policy
--   on bucket community-photos
--
-- Facts (verified before writing this file):
--   - DB has SELECT policies on community-photos; no INSERT policy
--   - Repo never versioned an INSERT policy for this bucket (gap B)
--
-- App contract (src/services/photoService.ts → uploadCommunityPhoto):
--   path = `{locationName}/{userId}_{timestamp}_{safeName}`
--   client = anon key + user JWT (authenticated); guests blocked in UI before publish
--
-- DO NOT run `supabase db push` / `migration up` until review approves.
-- =============================================================================

-- INSERT only. Do not alter existing SELECT policies on this bucket.
-- Least privilege: authenticated role only; bucket scoped; object name must
-- start (final path segment) with auth.uid() — matches app fileName prefix.

CREATE POLICY "community_photos_storage_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'community-photos'
    AND auth.uid() IS NOT NULL
    AND array_length(string_to_array(name, '/'), 1) >= 2
    AND (string_to_array(name, '/'))[array_length(string_to_array(name, '/'), 1)]
        LIKE (auth.uid()::text || '_%')
  );
