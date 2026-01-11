
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

export async function generateReflection(
    readingText: string,
    date: string,
    language: string = 'en'
): Promise<string> {
    if (!genAI) {
        console.error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
        return ""; // Return empty string as per new Promise<string> type
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const maxChars = 1450;

        let prompt = "";

        if (language === 'pt-br') {
            prompt = `
Você é um companheiro espiritual católico gentil, sábio e encorajador.
Sua tarefa é escrever uma "Reflexão Diária" curta, inspiradora e pessoal baseada nas leituras do evangelho de hoje (${date}).

A leitura é:
"${readingText.substring(0, 2000)}"

Requisitos Estritos:
1. Comece com uma saudação calorosa e pessoal (ex: "Bom dia, alma abençoada", "Paz e bem", "Querido irmão/irmã").
2. Escreva 2-3 parágrafos curtos refletindo sobre o significado espiritual do texto.
3. Use a tradução "Bíblia Sagrada Ave-Maria" se citar versículos.
4. O tom deve ser de esperança, graça e aplicação prática na vida diária.
5. Termine com uma oração curta e poderosa de 1-2 frases.
6. Assine como "- DailyWord AI".
7. IMPORTANTE: O texto TOTAL deve ter MENOS de ${maxChars} caracteres para caber numa mensagem de WhatsApp. Não use hashtags.
        `.trim();
        } else {
            prompt = `
You are a gentle, wise, and encouraging Catholic spiritual companion.
Your task is to write a short, uplifting, and personal "Daily Reflection" based on today's gospel reading (${date}).

The reading is:
"${readingText.substring(0, 2000)}"

Strict Requirements:
1. Start with a warm, personal greeting (e.g., "Good morning, blessed soul", "Peace be with you").
2. Write 2-3 short paragraphs reflecting on the spiritual meaning of the text. Focus on God's love, grace, and practical application.
3. Tone: Solace, hope, encouragement. Not judgmental or overly theological.
4. End with a short, powerful 1-2 sentence prayer.
5. Sign off with "- DailyWord AI".
6. CRITICAL: Total text length MUST be under ${maxChars} characters to fit in a single text message. Do NOT use hashtags.
7. Use Markdown for bolding key phrases (*text*) if appropriate, but keep it minimal.
  `.trim();
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return null;
    }
}
