'use client'

import useSWR, { mutate } from 'swr'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchCalendarItems } from '@/lib/fetchers'
import { CalendarItemSkeleton } from '@/components/Skeleton'
import {
  ChevronLeft, ChevronRight, MapPin, Plus, Pencil, Trash2, X, Clock, Calendar
} from 'lucide-react'

const DAYS_SHORT = ['Mng', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

type Item = {
  id: string
  subject?: string
  title?: string
  type: string
  day_of_week?: string
  date_str?: string
  event_date?: string
  start_time?: string
  end_time?: string
  room?: string
  location?: string
}

const CALENDAR_KEY = 'calendar-items'

export default function CalendarPage() {
  const supabase = createClient()

  const { data: items = [], isLoading } = useSWR<Item[]>(CALENDAR_KEY, fetchCalendarItems, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [touchStart, setTouchStart] = useState(0)

  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formRoom, setFormRoom] = useState('')
  const [formCategory, setFormCategory] = useState<'event' | 'schedule'>('event')

  const formatDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormCategory('event')
    setFormTitle('')
    setFormDate(formatDate(selectedDate))
    setFormStartTime('19:00')
    setFormEndTime('20:00')
    setFormRoom('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item)
    setFormCategory(item.type as 'event' | 'schedule')
    setFormTitle(item.subject || item.title || '')
    setFormDate(item.event_date || formatDate(selectedDate))
    setFormStartTime(item.start_time?.slice(0, 5) || '19:00')
    setFormEndTime(item.end_time?.slice(0, 5) || '20:00')
    setFormRoom(item.room || '')
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Yakin mau hapus agenda ini, bos?')) return
    mutate(CALENDAR_KEY, (prev: Item[] = []) => prev.filter(i => i.id !== id), false)
    const table = type === 'event' ? 'events' : 'schedules'
    await supabase.from(table).delete().eq('id', id)
    mutate(CALENDAR_KEY)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const table = formCategory === 'event' ? 'events' : 'schedules'
    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeek = daysNames[new Date(formDate).getDay()]

    if (editingItem) {
      if (formCategory === 'event') {
        const payload = { title: formTitle, event_date: formDate, start_time: formStartTime, end_time: formEndTime }
        await supabase.from(table).update(payload).eq('id', editingItem.id)
      } else {
        const payload = { subject: formTitle, day_of_week: dayOfWeek, start_time: formStartTime, end_time: formEndTime, room: formRoom }
        await supabase.from(table).update(payload).eq('id', editingItem.id)
      }
    } else {
      if (formCategory === 'event') {
        const payload = { user_id: user.id, title: formTitle, event_date: formDate, start_time: formStartTime, end_time: formEndTime }
        await supabase.from(table).insert(payload)
      } else {
        const payload = { user_id: user.id, subject: formTitle, day_of_week: dayOfWeek, start_time: formStartTime, end_time: formEndTime, room: formRoom }
        await supabase.from(table).insert(payload)
      }
    }
    
    setIsModalOpen(false)
    mutate(CALENDAR_KEY)
  }

  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()
    const grid = []
    for (let i = firstDay - 1; i >= 0; i--)
      grid.push({ day: prevMonthDays - i, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false })
    for (let i = 1; i <= daysInMonth; i++)
      grid.push({ day: i, month, year, isCurrentMonth: true })
    const remaining = 42 - grid.length
    for (let i = 1; i <= remaining; i++)
      grid.push({ day: i, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false })
    return grid
  }, [currentMonth])

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const goToToday = () => { const t = new Date(); setCurrentMonth(new Date(t)); setSelectedDate(new Date(t)) }

  const selectedDateItems = useMemo(() => {
    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = daysNames[selectedDate.getDay()]
    const dateStr = formatDate(selectedDate)
    return items.filter(item => {
      if (item.type === 'schedule') return item.day_of_week === dayName
      if (item.type === 'event') return item.date_str === dateStr
      return false
    }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  }, [selectedDate, items])

  const getItemCount = (dt: { day: number; month: number; year: number }) => {
    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const d = new Date(dt.year, dt.month, dt.day)
    const dayName = daysNames[d.getDay()]
    const dStr = formatDate(d)
    return items.filter(item => {
      if (item.type === 'schedule') return item.day_of_week === dayName
      if (item.type === 'event') return item.date_str === dStr
      return false
    }).length
  }

  return (
    <>
      <div className="max-w-[1536px] mx-auto px-4 md:px-8 pb-32 md:pb-10 animate-in fade-in duration-700 space-y-6">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">
          Agenda <span className="gold-text-gradient">Gaskeun</span> 📅
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
          Semua jadwal kuliah &amp; acara lu ada di sini, bos.
        </p>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* Calendar Grid */}
        <div className="w-full lg:flex-1 bg-[#0d0d0d] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl shadow-black">

          {/* Month Navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-base font-black text-white uppercase tracking-tighter">
              {MONTHS_ID[currentMonth.getMonth()]} <span className="text-slate-600">{currentMonth.getFullYear()}</span>
            </h2>
            <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-xl p-1">
              <button onClick={goToToday} className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#d4af37] hover:bg-white/5 rounded-lg transition-all">
                Hari Ini
              </button>
              <div className="w-px h-4 bg-white/10"></div>
              <button onClick={prevMonth} className="p-2 text-slate-500 hover:text-[#d4af37] hover:bg-white/5 rounded-lg transition-all"><ChevronLeft size={16} /></button>
              <button onClick={nextMonth} className="p-2 text-slate-500 hover:text-[#d4af37] hover:bg-white/5 rounded-lg transition-all"><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {DAYS_SHORT.map(day => (
              <div key={day} className="py-2.5 text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.1em]">{day}</div>
            ))}
          </div>

          {/* Day Grid — skeleton overlay while loading */}
          <div className="grid grid-cols-7 relative">
            {calendarGrid.map((dt, i) => {
              const isSelected = selectedDate.getDate() === dt.day && selectedDate.getMonth() === dt.month && selectedDate.getFullYear() === dt.year
              const isToday = new Date().getDate() === dt.day && new Date().getMonth() === dt.month && new Date().getFullYear() === dt.year
              const count = (!isLoading && dt.isCurrentMonth) ? getItemCount(dt) : 0
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(new Date(dt.year, dt.month, dt.day))}
                  disabled={!dt.isCurrentMonth}
                  className={`relative flex flex-col items-center justify-center h-12 border-b border-r border-white/[0.04] transition-all duration-150 ${
                    !dt.isCurrentMonth ? 'opacity-15' : 'hover:bg-white/[0.04] active:bg-white/10'
                  } ${isSelected ? 'bg-[#d4af37]/10' : ''}`}
                >
                  {isLoading && dt.isCurrentMonth ? (
                    <div className="w-5 h-4 rounded bg-white/[0.06] animate-pulse" />
                  ) : (
                    <>
                      <span className={`text-xs font-black leading-none ${isSelected ? 'text-[#d4af37]' : isToday ? 'text-[#d4af37] opacity-70' : 'text-slate-400'}`}>
                        {dt.day}
                      </span>
                      <div className="flex gap-0.5 h-1 mt-1">
                        {isToday && !isSelected && <div className="w-1 h-1 bg-[#d4af37] rounded-full opacity-60"></div>}
                        {count > 0 && [...Array(Math.min(count, 3))].map((_, idx) => (
                          <div key={idx} className={`h-1 rounded-full ${isSelected ? 'bg-[#d4af37] w-2' : 'bg-slate-700 w-1'}`}></div>
                        ))}
                      </div>
                    </>
                  )}
                  {isSelected && <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#d4af37]"></div>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-full lg:w-80 lg:shrink-0 lg:sticky lg:top-6">
          <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] p-5 shadow-2xl shadow-black space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {selectedDate.toLocaleDateString('id-ID', { weekday: 'long' })}
                </p>
                <h2 className="text-lg font-black text-white leading-tight">
                  {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
              </div>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 bg-gradient-to-br from-[#d4af37] to-[#aa8418] text-black px-3.5 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all shadow-lg active:scale-95"
              >
                <Plus size={13} />
                Tambah
              </button>
            </div>

            {/* Skeleton while loading, items when ready */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <CalendarItemSkeleton key={i} />)}
              </div>
            ) : selectedDateItems.length > 0 ? (
              <div className="space-y-3">
                {selectedDateItems.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="group relative bg-black/30 border border-white/5 rounded-2xl p-4 hover:border-[#d4af37]/20 transition-all duration-300 overflow-hidden">
                    <div className={`absolute left-0 inset-y-0 w-1 ${item.type === 'event' ? 'bg-indigo-500' : 'bg-[#d4af37]'}`}></div>
                    <div className="pl-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest mb-1.5 ${item.type === 'event' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-[#d4af37]/10 text-[#d4af37]'}`}>
                            {item.type === 'event' ? '📅 Acara' : '📚 Matkul'}
                          </span>
                          <h4 className="text-sm font-black text-white group-hover:text-[#d4af37] transition-colors truncate leading-snug">
                            {item.subject || item.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {item.start_time && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-slate-500">
                                <Clock size={10} className="text-[#d4af37]" />
                                {item.start_time?.slice(0, 5)} – {item.end_time?.slice(0, 5)}
                              </span>
                            )}
                            {item.room && (
                              <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 max-w-full truncate">
                                <MapPin size={10} className="text-[#d4af37] shrink-0" />
                                <span className="truncate">{item.room}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                          <button onClick={() => handleOpenEdit(item)} className="p-1.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-colors">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(item.id, item.type)} className="p-1.5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 opacity-50">
                <span className="text-2xl">🏖️</span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em]">Jadwal Kosong, Santuy Bos</span>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      
      {/* Add/Edit Modal (Moved outside animated root to cover entire viewport) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4 pb-6 md:p-6 bg-black/40 backdrop-blur-3xl animate-in fade-in duration-300"
          style={{ WebkitBackdropFilter: 'blur(24px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full md:max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 relative transition-transform"
            style={{ transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined }}
            onClick={e => e.stopPropagation()}
            onTouchStart={e => setTouchStart(e.touches[0].clientY)}
            onTouchMove={e => {
              const current = e.touches[0].clientY
              const diff = current - touchStart
              if (diff > 0) setDragOffset(diff)
            }}
            onTouchEnd={() => {
              if (dragOffset > 100) {
                setIsModalOpen(false)
              }
              setDragOffset(0)
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
            <div className="px-4 py-6 md:p-6 relative z-10">
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5 md:hidden"></div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  {editingItem ? 'Edit' : 'Tambah'} <span className="gold-text-gradient">Agenda</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                {/* Category Selection */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setFormCategory('event')}
                    className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${formCategory === 'event' ? 'bg-[#d4af37] text-black shadow-lg shadow-gold-900/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    Acara
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('schedule')}
                    className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${formCategory === 'schedule' ? 'bg-[#d4af37] text-black shadow-lg shadow-gold-900/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    Jadwal Kuliah
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{formCategory === 'event' ? 'Nama Acara' : 'Nama Mata Kuliah'}</label>
                  <input
                    required type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 md:px-5 text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all placeholder:text-slate-700"
                    placeholder="Contoh: Kalkulus / Meeting..."
                  />
                </div>
                {formCategory === 'schedule' && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><MapPin size={10} /> Ruangan</label>
                    <input
                      type="text" value={formRoom} onChange={e => setFormRoom(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 md:px-5 text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all placeholder:text-slate-700"
                      placeholder="Contoh: A-301 / Zoom"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Calendar size={10} /> {formCategory === 'event' ? 'Tanggal' : 'Hari (Pilih tgl)'}</label>
                  <input
                    required type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 md:px-5 text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Clock size={10} /> Mulai</label>
                    <input
                      required type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-3 md:px-5 text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all appearance-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Clock size={10} /> Selesai</label>
                    <input
                      required type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-3 md:px-5 text-sm font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all appearance-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-br from-[#d4af37] to-[#aa8418] text-black font-black uppercase tracking-[0.15em] text-xs rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  {editingItem ? '✅ Gas Update' : '🚀 Gaskan Tambah'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
