-- ============================================
-- MIGRATION: Health Logs Table
-- Jalankan script ini di Supabase SQL Editor
-- ============================================

-- 1. Create health_logs table
CREATE TABLE IF NOT EXISTS health_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours NUMERIC(3,1),          -- Jam tidur (misal 6.5)
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),  -- Rating mood 1-10
  water_glasses INTEGER DEFAULT 0,    -- Jumlah gelas air putih
  weight_kg NUMERIC(5,1),            -- Berat badan (kg)
  notes TEXT,                         -- Catatan keluhan fisik / kondisi umum
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Unique constraint: satu log per user per hari (upsert friendly)
ALTER TABLE health_logs
  ADD CONSTRAINT health_logs_user_date_unique UNIQUE (user_id, log_date);

-- 3. RLS (Row Level Security)
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health logs"
  ON health_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health logs"
  ON health_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health logs"
  ON health_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health logs"
  ON health_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Index for faster queries
CREATE INDEX idx_health_logs_user_date ON health_logs(user_id, log_date DESC);
