-- ========================================================
-- PRISM INSTRUCTOR OS - MEETING FILES STORAGE POLICIES
-- Purpose: Storage bucket and RLS for in-meeting file
--          sharing via supabase.storage.from('meeting_files')
-- ========================================================
-- PREREQUISITE: Create the `meeting_files` bucket first in
-- Supabase Dashboard → Storage → New Bucket (public: true).
-- ========================================================

-- Allow authenticated users to READ meeting files
CREATE POLICY "Authenticated users can read meeting files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'meeting_files'
        AND auth.role() = 'authenticated'
    );

-- Allow authenticated users to UPLOAD meeting files
-- Files are organized under {meeting_code}/{timestamp}_{filename}
CREATE POLICY "Authenticated users can upload meeting files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'meeting_files'
        AND auth.role() = 'authenticated'
    );

-- Allow users to UPDATE their own uploads (e.g., overwrite)
CREATE POLICY "Users can update own meeting files"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'meeting_files'
        AND auth.role() = 'authenticated'
        AND owner = auth.uid()
    );

-- Admins can delete any meeting file; regular users can delete their own
CREATE POLICY "Users can delete own meeting files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'meeting_files'
        AND auth.role() = 'authenticated'
        AND (
            owner = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );
