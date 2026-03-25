'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Home, MessageSquare, Upload, CheckSquare, Settings, Bot, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User as UserType } from '@supabase/supabase-js'

const navItems = [
  { name: 'Basecamp', href: '/', icon: Home },
  { name: 'Agenda', href: '/calendar', icon: CalendarDays },
  { name: 'Input PDF', href: '/import', icon: Upload },
  { name: 'Patih AI', href: '/chat', icon: MessageSquare },
  { name: 'List Kerjaan', href: '/tasks', icon: CheckSquare },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserType | null>(null)
  const [name, setName] = useState<string>('')
  const [level, setLevel] = useState<number>(1)
  const [xp, setXp] = useState<number>(0)
  const [max_xp] = useState<number>(100)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        const { data: profile } = await supabase
          .from('users')
          .select('name, level, xp')
          .eq('id', authUser.id)
          .single()

        if (profile) {
          if (profile.name) setName(profile.name)
          if (profile.level) setLevel(profile.level)
          if (profile.xp) setXp(profile.xp)
        }
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col w-64 h-screen bg-black/60 backdrop-blur-xl border-r border-white/10 p-6 shadow-2xl shadow-black z-50 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d4af37] via-[#f9d976] to-[#d4af37] opacity-80"></div>
      <div className="flex items-center space-x-3 px-2 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#aa8418] rounded-xl flex items-center justify-center text-black shadow-lg shadow-gold-900/20">
          <Bot size={24} />
        </div>
        <span className="text-xl font-black tracking-tighter gold-text-gradient uppercase">KalaPatih</span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar pr-2 -mr-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname?.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-2xl transition-all duration-300 group hover:scale-[1.02] active:scale-95 relative ${isActive
                ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8418] text-black shadow-lg shadow-gold-900/40'
                : 'text-slate-400 hover:bg-white/5 hover:text-[#d4af37] hover:shadow-md hover:shadow-black/50'
                }`}
            >
              <div className={`transition-transform duration-300 group-hover:rotate-6 ${isActive ? 'scale-110' : ''}`}>
                <Icon size={20} className={isActive ? 'text-black' : 'text-slate-500 group-hover:text-[#d4af37]'} />
              </div>
              <span className={`text-sm font-black uppercase tracking-tight transition-colors duration-300`}>
                {item.name}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-6 bg-white/30 backdrop-blur-sm rounded-full animate-in slide-in-from-right duration-500"></div>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center space-x-3 bg-white/5 border border-white/5 p-3 rounded-2xl mb-4 group hover:bg-white/10 transition-all duration-300 border-dashed">
          <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#aa8418] text-black rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform relative">
            <span className="font-black italic">{user?.email?.[0].toUpperCase() || 'B'}</span>
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#d4af37] rounded-md flex items-center justify-center border-2 border-black shadow-lg">
              <span className="text-[8px] font-black text-black">L{level}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white truncate uppercase tracking-tighter">
              {name || user?.email?.split('@')[0] || 'Bos User'}
            </p>
            <div className="mt-1.5 w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4af37] transition-all duration-1000"
                style={{ width: `${Math.min((xp / max_xp) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-[7px] font-black text-[#d4af37] mt-1 uppercase tracking-widest opacity-60">Glowup Progress</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 hover:text-rose-500 transition-all duration-300 group"
        >
          <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Logout</span>
        </button>
        <Link href="/settings" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-slate-600 transition-colors">
          <Settings size={20} />
          <span className="text-xs font-black uppercase tracking-widest">Settings</span>
        </Link>
      </div>
    </div>
  )
}

