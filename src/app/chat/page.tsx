'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createClient } from '@/lib/supabase/client'

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/chat', { cache: 'no-store' })
        if (!res.ok) throw new Error("Gagal ambil history")
        const data = await res.json()
        if (data.history && data.history.length > 0) {
          setMessages(data.history.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content
          })))
        } else {
          setMessages([
            { role: 'assistant', content: 'Halo bos! Ada yang bisa Yono bantu soal jadwal kuliah atau agenda lu hari ini? Gas tanya aja! 👋' }
          ])
        }
      } catch {
        setMessages([
          { role: 'assistant', content: 'Halo bos! Ada yang bisa Yono bantu soal jadwal kuliah atau agenda lu hari ini? Gas tanya aja! 👋' }
        ])
      }
    }
    loadHistory()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const extractEventLogic = (message: string) => {
    const msg = message.toLowerCase()
    const addKeywords = ['tambah', 'set', 'masukin', 'agenda', 'meeting', 'acara', 'buat']
    if (!addKeywords.some(kw => msg.includes(kw))) return null

    const eventDate = new Date()
    if (msg.includes('besok')) {
      eventDate.setDate(eventDate.getDate() + 1)
    } else if (msg.includes('lusa')) {
      eventDate.setDate(eventDate.getDate() + 2)
    } else {
      const dateMatch = msg.match(/tanggal\s*(\d+)/)
      if (dateMatch) {
        const targetDay = parseInt(dateMatch[1])
        if (targetDay < eventDate.getDate()) {
          // Next month
          eventDate.setMonth(eventDate.setMonth(eventDate.getMonth() + 1))
        }
        eventDate.setDate(targetDay)
      }
    }

    let startTime = '19:00:00'
    const timeRegex = /jam\s*(\d+)/
    const match = msg.match(timeRegex)
    if (match) {
      let hour = parseInt(match[1])
      const isEvening = msg.includes('malam') || msg.includes('malem') || msg.includes('sore')
      if (isEvening && hour < 12) hour += 12
      if (msg.includes('siang') && hour <= 5) hour += 12
      startTime = `${hour.toString().padStart(2, '0')}:00:00`
    }

    let title = message
      .replace(/tambah|set|masukin|agenda|meeting|acara|buat|rapat/gi, '')
      .replace(/besok|lusa|hari ini|tanggal\s*\d+/gi, '')
      .replace(/jam\s*\d+\s*(malam|malem|sore|siang|pagi|an)?/gi, '')
      .trim()

    if (!title) title = "Agenda Baru"

    return {
      title,
      event_date: eventDate.toISOString().split('T')[0],
      start_time: startTime,
      end_time: startTime.replace(/^\d+/, h => (parseInt(h) + 1).toString().padStart(2, '0'))
    }
  }

  const handleLogicFallback = async (userMessage: string) => {
    const logicEvent = extractEventLogic(userMessage)
    if (logicEvent) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // 1. Save event to calendar
        const { error: eventError } = await supabase.from('events').insert({
          user_id: user.id,
          ...logicEvent
        })

        // 2. Save chat to history
        const assistantMessage = `**[Yono LOGIC MODE]**\n\nWaduh bos, API lagi gempor nich, tapi Yono tetep gass pake Logic Mode! 🤖✅\n\nAgenda **"${logicEvent.title}"** udah Yono masukin ke kalender buat tanggal **${logicEvent.event_date}** jam **${logicEvent.start_time.slice(0, 5)}**. Aman terkendali! 🫡`

        await supabase.from('chat_history').insert([
          { user_id: user.id, role: 'user', content: userMessage },
          { user_id: user.id, role: 'assistant', content: assistantMessage }
        ])

        if (!eventError) {
          setMessages(prev => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: assistantMessage
            }
            return newMessages
          })
          return true
        }
      }
    }
    return false
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    // Instead of adding an empty bubble immediately, we wait for the first chunk
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages.slice(-6) }),
      })

      if (!response.ok) throw new Error("Gagal dapet balesan dari Yono ai.")

      const reader = response.body?.getReader()
      let accumulatedContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          
          if (!accumulatedContent && chunk.trim()) {
            // First meaningful chunk! Add the assistant message now
            accumulatedContent += chunk
            setMessages(prev => [...prev, { role: 'assistant', content: accumulatedContent }])
          } else if (accumulatedContent) {
            accumulatedContent += chunk
            
            // If we hit a technical error message in the stream, try fallback
            if (accumulatedContent.includes("kendala teknis")) {
              const worked = await handleLogicFallback(userMessage)
              if (worked) {
                setIsLoading(false)
                return
              }
            }

            setMessages(prev => {
              const newMessages = [...prev]
              newMessages[newMessages.length - 1] = {
                role: 'assistant',
                content: accumulatedContent
              }
              return newMessages
            })
          }
          
          // Smooth reveal delay
          await new Promise(resolve => setTimeout(resolve, 20))
        }
      }
    } catch {
      const worked = await handleLogicFallback(userMessage)
      if (worked) {
        setIsLoading(false)
        return
      }

      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: "Waduh bos, sori.. koneksi Yono lagi bapuk nih. Coba lagi ya! 🙏" }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-2 md:px-10 h-[calc(100vh-130px)] md:h-[calc(100vh-160px)] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex items-center justify-between mb-4 md:mb-8 px-2 md:px-2">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#aa8418] rounded-2xl flex items-center justify-center text-black shadow-lg shadow-gold-900/20 transform -rotate-3">
            <Bot size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-none">Yono <span className="gold-text-gradient">AI</span></h1>
            <div className="flex items-center text-[10px] font-black text-[#d4af37] uppercase tracking-widest mt-1">
              <span className="w-2 h-2 bg-[#d4af37] rounded-full mr-2 animate-pulse"></span>
              Ready To Ngebabu
            </div>
          </div>
        </div>
        <div className="hidden md:flex bg-black/40 backdrop-blur-md shadow-sm border border-white/5 px-4 py-2 rounded-2xl items-center">
          <Sparkles size={14} className="mr-2 text-[#d4af37]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Yono 4.5 Boost</span>
        </div>
      </div>

      <div className="flex-1 bg-[#0d0d0d] border border-white/5 shadow-2xl shadow-black rounded-2xl md:rounded-[3rem] mb-2 md:mb-6 overflow-hidden flex flex-col relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

        <div className="flex-1 overflow-y-auto p-3 md:p-10 space-y-4 md:space-y-8 scrollbar-hide relative z-10">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex max-w-[100%] md:max-w-[75%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`hidden md:flex w-10 h-10 rounded-xl items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-white/10 text-slate-400 ml-4' : 'bg-[#d4af37]/10 text-[#d4af37] mr-4'
                  }`}>
                  {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-3 md:p-6 rounded-xl md:rounded-[2rem] text-[13px] md:text-base tracking-tight leading-relaxed ${m.role === 'user'
                  ? 'bg-[#1a1a1a] text-white border border-white/5 rounded-tr-none shadow-xl shadow-black font-bold'
                  : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none font-normal'
                  }`}>
                  {m.role === 'assistant' ? (
                    <div className="chat-message prose prose-sm md:prose-base prose-invert max-w-none prose-p:leading-relaxed prose-p:my-2 prose-strong:text-[#d4af37] prose-strong:block prose-strong:mt-4 prose-strong:mb-1 prose-li:text-slate-300 prose-ul:my-1 prose-ol:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                      {isLoading && idx === messages.length - 1 && <span className="typing-cursor">┃</span>}
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (!messages.length || messages[messages.length - 1]?.role !== 'assistant') && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex items-center space-x-3 bg-white/5 p-5 rounded-[2rem] rounded-tl-none border border-white/5">
                <Loader2 size={18} className="text-[#d4af37] animate-spin" />
                <span className="text-[10px] text-[#d4af37] font-black uppercase tracking-widest">Yono lagi mikir...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-2 md:p-6 bg-black/40 backdrop-blur-md border-t border-white/5">
          <div className="relative flex items-center max-w-3xl mx-auto w-full">
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-full py-3 md:py-5 pl-5 md:pl-8 pr-14 md:pr-16 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500/50 transition-all shadow-sm tracking-tight text-white placeholder:text-slate-600"
              placeholder="Curhat ke Yono AI, Cuy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 md:right-3 w-10 md:w-12 h-10 md:h-12 bg-gradient-to-br from-[#d4af37] to-[#aa8418] text-black rounded-full transition-all shadow-lg shadow-gold-900/40 disabled:opacity-50 active:scale-90 flex items-center justify-center"
            >
              <Send size={18} className="md:size-20" />
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .typing-cursor {
          display: inline-block;
          color: #d4af37;
          animation: blink 0.8s infinite;
          font-weight: black;
          margin-left: 4px;
        }
        @keyframes shimmer {
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  )
}
