-- Migration: Add missing columns to students table for the comprehensive student profile
-- Run this in the Supabase SQL editor

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS admission_number TEXT,
  ADD COLUMN IF NOT EXISTS nemis_number TEXT,
  ADD COLUMN IF NOT EXISTS upi TEXT,
  ADD COLUMN IF NOT EXISTS kcpe_marks INTEGER,
  ADD COLUMN IF NOT EXISTS national_id TEXT,
  ADD COLUMN IF NOT EXISTS nita_number TEXT,
  ADD COLUMN IF NOT EXISTS epra_license_status TEXT DEFAULT 'None',
  ADD COLUMN IF NOT EXISTS kcse_grade TEXT,
  ADD COLUMN IF NOT EXISTS photo TEXT;
