
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

// Define interface for structured return
export interface ReflectionResult {
    summary: string;
    prayer: string;
}

export async function generateReflection(readings: DailyReading): Promise<ReflectionResult | null> {
    if (!genAI) {
        console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
        return null; // Handle null in caller
    }

    try {
        // Use a model that supports JSON mode well
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        You are a Catholic spiritual guide. Based on today's Mass readings, provide a summary/reflection and a short prayer.
        
        Readings:
        1. ${readings.reading1.reference}: ${readings.reading1.text.substring(0, 500)}...
        2. Psalm: ${readings.psalm.text.substring(0, 200)}...
        ${readings.reading2 ? `3. Second Reading (${readings.reading2.reference}): ${readings.reading2.text.substring(0, 500)}...` : ''}
        4. Gospel (${readings.gospel.reference}): ${readings.gospel.text.substring(0, 800)}...

        Return a JSON object with this schema:
        {
            "summary": "The Word: (1 sentence theme). Reflection: (2 short paragraphs using emojis and *bold* for emphasis. Cite quotes like (John 1:1)).",
            "prayer": "Lord, ... (1 sentence prayer)"
        }

        CRITICAL Rules:
        1. "summary" MUST be under 900 characters.
        2. "prayer" MUST be under 200 characters.
        3. Do NOT use newline characters (\\n) within the JSON strings. Use spaces or visual separators.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Basic cleanup just in case
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText) as ReflectionResult;

    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return null;
    }
}
