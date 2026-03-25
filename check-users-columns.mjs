import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  const { data, error } = await supabase.from('users').select('*').limit(1)
  if (error) {
    console.error('Error fetching users:', error)
  } else if (data && data.length > 0) {
    console.log('Columns in users table:', Object.keys(data[0]))
  } else {
    console.log('No users found in the table.')
  }
}

checkColumns()
