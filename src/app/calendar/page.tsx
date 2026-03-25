'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  X
} from 'lucide-react'

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarPage() {
  const supabase = createClient()
  const [items, setItems] = useState<{ id: string; subject?: string; title?: string; type: string; day_of_week?: string; date_str?: string; start_time?: string; end_time?: string; room?: string; location?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{ id: string; subject?: string; title?: string; type: string; day_of_week?: string; date_str?: string; start_time?: string; end_time?: string; room?: string; location?: string } | null>(null)
  
  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)

      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
      
      const merged = [
        ...(scheduleData || []).map(s => ({ ...s, type: 'schedule' })),
        ...(eventData || []).map(e => {
            const [y, m, d] = e.event_date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return { 
                ...e, 
                type: 'event', 
                day_of_week: daysNames[dateObj.getDay()], 
                subject: e.title,
                date_str: e.event_date 
            };
        })
      ]
      setItems(merged)
      setLoading(false)
    }
    fetchData()
  }, [supabase]);

  const refreshData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: scheduleData } = await supabase.from('schedules').select('*').eq('user_id', user.id)
    const { data: eventData } = await supabase.from('events').select('*').eq('user_id', user.id)
    
    const merged = [
      ...(scheduleData || []).map(s => ({ ...s, type: 'schedule' })),
      ...(eventData || []).map(e => {
          const [y, m, d] = e.event_date.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return { ...e, type: 'event', day_of_week: daysNames[dateObj.getDay()], subject: e.title, date_str: e.event_date };
      })
    ]
    setItems(merged)
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormDate(formatDate(selectedDate))
    setFormStartTime('19:00')
    setFormEndTime('20:00')
    setIsModalOpen(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenEdit = (item: any) => {
    setEditingItem(item)
    setFormTitle(item.subject)
    setFormDate(item.event_date || formatDate(selectedDate))
    setFormStartTime(item.start_time?.slice(0, 5) || '19:00')
    setFormEndTime(item.end_time?.slice(0, 5) || '20:00')
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Yakin mau hapus agenda ini, bos?')) return
    const table = type === 'event' ? 'events' : 'schedules'
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) alert('Gagal hapus: ' + error.message)
    else refreshData()
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      user_id: user.id,
      title: formTitle,
      event_date: formDate,
      start_time: formStartTime,
      end_time: formEndTime
    }

    if (editingItem) {
        const table = editingItem.type === 'event' ? 'events' : 'schedules'
        const updatePayload = editingItem.type === 'event' 
            ? { title: formTitle, event_date: formDate, start_time: formStartTime, end_time: formEndTime }
            : { subject: formTitle, day_of_week: new Date(formDate).toLocaleDateString('en-US', { weekday: 'long' }), start_time: formStartTime, end_time: formEndTime }
        
        const { error } = await supabase.from(table).update(updatePayload).eq('id', editingItem.id)
        if (error) alert('Gagal update: ' + error.message)
    } else {
        const { error } = await supabase.from('events').insert(payload)
        if (error) alert('Gagal nambah: ' + error.message)
    }

    setIsModalOpen(false)
    refreshData()
  }

  // Grid Calculation
  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const prevMonthDays = new Date(year, month, 0).getDate()
    
    const grid = []
    
    // Fill leading days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        grid.push({
            day: prevMonthDays - i,
            month: month - 1,
            year: month === 0 ? year - 1 : year,
            isCurrentMonth: false
        })
    }
    
    // Fill current month days
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push({
            day: i,
            month: month,
            year: year,
            isCurrentMonth: true
        })
    }
    
    // Fill trailing days from next month
    const remainingSlots = 42 - grid.length
    for (let i = 1; i <= remainingSlots; i++) {
        grid.push({
            day: i,
            month: month + 1,
            year: month === 11 ? year + 1 : year,
            isCurrentMonth: false
        })
    }
    
    return grid
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(new Date(today))
    setSelectedDate(new Date(today))
  }

  // Filter items for the selected date
  const selectedDateItems = useMemo(() => {
    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = daysNames[selectedDate.getDay()]
    const dateStrFormatted = formatDate(selectedDate)
    
    return items.filter(item => {
        if (item.type === 'schedule') return item.day_of_week === dayName
        if (item.type === 'event') return item.date_str === dateStrFormatted
        return false
    }).sort((a,b) => (a.start_time || '').localeCompare(b.start_time || ''))
  }, [selectedDate, items])

  return (
    <div className="max-w-[1536px] mx-auto px-6 md:px-10 h-full flex flex-col lg:flex-row gap-8 animate-in fade-in duration-1000 pb-20 lg:pb-0">
      
      {/* Sidebar Detail View (Left side on Desktop, Top on Mobile) */}
      <div className="w-full lg:w-80 shrink-0 space-y-8 flex flex-col">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-none">Agenda <span className="gold-text-gradient block sm:inline">Gaskeun</span></h1>
            <button 
                onClick={handleOpenAdd}
                className="lg:hidden p-3 bg-[#d4af37] text-black rounded-2xl shadow-lg shadow-gold-900/40 active:scale-95 transition-all"
            >
                <Plus size={20} />
            </button>
          </div>
          <p className="text-slate-500 mt-3 font-bold uppercase tracking-widest text-[10px] md:text-xs opacity-80 leading-relaxed md:max-w-xs">
            {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <button 
            onClick={handleOpenAdd}
            className="hidden lg:flex items-center justify-center space-x-2 w-full py-4 bg-gradient-to-br from-[#d4af37] to-[#aa8418] text-black rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-gold-900/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
            <Plus size={16} />
            <span>Tambah Event</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar max-h-[400px] lg:max-h-none">
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Sparkles className="animate-spin text-[#d4af37]" />
                </div>
            ) : selectedDateItems.length > 0 ? (
                selectedDateItems.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="bg-[#0d0d0d] border border-white/5 p-5 rounded-[2.2rem] shadow-2xl shadow-black hover:border-[#d4af37]/30 transition-all duration-300 group relative overflow-hidden">
                         <div className="flex items-center justify-between mb-3">
                            <span className={`text-[7px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${
                                item.type === 'event' ? 'bg-white/10 text-slate-300' : 'bg-[#d4af37]/20 text-[#d4af37]'
                            }`}>
                                {item.type === 'event' ? 'Acara' : 'Matkul'}
                            </span>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEdit(item)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <Pencil size={12} />
                                </button>
                                <button onClick={() => handleDelete(item.id, item.type)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                        <h4 className="text-[11px] font-black text-white group-hover:text-[#d4af37] transition-colors uppercase tracking-tight mb-4">
                            {item.subject}
                        </h4>
                        <div className="flex flex-col space-y-2">
                             <div className="flex items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                <span className="text-white mr-1.5">{item.start_time?.slice(0, 5)}</span>
                                <span className="text-slate-700">s/d</span>
                                <span className="text-white ml-1.5">{item.end_time?.slice(0, 5)}</span>
                            </div>
                            {item.room && (
                                <div className="flex items-center text-[9px] font-black text-slate-600 uppercase tracking-widest truncate">
                                    <MapPin size={10} className="mr-1.5 text-[#d4af37] shrink-0" />
                                    <span className="truncate">{item.room}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center opacity-40">
                    <span className="text-[20px] mb-2">🏖️</span>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Santuy Bos, Jadwal Kosong Melompong</span>
                </div>
            )}
        </div>
      </div>

      {/* Main Calendar Grid (Right side on Desktop) */}
      <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                {MONTHS[currentMonth.getMonth()]} <span className="text-slate-600">{currentMonth.getFullYear()}</span>
            </h2>
            <div className="flex items-center bg-black/40 backdrop-blur-md shadow-2xl shadow-black border border-white/5 rounded-[2rem] p-1.5 shrink-0">
                <button onClick={goToToday} className="px-4 py-2 hover:bg-white/5 text-[9px] font-black uppercase tracking-widest text-[#d4af37] rounded-xl transition-all">Today</button>
                <div className="w-px h-4 bg-white/5 mx-1"></div>
                <button onClick={prevMonth} className="p-2.5 hover:bg-white/5 hover:text-[#d4af37] text-slate-500 rounded-xl transition-all"><ChevronLeft size={16} /></button>
                <button onClick={nextMonth} className="p-2.5 hover:bg-white/5 hover:text-[#d4af37] text-slate-500 rounded-xl transition-all"><ChevronRight size={16} /></button>
            </div>
        </div>

        <div className="flex-1 bg-[#0d0d0d] border border-white/5 rounded-[3rem] shadow-2xl shadow-black overflow-hidden flex flex-col">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-white/5">
                {DAYS_SHORT.map(day => (
                    <div key={day} className="py-4 text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{day}</div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 grid grid-cols-7 grid-rows-6">
                {calendarGrid.map((dt, i) => {
                    const isSelected = selectedDate.getDate() === dt.day && 
                                     selectedDate.getMonth() === dt.month && 
                                     selectedDate.getFullYear() === dt.year;
                    const isToday = new Date().getDate() === dt.day && 
                                   new Date().getMonth() === dt.month && 
                                   new Date().getFullYear() === dt.year;
                    
                    // Simple dot indicator if there's an event or schedule
                    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                    const d = new Date(dt.year, dt.month, dt.day)
                    const dayName = daysNames[d.getDay()]
                    
                    const dayItemsCount = items.filter(item => {
                        if (item.type === 'schedule') return item.day_of_week === dayName
                        if (item.type === 'event') return item.date_str === formatDate(d)
                        return false
                    }).length

                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(new Date(dt.year, dt.month, dt.day))}
                            className={`relative flex flex-col items-center justify-center border-b border-r border-white/5 transition-all duration-300 group hover:bg-white/[0.02] ${
                                !dt.isCurrentMonth ? 'opacity-20 pointer-events-none' : ''
                            } ${isSelected ? 'bg-white/[0.05]' : ''}`}
                        >
                            <span className={`text-sm font-black transition-all ${
                                isSelected ? 'text-[#d4af37] scale-125' : 
                                isToday ? 'text-[#d4af37]' : 'text-slate-400'
                            }`}>
                                {dt.day}
                            </span>
                            {isToday && !isSelected && (
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#d4af37] rounded-full shadow-lg shadow-gold-900/40"></div>
                            )}
                            {dayItemsCount > 0 && dt.isCurrentMonth && (
                                <div className="flex gap-0.5 mt-1.5">
                                    {[...Array(Math.min(dayItemsCount, 3))].map((_, idx) => (
                                        <div key={idx} className={`h-1 rounded-full transition-all ${isSelected ? 'bg-[#d4af37] w-2' : 'bg-slate-700 w-1'}`}></div>
                                    ))}
                                </div>
                            )}
                            {isSelected && (
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-[#d4af37] rounded-t-full shadow-lg shadow-gold-900/40"></div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
      </div>

      {/* Manual Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                
                <div className="p-8 md:p-10 relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                            {editingItem ? 'Edit' : 'Tambah'} <span className="gold-text-gradient">Agenda</span>
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Judul Agenda</label>
                            <input 
                                required
                                type="text" 
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all"
                                placeholder="Meeting Penting..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Tanggal</label>
                                <input 
                                    required
                                    type="date" 
                                    value={formDate}
                                    onChange={e => setFormDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all color-scheme-dark"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Mulai</label>
                                <input 
                                    required
                                    type="time" 
                                    value={formStartTime}
                                    onChange={e => setFormStartTime(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all color-scheme-dark"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Selesai</label>
                                <input 
                                    required
                                    type="time" 
                                    value={formEndTime}
                                    onChange={e => setFormEndTime(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all color-scheme-dark"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-5 bg-gradient-to-br from-[#d4af37] to-[#aa8418] text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-gold-900/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                        >
                            {editingItem ? 'Gas Update' : 'Gaskan Tambah'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
