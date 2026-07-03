-- Migration: Add enhanced columns to library_resources
ALTER TABLE public.library_resources 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS downloads_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS academic_term INTEGER CHECK (academic_term IN (1, 2, 3)),
ADD COLUMN IF NOT EXISTS uploaded_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update existing records to link uploaded_by_id if possible
UPDATE public.library_resources r
SET uploaded_by_id = p.id
FROM public.profiles p
WHERE p.name = r.uploaded_by AND r.uploaded_by_id IS NULL;

-- Recreate RLS Policies to be secure and support owners
DROP POLICY IF EXISTS "Enable read access for all users" ON public.library_resources;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.library_resources;
DROP POLICY IF EXISTS "Enable update access for admins and uploaders" ON public.library_resources;
DROP POLICY IF EXISTS "Enable delete access for admins and uploaders" ON public.library_resources;

-- Read policy: Anyone authenticated can read
CREATE POLICY "Enable read access for all users" ON public.library_resources
    FOR SELECT USING (auth.role() = 'authenticated');

-- Insert policy: Authenticated users can insert
CREATE POLICY "Enable insert access for all users" ON public.library_resources
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND (uploaded_by_id IS NULL OR uploaded_by_id = auth.uid())
    );

-- Update policy: Only admins or the uploader can update
CREATE POLICY "Enable update access for admins and uploaders" ON public.library_resources
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND (
            uploaded_by_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Delete policy: Only admins or the uploader can delete
CREATE POLICY "Enable delete access for admins and uploaders" ON public.library_resources
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND (
            uploaded_by_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- RPC for incrementing download counts safely
CREATE OR REPLACE FUNCTION public.increment_library_download(resource_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.library_resources
    SET downloads_count = COALESCE(downloads_count, 0) + 1
    WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
