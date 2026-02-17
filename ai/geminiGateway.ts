import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function callGemini(prompt: string, history: any[] = []): Promise<string> {
    try {
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-exp', // Updated model for better JSON adherence
            config: {
                temperature: 0.4, // Lower temperature for more deterministic output
            },
            history: history.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            }))
        });

        const result = await chat.sendMessage({ message: prompt });
        return result.text || "Sem resposta do Gemini.";
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
        return {
            summary: "Erro ao processar resposta estruturada.",
            issues: [{ title: "Formato Inválido", why: "O modelo não retornou JSON válido.", severity: "high" }],
            recommendations: [],
            actions: []
        };
    }
}
