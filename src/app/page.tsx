'use client'

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  PlusCircle,
  Droplets,
  Sparkles,
  Dumbbell,
  Target,
  Trophy,
  Scale,
  Ruler,
  Bed,
  X,
  Zap,
  TrendingUp,
  Activity,
  Heart,
  Brain,
  BookOpen,
  Moon,
  Wind,
  Focus,
  Coffee,
  ArrowRight,
  MapPin,
  CheckSquare,
  Clock,
  Layout
} from "lucide-react";
import Link from "next/link";

import { TECH_QUOTES } from "@/lib/quotes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dailyHabits: Record<string, any[]> = {
  'Minggu': [
    { id: '1', title: 'Ibadah/Refleksi', minLevel: 1, done: false, icon: Heart, xp: 20, time: 'Pagi' },
    { id: '2', title: 'Persiapan Mingguan', minLevel: 1, done: false, icon: Brain, xp: 15, time: 'Sore' },
    { id: '3', title: 'Planning Besok', baseTitle: 'Planning Besok', type: 'planning', minLevel: 4, done: false, icon: Target, xp: 25, time: 'Malam' }
  ],
  'Senin': [
    { id: '1', title: 'Minum Air', baseTitle: 'Minum Air', type: 'water', minLevel: 1, done: false, icon: Droplets, xp: 10, time: 'Pagi' },
    { id: '2', title: 'Glowup Gym', minLevel: 1, done: false, icon: Dumbbell, xp: 30, time: 'Sore' },
    { id: '3', title: 'Skincare-an Pagi', minLevel: 1, done: false, icon: Sparkles, xp: 5, time: 'Pagi' },
    { id: '4', title: 'Baca Buku', baseTitle: 'Baca Buku', type: 'reading', minLevel: 3, done: false, icon: BookOpen, xp: 15, time: 'Malam' },
    { id: '5', title: 'Meditasi 5 Menit', minLevel: 5, done: false, icon: Focus, xp: 20, time: 'Pagi' }
  ],
  'Selasa': [
    { id: '1', title: 'Baca Buku', baseTitle: 'Baca Buku', type: 'reading', minLevel: 1, done: false, icon: BookOpen, xp: 15, time: 'Malam' },
    { id: '2', title: 'Lari Pagi', minLevel: 1, done: false, icon: Wind, xp: 25, time: 'Pagi' },
    { id: '3', title: 'Minum Air', baseTitle: 'Minum Air', type: 'water', minLevel: 3, done: false, icon: Droplets, xp: 10, time: 'Pagi' },
    { id: '4', title: 'Push Up', baseTitle: 'Push Up', type: 'pushup', minLevel: 4, done: false, icon: PlusCircle, xp: 20, time: 'Sore' }
  ],
  'Rabu': [
    { id: '1', title: 'Meditasi 10 Menit', minLevel: 1, done: false, icon: Focus, xp: 10, time: 'Pagi' },
    { id: '2', title: 'Work focus session', minLevel: 1, done: false, icon: Zap, xp: 20, time: 'Siang' },
    { id: '3', title: 'Stretching', minLevel: 3, done: false, icon: Activity, xp: 15, time: 'Sore' },
    { id: '4', title: 'Planning Hari Ini', minLevel: 5, done: false, icon: Target, xp: 20, time: 'Pagi' }
  ],
  'Kamis': [
    { id: '1', title: 'Push Up', baseTitle: 'Push Up', type: 'pushup', minLevel: 1, done: false, icon: PlusCircle, xp: 20, time: 'Sore' },
    { id: '2', title: 'Kurangi Kopi', minLevel: 1, done: false, icon: Coffee, xp: 10, time: 'Siang' },
    { id: '3', title: 'Minum Air', baseTitle: 'Minum Air', type: 'water', minLevel: 3, done: false, icon: Droplets, xp: 10, time: 'Pagi' },
    { id: '4', title: 'Baca Buku', baseTitle: 'Baca Buku', type: 'reading', minLevel: 5, done: false, icon: BookOpen, xp: 15, time: 'Malam' }
  ],
  'Jumat': [
    { id: '1', title: 'Bersih-bersih Kamar', minLevel: 1, done: false, icon: Sparkles, xp: 15, time: 'Sore' },
    { id: '2', title: 'Evaluasi Mingguan', minLevel: 1, done: false, icon: Brain, xp: 20, time: 'Malam' },
    { id: '3', title: 'Glowup Gym', minLevel: 3, done: false, icon: Dumbbell, xp: 30, time: 'Sore' },
    { id: '4', title: 'Minum Air', baseTitle: 'Minum Air', type: 'water', minLevel: 4, done: false, icon: Droplets, xp: 10, time: 'Pagi' }
  ],
  'Sabtu': [
    { id: '1', title: 'Jalan Santai', minLevel: 1, done: false, icon: Wind, xp: 10, time: 'Pagi' },
    { id: '2', title: 'Nge-game Relax', minLevel: 1, done: false, icon: Zap, xp: 5, time: 'Malam' },
    { id: '3', title: 'Planning Mingguan', minLevel: 5, done: false, icon: Target, xp: 20, time: 'Pagi' }
  ]
};

