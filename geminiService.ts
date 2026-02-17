
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GeminiSuggestion, ChatMessage, TableType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  
  Retorne um array JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ideia: { type: Type.STRING },
              funcao: { type: Type.STRING },
              tipo: { type: Type.STRING },
              gancho: { type: Type.STRING },
              cta: { type: Type.STRING },
              canal: { type: Type.STRING },
              intencao: { type: Type.STRING },
              r: { type: Type.NUMBER },
              d: { type: Type.NUMBER },
              c: { type: Type.NUMBER }
            },
            required: ["ideia", "funcao", "tipo", "gancho", "cta", "canal", "intencao", "r", "d", "c"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
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
 * used for the OrganickAI Briefing module.
 */
export async function transcribeAndExtractInsights(files: { data: string, mimeType: string }[]): Promise<string> {
  const prompt = "Analise o conteúdo deste arquivo (áudio ou documento) e extraia um resumo executivo estratégico focado em briefing de marketing e conteúdo. Identifique tom de voz, dores do cliente, objetivos e restrições. Se for áudio, transcreva os pontos chave.";

  try {
    const parts = files.map(f => ({
      inlineData: {
        data: f.data.split(',')[1] || f.data,
        mimeType: f.mimeType
      }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [...parts, { text: prompt }] }
    });

    return response.text || "Não foi possível extrair insights dos arquivos.";
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
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: COPILOT_SYSTEM_INSTRUCTION,
    },
    history: history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }))
  });

  const contextualMessage = `CONTEXTO ATUAL DO APP:
  - Dados: ${JSON.stringify(appContext)}
  
  MENSAGEM DO USUÁRIO:
  ${message}`;

  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message: contextualMessage });
    return response.text || "Ocorreu um erro ao processar sua solicitação.";
  } catch (error) {
    console.error("Gemini Copilot Error:", error);
    return "Desculpe, tive um problema de conexão com o cérebro operacional. Tente novamente em instantes.";
  }
}

/**
 * AI Presentation Assistant: Generates headline and callouts for a slide image.
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Presentation Error:", error);
    return {
      title: "Resumo Estratégico",
      subtitle: "Visão consolidada de ativos e operações.",
      key_points: ["Análise de dados reais", "Performance multicanal", "Otimização tática"],
      callouts: [
        { id: 1, title: "Monitoramento", desc: "Acompanhamento em tempo real.", top: "30%", left: "10%" },
        { id: 2, title: "Validação", desc: "Processo científico Organick.", top: "50%", left: "50%" }
      ],
      next_step: "Revisar pauta semanal e aprovar criativos."
    };
  }
}

/**
 * Contextual Analysis Function for Gemini Assistant Sidebar
 */
