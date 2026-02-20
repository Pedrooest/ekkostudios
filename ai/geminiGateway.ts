
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI() {
    if (!genAIInstance) {
        const key = process.env.GEMINI_API_KEY || '';
        if (!key) console.warn('[GeminiGateway] Missing API Key');
        genAIInstance = new GoogleGenerativeAI(key);
    }
    return genAIInstance;
}

// Helper for 429 Retries
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
            console.warn(`[GeminiGateway] Rate limit hit. Retrying in ${delay}ms...`);
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

export async function callGemini(prompt: string, history: any[] = []): Promise<string> {
    try {
        const ai = getGenAI();
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' });

        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }))
        });

        const result = await withRetry(() => chat.sendMessage(prompt));
        return result.response.text() || "Sem resposta do Gemini.";
    } catch (error) {
        console.error("Gemini Gateway Error:", error);
        return "Erro ao conectar com o assistente. Tente novamente.";
    }
}

export function parseAssistantResponse(text: string): any {
    try {
        // Attempt to find JSON block if wrapped in markdown
        const jsonBlock = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
        const cleanText = jsonBlock ? jsonBlock[1] : text;

        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return null;
    }
}
