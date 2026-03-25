import { Bell, Search, Settings, User, X, Info, CheckCircle2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: 'Selamat Datang!', message: 'Selamat datang di KalaPatih App, Ngab. Mari mulai berjuang!', type: 'info', time: 'Baru saja' },
    { id: 2, title: 'Lengkapi Profil', message: 'Tinggi dan berat badan lu belum lengkap nih.', type: 'warning', time: '1j yang lalu' }
  ])
  return (
    <header className="h-16 bg-black/40 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-6 md:px-10">
        <div className="flex flex-col md:hidden">
          <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-[0.2em] leading-none mb-1">
            {pathname === '/' ? 'Selamat Datang Kembali!' : 'KalaPatih App'}
          </span>
          <span className="text-sm font-black text-white uppercase tracking-tighter leading-none">
            {pathname === '/' ? 'Hallo andrian 👋' :
              pathname === '/calendar' ? 'Weekly Schedule' :
                pathname === '/chat' ? 'Patih AI Chat' :
                  pathname === '/tasks' ? 'Nugas List' :
                    pathname === '/import' ? 'Import Jadwal' : 'KalaPatih'}
          </span>
        </div>

        <div className="hidden md:block max-w-md w-full relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#d4af37] transition-all duration-300" size={18} />
          <input
            type="text"
            placeholder="Cari sesuatu ngab..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500/50 transition-all duration-300 font-medium placeholder:text-slate-600 shadow-inner text-white"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-10 h-10 border border-white/5 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white/5 hover:text-[#d4af37] transition-all relative"
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#d4af37] border-2 border-black rounded-full"></span>
            </button>

            {/* Notification Tray */}
            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                <div className="absolute right-0 mt-4 w-72 md:w-80 bg-[#0d0d0d] border border-white/10 rounded-[2rem] shadow-2xl p-4 z-50 animate-in slide-in-from-top-2 duration-300 backdrop-blur-3xl overflow-hidden">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Notifikasi</h4>
                    <button onClick={() => setIsNotifOpen(false)} className="text-slate-500 hover:text-white"><X size={14} /></button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-transparent hover:border-white/5 group">
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notif.type === 'info' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                            {notif.type === 'info' ? <Info size={14} /> : <CheckCircle2 size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-white uppercase tracking-tight">{notif.title}</p>
                            <p className="text-[9px] text-slate-500 font-bold leading-tight mt-0.5">{notif.message}</p>
                            <p className="text-[7px] text-slate-600 font-black uppercase mt-1 tracking-widest">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 text-center">
                    <button className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest hover:underline">Tandai semua dibaca</button>
                  </div>
                </div>
              </>
            )}
          </div>

          <Link href="/settings" className="flex md:hidden w-10 h-10 bg-white/5 border border-white/5 rounded-xl items-center justify-center text-[#d4af37]">
            <User size={20} />
          </Link>
          <Link href="/settings" className="hidden md:flex w-10 h-10 border border-white/5 rounded-xl items-center justify-center text-slate-500 hover:bg-white/5 hover:text-[#d4af37] transition-all">
            <Settings size={20} />
          </Link>
        </div>
      </div>
    </header>
  )
}

