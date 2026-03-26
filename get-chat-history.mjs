import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHistory() {
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching history:', error);
    return;
  }

  console.log('--- LATEST CHAT HISTORY ---');
  data.forEach(msg => {
    console.log(`[${msg.role}] ${msg.content.slice(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
  });
}

checkHistory();
