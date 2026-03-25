'use client'

import { useState } from 'react'
import { UploadCloud, FileText, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
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
    } catch (err: any) {
      alert("Waduh bos, ada error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">Masukin <span className="gold-text-gradient">Jadwal</span></h1>
        <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px] md:text-xs opacity-80">Upload PDF KRS lu, sisanya biar Patih yang ngerjain, Boss.</p>
      </div>

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

      {result && (
        <div className="bg-[#d4af37] shadow-xl shadow-gold-900/40 rounded-[2.5rem] p-8 md:p-10 flex items-center text-black animate-in zoom-in-95 duration-500">
          <div className="w-14 h-14 bg-black/10 backdrop-blur-md rounded-2xl flex items-center justify-center mr-6 shrink-0 border border-black/5">
            <Sparkles className="text-black" size={28} />
          </div>
          <div>
            <h4 className="font-black text-lg md:text-xl uppercase tracking-tighter">Ekstraksi Sukses! ✨</h4>
            <p className="text-black/70 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 opacity-80">{result}</p>
          </div>
        </div>
      )}
    </div>
  )
}

