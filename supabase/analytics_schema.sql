-- ==========================================
-- PRISM ADVANCED ANALYTICS SERVER COMPUTATION
-- ==========================================
-- This script shifts heavy data calculations from 
-- the user's browser to the Postgres server.

-- 1. VIEW: Student Performance Summary
-- Pre-calculates the average competency score and overall attendance 
-- for each student to avoid downloading the heavy JSON payloads.
CREATE OR REPLACE VIEW public.student_performance_summary AS
SELECT 
    s.id,
    s.name,
    s.grade,
    s.subject,
    s.attendance_pct,
    (
        SELECT COALESCE(AVG(value::text::numeric), 0)
        FROM jsonb_each(s.competencies)
    ) as avg_score
FROM 
    public.students s;

-- 2. RPC: Get Class Averages
-- Calculates the total class average score and attendance rate.
CREATE OR REPLACE FUNCTION get_class_averages()
RETURNS TABLE (
    overall_avg_score numeric,
    overall_avg_attendance numeric,
    total_students bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(avg_score)::numeric, 2) as overall_avg_score,
        ROUND(AVG(attendance_pct)::numeric, 2) as overall_avg_attendance,
        COUNT(id) as total_students
    FROM public.student_performance_summary;
END;
$$;

-- 3. RPC: Get Subject Comparison
-- Aggregates performance by subject (Solar vs ICT)
CREATE OR REPLACE FUNCTION get_subject_comparison()
RETURNS TABLE (
    subject text,
    avg_score numeric,
    student_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sps.subject,
        ROUND(AVG(sps.avg_score)::numeric, 2) as avg_score,
        COUNT(sps.id) as student_count
    FROM public.student_performance_summary sps
    GROUP BY sps.subject;
END;
$$;

-- 4. RPC: Get At-Risk Students
-- Identifies students struggling (score < 2.5) or severely missing class (attendance < 80%)
CREATE OR REPLACE FUNCTION get_at_risk_students()
RETURNS TABLE (
    id uuid,
    name text,
    subject text,
    avg_score numeric,
    attendance_pct numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sps.id,
        sps.name,
        sps.subject,
        sps.avg_score,
        sps.attendance_pct
    FROM public.student_performance_summary sps
    WHERE sps.avg_score < 2.5 OR sps.attendance_pct < 80
    ORDER BY sps.avg_score ASC;
END;
$$;

-- Example of a complex RPC to get grade distributions
CREATE OR REPLACE FUNCTION get_grade_distribution()
RETURNS TABLE (
    grade integer,
    student_count bigint,
    avg_score numeric,
    avg_attendance numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sps.grade,
        COUNT(sps.id) as student_count,
        ROUND(AVG(sps.avg_score)::numeric, 2) as avg_score,
        ROUND(AVG(sps.attendance_pct)::numeric, 2) as avg_attendance
    FROM public.student_performance_summary sps
    GROUP BY sps.grade
    ORDER BY sps.grade;
END;
$$;
