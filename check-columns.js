const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  "https://xptxzdfowsmtxkqkluih.supabase.co",
  "sb_publishable_VnZnUaUJkMyKr4GRknyY6A_xcwbtY7V"
)

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(1)
  if (error) {
    console.error('Error selecting users:', error)
    return
  }
  if (data && data.length > 0) {
    console.log('Columns in users table:', Object.keys(data[0]))
  } else {
    console.log('Users table is empty or no data found.')
  }
}

check()
