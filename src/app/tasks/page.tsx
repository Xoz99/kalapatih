'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Circle, Clock, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react'

export default function TasksPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')
  const [newTaskStartDate, setNewTaskStartDate] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setTasks(data)
    setLoading(false)
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return
    setIsAdding(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsAdding(false)
      return
    }

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTaskTitle.trim(),
      priority: 'Medium',
      start_date: newTaskStartDate || null,
      deadline: newTaskDeadline || null
    })

    if (!error) {
      setNewTaskTitle('')
      setNewTaskDeadline('')
      setNewTaskStartDate('')
      fetchTasks()
    }
    setIsAdding(false)
  }

  async function toggleComplete(id: string, currentStatus: boolean) {
    await supabase.from('tasks').update({ is_done: !currentStatus }).eq('id', id)
    fetchTasks()
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-10 space-y-10 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">List Nugas <span className="gold-text-gradient">Biar Gak Dead</span> 📝</h1>
          <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px] md:text-xs">Sikat sekarang biar weekend lu tenang, Ngab.</p>
        </div>
      </div>

      <div className="bg-[#0d0d0d] border border-white/5 shadow-2xl shadow-black rounded-[2.5rem] p-6 md:p-8 space-y-4">
        <div className="flex items-center space-x-3 md:space-x-4">
          <input
            type="text"
            placeholder="Ada tugas apa lagi hari ini, ngab?"
            className="flex-1 bg-white/5 border border-white/10 rounded-3xl py-4 px-6 text-sm focus:outline-none focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500/50 transition-all font-bold tracking-tight text-white placeholder:text-slate-600"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
          <button
            onClick={addTask}
            disabled={isAdding || !newTaskTitle.trim()}
            className="bg-gradient-to-br from-[#d4af37] to-[#aa8418] text-black px-6 md:px-8 py-4 rounded-3xl font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-gold-900/40 flex items-center disabled:opacity-50 active:scale-95"
          >
            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 px-2">
          <div className="flex-1 w-full space-y-1.5">
            <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.2em] ml-2 opacity-70 italic">Mulai</span>
            <input
              type="datetime-local"
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 text-xs font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all hover:bg-white/10"
              value={newTaskStartDate}
              onChange={(e) => setNewTaskStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 w-full space-y-1.5">
            <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.2em] ml-2 opacity-70 italic font-serif">Deadline</span>
            <input
              type="datetime-local"
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-6 text-xs font-bold text-white focus:outline-none focus:border-[#d4af37]/50 transition-all hover:bg-white/10"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-20">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
          </div>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center p-5 md:p-6 rounded-[2.5rem] border transition-all duration-500 group cursor-default shadow-sm ${task.is_done
                ? 'bg-white/5 border-transparent opacity-40'
                : 'bg-[#0d0d0d] border-white/5 hover:border-[#d4af37]/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black'
                }`}
            >
              <button
                onClick={() => toggleComplete(task.id, task.is_done)}
                className={`mr-4 md:mr-6 transition-all transform hover:scale-110 ${task.is_done ? 'text-[#d4af37]' : 'text-slate-700 hover:text-[#d4af37]'}`}
              >
                {task.is_done ? <CheckCircle2 size={32} /> : <Circle size={32} />}
              </button>

              <div className="flex-1 min-w-0">
                <h3 className={`text-base md:text-lg font-black tracking-tight truncate ${task.is_done ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {task.title}
                </h3>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-[10px] text-slate-600 font-black uppercase tracking-widest">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1.5 shrink-0 text-[#d4af37]" /> {new Date(task.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {task.priority && (
                    <span className={`px-2 py-0.5 rounded-md border ${task.priority === 'High' ? 'border-red-500/30 text-red-500/50' :
                      task.priority === 'Medium' ? 'border-[#d4af37]/30 text-[#d4af37]/50' :
                        'border-slate-700 text-slate-700'
                      }`}>
                      {task.priority}
                    </span>
                  )}
                  {task.deadline && (
                    <div className="flex items-center bg-white/5 px-2 py-1 rounded-lg text-slate-300 border border-white/5">
                      <span className="text-[#d4af37] mr-1.5 opacity-50">Deadline:</span>
                      {new Date(task.deadline).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} {new Date(task.deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {task.start_date && (
                    <div className="flex items-center bg-white/5 px-2 py-1 rounded-lg text-slate-400 border border-white/5">
                      <span className="text-[#d4af37] mr-1.5 opacity-50">Mulai:</span>
                      {new Date(task.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} {new Date(task.start_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="p-3 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-2xl hover:bg-red-500/10 shrink-0"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-[#0d0d0d] border border-dashed border-white/5 rounded-[3rem] shadow-2xl shadow-black">
            <div className="w-20 h-20 bg-[#d4af37]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-[#d4af37]" />
            </div>
            <h3 className="text-white font-black text-xl uppercase tracking-tighter">Gak ada nugas nih, ngab? ✨</h3>
            <p className="text-slate-600 text-[10px] font-bold mt-2 uppercase tracking-widest">Santuy amat hidup lu. Minimal satu gih biar gak gabut.</p>
          </div>
        )}
      </div>
    </div>
  )
}