export async function analyzeContextualData(tab: TableType, data: any): Promise<string> {
  const promptTemplates: Record<string, string> = {
    DASHBOARD: "Analise o panorama geral da agência com base nestes números. Identifique gargalos operacionais e saúde da carteira de clientes.",
    CLIENTES: "Analise a lista de clientes. Sugira estratégias de retenção, oportunidades de upsell e analise se os objetivos definidos estão claros e mensuráveis.",
    RDC: "Analise as ideias de conteúdo na Matriz RDC. Sugira quais devem ser priorizadas com base no Score.",
    MATRIZ: "Analise a Matriz Estratégica. Sugira refinamentos nos pilares Hero/Hub/Help para garantir que a autoridade da marca esteja sendo construída corretamente.",
    COBO: "Analise o mix de canais (COBO). Avalie se a frequência e os formatos estão adequados para as intenções de cada canal e sugira otimizações.",
    PLANEJAMENTO: "Analise o cronograma de planejamento. Verifique a consistência das datas, o equilíbrio de funções de conteúdo e sugira melhorias na distribuição semanal.",
    TAREFAS: "Analise o fluxo de tarefas. Identifique gargalos na operação, atrasos críticos, sobrecarga de responsáveis e sugira uma ordem de prioridade otimizada.",
    VH: "Analise a engenharia de Valor Hora. Avalie a carga horária operacional e sugira ajustes para otimizar o tempo da equipe.",
    ORGANICKIA: "Analise o briefing e o histórico de inteligência. Sugira formas de tornar os roteiros mais persuasivos e como extrair mais valor dos arquivos carregados."
  };

  const systemInstruction = `Você é o ANALISTA ESTRATÉGICO da EKKO. Seu objetivo é analisar dados de uma aba específica e fornecer sugestões acionáveis, bullets de melhoria e insights profundos baseados no Método Organick.
  
  Mantenha suas respostas estruturadas em:
  - 📊 INSIGHTS ESTRATÉGICOS (O que os dados dizem)
  - 🚀 AÇÕES RECOMENDADAS (O que fazer agora)
  - 💡 MELHORIAS TÁTICAS (Como otimizar o processo)
  
  Seja direto, profissional e focado em resultados.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `ABA ATIVA: ${tab}\nDADOS ATUAIS: ${JSON.stringify(data)}\n\nTAREFA: ${promptTemplates[tab] || 'Analise estes dados e forneça insights.'}`,
      config: {
        systemInstruction
      }
    });
    return response.text || "Não foi possível gerar sugestões para este contexto.";
  } catch (error) {
    console.error("Contextual Analysis Error:", error);
    return "Erro ao conectar com o Assistente Gemini. Verifique sua conexão ou tente novamente.";
  }
}
/**
 * OrganickIA PDF Extraction: Extracts structured data for app tables.
 */
export async function extractStructuredDataFromPDF(files: { data: string, mimeType: string }[]): Promise<any> {
  const prompt = `Você é o ASSISTENTE DE IMPORTAÇÃO do Organick.
    Analise o PDF fornecido e extraia informações para preencher as tabelas do sistema.
    
    RETORNE APENAS UM JSON VÁLIDO com este schema:
    {
      "cliente": { "nome": "Nome Sugerido", "nicho": "Nicho", "objetivo": "Objetivo", "observacoes": "Resumo do que foi extraído" },
      "cobo": [
        {"Canal": "Instagram/TikTok/Youtube/Linkedin", "Frequência": "Ex: 3x semana", "Público": "Descrição", "Voz": "Tom de voz", "Zona": "Quente/Morna/Fria", "Intenção": "Atenção/Retenção", "Formato": "Reels/Carrossel"}
      ],
      "estrategia": [
        {"Função": "Hero/Hub/Help", "Quem fala": "Marca/Expert", "Papel estratégico": "Descrição", "Tipo de conteúdo": "Educativo/Entretenimento", "Resultado esperado": "Autoridade/Vendas"}
      ],
      "rdc": [
        {"Ideia de Conteúdo": "Título da ideia", "Rede Social": "Instagram", "Tipo de conteúdo": "Reels", "Resolução (1–5)": 3, "Demanda (1–5)": 3, "Competição (1–5)": 3}
      ],
      "planejamento": [
        {"Data": "YYYY-MM-DD", "Hora": "HH:mm", "Conteúdo": "Título do post", "Formato": "Reels", "Zona": "Morna", "Intenção": "Conversão", "Status": "Pendente"}
      ],
      "pendencias": ["Liste aqui informações que parecem importantes mas não se encaixaram no schema acima"]
    }

    REGRAS:
    1. Se não encontrar data, deixe planejamento vazio ou sugira datas futuras a partir de amanhã.
    2. Não invente dados. Se não tiver certeza, deixe o campo vazio ou coloque em pendencias.
    3. Para RDC, atribua scores R/D/C baseados no bom senso se não houver dados explícitos, ou 0 se não souber.
    `;

  try {
    const parts = files.map(f => ({
      inlineData: {
        data: f.data.split(',')[1] || f.data,
        mimeType: f.mimeType
      }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Updating to latest stable/preview if available or keep generic
      contents: { parts: [...parts, { text: prompt }] },
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return { error: "Falha na extração. Tente novamente." };
  }
}
