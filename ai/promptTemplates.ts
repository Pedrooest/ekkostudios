import { TableType } from '../types';

export function renderPrompt(tab: TableType, objective: string, mode: 'chat' | 'action', context: any, userNotes: string = ''): string {
    const basePrompt = `Você é o Assistente Inteligente Organick.
  Atue como um estrategista sênior de agência de marketing.
  
  CONTEXTO ATUAL (${tab}):
  ${JSON.stringify(context, null, 2)}
  
  OBJETIVO DO USUÁRIO:
  ${objective}
  
  NOTAS DO USUÁRIO:
  "${userNotes}"
  `;

    if (mode === 'action') {
        return `${basePrompt}

    IMPORTANTE: MODO AÇÃO ATIVO.
    Você DEVE retornar APENAS um objeto JSON válido, sem markdown, sem texto antes ou depois.
    Siga estritamente este schema:

    {
      "summary": "Resumo executivo da análise (máx 2 linhas)",
      "issues": [
        {"title": "Problema identificado", "why": "Explicação curta", "severity": "high|medium|low"}
      ],
      "recommendations": [
        {"title": "Sugestão prática", "steps": ["Passo 1", "Passo 2"], "expected_impact": "Impacto esperado"}
      ],
      "actions": [
        {
          "type": "create_task|update_task|suggest_rdc", 
          "payload": { ...dados necessários para a ação... }
        }
      ],
      "presentation": {
        "slide_title": "Título para slide de apresentação",
        "key_points": ["Ponto 1", "Ponto 2", "Ponto 3"],
        "callouts": [{"target": "Elemento", "text": "Destaque"}],
        "next_step": "Próximo passo sugerido"
      }
    }
    
    Se o objetivo for "Gerar ideias", preencha 'recommendations' e 'actions' (com suggest_rdc).
    Se o objetivo for "Revisar", foque em 'issues'.
    Se o objetivo for "Otimizar", foque em 'actions' de ajuste.
    `;
    }

    return `${basePrompt}
  
  Responda de forma conversacional, direta e útil. Use formatação Markdown para listas e destaques.
  Seja breve.`;
}
