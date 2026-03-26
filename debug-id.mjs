
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing since dotenv is missing
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('--- DEBUG PUBLIC.USERS ---');
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    users.forEach(u => console.log(`User: ${u.id} | Name: ${u.name}`));
  }

  console.log('\n--- DEBUG ALL FRIDAY SCHEDULES ---');
  const { data: allSch, error: allErr } = await supabase
    .from('schedules')
    .select('*')
    .eq('day_of_week', 'Friday');
  if (allErr) console.error('Error:', allErr);
  else allSch.forEach(s => console.log(`[User: ${s.user_id}] ${s.subject} | ${s.start_time}-${s.end_time}`));
}

debug();
