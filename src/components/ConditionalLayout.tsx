'use client'

import { usePathname } from 'next/navigation'
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return <main className="flex-1">{children}</main>
  }

  return (
    <div className="flex bg-[var(--background)] min-h-screen overflow-x-hidden">
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
