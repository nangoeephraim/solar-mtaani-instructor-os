-- ========================================================
-- PRISM INSTRUCTOR OS - RELOAD SCHEMA CACHE
-- Purpose: Forces Supabase PostgREST to reload the schema cache.
-- Run this if the frontend complains about "Could not find column... in schema cache".
-- ========================================================

NOTIFY pgrst, 'reload schema';
