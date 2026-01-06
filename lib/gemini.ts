
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

export async function generateReflection(readings: DailyReading): Promise<string | null> {
    if (!genAI) {
        console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
        return null; // Handle null in caller
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
        });

        const prompt = `
        You are a Catholic spiritual guide. Based on today's Mass readings, provide a structured reflection.
        
        Readings:
        1. ${readings.reading1.reference}: ${readings.reading1.text.substring(0, 500)}...
        2. Psalm: ${readings.psalm.text.substring(0, 200)}...
        ${readings.reading2 ? `3. Second Reading (${readings.reading2.reference}): ${readings.reading2.text.substring(0, 500)}...` : ''}
        4. Gospel (${readings.gospel.reference}): ${readings.gospel.text.substring(0, 800)}...

        Format the output as a SINGLE LINE with no line breaks, using '|' as a separator.
        Example:
        📖 *Word:* (Summary of the readings) | 🕊️ *Reflection:* (Spiritual application) | 🙏 *Prayer:* (Short prayer)

        CRITICAL: Keep the total length under 1000 characters.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return null;
    }
}
