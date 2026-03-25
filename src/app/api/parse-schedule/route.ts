import { NextRequest, NextResponse } from "next/server";
import { parseScheduleFromPDF } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Process with Gemini
    const extractedData = await parseScheduleFromPDF(base64, file.type);

    // Insert into Supabase
    const schedulesToInsert = extractedData.map((item: { subject: string; day_of_week: string; start_time: string; end_time: string; room?: string; event_type?: string }) => ({
      user_id: user.id,
      subject: item.subject,
      day_of_week: item.day_of_week,
      start_time: item.start_time,
      end_time: item.end_time,
      room: item.room || "N/A",
      event_type: item.event_type || "wajib"
    }));

    const { error } = await supabase.from("schedules").insert(schedulesToInsert);

    if (error) throw error;

    return NextResponse.json({ 
        success: true, 
        count: schedulesToInsert.length,
        data: schedulesToInsert 
    });
  } catch (error) {
    console.error("Parsing Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}
