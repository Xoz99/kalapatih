-- Fix for habit persistence (Run this in Supabase SQL Editor if habits aren't saving)
ALTER TABLE public.habit_logs DROP CONSTRAINT IF EXISTS habit_logs_habit_id_fkey;
ALTER TABLE public.habit_logs ALTER COLUMN habit_id TYPE TEXT;

-- Verify columns in users table (just in case)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weight_kg FLOAT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS height_cm FLOAT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sleep_hours FLOAT DEFAULT 0;

-- Ensure user_logs exists for tracking history
CREATE TABLE IF NOT EXISTS public.user_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    weight_kg FLOAT,
    height_cm FLOAT,
    logged_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
