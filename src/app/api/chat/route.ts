import { NextRequest } from "next/server";
import { GoogleGenerativeAI, Content, Part } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { data: history, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;

    return new Response(JSON.stringify({ history }), { status: 200 });
  } catch (error: any) {
    console.error("Fetch History Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
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
            description: "Menambah event atau agenda baru ke kalender bos.",
            parameters: {
              type: "OBJECT",
              properties: {
                title: { type: "string", description: "Judul acara/meeting" },
                date: { type: "string", description: "Tanggal acara format YYYY-MM-DD" },
                start_time: { type: "string", description: "Jam mulai format HH:mm" },
                end_time: { type: "string", description: "Jam selesai format HH:mm" },
                event_type: { type: "string", description: "Tipe event: 'wajib' (kuliah/penting) atau 'acara' (biasa/one-off)", enum: ["wajib", "acara"] }
              },
              required: ["title", "date", "start_time", "end_time", "event_type"],
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
            description: "Menghapus event dari kalender berdasarkan ID.",
            parameters: {
              type: "OBJECT",
              properties: {
                id: { type: "string", description: "ID event yang mau dihapus" },
              },
              required: ["id"],
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
          }
        ],
      },
    ];

    // Use 'gemini-flash-lite-latest' (8B version) for maximum token efficiency (cost-effective).
    const actualModel = genAI.getGenerativeModel({
      model: "gemini-flash-lite-latest", 
      tools: tools as any,
      systemInstruction: `Lu adalah Patih AI, asisten Sultan Tuan Andrian. Gaya bicara asik, Gen Z gaul Indonesia, panggil 'bos' atau 'ngab'. Manage jadwal (Wajib/Acara) & Tugas. Gunakan Markdown. Hari ini ${todayNameEn}, ${todayDateStr}. User ID: ${user.id}`,
    }, { apiVersion: 'v1beta' });

    const chatContent: Content[] = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content } as Part],
    }));

    const chat = actualModel.startChat({ history: chatContent });

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
            const part = chunk.candidates?.[0]?.content?.parts?.[0];

            if (part?.functionCall) {
              toolCall = part.functionCall;
              break; // Handle tool separately
            }

            const text = chunk.text();
            fullContent += text;
            controller.enqueue(encoder.encode(text));
          }

          if (toolCall) {
            // Handle Tool logic
            let toolResponse = null;
            if (toolCall.name === "get_schedule") {
              const { day } = toolCall.args as any;
              const { data, error: dbErr } = await supabase.from('schedules').select('*').eq('day_of_week', day || todayNameEn);
              if (dbErr) {
                console.error("get_schedule error:", dbErr);
                toolResponse = { name: "get_schedule", response: { error: "Gagal ambil jadwal dari database." } };
              } else {
                toolResponse = { name: "get_schedule", response: { schedule: data } };
              }
            }
            else if (toolCall.name === "add_event") {
              const { title, date, start_time, end_time, event_type } = toolCall.args as any;
              const { data, error: dbErr } = await supabase.from('events').insert({
                user_id: user.id, title, event_date: date, start_time, end_time
              }).select();
              
              if (dbErr) {
                console.error("add_event error:", dbErr);
                toolResponse = { name: "add_event", response: { success: false, error: dbErr.message } };
              } else {
                toolResponse = { name: "add_event", response: { success: true, event: data?.[0] } };
              }
            }
            else if (toolCall.name === "list_events") {
              const { data, error: dbErr } = await supabase.from('events').select('*').eq('user_id', user.id).limit(10);
              if (dbErr) {
                console.error("list_events error:", dbErr);
                toolResponse = { name: "list_events", response: { error: "Gagal ambil daftar event." } };
              } else {
                toolResponse = { name: "list_events", response: { events: data } };
              }
            }
            else if (toolCall.name === "delete_event") {
              const { id } = toolCall.args as any;
              const { error: dbErr } = await supabase.from('events').delete().eq('id', id).eq('user_id', user.id);
              if (dbErr) {
                console.error("delete_event error:", dbErr);
                toolResponse = { name: "delete_event", response: { success: false, error: dbErr.message } };
              } else {
                toolResponse = { name: "delete_event", response: { success: true } };
              }
            }
            else if (toolCall.name === "add_task") {
              const { title, priority, deadline, start_date } = toolCall.args as any;
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
              const { data, error: dbErr } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('is_done', false).limit(5);
              if (dbErr) {
                console.error("list_tasks error:", dbErr);
                toolResponse = { name: "list_tasks", response: { error: "Gagal ambil daftar tugas." } };
              } else {
                toolResponse = { name: "list_tasks", response: { tasks: data } };
              }
            }

            if (toolResponse) {
              // Final commentary stream
              const finalResult = await chat.sendMessageStream([{ functionResponse: toolResponse }]);
              for await (const chunk of finalResult.stream) {
                const text = chunk.text();
                fullContent += text;
                controller.enqueue(encoder.encode(text));
              }
            }
          }

          // Save history
          await supabase.from('chat_history').insert({ user_id: user.id, role: 'user', content: message });
          if (fullContent) {
            await supabase.from('chat_history').insert({ user_id: user.id, role: 'assistant', content: fullContent });
          }
        } catch (err: any) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode("Waduh bos, ada kendala teknis dikit nih. Coba lagi yak! 🙏"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
