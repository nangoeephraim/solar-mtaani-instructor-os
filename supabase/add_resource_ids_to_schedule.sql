-- Migration: Add resource_ids column to schedule_slots
ALTER TABLE public.schedule_slots
ADD COLUMN IF NOT EXISTS resource_ids TEXT[] DEFAULT '{}';
