import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function verify() {
  console.log("Checking GEMINI_API_KEY...");
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing!");
    return;
  }
  console.log("Key found (prefix):", process.env.GEMINI_API_KEY.slice(0, 5));

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    console.log("Testing gemini-2.5-flash-lite...");
    const result = await model.generateContent("Say 'API is ALIVE'");
    console.log("Result:", result.response.text());
  } catch (e) {
    console.error("❌ Gemini Error:", e.message || e);
    
    console.log("Falling back to gemini-1.5-flash...");
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say 'V1.5 is ALIVE'");
        console.log("Result:", result.response.text());
    } catch (e2) {
        console.error("❌ All models failed:", e2.message || e2);
    }
  }
}

verify();
