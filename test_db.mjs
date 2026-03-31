import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://xptxzdfowsmtxkqkluih.supabase.co';
const supabaseKey = 'sb_publishable_VnZnUaUJkMyKr4GRknyY6A_xcwbtY7V';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('schedules').select('*');
  console.log('All Schedules:', JSON.stringify(data, null, 2));
}
check();
