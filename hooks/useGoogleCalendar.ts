import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

export function useGoogleCalendar() {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('google_calendar_token')
  );
  const [isConnected, setIsConnected] = useState(!!accessToken);

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar',
    onSuccess: (response) => {
      setAccessToken(response.access_token);
      setIsConnected(true);
      localStorage.setItem('google_calendar_token', response.access_token);
    },
    onError: () => console.error('Erro ao conectar Google Calendar')
  });

  const disconnect = () => {
    setAccessToken(null);
    setIsConnected(false);
    localStorage.removeItem('google_calendar_token');
  };

  const createEvent = async (event: {
    titulo: string;
    descricao?: string;
    data: string; // YYYY-MM-DD
    hora?: string; // HH:MM
    cliente?: string;
  }) => {
    if (!accessToken) return null;
    
    // Convert to ISO 8601
    // If only date is provided, it's an all-day event
    const start = event.hora
      ? `${event.data}T${event.hora}:00`
      : event.data;
      
    let end;
    if (event.hora) {
        const [h, m] = event.hora.split(':');
        const nextH = String(Number(h) + 1).padStart(2, '0');
        end = `${event.data}T${nextH}:${m}:00`;
    } else {
        end = event.data;
    }

    const body = {
      summary: event.titulo,
      description: event.descricao || '',
      start: event.hora
        ? { dateTime: start, timeZone: 'America/Sao_Paulo' }
        : { date: start },
      end: event.hora
        ? { dateTime: end, timeZone: 'America/Sao_Paulo' }
        : { date: end },
      colorId: '1',
    };

    try {
        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        if (res.status === 401) {
            // Token expired
            disconnect();
            return null;
        }
        
        return res.ok ? await res.json() : null;
    } catch (err) {
        console.error('Error creating event:', err);
        return null;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!accessToken) return;
    try {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
    } catch (err) {
        console.error('Error deleting event:', err);
    }
  };

  return { isConnected, login, disconnect, createEvent, deleteEvent };
}
