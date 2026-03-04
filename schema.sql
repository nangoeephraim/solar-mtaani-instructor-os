-- PRISM Instructor OS: Supabase Postgres Schema

-- ==========================================
-- 1. Profiles Table (extends auth.users)
-- ==========================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'viewer')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
-- Everyone can read profiles (needed for chat and seeing who uploaded library docs)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- Only users can update their own profile name/avatar
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 2. App Settings Table (Global Config)
-- ==========================================
CREATE TABLE public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    organization_name TEXT DEFAULT 'PRISM Academy',
    allow_instructor_invites BOOLEAN DEFAULT false,
    require_approval BOOLEAN DEFAULT true,
    default_role TEXT DEFAULT 'viewer',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are viewable by everyone" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Only admins can update settings" ON public.app_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- ==========================================
-- 3. Students Table
-- ==========================================
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    subject TEXT NOT NULL,
    attendance_pct NUMERIC(5,2) DEFAULT 0,
    lot TEXT DEFAULT 'A',
    student_group TEXT DEFAULT 'Academy',
    
    -- JSONB columns for flexible data structures that don't need strict relational querying yet
    assessment JSONB DEFAULT '{"units": {}, "termStats": []}'::jsonb,
    attendance_history JSONB DEFAULT '[]'::jsonb,
    notes JSONB DEFAULT '[]'::jsonb,
    competencies JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view students" ON public.students FOR SELECT USING (true);
-- Admins and Instructors can manage students. Viewers cannot.
CREATE POLICY "Admins/Instructors can insert students" ON public.students FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
);
CREATE POLICY "Admins/Instructors can update students" ON public.students FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
);
CREATE POLICY "Only admins can delete students" ON public.students FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- ==========================================
-- 4. Schedule Slots Table
-- ==========================================
CREATE TABLE public.schedule_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    type TEXT NOT NULL,
    location TEXT,
    instructor TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view schedule" ON public.schedule_slots FOR SELECT USING (true);
-- Admins and Instructors can manage the timetable
CREATE POLICY "Admins/Instructors can manage schedule" ON public.schedule_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
);


-- ==========================================
-- 5. Resources Table (Equipment/Rooms)
-- ==========================================
CREATE TABLE public.resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('room', 'equipment', 'material')),
    status TEXT DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Admins/Instructors can manage resources" ON public.resources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'instructor'))
);


-- ==========================================
-- 6. Chat & Communications
-- ==========================================
CREATE TABLE public.chat_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('chat', 'announcement', 'dm')),
    description TEXT,
    participants UUID[] DEFAULT '{}', -- Array of user IDs for DMs, empty for public
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id TEXT NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '{}'::jsonb, -- e.g., {"👍": ["user_id_1", "user_id_2"]}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Channel Policies: Anyone can view public channels. For DMs, user must be in participants.
CREATE POLICY "View Channels" ON public.chat_channels FOR SELECT USING (
  type != 'dm' OR (auth.uid() = ANY(participants))
);
CREATE POLICY "Manage Channels" ON public.chat_channels FOR ALL USING (
   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR created_by = auth.uid()
);

-- Message Policies: Can read messages if they can read the channel
CREATE POLICY "Read Messages" ON public.chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_channels WHERE id = channel_id AND (type != 'dm' OR auth.uid() = ANY(participants)))
);
-- Anyone can insert messages to channels they have access to
CREATE POLICY "Insert Messages" ON public.chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.chat_channels WHERE id = channel_id AND (type != 'dm' OR auth.uid() = ANY(participants)))
);
-- Can only update/edit their own messages (or admins can pin)
CREATE POLICY "Update Messages" ON public.chat_messages FOR UPDATE USING (
  sender_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- ==========================================
-- REALTIME PUBLICATIONS
-- ==========================================
-- Turn on realtime for specific tables so the app gets instant websocket updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Initial Database Seeding
INSERT INTO public.app_settings (id, organization_name) VALUES ('global', 'PRISM Academy') ON CONFLICT DO NOTHING;
INSERT INTO public.chat_channels (id, name, type, description) VALUES 
('chan_general', 'General Support', 'chat', 'General chat and instructor support'),
('chan_announcements', 'Announcements', 'announcement', 'Official campus broadcasts')
ON CONFLICT DO NOTHING;
