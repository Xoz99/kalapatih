import { createClient } from '@/lib/supabase/client'

// Generic SWR fetcher — key is just a string identifier used by SWR cache
// Actual data fetching is done via Supabase client

export async function fetchTasks() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchCalendarItems() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const [{ data: scheduleData }, { data: eventData }] = await Promise.all([
    supabase.from('schedules').select('*').eq('user_id', user.id),
    supabase.from('events').select('*').eq('user_id', user.id),
  ])

  const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const merged = [
    ...(scheduleData || []).map(s => ({ ...s, type: 'schedule' as const })),
    ...(eventData || []).map(e => {
      const [y, m, d] = e.event_date.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      return {
        ...e,
        type: 'event' as const,
        day_of_week: daysNames[dateObj.getDay()],
        subject: e.title,
        date_str: e.event_date,
      }
    }),
  ]

  return merged
}
