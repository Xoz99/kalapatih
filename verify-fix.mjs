import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing to avoid dependencies
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verify() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log("No user found in session.");
        return;
    }
    
    console.log("Checking events for user:", user.id);
    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error("Error fetching events:", error);
    } else {
        console.log("Latest Events:", JSON.stringify(events, null, 2));
    }
}

verify();
