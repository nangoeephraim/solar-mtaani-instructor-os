-- Migration: Add missing columns to resources
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS capacity INTEGER,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS usage_history JSONB DEFAULT '[]'::jsonb;

-- Setup ID default to uuid_generate_v4() cast to text
ALTER TABLE public.resources ALTER COLUMN id SET DEFAULT public.uuid_generate_v4()::text;

-- Update constraints for type column
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.resources'::regclass 
          AND contype = 'c' 
          AND consrc LIKE '%type%'
    LOOP
        EXECUTE 'ALTER TABLE public.resources DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE public.resources ADD CONSTRAINT resources_type_check CHECK (type IN ('room', 'equipment', 'other', 'material'));
