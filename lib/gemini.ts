
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

export async function generateReflection(readings: DailyReading, language: string = 'en'): Promise<string | null> {
    if (!genAI) {
        console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
        return null; // Handle null in caller
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
        });

        const isPt = language === 'pt';

        const prompt = isPt ? `
        Você é um guia espiritual católico. Com base nas leituras da missa de hoje, forneça uma reflexão estruturada em Português do Brasil.
        
        Leituras:
        1. ${readings.reading1.reference}: ${readings.reading1.text.substring(0, 500)}...
        2. Salmo: ${readings.psalm.text.substring(0, 200)}...
        ${readings.reading2 ? `3. Segunda Leitura (${readings.reading2.reference}): ${readings.reading2.text.substring(0, 500)}...` : ''}
        4. Evangelho (${readings.gospel.reference}): ${readings.gospel.text.substring(0, 800)}...

        Formate a saída como uma LINHA ÚNICA, sem quebras de linha, usando '|' como separador. Use negrito para palavras-chave e inclua a referência completa se citar algo, por exemplo "No princípio era o Verbo..."(João 1:1).
        Exemplo:
        📖 *Palavra:* (Resumo das leituras) | 🕊️ *Reflexão:* (Aplicação espiritual) | 🙏 *Oração:* (Breve oração)

        CRÍTICO: Mantenha o comprimento total abaixo de 1450 caracteres.
        ` : `
        You are a Catholic spiritual guide. Based on today's Mass readings, provide a structured reflection.
        
        Readings:
        1. ${readings.reading1.reference}: ${readings.reading1.text.substring(0, 500)}...
        2. Psalm: ${readings.psalm.text.substring(0, 200)}...
        ${readings.reading2 ? `3. Second Reading (${readings.reading2.reference}): ${readings.reading2.text.substring(0, 500)}...` : ''}
        4. Gospel (${readings.gospel.reference}): ${readings.gospel.text.substring(0, 800)}...

        Format the output as a SINGLE LINE with no line breaks, using '|' as a separator. Bold certain keywords and make sure to include the full verse reference if you're doing a reference like "In the beginning was the Word, and the Word was with God, and the Word was God"(John 1:1).
        Example:
        📖 *Word:* (Summary of the readings) | 🕊️ *Reflection:* (Spiritual application) | 🙏 *Prayer:* (Short prayer)

        CRITICAL: Keep the total length under 1450 characters.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return null;
    }
}

export async function translateReadingsToPortuguese(englishReadings: DailyReading): Promise<DailyReading | null> {
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
        Translate the following Catholic Mass Readings into Portuguese (Bíblia Sagrada Ave-Maria version).
        Only return the JSON object with the translated text. Do not include markdown formatting.

        Input References:
        Reading 1: ${englishReadings.reading1.reference}
        Psalm: ${englishReadings.psalm.reference}
        ${englishReadings.reading2 ? `Reading 2: ${englishReadings.reading2.reference}` : ''}
        Gospel: ${englishReadings.gospel.reference}

        Return standard JSON structure:
        {
            "reading1": { "reference": "Translated Ref", "text": "Translated Text..." },
            "psalm": { "reference": "Translated Ref", "text": "Translated Text..." },
            "reading2": { "reference": "Translated Ref", "text": "Translated Text..." }, // Optional
            "gospel": { "reference": "Translated Ref", "text": "Translated Text..." }
        }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        const translated = JSON.parse(text);

        return {
            ...englishReadings,
            ...translated
        };

    } catch (error) {
        console.error("Translation Error", error);
        return null; // Fallback to English if fails
    }
}
