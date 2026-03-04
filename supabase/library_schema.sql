-- Drop existing if any
DROP TABLE IF EXISTS public.library_resources CASCADE;

-- Create the Library Resources table
CREATE TABLE public.library_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    size BIGINT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    download_url TEXT
);

-- Turn on RLS
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Enable read access for all users" ON public.library_resources
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert access to all authenticated users
CREATE POLICY "Enable insert access for all users" ON public.library_resources
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow update access for admins or the uploader
CREATE POLICY "Enable update access for admins and uploaders" ON public.library_resources
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Allow delete access for admins or the uploader
CREATE POLICY "Enable delete access for admins and uploaders" ON public.library_resources
    FOR DELETE USING (
        auth.role() = 'authenticated'
    );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.library_resources;
