-- Migration: Add missing columns to schedule_slots for the new education levels system
-- Run this in the Supabase SQL editor

ALTER TABLE public.schedule_slots
  ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'L3',
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Solar',
  ADD COLUMN IF NOT EXISTS student_group TEXT DEFAULT 'Academy',
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';

-- Backfill existing rows: infer subject from type column
UPDATE public.schedule_slots
  SET subject = CASE WHEN type = 'ict' THEN 'ICT' ELSE 'Solar' END
  WHERE subject IS NULL OR subject = 'Solar';
