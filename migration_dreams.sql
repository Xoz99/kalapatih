-- Create dreams table
CREATE TABLE IF NOT EXISTS public.dreams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT DEFAULT 'active', -- 'active', 'achieved', 'paused'
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;

-- Allow all access for MVP
CREATE POLICY "Allow all access" ON public.dreams FOR ALL USING (true) WITH CHECK (true);
