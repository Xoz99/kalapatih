-- COMPREHENSIVE RLS FIX FOR PATIH AI
-- Run this in Supabase SQL Editor to fix 403/400 errors

-- 1. Users Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.users;
CREATE POLICY "Allow all access" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 2. Events Table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.events;
CREATE POLICY "Allow all access" ON public.events FOR ALL USING (true) WITH CHECK (true);

-- 3. Tasks Table
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.tasks;
CREATE POLICY "Allow all access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- 4. Schedules Table
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.schedules;
CREATE POLICY "Allow all access" ON public.schedules FOR ALL USING (true) WITH CHECK (true);

-- 5. Dreams Table (If already created)
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.dreams;
CREATE POLICY "Allow all access" ON public.dreams FOR ALL USING (true) WITH CHECK (true);

-- 6. User Logs (Historical)
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.user_logs;
CREATE POLICY "Allow all access" ON public.user_logs FOR ALL USING (true) WITH CHECK (true);
