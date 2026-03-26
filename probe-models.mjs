import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: The JS SDK doesn't have a direct listModels method on the genAI object.
    // We usually have to check documentation or probe via testing.
    // However, we can try to initialize some common names.
    
    const candidates = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-1.5-flash-001",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash-8b",
      "gemini-pro"
    ];

    for (const name of candidates) {
        try {
            const model = genAI.getGenerativeModel({ model: name });
            await model.generateContent("hello");
            console.log(`✅ Success: ${name}`);
        } catch (e) {
            console.log(`❌ Fail: ${name} (${e.message.split('\n')[0]})`);
        }
    }
  } catch (err) {
    console.error("General error:", err);
  }
}

listModels();
