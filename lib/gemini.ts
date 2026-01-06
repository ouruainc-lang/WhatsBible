
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
    theme: string;
    reflection: string;
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
        You are a Catholic spiritual guide. Based on today's Mass readings, provide a structured reflection.
        
        Readings:
        1. ${readings.reading1.reference}: ${readings.reading1.text.substring(0, 500)}...
        2. Psalm: ${readings.psalm.text.substring(0, 200)}...
        ${readings.reading2 ? `3. Second Reading (${readings.reading2.reference}): ${readings.reading2.text.substring(0, 500)}...` : ''}
        4. Gospel (${readings.gospel.reference}): ${readings.gospel.text.substring(0, 800)}...

        Return a JSON object with this EXACT schema:
        {
            "theme": "A short 1-sentence spiritual theme or title for today.",
            "reflection": "Two short paragraphs of spiritual reflection using emojis and *bold* for emphasis. Cite quotes like (John 1:1).",
            "prayer": "Lord, ... (1 sentence prayer)"
        }

        CRITICAL Rules:
        1. "theme" must be under 100 characters.
        2. "reflection" MUST be under 800 characters.
        3. "prayer" MUST be under 200 characters.
        4. Do NOT use newline characters (\\n) within the JSON strings. Use spaces or visual separators.
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
