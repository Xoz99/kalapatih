'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

import NeuralBackground from '@/components/NeuralBackground'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const cleanEmail = email.trim().toLowerCase()

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (authData?.user) {
            router.push('/')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 pb-48 md:pb-64 relative overflow-hidden font-sans selection:bg-[#d4af37] selection:text-black">

            {/* AI Neural Background */}
            <NeuralBackground />

            {/* Subtle Background Circuit Pattern */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)`,
                backgroundSize: '80px 80px'
            }}></div>

            {/* Moving Barong AI Logo (Subtle Background Layer) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div className="relative w-[800px] h-[800px] opacity-[0.07] animate-[pulse_10s_infinite] blur-sm">
                    <Image
                        src="/assets/cyber-barong.png"
                        alt="Cyber Barong Background"
                        fill
                        className="object-contain"
                    />
                </div>
            </div>

            {/* Global Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#d4af37]/5 rounded-full blur-[180px] pointer-events-none"></div>

            <div className="w-full max-w-xl z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">

                {/* Typography Header */}
                <div className="text-center mb-16">
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-[0.2em] md:tracking-[0.4em] uppercase leading-none drop-shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                        KALA <span className="gold-text-gradient">PATIH</span>
                    </h1>
                    <p className="text-[#d4af37] mt-6 font-black uppercase tracking-[0.5em] text-[10px] md:text-sm opacity-90 drop-shadow-sm">
                        ASISTEN WAKTU TUAN MUDA ANDRIAN
                    </p>

                    {/* Visual Trace line below header */}
                    <div className="flex items-center justify-center mt-8 space-x-6 opacity-40">
                        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]"></div>
                        <div className="w-3 h-3 rounded-full border-2 border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
                        <div className="w-20 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]"></div>
                    </div>
                </div>

                {/* Form Container */}
                <div className="w-full max-w-sm space-y-6 relative">
                    <form onSubmit={handleAuth} className="space-y-4">

                        {/* Input Field: Email/Username */}
                        <div className="relative group/input">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent rounded-2xl blur opacity-0 group-focus-within/input:opacity-100 transition duration-500"></div>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="e-mail / username"
                                    className="w-full bg-black/80 border border-white/10 rounded-xl py-4 px-6 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d4af37]/80 focus:ring-1 focus:ring-[#d4af37]/50 transition-all text-center"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Input Field: Password */}
                        <div className="relative group/input">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent rounded-2xl blur opacity-0 group-focus-within/input:opacity-100 transition duration-500"></div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="password"
                                    className="w-full bg-black/80 border border-white/10 rounded-xl py-4 px-6 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-[#d4af37]/80 focus:ring-1 focus:ring-[#d4af37]/50 transition-all text-center pr-12"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-[#d4af37] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center animate-in shake-in">
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">{error}</span>
                            </div>
                        )}

                        {/* Premium Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group/btn h-14"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#8b6b14] via-[#d4af37] to-[#8b6b14] rounded-2xl blur-md group-hover:blur-lg opacity-40 transition-all"></div>
                            <div className="relative h-full w-full bg-gradient-to-r from-[#bb9525] via-[#d4af37] to-[#bb9525] text-black rounded-xl font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center active:scale-[0.98] transition-all overflow-hidden border border-white/20">
                                {loading ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <span className="relative z-10">GAS MASUK</span>
                                )}
                                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_2s_infinite] pointer-events-none"></div>
                            </div>
                        </button>
                    </form>

                    <div className="h-10"></div>
                </div>

                {/* Visual Trace Decorator */}
                <div className="mt-20 flex items-center justify-center space-x-4 opacity-30">
                    <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]"></div>
                    <div className="w-2 h-2 rounded-full border border-[#d4af37] rotate-45"></div>
                    <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]"></div>
                </div>
            </div>

            {/* CSS Keyframes for shimmer */}
            <style jsx>{`
            @keyframes shimmer {
                100% {
                    left: 100%;
                }
            }
        `}</style>
        </div>
    )
}
