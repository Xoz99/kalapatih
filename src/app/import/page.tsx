'use client'

import { useState } from 'react'
import { UploadCloud, FileText, Sparkles, Loader2, Plus, Trash2, Save, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ImportPage() {
  const supabase = createClient()
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  
  // Manual Input State
  const [manualEntries, setManualEntries] = useState([
    { subject: '', day_of_week: 'Monday', start_time: '08:00', end_time: '10:00', room: '' }
  ])

  const days = [
    { label: 'Senin', value: 'Monday' },
    { label: 'Selasa', value: 'Tuesday' },
    { label: 'Rabu', value: 'Wednesday' },
    { label: 'Kamis', value: 'Thursday' },
    { label: 'Jumat', value: 'Friday' },
    { label: 'Sabtu', value: 'Saturday' },
    { label: 'Minggu', value: 'Sunday' }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleAddRow = () => {
    setManualEntries([...manualEntries, { subject: '', day_of_week: 'Monday', start_time: '08:00', end_time: '10:00', room: '' }])
  }

  const handleRemoveRow = (index: number) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index))
  }

  const handleManualChange = (index: number, field: string, value: string) => {
    const updated = [...manualEntries]
    updated[index] = { ...updated[index], [field]: value }
    setManualEntries(updated)
  }

  const handleSaveManual = async () => {
    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Belum login bos!")

      // 1. Fetch existing schedules for conflict check
      const { data: existingSchedules, error: fetchError } = await supabase
        .from('schedules')
        .select('subject, day_of_week, start_time, end_time')
        .eq('user_id', user.id)

      if (fetchError) throw fetchError

      // 2. Check for conflicts
      const conflicts: string[] = []
      const newEntries = manualEntries.filter(e => e.subject)

      for (const entry of newEntries) {
        const hasConflict = existingSchedules?.some(ex => {
          if (ex.day_of_week !== entry.day_of_week) return false
          
          // Conflict logic: (startA < endB) && (endA > startB)
          return (entry.start_time < ex.end_time) && (entry.end_time > ex.start_time)
        })

        if (hasConflict) {
          conflicts.push(`${entry.subject} (${entry.day_of_week})`)
        }
      }

      if (conflicts.length > 0) {
        alert(`Waduh bentrok bos!\n\nJadwal ini tabrakan sama yang udah ada:\n- ${conflicts.join('\n- ')}\n\nCoba cek jamnya lagi ya.`)
        return
      }

      // 3. Batch insert
      const { error } = await supabase.from('schedules').insert(
        newEntries.map(e => ({
          ...e,
          user_id: user.id
        }))
      )

      if (error) throw error
      
      setResult(`Gokil bos! ${newEntries.length} jadwal berhasil disimpen secara manual.`)
      setManualEntries([{ subject: '', day_of_week: 'Monday', start_time: '08:00', end_time: '10:00', room: '' }])
    } catch (err) {
      alert("Error pas simpan: " + (err instanceof Error ? err.message : "Coba lagi nanti"))
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-schedule", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(`Gokil bos! Patih berhasil nge-ekstrak ${data.count} mata kuliah ke kalender lu.`);
      } else {
        throw new Error(data.error || "Gagal nge-ekstrak jadwal.");
      }
    } catch (err) {
      alert("Waduh bos, ada error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">Masukin <span className="gold-text-gradient">Jadwal</span></h1>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px] md:text-xs opacity-80">Rapiin Jadwal Bos Andrian Biar Gak Berantakan.</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#0d0d0d] p-1.5 rounded-2xl border border-white/5 w-fit mx-auto md:mx-0">
          <button 
            onClick={() => { setMode('ai'); setResult(null); }}
            className={`px-6 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${mode === 'ai' ? 'bg-[#d4af37] text-black shadow-lg shadow-gold-900/20' : 'text-slate-500 hover:text-white'}`}
          >
            AI PDF
          </button>
          <button 
            onClick={() => { setMode('manual'); setResult(null); }}
            className={`px-6 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${mode === 'manual' ? 'bg-[#d4af37] text-black shadow-lg shadow-gold-900/20' : 'text-slate-500 hover:text-white'}`}
          >
            Manual
          </button>
        </div>
      </div>

      {mode === 'ai' ? (
        <div className="bg-[#0d0d0d] border border-white/5 shadow-2xl shadow-black rounded-[3rem] p-6 md:p-12 mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full -mr-32 -mt-32 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
          
          <div 
            className="border-2 border-dashed border-white/5 bg-white/5 rounded-[2.5rem] p-10 md:p-20 flex flex-col items-center justify-center text-center transition-all hover:bg-black/20 hover:border-[#d4af37]/20"
          >
            <div className="w-20 h-20 bg-[#0d0d0d] shadow-xl shadow-black rounded-[1.8rem] flex items-center justify-center mb-8 text-[#d4af37] transform transition-transform group-hover:rotate-12 border border-white/5">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">
              Taruh PDF di Sini, Bos!
            </h3>
            <p className="text-[10px] md:text-xs font-bold text-slate-600 mb-8 uppercase tracking-widest leading-relaxed max-w-xs">Pastikan file `.pdf` jadwal resmi dari kampus lu ya biar Patih gak bingung.</p>
            
            <label className="cursor-pointer bg-gradient-to-br from-[#d4af37] to-[#aa8418] shadow-lg shadow-gold-900/40 text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95">
              Pilih File PDF
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
            </label>
          </div>

          {file && (
            <div className="mt-8 flex flex-col md:flex-row items-center p-6 bg-white/5 rounded-[2rem] border border-white/5 animate-in fade-in slide-in-from-top-4">
              <div className="w-14 h-14 bg-[#0d0d0d] rounded-xl flex items-center justify-center text-[#d4af37] shadow-sm mb-4 md:mb-0 md:mr-6 border border-white/5">
                <FileText size={24} />
              </div>
              <div className="flex-1 text-center md:text-left mb-6 md:mb-0">
                <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[200px] md:max-w-none">{file.name}</p>
                <p className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to ekstrak</p>
              </div>
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full md:w-auto bg-white text-black hover:bg-slate-200 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center overflow-hidden relative group"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Lagi diproses...
                  </>
                ) : 'Sikat Ekstrak'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
               <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                 <Calendar className="mr-2 text-[#d4af37]" size={16} /> Entri Manual
               </h3>
               <button 
                 onClick={handleAddRow}
                 className="flex items-center text-[10px] font-black text-[#d4af37] uppercase tracking-widest hover:text-white transition-all"
               >
                 <Plus size={14} className="mr-1" /> Tambah Row
               </button>
            </div>
            <div className="p-6 space-y-4">
              {manualEntries.map((entry, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white/[0.03] border border-white/5 rounded-2xl group relative animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Mata Kuliah</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Algoritma"
                      value={entry.subject}
                      onChange={(e) => handleManualChange(idx, 'subject', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#d4af37]/50 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Hari</label>
                    <select 
                      value={entry.day_of_week}
                      onChange={(e) => handleManualChange(idx, 'day_of_week', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#d4af37]/50 focus:outline-none transition-all appearance-none"
                    >
                      {days.map(d => <option key={d.value} value={d.value} className="bg-slate-900">{d.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Mulai</label>
                    <input 
                      type="time" 
                      value={entry.start_time}
                      onChange={(e) => handleManualChange(idx, 'start_time', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#d4af37]/50 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Selesai</label>
                    <input 
                      type="time" 
                      value={entry.end_time}
                      onChange={(e) => handleManualChange(idx, 'end_time', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:border-[#d4af37]/50 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5 relative">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Ruangan</label>
                    <input 
                      type="text" 
                      placeholder="A-301"
                      value={entry.room}
                      onChange={(e) => handleManualChange(idx, 'room', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#d4af37]/50 focus:outline-none transition-all"
                    />
                    {manualEntries.length > 1 && (
                      <button 
                        onClick={() => handleRemoveRow(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-white/[0.01] border-t border-white/5 flex justify-end">
              <button 
                onClick={handleSaveManual}
                disabled={isUploading || manualEntries.every(e => !e.subject)}
                className="bg-[#d4af37] text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center shadow-lg shadow-gold-900/20"
              >
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan Jadwal Bos
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-[#d4af37] shadow-xl shadow-gold-900/40 rounded-[2.5rem] p-8 md:p-10 flex items-center text-black animate-in zoom-in-95 duration-500">
          <div className="w-14 h-14 bg-black/10 backdrop-blur-md rounded-2xl flex items-center justify-center mr-6 shrink-0 border border-black/5">
            <Sparkles className="text-black" size={28} />
          </div>
          <div>
            <h4 className="font-black text-lg md:text-xl uppercase tracking-tighter">Sukses Terkoneksi! ✨</h4>
            <p className="text-black/70 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 opacity-80">{result}</p>
          </div>
        </div>
      )}
    </div>
  )
}

