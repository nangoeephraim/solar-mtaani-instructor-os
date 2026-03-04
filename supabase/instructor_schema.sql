-- =============================================
-- MULTI-INSTRUCTOR SUPPORT SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Instructor Profiles
CREATE TABLE IF NOT EXISTS public.instructor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT NOT NULL DEFAULT 'Solar', -- 'Solar' | 'ICT'
  qualification TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Class Assignments (which instructor teaches which grade/subject/term)
CREATE TABLE IF NOT EXISTS public.class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,           -- e.g. 'L3', 'G7', 'F2'
  subject TEXT NOT NULL,         -- 'Solar' | 'ICT'
  student_group TEXT,            -- 'Campus' | 'Academy' | 'CBC' | 'High School'
  term INTEGER CHECK (term IN (1, 2, 3)),
  academic_year TEXT,            -- e.g. '2026'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(instructor_id, grade, subject, term, academic_year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user_id ON public.instructor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_instructor ON public.class_assignments(instructor_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_grade_subject ON public.class_assignments(grade, subject);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;

-- Instructors can read all instructor profiles
CREATE POLICY "Authenticated users can read instructor_profiles"
  ON public.instructor_profiles FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- Only admins can insert/update/delete instructor profiles
CREATE POLICY "Admins can manage instructor_profiles"
  ON public.instructor_profiles FOR ALL
  USING ((select auth.role()) = 'authenticated');

-- Authenticated users can read class assignments
CREATE POLICY "Authenticated users can read class_assignments"
  ON public.class_assignments FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- Only admins can manage class assignments
CREATE POLICY "Admins can manage class_assignments"
  ON public.class_assignments FOR ALL
  USING ((select auth.role()) = 'authenticated');

-- =============================================
-- VIEW: Instructor workload summary
-- =============================================

CREATE OR REPLACE VIEW public.instructor_workload AS
SELECT
  ip.id AS instructor_id,
  ip.full_name,
  ip.subject AS primary_subject,
  ip.is_active,
  COUNT(DISTINCT ca.id) AS total_assignments,
  COUNT(DISTINCT ca.grade) AS unique_grades,
  ARRAY_AGG(DISTINCT ca.grade) FILTER (WHERE ca.is_active = true) AS assigned_grades,
  ARRAY_AGG(DISTINCT ca.subject) FILTER (WHERE ca.is_active = true) AS assigned_subjects
FROM public.instructor_profiles ip
LEFT JOIN public.class_assignments ca ON ca.instructor_id = ip.id AND ca.is_active = true
GROUP BY ip.id, ip.full_name, ip.subject, ip.is_active;

-- Set security invoker for performance
ALTER VIEW public.instructor_workload SET (security_invoker = on);

-- =============================================
-- AUTO-CREATE INSTRUCTOR PROFILE ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.auto_create_instructor_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.instructor_profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_instructor ON auth.users;
CREATE TRIGGER on_auth_user_created_instructor
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_instructor_profile();
