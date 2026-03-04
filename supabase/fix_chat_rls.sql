-- ========================================================
-- PRISM INSTRUCTOR OS - FIX CHAT RLS POLICIES
-- ========================================================
-- Problem: The UPDATE policy was too restrictive, blocking:
--   1. Emoji reactions on other users' messages
--   2. Soft-deleting messages (uses UPDATE to set is_deleted=true)
--   3. Pinning messages by non-owners
--
-- The old policy checked: sender_id = auth.uid() OR is_pinned = true OR reactions != '{}'
-- This fails because:
--   - First reaction: reactions IS '{}', so the condition fails
--   - Pinning: is_pinned is false before pinning, so the condition fails
--   - Soft delete of others' msgs: sender_id isn't the current user
--
-- Fix: Allow any authenticated user to UPDATE messages.
-- Content edits are guarded in the frontend to only allow the sender.
-- ========================================================

-- Drop the old broken policy
DROP POLICY IF EXISTS "Message senders can update their own messages" ON public.chat_messages;

-- New permissive policy: any authenticated user can update messages
CREATE POLICY "Authenticated users can update chat messages"
    ON public.chat_messages FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Reload PostgREST Cache
NOTIFY pgrst, 'reload schema';
