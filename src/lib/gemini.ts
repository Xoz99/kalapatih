import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const schema: Schema = {
  description: "List of subjects extracted from a college schedule",
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      subject: {
        type: SchemaType.STRING,
        description: "Name of the course or subject",
      },
      day_of_week: {
        type: SchemaType.STRING,
        description: "Day of the week (Monday, Tuesday, etc.)",
      },
      start_time: {
        type: SchemaType.STRING,
        description: "Start time in HH:mm format",
      },
      end_time: {
        type: SchemaType.STRING,
        description: "End time in HH:mm format",
      },
      room: {
        type: SchemaType.STRING,
        description: "Room or location of the class",
      },
      event_type: {
        type: SchemaType.STRING,
        description: "Tipe event: 'wajib' (untuk Jadwal Kuliah/Mata Kuliah rutin) atau 'acara' (untuk event sekali jalan/agenda biasa)",
      }
    },
    required: ["subject", "day_of_week", "start_time", "end_time", "event_type"],
  },
};

export async function parseScheduleFromPDF(fileBase64: string, fileMimeType: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const prompt = `Ekstrak jadwal dari file PDF ini. 
  PENTING: Tentukan 'event_type'. 
  - Kalo itu Jadwal Kuliah rutin (Mata Kuliah), set ke 'wajib'. 
  - Kalo itu event sekali jalan, seminar, lomba, atau agenda biasa, set ke 'acara'.
  Berikan output dalam format JSON yang berisi daftar mata kuliah/acara, hari (Monday-Sunday), jam mulai, jam selesai, ruangan, dan event_type.`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: fileBase64,
        mimeType: fileMimeType,
      },
    },
    prompt,
  ]);

  return JSON.parse(result.response.text());
}
