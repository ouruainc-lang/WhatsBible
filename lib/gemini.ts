
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface DailyReading {
    date: string;
    reading1: { reference: string; text: string };
    psalm: { reference: string; text: string };
    reading2?: { reference: string; text: string }; // Optional
    gospel: { reference: string; text: string };
}

export async function generateReflection(readings: DailyReading): Promise<string> {
    if (!genAI) {
        console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
        return "Reflection unavailable (API Key missing).";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
        You are a Catholic spiritual guide. Based on today's Mass readings, provide a concise summary and a short, uplifting spiritual reflection.
        
        Readings:
        1. ${readings.reading1.reference}: ${readings.reading1.text.substring(0, 500)}...
        2. Psalm: ${readings.psalm.text.substring(0, 200)}...
        ${readings.reading2 ? `3. Second Reading (${readings.reading2.reference}): ${readings.reading2.text.substring(0, 500)}...` : ''}
        4. Gospel (${readings.gospel.reference}): ${readings.gospel.text.substring(0, 800)}...

        Format the output for a WhatsApp message (plain text, use emojis, *bold* for emphasis).
        Structure:
        
        📅 *Daily Summary & Reflection*
        
        📖 *The Word*
        (1-2 sentence summary of the key theme of the readings)

        🕊️ *Reflection*
        (2 short paragraphs of spiritual application for daily life. Be encouraging and insightful.)

        🙏 *Prayer*
        (A very short 1-sentence prayer)

        (Do not include the full text of readings, just the summary/reflection).
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return "Could not generate reflection at this time. Please read the full text below.";
    }
}
