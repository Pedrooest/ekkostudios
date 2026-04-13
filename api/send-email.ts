import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Campos obrigatórios: to, subject, html' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EKKO Studios <notificacoes@ekkostudios.com.br>',
        to,
        subject,
        html,
      }),
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao enviar email via Resend');
    }
    
    return res.status(200).json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('[API Send Email Error]:', error);
    return res.status(500).json({ error: error.message });
  }
}
