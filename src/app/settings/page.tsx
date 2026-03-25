'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, User, Bell, Lock, Shield, X, Camera, Save, Plus, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };
  return (
    <div className="max-w-[800px] mx-auto px-6 md:px-10 py-10 space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Pengaturan <span className="gold-text-gradient">Basecamp</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Atur vibes dan privasi lu di sini, Ngab.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Profile Modal */}
        {activeModal === 'Profil Saya' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)}></div>
            <div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Edit Profil</h2>
                <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10 flex items-center justify-center text-slate-500 group-hover:border-[#d4af37]/50 transition-all cursor-pointer">
                    <Camera size={28} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#d4af37] rounded-xl flex items-center justify-center text-black shadow-lg">
                    <Plus size={16} />
                  </div>
                </div>
                <div className="w-full space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nama Display</label>
                    <input type="text" placeholder="Andrian Adi" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-[#d4af37]/50 transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Bio Singkat</label>
                    <textarea placeholder="Productivity enthusiast & Tech lead." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-[#d4af37]/50 transition-all h-24 resize-none" />
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-[#d4af37] to-[#aa8418] text-black font-black py-4 rounded-2xl shadow-lg shadow-gold-900/20 active:scale-95 transition-all">
                  SIMPAN PERUBAHAN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifikasi Modal */}
        {activeModal === 'Notifikasi' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)}></div>
            <div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Notifikasi System</h2>
                <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Push Notification', desc: 'Terima notif langsung di HP/Browser.' },
                  { label: 'Email Report', desc: 'Dapetin rangkuman produktivitas mingguan.' },
                  { label: 'Level Up Alert', desc: 'Kasih tau kalo lagi naik level.' }
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-tight">{pref.label}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">{pref.desc}</p>
                    </div>
                    <div className="w-12 h-6 bg-[#d4af37] rounded-full relative cursor-pointer p-1">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full shadow-md"></div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl active:scale-95 transition-all">
                KEMBALI
              </button>
            </div>
          </div>
        )}

        {[
          { icon: User, label: 'Profil Saya', desc: 'Ganti nama sama foto biar makin kalcers.' },
          { icon: Bell, label: 'Notifikasi', desc: 'Atur biar gak berisik amat pas lagi tidur.' },
          { icon: Lock, label: 'Keamanan', desc: 'Ganti password atau aktifin 2FA.' },
          { icon: Shield, label: 'Privasi', desc: 'Kontrol data apa aja yang lu bagiin.' }
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => setActiveModal(item.label)}
            className="bg-[#0d0d0d] border border-white/5 p-6 rounded-[2rem] flex items-center group cursor-pointer hover:border-[#d4af37]/30 transition-all"
          >
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#d4af37] mr-6 group-hover:scale-110 transition-transform">
              <item.icon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white uppercase tracking-tight">{item.label}</h3>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">{item.desc}</p>
            </div>
            <div className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <ArrowLeft size={20} className="text-[#d4af37] transform rotate-180" />
            </div>
          </div>
        ))}

        {/* Logout Button for Mobile */}
        <div
          onClick={handleLogout}
          className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2rem] flex items-center group cursor-pointer hover:bg-rose-500/20 transition-all mt-6"
        >
          <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 mr-6 group-hover:scale-110 transition-transform">
            <LogOut size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-rose-500 uppercase tracking-tight">Keluar Akun / Logout</h3>
            <p className="text-[10px] font-bold text-rose-400/60 uppercase tracking-widest mt-1">Selesai berjuang buat hari ini, Ngab?</p>
          </div>
        </div>
      </div>

      <div className="pt-10 border-t border-white/5 text-center">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">KalaPatih System • v1.0.4-kalcers</p>
      </div>
    </div>
  );
}
