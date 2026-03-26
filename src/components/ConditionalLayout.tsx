'use client'

import { usePathname } from 'next/navigation'
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const isLoginPage = pathname === '/login'

  useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoginPage) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <div className="flex bg-[var(--background)] min-h-screen overflow-x-hidden">
      {showSplash && (
        <div className={`fixed inset-0 z-[999] bg-[#050505] flex flex-col items-center justify-center gap-8 ${isMounted ? 'animate-fade-out' : ''}`}>
          <div className="relative">
            <div className="w-40 h-40 relative animate-pulse drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]">
              <Image
                src="/assets/cyber-barong-transparent.png"
                alt="Kalapatih Barong"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="absolute inset-0 w-40 h-40 scale-150 rounded-full bg-[#d4af37]/5 blur-3xl animate-ping opacity-30"></div>
          </div>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-[0.3em] md:tracking-[0.5em] uppercase leading-none drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              KALA <span className="gold-text-gradient">PATIH</span>
            </h1>
            <p className="text-[#d4af37] mt-6 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs opacity-80">
              TUAN MUDA ANDRIAN ASISTENT
            </p>
            {/* Visual Trace line */}
            <div className="flex items-center justify-center mt-8 space-x-6 opacity-40">
              <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]"></div>
              <div className="w-2 h-2 rounded-full border-2 border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
              <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]"></div>
            </div>
          </div>
          <div className="absolute bottom-12">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce"></div>
            </div>
          </div>
        </div>
      )}
      <aside className="hidden md:block">
        <Sidebar />
      </aside>
      <div className="flex-1 flex flex-col min-w-0 font-sans overflow-x-hidden">
        <Navbar />
        <main className="flex-1 py-6 md:py-10 pb-32 md:pb-10 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
