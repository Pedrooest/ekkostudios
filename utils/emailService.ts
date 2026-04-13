interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}

export const sendEmail = async (payload: EmailPayload): Promise<boolean> => {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (error) {
    console.error('[EmailService Error]:', error);
    return false;
  }
};

// Templates de email
export const templates = {
  novaTarefa: (tarefa: string, responsavel: string, prazo: string, cliente: string) => ({
    subject: `📋 Nova tarefa atribuída: ${tarefa}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7;">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; text-align: center;">
          <img src="https://ekkostudios.vercel.app/EKKO LOGO.png" height="40" style="margin-bottom: 16px;" />
          <h1 style="color: white; margin: 0; font-size: 20px;">Nova tarefa atribuída</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #3f3f46; font-size: 16px;">Olá, <strong>${responsavel}</strong>!</p>
          <p style="color: #52525b;">Você recebeu uma nova tarefa:</p>
          <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #18181b;">${tarefa}</p>
            <p style="margin: 0; color: #71717a;">Cliente: ${cliente}</p>
            <p style="margin: 8px 0 0; color: #ef4444; font-weight: 500;">⏰ Prazo: ${prazo}</p>
          </div>
          <a href="https://ekkostudios.vercel.app" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver no EKKO →</a>
        </div>
        <div style="padding: 20px 32px; background: #f4f4f5; text-align: center;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">EKKO Studios • Sistema de Gestão</p>
        </div>
      </div>
    `
  }),

  lembretePagamento: (descricao: string, valor: string, vencimento: string, cliente: string) => ({
    subject: `💰 Lembrete de pagamento: ${descricao}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7;">
        <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ Lembrete de pagamento</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #3f3f46; font-size: 16px;">Oi!</p>
          <p style="color: #52525b;">Lembrete de pagamento para <strong>${cliente}</strong>:</p>
          <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #18181b;">${descricao}</p>
            <p style="margin: 0; color: #52525b;">Valor: <strong>${valor}</strong></p>
            <p style="margin: 8px 0 0; color: #ef4444; font-weight: 500;">Vencimento: ${vencimento}</p>
          </div>
          <a href="https://ekkostudios.vercel.app" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver Financeiro →</a>
        </div>
        <div style="padding: 20px 32px; background: #f4f4f5; text-align: center;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">EKKO Studios • Sistema de Gestão</p>
        </div>
      </div>
    `
  }),

  novoConteudo: (conteudo: string, data: string, redeSocial: string, cliente: string) => ({
    subject: `📱 Novo conteúdo planejado: ${conteudo}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 32px; text-align: center;">
          <img src="https://ekkostudios.vercel.app/EKKO LOGO.png" height="40" style="margin-bottom: 16px;" />
          <h1 style="color: white; margin: 0; font-size: 20px;">📱 Novo conteúdo planejado</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #3f3f46; font-size: 16px;">Oi!</p>
          <p style="color: #52525b;">Um novo conteúdo foi adicionado ao planejamento:</p>
          <div style="background: #f5f3ff; border-radius: 8px; padding: 20px; border-left: 4px solid #8b5cf6; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">${conteudo}</p>
            <p style="margin: 0; color: #52525b;">Cliente: ${cliente} • ${redeSocial}</p>
            <p style="margin: 8px 0 0; color: #7c3aed;">📅 Data: ${data}</p>
          </div>
          <a href="https://ekkostudios.vercel.app" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ver Planejamento →</a>
        </div>
        <div style="padding: 20px 32px; background: #f4f4f5; text-align: center;">
          <p style="color: #a1a1aa; font-size: 12px; margin: 0;">EKKO Studios • Sistema de Gestão</p>
        </div>
      </div>
    `
  }),
};