const getDayName = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[new Date().getDay()];
};

export default function Home() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayEvents, setTodayEvents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ todayTotal: 0, eventCount: 0, pendingTasks: 0 });
  const [playerStats, setPlayerStats] = useState({
    level: 1,
    xp: 0,
    max_xp: 100,
    weight: 0,
    height: 0,
    sleep: 0, // New: Jam Tidur
    name: 'Boss Andrian'
  });

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false);
  const [justLeveledUpTo, setJustLeveledUpTo] = useState(1);
  const [tempStats, setTempStats] = useState({ weight: 0, height: 0, sleep: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const categories = ['Semua', 'Kesehatan', 'Bekerja', 'Pendidikan'];

  // Habit Logic
  const handleHabitComplete = async (habitId: string, xp: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, done: true } : h));

      const newXpTotal = playerStats.xp + xp;
      let newLevel = playerStats.level;
      let finalXp = newXpTotal;

      if (newXpTotal >= playerStats.max_xp) {
        newLevel += 1;
        finalXp = newXpTotal - playerStats.max_xp;
        setJustLeveledUpTo(newLevel);
        setIsLevelUpModalOpen(true);
      }

      setPlayerStats(prev => ({
        ...prev,
        xp: finalXp,
        level: newLevel,
        max_xp: 100 + (newLevel - 1) * 20
      }));

      // If level up, refresh habits to unlock new ones and update titles
      if (newLevel > playerStats.level) {
        const currentDay = getDayName();
        const todayHabitsPool = dailyHabits[currentDay] || [];
        setHabits(prevHabits => {
          const doneIds = prevHabits.filter(h => h.done).map(h => h.id);
          return todayHabitsPool
            .filter((h: { minLevel?: number }) => newLevel >= (h.minLevel || 1))
            .map((h: { title: string; type?: string; minLevel?: number; id: string }) => {
              let dynamicTitle = h.title;
              if (h.type === 'pushup') {
                dynamicTitle = `Push Up ${10 + (newLevel * 5)}x`;
              } else if (h.type === 'water') {
                dynamicTitle = `Minum Air (${(1 + (newLevel * 0.2)).toFixed(1)}L)`;
              } else if (h.type === 'reading') {
                dynamicTitle = `Baca Buku ${5 + newLevel} Hal`;
              }
              return {
                ...h,
                title: dynamicTitle,
                done: doneIds.includes(h.id)
              };
            });
        });
      }

      // Persist to DB
      const todayIso = new Date().toISOString().split('T')[0];
      const { error: logError } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: user.id,
        completed_at: todayIso
      });

      if (logError) {
        console.error("Gagal simpan log habit:", logError);
      }

      const { error: userError } = await supabase.from('users').update({
        xp: finalXp,
        level: newLevel
      }).eq('id', user.id);

      if (userError) {
        console.error("Gagal update user level/xp:", userError);
      }

    } catch (e) {
      console.error("Gagal update habit:", e);
    }
  };

  const calculateBMI = (w?: number, h?: number) => {
    const weight = w ?? playerStats.weight;
    const height = h ?? playerStats.height;
    if (!weight || !height) return { bmi: 0, category: 'Tidak tersedia', color: 'text-slate-500', bg: 'from-slate-500/10 to-transparent' };
    const heightInMeters = height / 100;
    const bmiVal = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    const val = parseFloat(bmiVal);

    if (val < 18.5) return { bmi: val, category: 'KURANG GIZI', color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5' };
    if (val < 25) return { bmi: val, category: 'NORMAL / IDEAL', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5' };
    if (val < 30) return { bmi: val, category: 'OVERWEIGHT', color: 'text-orange-400', bg: 'from-orange-500/20 to-orange-500/5' };
    return { bmi: val, category: 'OBESITAS', color: 'text-red-400', bg: 'from-red-500/20 to-red-500/5' };
  };

  const handleUpdateStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Saving stats for user:", user.id, tempStats);
      const { error: updateError } = await supabase.from('users').upsert({
        id: user.id,
        name: user.user_metadata?.full_name || playerStats.name || 'User',
        weight_kg: tempStats.weight,
        height_cm: tempStats.height,
        sleep_hours: tempStats.sleep
      });

      if (updateError) {
        console.error("Supabase Upsert Error:", updateError);
        throw updateError;
      }

      // Add to historical logs
      await supabase.from('user_logs').upsert({
        user_id: user.id,
        weight_kg: tempStats.weight,
        height_cm: tempStats.height,
        logged_at: new Date().toISOString().split('T')[0]
      });

      setPlayerStats(prev => ({
        ...prev,
        weight: tempStats.weight,
        height: tempStats.height,
        sleep: tempStats.sleep
      }));

      // Fallback local save
      localStorage.setItem('patih_body_stats', JSON.stringify({
        weight: tempStats.weight,
        height: tempStats.height,
        sleep: tempStats.sleep
      }));

      alert("Berhasil simpan data Glowup!");
      setIsStatsModalOpen(false);
    } catch (err) {
      console.error("Gagal update stats:", err);
      alert(`Gagal menyimpan data: ${err instanceof Error ? err.message : "Pastikan koneksi stabil."}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % TECH_QUOTES.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentQuote = TECH_QUOTES[quoteIndex];

  useEffect(() => {
    async function getDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const todayIso = today.toISOString().split('T')[0];
      const currentDay = getDayName();

      // Clear yesterday's auto-generated events
      await supabase.from('events').delete().eq('user_id', user.id).eq('event_type', 'acara').lt('event_date', todayIso);

      // Fetch User Stats
      const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (userError) {
        console.error("Gagal ambil data user (ERROR):", userError);
      }

      // Recovery from localStorage if DB returns 0 or null
      const localData = typeof window !== 'undefined' ? localStorage.getItem('patih_body_stats') : null;
      const fallback = localData ? JSON.parse(localData) : null;

      if (userData) {
        const dbWeight = userData.weight_kg ?? fallback?.weight ?? 0;
        const dbHeight = userData.height_cm ?? fallback?.height ?? 0;
        const dbSleep = userData.sleep_hours ?? fallback?.sleep ?? 0;
        const dbLevel = userData.level ?? playerStats.level;

        setPlayerStats(prev => ({
          ...prev,
          weight: dbWeight,
          height: dbHeight,
          sleep: dbSleep,
          level: dbLevel,
          max_xp: 100 + (dbLevel - 1) * 20,
          xp: userData.xp ?? prev.xp,
          name: userData.name ?? prev.name
        }));
        setTempStats({
          weight: dbWeight,
          height: dbHeight,
          sleep: dbSleep
        });
      } else if (fallback) {
        const fallbackLevel = fallback.level ?? 1;
        setPlayerStats(prev => ({
          ...prev,
          ...fallback,
          max_xp: 100 + (fallbackLevel - 1) * 20
        }));
        setTempStats(fallback);
      }

      // Fetch Today's Habit Logs
      const { data: habitLogs, error: habitError } = await supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('user_id', user.id)
        .eq('completed_at', todayIso);

      if (habitError) {
        console.error("Gagal ambil log habit:", habitError);
      }

      const completedIds = habitLogs?.map(log => log.habit_id) || [];
      const todayHabitsPool = dailyHabits[currentDay] || [];

      const userLevel = userData?.level ?? fallback?.level ?? 1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setHabits(todayHabitsPool.filter((h: any) => userLevel >= (h.minLevel || 1)).map((h: any) => {
        let dynamicTitle = h.title;
        if (h.type === 'pushup') {
          dynamicTitle = `Push Up ${10 + (userLevel * 5)}x`;
        } else if (h.type === 'water') {
          dynamicTitle = `Minum Air (${(1 + (userLevel * 0.2)).toFixed(1)}L)`;
        } else if (h.type === 'reading') {
          dynamicTitle = `Baca Buku ${5 + userLevel} Hal`;
        }

        return {
          ...h,
          title: dynamicTitle,
          done: completedIds.includes(h.id)
        };
      }));

      const { data: scheduleData } = await supabase.from('schedules').select('*').eq('user_id', user.id).eq('day_of_week', currentDay === 'Minggu' ? 'Sunday' : currentDay === 'Senin' ? 'Monday' : currentDay === 'Selasa' ? 'Tuesday' : currentDay === 'Rabu' ? 'Wednesday' : currentDay === 'Kamis' ? 'Thursday' : currentDay === 'Jumat' ? 'Friday' : 'Saturday').order('start_time', { ascending: true });
      const { data: eventData } = await supabase.from('events').select('*').eq('user_id', user.id).eq('event_date', todayIso);
      const { data: taskData, count: pendingCount } = await supabase.from('tasks').select('*', { count: 'exact' }).eq('user_id', user.id).eq('is_done', false).order('id', { ascending: false }).limit(5);

      if (scheduleData) setTodayClasses(scheduleData);
      if (eventData) setTodayEvents(eventData);
      if (taskData) setPendingTasks(taskData);

      setStats({
        todayTotal: (scheduleData?.length || 0) + (eventData?.length || 0),
        eventCount: eventData?.length || 0,
        pendingTasks: pendingCount || 0
      });
      setLoading(false);
    }
    getDashboardData();
  }, [supabase, playerStats.level]);

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-10 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">Kabar <span className="gold-text-gradient">Hari Ini</span></h2>
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <Trophy size={14} className="text-[#d4af37]" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">LVL {playerStats.level}</span>
            </div>
            <div className="flex-1 max-w-[140px] xs:max-w-[200px] md:max-w-[240px] h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#d4af37] to-[#aa8418] rounded-full transition-all duration-1000"
                style={{ width: `${(playerStats.xp / playerStats.max_xp) * 100}%` }}
              ></div>
            </div>
            <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest shrink-0">{playerStats.xp}/{playerStats.max_xp} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0">
          {[
            { label: 'BB', value: playerStats.weight, unit: 'KG', icon: Scale, color: 'from-orange-500/20 to-orange-500/5' },
            { label: 'TB', value: playerStats.height, unit: 'CM', icon: Ruler, color: 'from-blue-500/20 to-blue-500/5' },
            { label: 'TIDUR', value: playerStats.sleep, unit: 'H', icon: Bed, color: 'from-indigo-500/20 to-indigo-500/5' },
            { label: 'STATUS', value: calculateBMI().category, unit: '', icon: Activity, color: calculateBMI().bg || 'from-slate-500/20 to-slate-500/5' }
          ].map((stat, idx) => (
            <div
              key={idx}
              onClick={() => setIsStatsModalOpen(true)}
              className={`bg-gradient-to-br ${stat.color} backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 flex items-center space-x-3 ${stat.label === 'STATUS' ? 'min-w-[170px]' : 'min-w-[125px]'} w-fit cursor-pointer hover:border-[#d4af37]/30 transition-all group animate-in fade-in slide-in-from-right-2 duration-500`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-black/40 flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform flex-shrink-0">
                <stat.icon size={16} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className={`font-black text-white leading-tight ${stat.label === 'STATUS' ? 'text-[9px] md:text-[10px] whitespace-nowrap' : 'text-sm md:text-base'}`}>
                    {stat.value}
                  </span>
                  {stat.unit && <span className="text-[8px] text-slate-400 font-bold uppercase">{stat.unit}</span>}
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setIsStatsModalOpen(true)}
            className="flex-shrink-0 bg-[#d4af37] w-10 h-10 rounded-xl flex items-center justify-center text-black hover:bg-[#b8962d] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-gold-900/20"
          >
            <Plus size={20} className="stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Categories & Filter */}
      <div className="flex items-center space-x-3 mb-4 overflow-x-auto no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
              ? 'bg-[#d4af37] text-black shadow-lg shadow-gold-900/40'
              : 'bg-white/5 text-slate-500 border border-white/5 hover:border-[#d4af37]/30 hover:text-[#d4af37]'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Evening Alert */}
      {new Date().getHours() >= 21 && (
        <div className="bg-gradient-to-r from-indigo-600/20 to-transparent border-l-4 border-indigo-500 p-4 rounded-r-2xl mb-6 animate-in slide-in-from-left duration-700">
          <div className="flex items-center space-x-3">
            <Moon className="text-indigo-400 w-5 h-5 animate-pulse" />
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Sesi Malam Boss!</p>
              <h4 className="text-sm font-bold text-white uppercase tracking-tight">Waktunya cek berat badan (Optional) ⚖️</h4>
            </div>
          </div>
        </div>
      )}
      {/* Live Agenda Slider */}
      <div className="relative group">
        <div className="flex overflow-x-auto pb-8 gap-5 no-scrollbar snap-x snap-mandatory md:gap-6">
          {/* Today Summary Card */}
          <div className="w-[170px] h-[170px] md:w-auto md:h-auto md:min-w-[340px] snap-start flex-shrink-0">
            {loading ? (
              <div className="w-full h-full md:min-h-[260px] bg-[#0d0d0d] border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-2 w-16 rounded bg-white/[0.06] animate-pulse" />
                  <div className="h-12 w-20 rounded-xl bg-white/[0.06] animate-pulse" />
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => <div key={i} className="w-6 h-6 rounded-full bg-white/[0.06] animate-pulse" />)}
                </div>
              </div>
            ) : (
              <div className="w-full h-full md:min-h-[260px] bg-gradient-to-br from-[#d4af37] to-[#aa8418] p-3 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-xl shadow-gold-900/20 flex flex-col items-start justify-between relative overflow-hidden group/card transition-all hover:scale-[1.02]">
                <div className="absolute top-1 right-1 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12 blur-2xl opacity-40"></div>

                <div className="w-full text-left">
                  <p className="text-[8px] font-black text-black/40 uppercase tracking-[0.2em] mb-1 md:mb-4">Vibe Hari Ini</p>
                  <div className="flex flex-col items-start">
                    <h3 className="text-4xl md:text-6xl font-black text-black tracking-tighter uppercase leading-none">{stats.todayTotal}</h3>
                    <span className="text-[9px] font-black text-black/60 uppercase tracking-widest mt-0.5 md:mt-1">Agenda</span>
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex items-center justify-start -space-x-1.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 md:w-9 md:h-9 rounded-full border-2 border-[#d4af37] bg-black flex items-center justify-center shadow-lg">
                        <span className="text-[8px] md:text-[10px] font-black text-[#d4af37]">{i}</span>
                      </div>
                    ))}
                    <div className="ml-3 text-[8px] font-black text-black/80 uppercase tracking-widest pl-1">
                      {stats.pendingTasks} Tertunda
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            // Skeleton agenda cards
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-[170px] h-[170px] md:w-auto md:h-auto md:min-w-[340px] snap-start flex-shrink-0">
                <div className="w-full h-full md:min-h-[260px] bg-[#0d0d0d] border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] animate-pulse" />
                    <div className="h-2 w-16 rounded bg-white/[0.06] animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded-lg bg-white/[0.06] animate-pulse" />
                    <div className="h-4 w-3/4 rounded-lg bg-white/[0.06] animate-pulse" />
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
                    <div className="h-3 w-4 rounded bg-white/[0.06] animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            [
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...todayEvents.map((e: any) => ({ ...e, type: 'event', icon: Layout, label: 'Kesehatan' })),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...todayClasses.slice(0, 3).map((s: any) => ({ ...s, type: 'schedule', icon: Activity, label: 'Pendidikan' })),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...pendingTasks.slice(0, 2).map((t: any) => ({ ...t, type: 'task', icon: CheckSquare, label: 'Bekerja', subject: t.title }))
            ].filter(item => activeCategory === 'Semua' || item.label === activeCategory).map((item, i) => (
              <Link
                href={item.type === 'task' ? '/tasks' : '/calendar'}
                key={`${item.type}-${item.id}-${i}`}
                className="w-[170px] h-[170px] md:w-auto md:h-auto md:min-w-[340px] snap-start flex-shrink-0"
              >
                <div className="w-full h-full md:min-h-[260px] bg-[#0d0d0d] p-3 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl hover:border-[#d4af37]/30 transition-all duration-500 group/item relative overflow-hidden">
                  <div className="flex flex-col h-full relative z-10">
                    <div className="flex items-center justify-between mb-2 md:mb-6">
                      <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover/item:rotate-12 shadow-inner ${item.type === 'event' ? 'bg-[#d4af37]/10 text-[#d4af37]' :
                        item.type === 'schedule' ? 'bg-indigo-500/10 text-indigo-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                        <item.icon size={16} className="stroke-[2.5] md:hidden" />
                        <item.icon size={22} className="stroke-[2.5] hidden md:block" />
                      </div>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">{item.label}</span>
                    </div>
                    <h4 className="text-sm md:text-xl font-black text-white uppercase tracking-tight line-clamp-3 md:line-clamp-2 md:min-h-[3.5rem] group-hover/item:text-[#d4af37] transition-colors flex-1">{item.subject || item.title}</h4>
                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-2 md:pt-6">
                      <div className="flex items-center text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">
                        <Clock size={11} className="mr-1 md:mr-2 text-[#d4af37] md:hidden" />
                        <Clock size={14} className="mr-2 text-[#d4af37] hidden md:block" />
                        {item.start_time ? item.start_time.slice(0, 5) : 'Anytime'}
                      </div>
                      <ArrowRight size={14} className="text-slate-800 group-hover/item:translate-x-1 group-hover/item:text-[#d4af37] transition-all md:hidden" />
                      <ArrowRight size={18} className="text-slate-800 group-hover/item:translate-x-1 group-hover/item:text-[#d4af37] transition-all hidden md:block" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
          {/* Add New Card */}
          {activeCategory === 'Semua' && (
            <Link href="/chat" className="min-w-[240px] snap-start">
              <div className="h-full bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center group/add hover:border-[#d4af37]/20 transition-all hover:bg-white/[0.03]">
                <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center mb-4 group-hover/add:scale-110 group-hover/add:border-[#d4af37]/30 transition-all">
                  <Plus size={24} className="text-slate-700 group-hover/add:text-[#d4af37] stroke-[3]" />
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Tambah Agenda</span>
              </div>
            </Link>
          )}

          {/* Habit Glowup Card */}
          {(activeCategory === 'Semua' || activeCategory === 'Kesehatan') && (
            <div className="w-[170px] h-[170px] md:w-auto md:h-auto md:min-w-[340px] snap-start flex-shrink-0">
              <div className="w-full h-full md:min-h-[260px] bg-slate-900/50 backdrop-blur-3xl border border-white/5 p-3 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden group/habit flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl opacity-40"></div>
                {/* Mobile compact view */}
                <div className="md:hidden flex flex-col h-full relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Habit Glowup</p>
                    <Target size={12} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar py-1">
                    {habits.map(habit => (
                      <div
                        key={habit.id}
                        onClick={() => !habit.done && handleHabitComplete(habit.id, habit.xp)}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all active:scale-95 ${habit.done ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${habit.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                          <habit.icon size={12} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-[8px] font-black uppercase tracking-tight truncate ${habit.done ? 'text-emerald-400/50 line-through' : 'text-white'}`}>
                            {habit.title}
                          </span>
                          <span className="text-[6px] font-bold text-indigo-400/40 uppercase tracking-widest">{habit.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest">{habits.filter(h => h.done).length} / {habits.length} Selesai</span>
                    <Zap size={10} className="text-indigo-500 animate-pulse" />
                  </div>
                </div>
                {/* Desktop full view */}
                <div className="hidden md:block">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Habit Glowup</p>
                    <Target size={14} className="text-indigo-400" />
                  </div>
                  <div className="space-y-3">
                    {habits.map((habit) => {
                      // gap was unused, removing it or using it if needed.
                      // const gap = suggestedGaps[idx];
                      return (
                        <div key={habit.id} className="flex items-center justify-between bg-white/5 p-3 px-4 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group/habit">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/habit:scale-110 transition-transform">
                              <habit.icon size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-white uppercase tracking-tight">{habit.title}</span>
                              <span className="text-[7px] font-bold text-indigo-400/60 uppercase tracking-widest">Sesi Glowup: {habit.time}</span>
                            </div>
                          </div>
                          <div
                            onClick={() => !habit.done && handleHabitComplete(habit.id, habit.xp)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${habit.done
                              ? 'bg-emerald-500/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                              : 'border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 text-slate-800 hover:text-emerald-400'
                              }`}
                          >
                            <Zap size={10} className={habit.done ? 'fill-current' : ''} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="hidden md:flex mt-6 items-center justify-between">
                  <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest opacity-60">Sikat Biar Naik Level!</span>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-black shadow-lg shadow-indigo-900/20 hover:scale-105 transition-transform">
                    <Plus size={18} className="stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#0b0b0b] rounded-[3rem] border border-white/5 premium-shadow p-5 md:p-12 relative overflow-hidden h-full">
            <div className="relative z-10 flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">
                Jadwal <span className="gold-text-gradient">Kuliah</span>
              </h2>
              <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] hidden sm:block">
                PATIH SYSTEM • 2026
              </div>
            </div>

            <div className="space-y-6">
              {loading ? (
                // Skeleton rows replacing the spinner
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 md:p-7 rounded-[2rem] border border-white/[0.04]">
                      <div className="w-10 h-10 md:w-16 md:h-16 rounded-[1.5rem] bg-white/[0.06] animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2.5">
                        <div className="h-5 w-3/4 rounded-lg bg-white/[0.06] animate-pulse" />
                        <div className="flex gap-3">
                          <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
                          <div className="h-3 w-20 rounded bg-white/[0.06] animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : todayClasses.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (todayClasses as any[]).map((cls: any) => (
                  <div key={cls.id} className="group relative p-4 md:p-7 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 hover:border-[#d4af37]/40 hover:bg-white/5 transition-all duration-500 cursor-pointer">
                    <div className="flex items-center gap-4 md:gap-0">
                      <div className="w-10 h-10 md:w-16 md:h-16 bg-white/5 text-[#d4af37] rounded-[1.2rem] md:rounded-[2rem] flex-shrink-0 flex items-center justify-center md:mr-8 group-hover:scale-110 transition-transform">
                        <Layout size={18} className="stroke-[1.5] md:hidden" />
                        <Layout size={28} className="stroke-[1.5] hidden md:block" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-white text-base md:text-xl group-hover:text-[#d4af37] transition-colors uppercase tracking-tight mb-1 md:mb-2 line-clamp-2">{cls.subject}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">
                          <span className="flex items-center shrink-0"><Clock className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-[#d4af37]" /> {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}</span>
                          <span className="flex items-center min-w-0"><MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-[#d4af37] shrink-0" /> <span className="truncate">{cls.room}</span></span>
                        </div>
                      </div>
                      <ArrowRight className="text-slate-800 group-hover:text-[#d4af37] group-hover:translate-x-2 transition-all hidden sm:block shrink-0" size={28} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[3.5rem]">
                  <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">Udah aman bos, kaga ada kuliah hari ini ☕</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-full">
          <div className="bg-[#0b0b0b] rounded-[3.5rem] border border-white/10 p-12 relative overflow-hidden h-full flex flex-col justify-center min-h-[500px]">
            <div className="relative z-10">
              <div className="flex flex-col space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-[#d4af37] opacity-50">Kalam Yono</h3>
                <p className="text-3xl font-black text-white uppercase tracking-tight leading-[1.1]">
                  &quot;{currentQuote.quote}&quot;
                </p>
              </div>

              <div className="mt-12 flex items-center space-x-3 opacity-30">
                <div className="w-3 h-3 rounded-full bg-[#d4af37]"></div>
                <div className="w-20 h-[1px] bg-[#d4af37]"></div>
              </div>
            </div>

            <div className="relative z-10 pt-12 border-t border-white/5 mt-auto">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#aa8418] flex items-center justify-center text-black shadow-2xl shadow-gold-900/30">
                  <span className="text-sm font-black italic">{currentQuote.initials}</span>
                </div>
                <div className="text-left">
                  <span className="block text-sm font-black text-white uppercase tracking-tighter leading-none mb-1">{currentQuote.author}</span>
                  <span className="block text-[9px] font-black text-[#d4af37] uppercase tracking-widest opacity-80">{currentQuote.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Modal */}
      {isStatsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in transition-all" onClick={() => setIsStatsModalOpen(false)}></div>
          <div className="relative bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_0_80px_rgba(212,175,55,0.1)] animate-in slide-in-from-bottom-12 duration-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest mb-0.5">Update Glowup</p>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Statistik Anda</h3>
                </div>
              </div>
              <button
                onClick={() => setIsStatsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* BMI Summary Card */}
            {(tempStats.weight > 0 && tempStats.height > 0) && (
              <div className="mb-6 bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between animate-in zoom-in duration-500">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-lg font-black ${calculateBMI(tempStats.weight, tempStats.height).color}`}>
                    {calculateBMI(tempStats.weight, tempStats.height).bmi}
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Body Mass Index</p>
                    <h4 className={`text-xs font-black uppercase tracking-tight ${calculateBMI(tempStats.weight, tempStats.height).color}`}>
                      {calculateBMI(tempStats.weight, tempStats.height).category}
                    </h4>
                  </div>
                </div>
                <div className="text-right hidden xs:block">
                  <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest block">Level Glowup</span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Premium User</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Weight & Height Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                    <Scale size={10} className="mr-1.5 text-[#d4af37]" /> Berat (KG)
                  </label>
                  <input
                    type="number"
                    value={tempStats.weight}
                    onChange={(e) => setTempStats(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-2xl font-black text-white focus:outline-none focus:border-[#d4af37]/50 transition-all text-center"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                    <Ruler size={10} className="mr-1.5 text-[#d4af37]" /> Tinggi (CM)
                  </label>
                  <input
                    type="number"
                    value={tempStats.height}
                    onChange={(e) => setTempStats(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-2xl font-black text-white focus:outline-none focus:border-[#d4af37]/50 transition-all text-center"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Sleep Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                    <Bed size={10} className="mr-1.5 text-[#d4af37]" /> Jam Tidur
                  </label>
                  <div className="flex items-center space-x-1">
                    <span className="text-xl font-black text-[#d4af37]">{tempStats.sleep}</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-[0.6rem]">Hours</span>
                  </div>
                </div>
                <div className="px-1">
                  <input
                    type="range"
                    min="0" max="24" step="0.5"
                    value={tempStats.sleep}
                    onChange={(e) => setTempStats(prev => ({ ...prev, sleep: parseFloat(e.target.value) }))}
                    className="w-full accent-[#d4af37] h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 text-[6px] font-black text-slate-600 uppercase tracking-widest">
                    <span>0H</span>
                    <span>12H</span>
                    <span>24H</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col space-y-3">
                <button
                  onClick={handleUpdateStats}
                  disabled={loading}
                  className="w-full bg-[#d4af37] py-4 rounded-2xl text-black font-black uppercase tracking-[0.2em] shadow-xl shadow-gold-900/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Simpan Perubahan</span>
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={14} />
                    </>
                  )}
                </button>
                <div className="text-center">
                  <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest italic flex items-center justify-center">
                    <Sparkles size={10} className="mr-1.5 opacity-50" /> Syncing to Yono Core
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Level Up Modal */}
      {isLevelUpModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 sm:p-0">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setIsLevelUpModalOpen(false)}></div>
          <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-[#d4af37]/30 rounded-[4rem] p-12 w-full max-w-md shadow-[0_0_100px_rgba(212,175,55,0.2)] animate-in zoom-in duration-700 text-center">
            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#d4af37] to-[#aa8418] flex items-center justify-center text-black mx-auto mb-8 shadow-2xl shadow-gold-900/40">
              <Trophy size={48} className="stroke-[2.5]" />
            </div>
            <h2 className="text-5xl font-black text-[#d4af37] uppercase tracking-tighter mb-4">Level Up</h2>
            <p className="text-xl font-black text-white uppercase tracking-widest mb-10">Yono System: Level {justLeveledUpTo}</p>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent mb-10"></div>
            <button
              onClick={() => setIsLevelUpModalOpen(false)}
              className="w-full py-6 rounded-[2rem] bg-white text-black text-sm font-black uppercase tracking-[0.3em] hover:bg-[#d4af37] hover:scale-105 transition-all duration-300 shadow-xl"
            >
              Lanjutkan Perjuangan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
