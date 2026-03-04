-- ==========================================
-- PRISM CLOUD STORAGE POLICIES
-- ==========================================
-- Storage bucket access control via RLS.
-- Run this after creating the buckets in the
-- Supabase Dashboard → Storage → New Bucket.
-- ==========================================

-- ==========================================
-- BUCKET 1: library_documents
-- Already used by LibraryTab.tsx for uploads.
-- ==========================================

-- Allow authenticated users to READ files
CREATE POLICY "Authenticated users can read library docs"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'library_documents'
        AND auth.role() = 'authenticated'
    );

-- Instructors and Admins can UPLOAD files
CREATE POLICY "Instructors and Admins can upload library docs"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'library_documents'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'instructor')
            AND is_active = true
        )
    );

-- Only Admins can DELETE library files
CREATE POLICY "Admins can delete library docs"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'library_documents'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Instructors can delete their own uploads
CREATE POLICY "Instructors can delete own library uploads"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'library_documents'
        AND owner = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'instructor'
            AND is_active = true
        )
    );


-- ==========================================
-- BUCKET 2: student_photos
-- For student profile images.
-- ==========================================

-- Authenticated users can view student photos
CREATE POLICY "Authenticated users can view student photos"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'student_photos'
        AND auth.role() = 'authenticated'
    );

-- Instructors and Admins can upload student photos
CREATE POLICY "Instructors and Admins can upload student photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'student_photos'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'instructor')
            AND is_active = true
        )
    );

-- Instructors and Admins can update/replace student photos
CREATE POLICY "Instructors and Admins can update student photos"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'student_photos'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'instructor')
            AND is_active = true
        )
    );

-- Admins can delete student photos
CREATE POLICY "Admins can delete student photos"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'student_photos'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );


-- ==========================================
-- BUCKET 3: certificates
-- For generated certificates and reports.
-- ==========================================

-- Authenticated users can view certificates
CREATE POLICY "Authenticated users can view certificates"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'certificates'
        AND auth.role() = 'authenticated'
    );

-- Only Admins can upload certificates
CREATE POLICY "Admins can upload certificates"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'certificates'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Only Admins can delete certificates
CREATE POLICY "Admins can delete certificates"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'certificates'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );


-- ==========================================
-- BUCKET 4: backups
-- For JSON database backups. Admin-only.
-- ==========================================

-- Admins only — read backups
CREATE POLICY "Admins can read backups"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'backups'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Admins only — write backups
CREATE POLICY "Admins can write backups"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'backups'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Admins only — delete old backups
CREATE POLICY "Admins can delete backups"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'backups'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND is_active = true
        )
    );
