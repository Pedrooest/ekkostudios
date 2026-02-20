
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { GeminiSuggestion, ChatMessage, TableType } from "./types";

// Lazy initialization to prevent crash on load if key is missing
let genAIInstance: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAIInstance) {
    const key = process.env.GEMINI_API_KEY || '';
    if (!key) console.warn('[GeminiService] Missing API Key');
    genAIInstance = new GoogleGenerativeAI(key);
  }
  return genAIInstance;
}

// Helper to get model
// Helper to get model
function getModel(modelName: string = 'gemini-2.0-flash-lite-001') {
  const ai = getGenAI();
  return ai.getGenerativeModel({ model: modelName });
}

// Helper for 429 Retries with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 5000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
      console.warn(`[Gemini] Rate limit hit. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2); // 5s, 10s, 20s, 40s, 80s
    }
    console.error("[Gemini] API Request Failed:", error);
    if (error.message?.includes('429')) {
      throw new Error("O limite gratuito da IA foi atingido. Tente novamente em 1 minuto.");
    }
    throw error;
  }
}

const COPILOT_SYSTEM_INSTRUCTION = `Você é o COPILOTO OPERACIONAL do app EKKO.

Seu papel é atuar como um assistente inteligente que conversa com os dados do sistema (Clientes, COBO, Estratégia, RDC, Planejamento, Fluxo de Tarefas e VH) e ajuda o usuário a planejar, validar, organizar e tomar decisões.

Você deve identificar automaticamente qual modo usar com base na intenção do usuário.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODO 1 — COPILOTO DE PLANEJAMENTO DE CONTEÚDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ativar quando o usuário pedir: planejamento de posts, ideias de conteúdo, cronograma, agenda de publicação.
Você deve:
• sugerir conteúdos alinhados com COBO e Estratégia
• organizar em calendário (respeitando 2026)
• sugerir tarefas operacionais (roteiro, gravação, edição, aprovação)
Saída estruturada: lista organizada pronta para inserir no sistema.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODO 2 — GERADOR/ANALISADOR DE BRIEFING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ativar quando houver: pedido de briefing, resumo estratégico, texto vindo de áudio/PDF.
Você deve:
• estruturar briefing no modelo Organick
• identificar lacunas de informação
• sugerir perguntas estratégicas
• organizar em seções claras

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODO 3 — AUDITOR OPERACIONAL (VH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ativar quando o usuário perguntar sobre: horas consumidas, limite de cliente, rentabilidade operacional.
Você deve:
• calcular custo operacional estimado
• indicar carga de trabalho
• alertar sobre excesso de horas
• sugerir ajustes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODO 4 — BUSCADOR OPERACIONAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ativar quando o usuário fizer consultas como: tarefas pendentes, conteúdos em aprovação, ideias estratégicas.
Você deve:
• responder de forma direta
• organizar por prioridade/status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS GERAIS (OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Sempre pergunte qual cliente se não estiver claro
• Nunca apague/modifique dados sem confirmação
• Responda em formato estruturado (listas/tabelas)
• Priorize clareza e ação prática
• Mantenha contexto com o calendário 2026
• Use linguagem profissional e objetiva
Seu objetivo é reduzir trabalho manual, organizar decisões e acelerar execução dentro do app.`;

/**
 * Advanced Gemini Strategic Content Suggester
 */
export async function suggestGeminiContent(context: {
  nicho: string;
  objetivo: string;
  canaisContext: string;
  estrategiaContext: string;
  rdcContext: string;
}): Promise<GeminiSuggestion[]> {
  const prompt = `Você é o estrategista sênior da EKKO, especialista no Método Organick.
  CONTEXTO DO CLIENTE:
  - Nicho: ${context.nicho}
  - Objetivo Principal: ${context.objetivo}
  
  DADOS DO SISTEMA:
  - Estrutura de Canais (COBO): ${context.canaisContext}
  - Matriz Estratégica: ${context.estrategiaContext}

  TAREFA: Sugira 10 ideias de conteúdo de alto impacto que conectem a Estratégia aos Canais ativos.
  REGRAS DO MÉTODO ORGANICK:
  - Classifique em Função (Hero, Hub, Help, Autoridade, Relacional).
  - Defina Intenção (Atenção, Relacionamento, Conversão).
  - O "Gancho" deve ser curto e magnético.
  - O "CTA" deve ser focado no canal sugerido.
  
  Retorne APENAS um array JSON válido.`;

  try {
    const model = getModel('gemini-2.0-flash-lite-001');
    const result = await withRetry(() => model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    }));
    const response = result.response;
    return JSON.parse(response.text() || "[]");
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [
      { ideia: "Os 3 segredos do " + context.nicho, funcao: "Autoridade", tipo: "Reels", gancho: "Ninguém te conta isso...", cta: "Comente 'SEGREDO'", canal: "Instagram", intencao: "Atenção", r: 4, d: 5, c: 2 },
      { ideia: "Bastidores da agência", funcao: "Relacional", tipo: "Stories", gancho: "A vida como ela é", cta: "Responda com 🔥", canal: "Instagram", intencao: "Relacionamento", r: 3, d: 3, c: 1 }
    ];
  }
}

/**
 * Multimodal extraction: Transcribe audio or extract text from documents (PDF/etc)
 */
export async function transcribeAndExtractInsights(files: { data: string, mimeType: string }[]): Promise<string> {
  const prompt = "Analise o conteúdo deste arquivo (áudio ou documento) e extraia um resumo executivo estratégico focado em briefing de marketing e conteúdo. Identifique tom de voz, dores do cliente, objetivos e restrições. Se for áudio, transcreva os pontos chave.";

  try {
    const model = getModel('gemini-2.0-flash-lite-001');
    const parts: Part[] = files.map(f => ({
      inlineData: {
        data: f.data.split(',')[1] || f.data,
        mimeType: f.mimeType
      }
    }));
    parts.push({ text: prompt });

    const result = await withRetry(() => model.generateContent({ contents: [{ role: 'user', parts }] }));
    return result.response.text() || "Não foi possível extrair insights dos arquivos.";
  } catch (error) {
    console.error("Gemini Multimodal Error:", error);
    return `Erro no processamento: ${error instanceof Error ? error.message : 'Falha desconhecida'}`;
  }
}

/**
 * Operational Copilot Chat logic
 */
export async function sendCopilotMessage(
  message: string,
  history: ChatMessage[],
  appContext: any
): Promise<string> {
  // Config Copilot Model
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash-lite-001',
    systemInstruction: {
      role: 'system',
      parts: [{ text: COPILOT_SYSTEM_INSTRUCTION }]
    }
  });

  const chat = model.startChat({
    history: history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }))
  });

  const contextualMessage = `CONTEXTO ATUAL DO APP:
  - Dados: ${JSON.stringify(appContext)}
  
  MENSAGEM DO USUÁRIO:
  ${message}`;

  try {
    const result = await withRetry(() => chat.sendMessage(contextualMessage));
    return result.response.text() || "Ocorreu um erro ao processar sua solicitação.";
  } catch (error) {
    console.error("Gemini Copilot Error:", error);
    return "Desculpe, tive um problema de conexão com o cérebro operacional. Tente novamente em instantes.";
  }
}

/**
 * AI Presentation Assistant
 */
export async function generatePresentationBriefing(context: {
  tab: string;
  clientName: string;
  nicho: string;
  userInput: string;
}): Promise<any> {
  const prompt = `Você é o ASSISTENTE DE APRESENTAÇÃO da EKKO.
  O usuário quer gerar um slide (PNG) da aba "${context.tab}" para o cliente "${context.clientName}" (${context.nicho}).
  O usuário quer destacar: "${context.userInput}"

  Sua tarefa é gerar um conteúdo de slide estratégico e persuasivo.
  RETORNE APENAS UM JSON VÁLIDO no seguinte formato:
  {
    "title": "Headline impactante e curta",
    "subtitle": "Subtítulo estratégico explicando o valor desse dado",
    "key_points": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "callouts": [
      {"id": 1, "title": "Título Callout 1", "desc": "Explicação curta", "top": "20%", "left": "15%"},
      {"id": 2, "title": "Título Callout 2", "desc": "Explicação curta", "top": "45%", "left": "70%"},
      {"id": 3, "title": "Título Callout 3", "desc": "Explicação curta", "top": "60%", "left": "25%"}
    ],
    "next_step": "Próximo passo sugerido para a operação"
  }`;

  try {
    const model = getModel('gemini-2.0-flash-lite-001');
    const result = await withRetry(() => model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    }));
    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error("Gemini Presentation Error:", error);
    return {
      title: "Resumo Estratégico",
      subtitle: "Visão consolidada de ativos e operações.",
      key_points: ["Análise de dados reais", "Performance multicanal", "Otimização tática"],
      next_step: "Revisar pauta semanal e aprovar criativos."
    };
  }
}

/**
 * Contextual Analysis Function
 */
export async function analyzeContextualData(tab: TableType, data: any): Promise<string> {
  const promptTemplates: Record<string, string> = {
    DASHBOARD: "Analise o panorama geral...",
    CLIENTES: "Analise a lista de clientes...",
    RDC: "Analise as ideias de conteúdo...",
    MATRIZ: "Analise a Matriz Estratégica...",
    COBO: "Analise o mix de canais...",
    PLANEJAMENTO: "Analise o cronograma...",
    TAREFAS: "Analise o fluxo de tarefas...",
    VH: "Analise a engenharia de Valor Hora...",
    ORGANICKIA: "Analise o briefing..."
  };

  const systemInstruction = `Você é o ANALISTA ESTRATÉGICO da EKKO. Seu objetivo é analisar dados de uma aba específica e fornecer sugestões acionáveis, bullets de melhoria e insights profundos baseados no Método Organick.
  
  Mantenha suas respostas estruturadas em:
  - 📊 INSIGHTS ESTRATÉGICOS (O que os dados dizem)
  - 🚀 AÇÕES RECOMENDADAS (O que fazer agora)
  - 💡 MELHORIAS TÁTICAS (Como otimizar o processo)
  
  Seja direto, profissional e focado em resultados.`;

  // Note: systemInstruction on getGenerativeModel is preferred
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash-lite-001',
    systemInstruction: systemInstruction
  });

  try {
    const result = await withRetry(() => model.generateContent(`ABA ATIVA: ${tab}\nDADOS ATUAIS: ${JSON.stringify(data)}\n\nTAREFA: ${promptTemplates[tab] || 'Analise estes dados.'}`));
    return result.response.text() || "Não foi possível gerar sugestões.";
  } catch (error) {
    console.error("Contextual Analysis Error:", error);
    return "Erro ao conectar com o Assistente Gemini.";
  }
}

/**
 * PDF Extraction
 */
export async function extractStructuredDataFromPDF(files: { data: string, mimeType: string }[]): Promise<any> {
  const prompt = `Você é o ASSISTENTE DE IMPORTAÇÃO do Organick.
    Analise o PDF fornecido e extraia informações para preencher as tabelas do sistema.
    RETORNE APENAS UM JSON VÁLIDO.`;

  try {
    const model = getModel('gemini-2.0-flash-lite-001');
    const parts: Part[] = files.map(f => ({
      inlineData: {
        data: f.data.split(',')[1] || f.data,
        mimeType: f.mimeType
      }
    }));
    parts.push({ text: prompt });

    const result = await withRetry(() => model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: "application/json" }
    }));

    return JSON.parse(result.response.text() || "{}");
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return { error: "Falha na extração." };
  }
}

/**
 * Brainstorming Ideas generator for Whiteboard
 */
export async function generateBrainstormingIdeas(prompt: string): Promise<string[]> {
  const finalPrompt = `You are a creative brainstorming assistant.
  User Prompt: "${prompt}"

  Generate a list of 6-12 creative, short, and actionable ideas related to the prompt.
  Return ONLY a JSON array of strings. Example: ["Idea 1", "Idea 2"]`;

  try {
    const model = getModel('gemini-2.0-flash-lite-001');
    const result = await withRetry(() => model.generateContent({
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    }));

    console.log('[Gemini] Brainstorm Response:', result.response.text());
    return JSON.parse(result.response.text() || "[]");
  } catch (error) {
    console.error("Gemini Brainstorming Error:", error);
    throw new Error(`Erro na API (${error instanceof Error ? error.message : 'Desconhecido'}). Tente novamente.`);
  }
}
