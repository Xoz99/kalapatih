import { NextRequest } from "next/server";
import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

// Defer initialization to ensure environment is fully loaded
const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from environment variables.");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

export async function GET() {
  try {
    console.log("GET /api/chat - Fetching history");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: history, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Supabase returned newest first, but UI needs chronological (oldest to newest)
    const chronologicalHistory = (history || []).reverse();

    return new Response(JSON.stringify({ history: chronologicalHistory }), { status: 200 });
  } catch (error) {
    console.error("Fetch History Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/chat - Request received");
    const { message, history } = await req.json();
    console.log("POST /api/chat - Message:", message);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData?.user) {
      console.error("POST /api/chat - Auth Error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const user = authData.user;
    console.log("POST /api/chat - User ID:", user.id);

    // Fetch full profile for AI context
    let profileName = 'Andrian';
    let profileUni = '';
    let profileSem = '';

    try {
      console.log("POST /api/chat - Syncing user & fetching profile:", user.id);
      
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        profileName = profile.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Andrian';
        profileUni = profile.university || '';
        profileSem = profile.semester?.toString() || '';
      } else {
        // Fallback sync if no profile exists yet
        profileName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Andrian';
        await supabase.from('users').upsert({ id: user.id, name: profileName }, { onConflict: 'id' });
      }
      console.log("POST /api/chat - Profile Loaded:", { profileName, profileUni, profileSem });
    } catch (e) {
      console.error("POST /api/chat - Profile fetch error:", e);
    }

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const todayNameEn = daysEn[today.getDay()];
    const todayDateStr = today.toISOString().split('T')[0];

    const tools = [
      {
        functionDeclarations: [
          {
            name: "add_event",
            description: "Tambah jadwal atau agenda baru ke kalender bos.",
            parameters: {
              type: "OBJECT",
              properties: {
                title: { type: "string", description: "Judul acara/meeting" },
                date: { type: "string", description: "Tanggal acara format YYYY-MM-DD" },
                start_time: { type: "string", description: "Jam mulai format HH:mm" },
                end_time: { type: "string", description: "Jam selesai format HH:mm" },
                category: { type: "string", description: "Kategori (misal: Kuliah, Kerja, Santai)" }
              },
              required: ["title", "date", "start_time", "end_time"],
            },
          },
          {
            name: "edit_event",
            description: "Mengubah agenda yang sudah ada di kalender.",
            parameters: {
              type: "OBJECT",
              properties: {
                id: { type: "string", description: "ID event yang mau diubah" },
                title: { type: "string", description: "Judul baru (opsional)" },
                date: { type: "string", description: "Tanggal baru YYYY-MM-DD (opsional)" },
                start_time: { type: "string", description: "Jam mulai baru HH:mm (opsional)" },
                end_time: { type: "string", description: "Jam selesai baru HH:mm (opsional)" },
                category: { type: "string", description: "Kategori baru (opsional)" }
              },
              required: ["id"],
            },
          },
          {
            name: "get_schedule",
            description: "Mengambil daftar jadwal kuliah bos untuk hari tertentu.",
            parameters: {
              type: "OBJECT",
              properties: {
                day: { type: "string", description: "Nama hari dalam bahasa Inggris (e.g. Monday)" },
              },
            },
          },
          {
            name: "list_events",
            description: "Melihat daftar semua event/agenda manual yang ada di kalender.",
            parameters: { type: "OBJECT", properties: {} },
          },
          {
            name: "delete_event",
            description: "Hapus agenda dari kalender. Bisa pakai ID atau sebutkan judul & tanggalnya.",
            parameters: {
              type: "OBJECT",
              properties: {
                id: { type: "string", description: "ID agenda (opsional kalau ada judul)" },
                title: { type: "string", description: "Judul agenda yang mau dihapus" },
                date: { type: "string", description: "Tanggal agenda format YYYY-MM-DD (opsional, default hari ini)" }
              }
            },
          },
          {
            name: "add_task",
            description: "Menambah tugas (To-Do) baru ke daftar tugas bos.",
            parameters: {
              type: "OBJECT",
              properties: {
                title: { type: "string", description: "Judul tugas" },
                priority: { type: "string", description: "Prioritas", enum: ["Low", "Medium", "High"] },
                start_date: { type: "string", description: "ISO start date" },
                deadline: { type: "string", description: "ISO deadline date" }
              },
              required: ["title"],
            },
          },
          {
            name: "list_tasks",
            description: "Melihat daftar tugas bos.",
            parameters: { type: "OBJECT", properties: {} },
          },
          {
            name: "add_dream",
            description: "Menyimpan mimpi atau target jangka panjang bos.",
            parameters: {
              type: "OBJECT",
              properties: {
                title: { type: "string", description: "Judul mimpi/target" },
                description: { type: "string", description: "Detail penjelasan mimpinya" },
                target_date: { type: "string", description: "Estimasi tercapai (YYYY-MM-DD)" }
              },
              required: ["title"],
            },
          },
          {
            name: "list_dreams",
            description: "Melihat daftar mimpi dan visi masa depan bos.",
            parameters: { type: "OBJECT", properties: {} },
          },
          {
            name: "list_habit_logs",
            description: "Cek habit apa aja yang udah diselesaikan bos hari ini.",
            parameters: {
              type: "OBJECT",
              properties: {
                date: { type: "string", description: "Tanggal (YYYY-MM-DD)" }
              }
            },
          },
          {
            name: "add_habit",
            description: "Tambah habit baru (habits yang mau dirutinin bos).",
            parameters: {
              type: "OBJECT",
              properties: {
                title: { type: "string", description: "Nama habit (misal: Minum air 2L)" },
                description: { type: "string", description: "Detail/alasan (opsional)" },
                frequency: { type: "string", description: "Frekuensi (misal: daily, weekly)" }
              },
              required: ["title"]
            },
          },
          {
            name: "log_habit",
            description: "Catat kalau bos udah nyelesaiin habit hari ini.",
            parameters: {
              type: "OBJECT",
              properties: {
                habit_id: { type: "string", description: "ID habit yang selesai" },
                date: { type: "string", description: "Tanggal selesai (YYYY-MM-DD, default hari ini)" }
              },
              required: ["habit_id"]
            },
          },
          {
            name: "list_habits",
            description: "Lihat daftar semua habit aktif yang harus dilakuin bos.",
            parameters: { type: "OBJECT", properties: {} },
          },
          {
            name: "log_health",
            description: "Catat data kesehatan harian bos (tidur, mood, minum air, berat badan, keluhan fisik). Bisa update partial, contoh cuma tidur doang.",
            parameters: {
              type: "OBJECT",
              properties: {
                date: { type: "string", description: "Tanggal log (YYYY-MM-DD), default hari ini" },
                sleep_hours: { type: "number", description: "Jam tidur semalam (misal: 6.5)" },
                mood: { type: "number", description: "Rating mood 1-10 (1=parah, 10=amazing)" },
                water_glasses: { type: "number", description: "Jumlah gelas air putih yang diminum" },
                weight_kg: { type: "number", description: "Berat badan (kg)" },
                notes: { type: "string", description: "Catatan keluhan fisik atau kondisi umum (misal: sakit kepala, badan pegel)" }
              }
            },
          },
          {
            name: "get_health_summary",
            description: "Ambil rangkuman kesehatan bos 7 hari terakhir (jam tidur, mood, minum air, berat, keluhan).",
            parameters: {
              type: "OBJECT",
              properties: {
                days: { type: "number", description: "Jumlah hari ke belakang (default 7)" }
              }
            },
          },
          {
            name: "get_holistic_context",
            description: "Mengambil rangkuman semua data bos (Habits, Tugas, Agenda/Event, Jadwal Kuliah, Kesehatan) untuk tanggal tertentu.",
            parameters: {
              type: "OBJECT",
              properties: {
                date: { type: "string", description: "Tanggal pengecekan (YYYY-MM-DD), default hari ini." }
              }
            },
          }
        ],
      },
    ];

    let chat;
    try {
      console.log("POST /api/chat - Initializing model:", "gemini-2.5-flash-lite");
      const genAI = getGenAI();
      const actualModel = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: tools as any,
        systemInstruction: `Lu adalah Yono AI (Kalapatih), asisten sekaligus sahabat Sultan Tuan ${profileName}. Gaya bicara asik, Gen Z gaul Indonesia, panggil 'bos' atau 'ngab'.
Lu punya 2 mode:

🛠️ MODE ASISTEN: Manage jadwal kuliah (recurring), agenda/event (manual), tugas, habit, dan mimpi (goals).
💬 MODE CURHAT: Lu juga TEMAN CURHAT yang asyik. Bos bisa cerita apa aja — soal hidup, perasaan, masalah, galau, stress, atau apapun. Lu dengerin dengan empati, kasih support, motivasi, dan saran yang bijak tapi tetap santai. Lu juga bisa diajak ngobrol random, ngebahas topik apapun, bercanda, atau sekadar nemenin bos.

Lu adalah Life Coach + Best Friend yang ngebantu bos ${profileName} buat terus glowup lahir batin. Gunakan Markdown.

KONTEKS SULTAN:
- Nama: ${profileName}
- Kuliah: ${profileUni || 'Belum diatur'}
- Semester: ${profileSem || 'Belum diatur'}

RULES:
1. Panggil Sultan ${profileName} dengan sebutan 'bos' atau 'ngab'.
2. JANGAN PERNAH berhalusinasi DATA. Selalu gunakan TOOLS untuk ambil/simpan data jadwal/tugas/habit.
3. ANTI-HALUSINASI: Kalau hasil pencarian dari database KOSONG (empty), katakan sejujurnya. JANGAN mengarang jadwal atau tugas fiktif.
4. Kalau bos tanya 'besok ada apa' atau 'kegiatan hari ini', WAJIB panggil 'get_holistic_context'.
5. Saat kasih rangkuman kegiatan, sebutkan: Jadwal Kuliah, Agenda Gaskeun, Tugas, dan Habits.
6. Gunakan format Markdown yang premium, rapi, dan enak dibaca. Pisahkan section dengan bold header.
7. Kalau database kasih error, laporin jujur ke bos.
8. CURHAT MODE: Kalau bos cerita masalah pribadi, galau, stress, atau mau ngobrol santai — JANGAN pakai tools. Langsung respon dengan empati, support, dan saran. Jadilah pendengar yang baik. Boleh pakai emoji buat bikin hangat.
9. Bisa diajak ngobrol topik apapun: film, musik, game, filosofi, relationship, dll. Respon natural dan asyik.
10. Kalau bos lagi down, kasih semangat dan motivasi yang genuine, bukan template.
11. HEALTH MODE: Kalau bos cerita soal kesehatan (tidur, capek, sakit, minum air, berat badan), langsung gunakan tool 'log_health' untuk mencatat. Kasih saran kesehatan yang relevan dan empati.
12. Kalau bos tanya 'gimana kondisi gw minggu ini?' atau sejenisnya, panggil 'get_health_summary'.
13. Proaktif tanyain kesehatan bos kalau konteks cocok (misal bos bilang capek/pusing/begadang).

Konteks Waktu: Hari ini ${todayNameEn}, ${todayDateStr}. User ID: ${user.id}`,
      });

      const chatContent: Content[] = (history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content } as Part],
      }));

      // Gemini Requirement: First message in history must be from 'user'
      while (chatContent.length > 0 && chatContent[0].role !== 'user') {
        chatContent.shift();
      }

      console.log("POST /api/chat - Starting chat with history length:", chatContent.length);
      if (chatContent.length > 0) {
        console.log("POST /api/chat - First History Role:", chatContent[0].role);
      }
      chat = actualModel.startChat({ history: chatContent });
    } catch (modelErr) {
      console.error("POST /api/chat - Model Initialization CRASH:", modelErr);
      return new Response(JSON.stringify({ 
        error: "Gagal inisialisasi model AI.", 
        details: (modelErr instanceof Error ? modelErr.message : String(modelErr)) 
      }), { status: 500 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ONE CALL: Stream immediately
          const result = await chat.sendMessageStream(message);
          let toolCall = null;
          let fullContent = "";

          // Iterate through stream
          for await (const chunk of result.stream) {
            const parts = chunk.candidates?.[0]?.content?.parts || [];

            for (const part of parts) {
              if (part.functionCall) {
                toolCall = part.functionCall;
                continue;
              }
              if (part.text) {
                const text = part.text;
                fullContent += text;
                controller.enqueue(encoder.encode(text));
              }
            }
            if (toolCall) break;
          }

          let currentIteration = 0;
          const maxIterations = 5;

          while (toolCall && currentIteration < maxIterations) {
            currentIteration++;
            console.log(`--- Tool Call Iteration ${currentIteration}: ${toolCall.name} ---`);

            // Handle Tool logic
            let toolResponse = null;
            if (toolCall.name === "get_schedule") {
              const { day } = toolCall.args as { day?: string };
              const { data, error: dbErr } = await supabase.from('schedules').select('*').eq('user_id', user.id).eq('day_of_week', day || todayNameEn);
              if (dbErr) {
                console.error("get_schedule error:", dbErr);
                toolResponse = { name: "get_schedule", response: { error: "Gagal ambil jadwal dari database." } };
              } else {
                toolResponse = { name: "get_schedule", response: { schedule: data } };
              }
            }
            else if (toolCall.name === "add_event") {
              const { title, date, start_time, end_time, category } = toolCall.args as { title: string; date: string; start_time: string; end_time: string; category?: string };

              // Basic Validation
              if (!title || !date || !start_time || !end_time) {
                toolResponse = { name: "add_event", response: { success: false, error: "Missing required fields: title, date, start_time, end_time" } };
              } else {
                console.log("TOOL CALL [add_event]:", { title, date, start_time, end_time, category });
                const { data, error: dbErr } = await supabase.from('events').insert({
                  user_id: user.id,
                  title,
                  event_date: date,
                  start_time,
                  end_time,
                  category: category || null
                }).select();

                if (dbErr) {
                  console.error("add_event error:", dbErr);
                  toolResponse = { name: "add_event", response: { success: false, error: `Gagal simpan: ${dbErr.message || 'Unknown error'}. Pastikan koneksi aman.` } };
                } else if (!data || data.length === 0) {
                  console.warn("add_event: insert success but select returned empty. Check RLS!");
                  toolResponse = { name: "add_event", response: { success: false, error: "Gagal: Data tidak muncul setelah simpan (Potensi masalah RLS)." } };
                } else {
                  console.log("add_event SUCCESS:", data[0].id);
                  toolResponse = { name: "add_event", response: { success: true, event: data[0] } };
                }
              }
            }
            else if (toolCall.name === "edit_event") {
              const { id, title, date, start_time, end_time, category } = toolCall.args as { id: string; title?: string; date?: string; start_time?: string; end_time?: string; category?: string };
              console.log("TOOL CALL [edit_event]:", { id, title, date, start_time, end_time, category });

              if (!id) {
                toolResponse = { name: "edit_event", response: { success: false, error: "ID agenda wajib diisi untuk edit." } };
              } else {
                const updateData: Record<string, string | null> = {};
                if (title) updateData.title = title;
                if (date) updateData.event_date = date;
                if (start_time) updateData.start_time = start_time;
                if (end_time) updateData.end_time = end_time;
                if (category) updateData.category = category;

                if (Object.keys(updateData).length === 0) {
                  toolResponse = { name: "edit_event", response: { success: false, error: "Tidak ada data yang diubah bos." } };
                } else {
                  const { data, error: dbErr } = await supabase
                    .from('events')
                    .update(updateData)
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .select();

                  if (dbErr) {
                    console.error("edit_event error:", dbErr);
                    toolResponse = { name: "edit_event", response: { success: false, error: `Gagal ubah: ${dbErr.message}` } };
                  } else if (!data || data.length === 0) {
                    console.warn("edit_event FAILURE: Record not found or not owner.");
                    toolResponse = { name: "edit_event", response: { success: false, error: "Gagal: Agenda tidak ditemukan atau bos bukan pemilik event ini. Coba cek ID dengan 'list_events'." } };
                  } else {
                    console.log("edit_event SUCCESS:", id);
                    toolResponse = { name: "edit_event", response: { success: true, event: data[0] } };
                  }
                }
              }
            }
            else if (toolCall.name === "list_events") {
              console.log("TOOL CALL [list_events] for user:", user.id);
              const { data, error: dbErr } = await supabase
                .from('events')
                .select('*')
                .eq('user_id', user.id)
                .order('event_date', { ascending: true })
                .limit(20);

              if (dbErr) {
                console.error("list_events error:", dbErr);
                toolResponse = { name: "list_events", response: { error: "Gagal ambil daftar event: " + dbErr.message } };
              } else {
                console.log("list_events SUCCESS, count:", data?.length || 0);
                toolResponse = { name: "list_events", response: { events: data } };
              }
            }
            else if (toolCall.name === "delete_event") {
              try {
                const { id, title, date } = toolCall.args as { id?: string; title?: string; date?: string };
                let targetId = id;

                // Priority: Use ID if provided, otherwise search by title + date
                if (!targetId && title) {
                  const searchDate = date || todayDateStr;
                  console.log(`TOOL CALL [delete_event]: Searching for "${title}" on ${searchDate}`);
                  
                  const { data: foundEvents } = await supabase
                    .from('events')
                    .select('id')
                    .eq('user_id', user.id)
                    .ilike('title', `%${title}%`)
                    .eq('event_date', searchDate)
                    .limit(1);

                  if (foundEvents && foundEvents.length > 0) {
                    targetId = foundEvents[0].id;
                  }
                }

                if (!targetId) {
                  toolResponse = { 
                    name: "delete_event", 
                    response: { 
                      success: false, 
                      error: title ? `Gagal nemuin agenda "${title}" buat dihapus.` : "ID atau Judul wajib ada buat hapus agenda." 
                    } 
                  };
                } else {
                  console.log("TOOL CALL [delete_event]: Deleting ID:", targetId);
                  const { data, error: dbErr } = await supabase
                    .from('events')
                    .delete()
                    .eq('id', targetId)
                    .eq('user_id', user.id)
                    .select();

                  if (dbErr) {
                    console.error("delete_event error:", dbErr);
                    toolResponse = { name: "delete_event", response: { success: false, error: `Gagal hapus: ${dbErr.message}` } };
                  } else if (!data || data.length === 0) {
                    toolResponse = { name: "delete_event", response: { success: false, error: "Gagal: Agenda kaga ada atau bos bukan pemilik event ini." } };
                  } else {
                    toolResponse = { name: "delete_event", response: { success: true, message: "Agenda udah Yono beresin dari kalender, Bos! ✅" } };
                  }
                }
              } catch (e) {
                console.error("delete_event catch logic:", e);
                toolResponse = { name: "delete_event", response: { success: false, error: "Ada masalah pas nyoba hapus agenda." } };
              }
            }
            else if (toolCall.name === "add_task") {
              const { title, priority, deadline, start_date } = toolCall.args as { title: string; priority?: string; deadline?: string; start_date?: string };
              const { error: dbErr } = await supabase.from('tasks').insert({
                user_id: user.id, title, priority: priority || 'Medium', deadline: deadline || null, start_date: start_date || null
              });
              if (dbErr) {
                console.error("add_task error:", dbErr);
                toolResponse = { name: "add_task", response: { success: false, error: dbErr.message } };
              } else {
                toolResponse = { name: "add_task", response: { success: true } };
              }
            }
            else if (toolCall.name === "list_tasks") {
              const { data, error: dbErr } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('is_done', false).limit(20);
              if (dbErr) {
                console.error("list_tasks error:", dbErr);
                toolResponse = { name: "list_tasks", response: { error: "Gagal ambil daftar tugas." } };
              } else {
                toolResponse = { name: "list_tasks", response: { tasks: data } };
              }
            }
            else if (toolCall.name === "add_dream") {
              try {
                const { title, description, target_date } = toolCall.args as { title: string; description?: string; target_date?: string };
                const { data, error: dbErr } = await supabase.from('dreams').insert({
                  user_id: user.id, title, description, target_date
                }).select();
                if (dbErr) throw dbErr;
                toolResponse = { name: "add_dream", response: { success: true, dream: data?.[0] } };
              } catch (e) {
                console.error("add_dream error:", e);
                toolResponse = { name: "add_dream", response: { success: false, error: e instanceof Error ? e.message : String(e) } };
              }
            }
            else if (toolCall.name === "list_dreams") {
              try {
                const { data, error: dbErr } = await supabase.from('dreams').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
                if (dbErr) throw dbErr;
                toolResponse = { name: "list_dreams", response: { dreams: data } };
              } catch (e) {
                console.error("list_dreams error:", e);
                toolResponse = { name: "list_dreams", response: { error: "Daftar mimpi belum bisa diakses (tabel missing?)." } };
              }
            }
            else if (toolCall.name === "add_habit") {
              try {
                const { title, description, frequency } = toolCall.args as { title: string; description?: string; frequency?: string };
                const { data, error: dbErr } = await supabase.from('habits').insert({
                  user_id: user.id, title, description, frequency: frequency || 'daily'
                }).select();
                if (dbErr) throw dbErr;
                toolResponse = { name: "add_habit", response: { success: true, habit: data?.[0] } };
              } catch (e) {
                console.error("add_habit error:", e);
                toolResponse = { name: "add_habit", response: { success: false, error: "Gagal nambah habit baru." } };
              }
            }
            else if (toolCall.name === "list_habits") {
              try {
                const { data, error: dbErr } = await supabase.from('habits').select('*').eq('user_id', user.id);
                if (dbErr) throw dbErr;
                toolResponse = { name: "list_habits", response: { habits: data } };
              } catch (e) {
                console.error("list_habits error:", e);
                toolResponse = { name: "list_habits", response: { error: "Gagal ambil daftar habit." } };
              }
            }
            else if (toolCall.name === "log_habit") {
              try {
                const { habit_id, date } = toolCall.args as { habit_id: string; date?: string };
                const targetDate = date || todayDateStr;
                const { error: dbErr } = await supabase.from('habit_logs').upsert({
                  user_id: user.id, habit_id, completed_at: targetDate
                }, { onConflict: 'user_id, habit_id, completed_at' });
                if (dbErr) throw dbErr;
                toolResponse = { name: "log_habit", response: { success: true, message: "Habit udah Yono catet! Mantap bos! 🏆" } };
              } catch (e) {
                console.error("log_habit error:", e);
                toolResponse = { name: "log_habit", response: { success: false, error: "Gagal mencatat habit log." } };
              }
            }
            else if (toolCall.name === "list_habit_logs") {
              try {
                const { date } = toolCall.args as { date?: string };
                const targetDate = date || todayDateStr;
                const { data, error: dbErr } = await supabase
                  .from('habit_logs')
                  .select('*, habits(title)')
                  .eq('user_id', user.id)
                  .eq('completed_at', targetDate);
                if (dbErr) throw dbErr;
                toolResponse = { name: "list_habit_logs", response: { completed_habits: data } };
              } catch (e) {
                console.error("list_habit_logs error:", e);
                toolResponse = { name: "list_habit_logs", response: { error: "Gagal ambil data habit." } };
              }
            }
            else if (toolCall.name === "log_health") {
              try {
                const { date, sleep_hours, mood, water_glasses, weight_kg, notes } = toolCall.args as {
                  date?: string; sleep_hours?: number; mood?: number; water_glasses?: number; weight_kg?: number; notes?: string;
                };
                const targetDate = date || todayDateStr;
                console.log("TOOL CALL [log_health]:", { targetDate, sleep_hours, mood, water_glasses, weight_kg, notes });

                // Build update object with only provided fields
                const healthData: Record<string, unknown> = { user_id: user.id, log_date: targetDate };
                if (sleep_hours !== undefined) healthData.sleep_hours = sleep_hours;
                if (mood !== undefined) healthData.mood = Math.min(10, Math.max(1, mood));
                if (water_glasses !== undefined) healthData.water_glasses = water_glasses;
                if (weight_kg !== undefined) healthData.weight_kg = weight_kg;
                if (notes !== undefined) healthData.notes = notes;

                const { data, error: dbErr } = await supabase
                  .from('health_logs')
                  .upsert(healthData, { onConflict: 'user_id, log_date' })
                  .select();

                if (dbErr) throw dbErr;
                console.log("log_health SUCCESS:", data?.[0]?.id);
                toolResponse = { name: "log_health", response: { success: true, health_log: data?.[0] } };
              } catch (e) {
                console.error("log_health error:", e);
                toolResponse = { name: "log_health", response: { success: false, error: "Gagal nyimpen data kesehatan bos." } };
              }
            }
            else if (toolCall.name === "get_health_summary") {
              try {
                const { days } = toolCall.args as { days?: number };
                const lookbackDays = days || 7;
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - lookbackDays);
                const startDateStr = startDate.toISOString().split('T')[0];

                console.log("TOOL CALL [get_health_summary]:", { lookbackDays, startDateStr });

                const { data, error: dbErr } = await supabase
                  .from('health_logs')
                  .select('*')
                  .eq('user_id', user.id)
                  .gte('log_date', startDateStr)
                  .order('log_date', { ascending: false });

                if (dbErr) throw dbErr;

                const logs = data || [];
                const avgSleep = logs.filter(l => l.sleep_hours).reduce((sum, l) => sum + l.sleep_hours, 0) / (logs.filter(l => l.sleep_hours).length || 1);
                const avgMood = logs.filter(l => l.mood).reduce((sum, l) => sum + l.mood, 0) / (logs.filter(l => l.mood).length || 1);
                const avgWater = logs.filter(l => l.water_glasses).reduce((sum, l) => sum + l.water_glasses, 0) / (logs.filter(l => l.water_glasses).length || 1);

                toolResponse = {
                  name: "get_health_summary",
                  response: {
                    period: `${lookbackDays} hari terakhir`,
                    total_logs: logs.length,
                    averages: {
                      sleep_hours: Math.round(avgSleep * 10) / 10,
                      mood: Math.round(avgMood * 10) / 10,
                      water_glasses: Math.round(avgWater * 10) / 10
                    },
                    recent_logs: logs.slice(0, 7).map(l => ({
                      date: l.log_date,
                      sleep: l.sleep_hours,
                      mood: l.mood,
                      water: l.water_glasses,
                      weight: l.weight_kg,
                      notes: l.notes
                    })),
                    health_tips: avgSleep < 6 ? "⚠️ Tidur kurang dari 6 jam rata-rata!" : avgSleep >= 7 ? "✅ Tidur cukup" : "⚠️ Tidur masih kurang ideal"
                  }
                };
              } catch (e) {
                console.error("get_health_summary error:", e);
                toolResponse = { name: "get_health_summary", response: { error: "Gagal ambil data kesehatan." } };
              }
            }
            else if (toolCall.name === "get_holistic_context") {
              try {
                const { date } = toolCall.args as { date?: string };
                const targetDate = date || todayDateStr;
                
                // For schedules (recurring), we need the day of week for that specific date
                const targetDayName = date ? daysEn[new Date(date).getDay()] : todayNameEn;

                console.log("TOOL CALL [get_holistic_context]:", { targetDate, targetDayName });

                const [habitsAll, habitsDone, tasksRes, eventsRes, schedulesRes, healthRes] = await Promise.all([
                  supabase.from('habits').select('*').eq('user_id', user.id),
                  supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('completed_at', targetDate),
                  supabase.from('tasks').select('*').eq('user_id', user.id).eq('is_done', false),
                  supabase.from('events').select('*').eq('user_id', user.id).eq('event_date', targetDate),
                  supabase.from('schedules').select('*').eq('user_id', user.id).eq('day_of_week', targetDayName),
                  supabase.from('health_logs').select('*').eq('user_id', user.id).eq('log_date', targetDate).maybeSingle()
                ]);

                toolResponse = {
                  name: "get_holistic_context",
                  response: {
                    date: targetDate,
                    all_habits: (habitsAll.data || []).map(h => ({ id: h.id, title: h.title })),
                    completed_habit_ids: (habitsDone.data || []).map(h => h.habit_id),
                    pending_tasks: (tasksRes.data || []).map(t => ({ title: t.title, deadline: t.deadline })),
                    manual_events: (eventsRes.data || []).map(e => ({ title: e.title, time: `${e.start_time}-${e.end_time}`, category: e.category })),
                    university_schedule: (schedulesRes.data || []).map(s => ({ subject: s.subject, time: `${s.start_time}-${s.end_time}`, room: s.room })),
                    health_today: healthRes.data ? {
                      sleep_hours: healthRes.data.sleep_hours,
                      mood: healthRes.data.mood,
                      water_glasses: healthRes.data.water_glasses,
                      weight_kg: healthRes.data.weight_kg,
                      notes: healthRes.data.notes
                    } : null,
                    status: (habitsAll.data?.length === 0 && tasksRes.data?.length === 0 && eventsRes.data?.length === 0 && schedulesRes.data?.length === 0) ? "No data found in database for this date. Tell user it's empty." : "Success"
                  }
                };
              } catch (e) {
                console.error("holistic context error:", e);
                toolResponse = { name: "get_holistic_context", response: { error: "Gagal ambil data holistik." } };
              }
            }

            // Send results back to Gemini
            if (toolResponse) {
              console.log("--- Tool Result ---", toolCall.name, toolResponse.response.success !== false ? "✅ SUCCESS" : "❌ FAILED");
              if (toolResponse.response.error) console.log("   Error:", toolResponse.response.error);

              const nextResp = await chat.sendMessage([{ functionResponse: toolResponse }]);
              toolCall = null; // Reset toolCall for the next iteration
              const nextParts = nextResp.response.candidates?.[0]?.content?.parts || [];
              const hasToolCall = nextParts.some(p => p.functionCall);

              for (const p of nextParts) {
                if (p.functionCall) {
                  toolCall = p.functionCall;
                }
                // Only enqueue text IF the entire response has NO tool calls (Final Answer)
                if (p.text && !hasToolCall) {
                  const t = p.text;
                  fullContent += t;
                  controller.enqueue(encoder.encode(t));
                }
              }
            } else {
              // If for some reason toolResponse was null (e.g., unknown tool), break the loop.
              break;
            }
          }

          // Save history with slight delay to ensure deterministic ordering by timestamp
          await supabase.from('chat_history').insert({ user_id: user.id, role: 'user', content: message });
          await supabase.from('chat_history').insert({ user_id: user.id, role: 'assistant', content: fullContent });
        } catch (err) {
          console.error("Stream error detail:", err);
          const errMsg = err instanceof Error ? err.message : String(err);
          controller.enqueue(encoder.encode(`Waduh bos, ada kendala teknis: ${errMsg}. Coba lagi ya! 🙏`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (error) {
    console.error("Chat Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }), { status: 500 });
  }
}
