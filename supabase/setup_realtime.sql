-- Run this SQL in the Supabase SQL Editor
-- This ensures that the required tables broadcast their changes to the realtime engine
-- so that connected clients (like PRISM) receive live updates.

-- Enable replica identity (full) to ensure old data is available on UPDATE/DELETE
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE chat_channels REPLICA IDENTITY FULL;
ALTER TABLE fee_payments REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- Add tables to the 'supabase_realtime' publication
-- The 'supabase_realtime' publication manages what is broadcast over websockets
DO $$
DECLARE
    target_pubname text := 'supabase_realtime';
BEGIN
    -- If publication doesn't exist, create it (usually it does in Supabase)
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = target_pubname) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Safely add tables if they aren't already part of the publication
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = target_pubname AND tablename = 'chat_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = target_pubname AND tablename = 'chat_channels') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_channels;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = target_pubname AND tablename = 'fee_payments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE fee_payments;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = target_pubname AND tablename = 'profiles') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    END IF;
END
$$;

