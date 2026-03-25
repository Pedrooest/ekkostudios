---
description: Como colaborar em tempo real entre o Google Stitch (Design AI) e o Antigravity (Logica/Backend AI)
---

# Fluxo de Trabalho: Antigravity + Google Stitch em Tempo Real

Este fluxo define como nós (Eu, Antigravity) e o Google Stitch podemos trabalhar lado a lado, em tempo real, utilizando a conexão oficial via **MCP (Model Context Protocol)**. Isso transforma o Stitch em uma extensão nativa do seu editor e permite requisições automáticas via API, sem precisar importar ou colar exportações manualmente.

## O Papel de Cada Um

*   🎨 **Google Stitch**: Mestre do visual. Funciona como a sua tela de design nativa em IA, onde você cria o visual do Ekko (HTML/CSS/React/Tailwind) através de intenções e prompts visuais.
*   🧠 **Antigravity (Eu)**: Engenheiro de Software Full-Stack. Como terei acesso ao servidor MCP do Stitch, poderei "puxar" as mudanças de UI em tempo real do seu projeto e incorporá-las ao nosso código, adicionando regras de negócio, Supabase e rotas em React TSX.

---

## 🚀 Passo 1: Configurando o Servidor MCP Oficial

Para que a nossa "conversa" real-time aconteça, precisamos nos conectar. Esta etapa precisa ser feita apenas uma vez.

1. **No Google Stitch**:
   - Acesse as configurações de exportação/integração do seu projeto.
   - Gere um **Token de API** exclusivo para o projeto Ekko.
2. **No Antigravity**:
   - Pressione `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac) para abrir a paleta de comandos e procure por `Antigravity: Configure MCP Servers`. Isso abrirá o arquivo de configuração de MCP (geralmente `mcp.json` ou as configurações globais de agentes).
   - Insira a configuração do Stitch apontando para a sua chave:
     ```json
     {
       "mcpServers": {
         "google-stitch": {
           "command": "npx",
           "args": ["-y", "@google/stitch-mcp-server"],
           "env": {
             "STITCH_API_KEY": "cole-seu-token-aqui"
           }
         }
       }
     }
     ```
   - Reinicie o seu Agent Manager (Antigravity).

---

## ⚡ Passo 2: A Colaboração Contínua (Em Tempo Real)

Com o MCP configurado e "falando", a dinâmica abandona completamente a importação ou copiar/colar arquivos:

1. **Desenhar no Stitch**:
   - Vá ao canvas do Stitch e desenhe/peça sua nova tela, fluxo ou ajuste (ex: "Tela de Matriz Estratégica" ou "Novo Layout da Sidebar").

2. **O Chamado para o Antigravity** (Aqui no chat):
   - Você dá um comando natural referenciando o Stitch:
     > *"Antigravity, puxe o layout mais recente da aba 'Matriz Estratégica' direto do Stitch e aplique no meu projeto do Ekko."*
   - Ou para ajustes:
     > *"Antigravity, o Stitch acabou de atualizar a cor e o padding dos cards de finanças no nosso canvas. Sincronize o nosso `FinancasView.tsx` com essa atualização visual."*

3. **A Magia dos Bastidores (O que eu faço)**:
   - Eu consulto a nova ferramenta MCP (`@google/stitch-mcp-server`) enviada ao meu contexto.
   - Encontro a tela correta na nuvem do Google Stitch.
   - Leio perfeitamente o JSX/CSS atualizado.
   - Faço a **Mesclagem Inteligente**: Injeto a UI no seu projeto local mantendo suas variáveis de estado (`useState`), hooks de banco de dados (`DatabaseService.ts`), as classes globais e toda a segurança do TypeScript intactos.

---

🌟 **Vantagem deste fluxo**: Você separa perfeitamente o papel de Product Designer (no Stitch) e Engenharia/Full-stack (Comigo, no Back-end/Lógica), com a sincronia automatizada feita unicamente pela API MCP.
