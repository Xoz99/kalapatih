'use client'

import useSWR, { mutate } from 'swr'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchTasks } from '@/lib/fetchers'
import { TaskCardSkeleton, StatCardSkeleton } from '@/components/Skeleton'
import {
  CheckCircle2, Circle, Clock, Plus, Trash2,
  AlertCircle, Loader2, Calendar, ChevronDown, ChevronUp,
  Target, Zap, CheckSquare
} from 'lucide-react'

type Task = {
  id: string
  title: string
  is_done: boolean
  priority?: string
  start_date?: string
  deadline?: string
  created_at: string
}

const TASKS_KEY = 'tasks'

export default function TasksPage() {
  const supabase = createClient()

  const { data: tasks = [], isLoading } = useSWR<Task[]>(TASKS_KEY, fetchTasks, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')
  const [newTaskStartDate, setNewTaskStartDate] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  const [isAdding, setIsAdding] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'done'>('pending')

  async function addTask() {
    if (!newTaskTitle.trim()) return
    setIsAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsAdding(false); return }

    // Optimistic update
    const optimistic: Task = {
      id: `temp-${Date.now()}`,
      title: newTaskTitle.trim(),
      is_done: false,
      priority: newTaskPriority,
      start_date: newTaskStartDate || undefined,
      deadline: newTaskDeadline || undefined,
      created_at: new Date().toISOString(),
    }
    mutate(TASKS_KEY, (prev: Task[] = []) => [optimistic, ...prev], false)

    await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      start_date: newTaskStartDate || null,
      deadline: newTaskDeadline || null,
    })

    setNewTaskTitle('')
    setNewTaskDeadline('')
    setNewTaskStartDate('')
    setNewTaskPriority('Medium')
    setIsFormOpen(false)
    setIsAdding(false)
    mutate(TASKS_KEY) // revalidate
  }

  async function toggleComplete(id: string, currentStatus: boolean) {
    // Optimistic update
    mutate(TASKS_KEY, (prev: Task[] = []) =>
      prev.map(t => t.id === id ? { ...t, is_done: !currentStatus } : t), false
    )
    await supabase.from('tasks').update({ is_done: !currentStatus }).eq('id', id)
    mutate(TASKS_KEY)
  }

  async function deleteTask(id: string) {
    // Optimistic update
    mutate(TASKS_KEY, (prev: Task[] = []) => prev.filter(t => t.id !== id), false)
    await supabase.from('tasks').delete().eq('id', id)
    mutate(TASKS_KEY)
  }

  const filteredTasks = tasks.filter(t => {
    if (activeFilter === 'pending') return !t.is_done
    if (activeFilter === 'done') return t.is_done
    return true
  })

  const pendingCount = tasks.filter(t => !t.is_done).length
  const doneCount = tasks.filter(t => t.is_done).length
  const progressPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

  const priorityConfig = {
    High: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400', Icon: Zap },
    Medium: { color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10 border-[#d4af37]/20', dot: 'bg-[#d4af37]', Icon: Target },
    Low: { color: 'text-slate-400', bg: 'bg-white/5 border-white/10', dot: 'bg-slate-500', Icon: CheckSquare },
  }

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pb-32 md:pb-10 space-y-6 animate-in fade-in duration-700">

      {/* Header */}
      <div className="space-y-1 pt-2">
        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">
          List Nugas <span className="gold-text-gradient">Biar Gak Dead</span> 📝
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
          Sikat sekarang biar weekend lu tenang, Ngab.
        </p>
      </div>

      {/* Stats Bar — skeleton while loading */}
      {isLoading ? (
        <StatCardSkeleton />
      ) : (
        <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{pendingCount}</div>
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Pending</div>
              </div>
              <div className="w-px h-8 bg-white/5"></div>
              <div className="text-center">
                <div className="text-2xl font-black gold-text-gradient">{doneCount}</div>
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Done</div>
              </div>
              <div className="w-px h-8 bg-white/5"></div>
              <div className="text-center">
                <div className="text-2xl font-black text-white">{tasks.length}</div>
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Total</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black gold-text-gradient">{progressPct}%</div>
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Progress</div>
            </div>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#aa8418] to-[#d4af37] rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Task Form */}
      <div className="bg-[#0d0d0d] border border-white/5 shadow-2xl shadow-black rounded-3xl overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <input
            type="text"
            placeholder="Tambah tugas baru..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:border-[#d4af37]/50 transition-all"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="p-3.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-[#d4af37] rounded-2xl transition-all border border-white/5"
          >
            {isFormOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button
            onClick={addTask}
            disabled={isAdding || !newTaskTitle.trim()}
            className="flex items-center gap-2 bg-gradient-to-br from-[#d4af37] to-[#aa8418] text-black px-5 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all shadow-lg disabled:opacity-50 active:scale-95"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={18} />}
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>

        {isFormOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-2">
              {(['High', 'Medium', 'Low'] as const).map(p => {
                const cfg = priorityConfig[p]
                return (
                  <button
                    key={p}
                    onClick={() => setNewTaskPriority(p)}
                    className={`flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newTaskPriority === p ? `${cfg.bg} ${cfg.color}` : 'border-white/5 text-slate-600 hover:border-white/10'}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={10} className="text-[#d4af37]" /> Mulai
                </span>
                <input type="datetime-local"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all"
                  value={newTaskStartDate}
                  onChange={(e) => setNewTaskStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={10} className="text-[#d4af37]" /> Deadline
                </span>
                <input type="datetime-local"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-[#0d0d0d] border border-white/5 p-1.5 rounded-2xl">
        {([
          { key: 'pending', label: 'Pending', count: pendingCount },
          { key: 'done', label: 'Selesai', count: doneCount },
          { key: 'all', label: 'Semua', count: tasks.length },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeFilter === f.key ? 'bg-[#d4af37] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            {f.label}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeFilter === f.key ? 'bg-black/20 text-black' : 'bg-white/5'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {isLoading ? (
          // Skeleton cards
          Array.from({ length: 4 }).map((_, i) => <TaskCardSkeleton key={i} />)
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const pCfg = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.Medium
            const overdue = isOverdue(task.deadline) && !task.is_done
            return (
              <div
                key={task.id}
                className={`group flex items-start gap-4 p-4 md:p-5 rounded-3xl border transition-all duration-300 ${task.id.startsWith('temp-') ? 'opacity-60' : ''} ${task.is_done
                  ? 'bg-white/[0.02] border-white/[0.03] opacity-50'
                  : overdue
                    ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/30'
                    : 'bg-[#0d0d0d] border-white/5 hover:border-[#d4af37]/20 hover:bg-white/[0.02]'
                  }`}
              >
                <button
                  onClick={() => toggleComplete(task.id, task.is_done)}
                  className={`mt-0.5 shrink-0 transition-all duration-300 hover:scale-110 active:scale-95 ${task.is_done ? 'text-[#d4af37]' : 'text-slate-700 hover:text-[#d4af37]'}`}
                >
                  {task.is_done
                    ? <CheckCircle2 size={26} className="drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                    : <Circle size={26} />
                  }
                </button>

                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className={`text-sm md:text-base font-black tracking-tight leading-snug ${task.is_done ? 'line-through text-slate-600' : overdue ? 'text-red-300' : 'text-white'}`}>
                    {task.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-xl border ${pCfg.bg} ${pCfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`}></span>
                      {task.priority}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <Clock size={10} />
                      {new Date(task.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </span>
                    {task.deadline && (
                      <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-xl border ${overdue ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                        <Calendar size={10} />
                        {overdue ? '🔥 ' : ''}Deadline: {new Date(task.deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2.5 text-slate-700 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all rounded-2xl hover:bg-red-500/10 shrink-0 active:scale-95"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })
        ) : (
          <div className="text-center py-16 bg-[#0d0d0d] border border-dashed border-white/5 rounded-[2.5rem]">
            <div className="w-16 h-16 bg-[#d4af37]/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-[#d4af37]" />
            </div>
            <h3 className="text-white font-black text-lg uppercase tracking-tighter">
              {activeFilter === 'done' ? 'Belum Ada yang Selesai' : 'Woh, Kosong Nih! ✨'}
            </h3>
            <p className="text-slate-600 text-[10px] font-bold mt-1.5 uppercase tracking-widest">
              {activeFilter === 'done' ? 'Yuk sikat dulu tugasnya!' : 'Santuy amat hidup lu. Tambah satu dulu lah!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
