-- Update users table with gamification and body stats
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS weight_kg FLOAT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS height_cm FLOAT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sleep_hours FLOAT DEFAULT 0;

-- Create habits table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    frequency TEXT DEFAULT 'daily',
    xp_reward INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create habit_logs table
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    completed_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Add policies (Allow all for MVP consistency with existing policies)
CREATE POLICY "Allow all access" ON public.habits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.habit_logs FOR ALL USING (true) WITH CHECK (true);

-- Insert some default habits for "Glowup"
-- Note: Replace '{USER_ID}' with actual ID or handle it in the application layer
-- For now, we'll let the application layer create the first habits if they don't exist.
