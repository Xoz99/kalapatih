'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Plus, CheckSquare, Calendar } from 'lucide-react'

export default function BottomNav() {
    const pathname = usePathname()

    const NAV_ITEMS = [
        { name: 'Home', icon: Home, href: '/' },
        { name: 'Chat', icon: MessageSquare, href: '/chat' },
        { name: 'Add', icon: Plus, href: '/import', isMain: true },
        { name: 'Tasks', icon: CheckSquare, href: '/tasks' },
        { name: 'Calendar', icon: Calendar, href: '/calendar' },
    ]

    return (
        <div className="fixed bottom-6 left-6 right-6 h-20 md:hidden z-50 pb-safe">
            <div className="w-full h-full bg-[#0a0a0a]/95 backdrop-blur-2xl rounded-[2.5rem] px-8 flex items-center justify-between border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)]">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.href === '/' ? pathname === '/' : pathname === item.href || pathname?.startsWith(`${item.href}/`)

                    if (item.isMain) {
                        return (
                            <Link key={item.href} href={item.href} className="flex items-center justify-center -mt-10 group transition-transform active:scale-95">
                                <div className="relative">
                                    {/* Outer glow ring */}
                                    <div className="absolute inset-0 rounded-full bg-[#d4af37]/30 blur-md scale-125 animate-pulse" />
                                    {/* Ring border */}
                                    <div className="absolute -inset-1 rounded-full border-2 border-[#d4af37]/40" />
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#d4af37] via-[#f9d976] to-[#aa8418] rounded-full flex items-center justify-center shadow-xl shadow-[#d4af37]/30 group-hover:scale-105 transition-transform relative z-10">
                                        <Plus size={28} className="text-black stroke-[3]" />
                                    </div>
                                </div>
                            </Link>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center transition-all duration-300 px-3 py-1.5 rounded-2xl ${isActive
                                ? 'text-[#d4af37]'
                                : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <div className="relative">
                                {isActive && (
                                    <div className="absolute -inset-2 bg-[#d4af37]/10 rounded-xl" />
                                )}
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                                {isActive && (
                                    <div className="absolute inset-0 bg-[#d4af37] blur-xl opacity-30 -z-0" />
                                )}
                            </div>
                            {isActive && <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full mt-1.5 animate-in zoom-in shadow-[0_0_8px_rgba(212,175,55,0.6)]" />}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
