import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

const GOOGLE_CONFIGURED = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * When VITE_GOOGLE_CLIENT_ID is not set, this hook returns no-ops so the
 * app renders normally without crashing. When the env var IS set (and
 * GoogleOAuthProvider wraps the app), the full implementation is used.
 *
 * The exported function is resolved ONCE at module evaluation time, so
 * the Rules of Hooks are respected — every call always invokes the same hook.
 */

function _useReal() {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('google_calendar_token')
  );
  const [isConnected, setIsConnected] = useState(!!accessToken);

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar',
    flow: 'implicit',
    onSuccess: (response) => {
      setAccessToken(response.access_token);
      setIsConnected(true);
      localStorage.setItem('google_calendar_token', response.access_token);
    },
    onError: (error) => {
      console.error('Erro ao conectar Google Calendar:', error);
    },
  });

  const disconnect = () => {
    setAccessToken(null);
    setIsConnected(false);
    localStorage.removeItem('google_calendar_token');
  };

  const createEvent = async (event: {
    titulo: string;
    descricao?: string;
    data: string;
    hora?: string;
    cliente?: string;
  }) => {
    if (!accessToken) return null;
    const start = event.hora ? `${event.data}T${event.hora}:00` : event.data;
    let end: string;
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
      start: event.hora ? { dateTime: start, timeZone: 'America/Sao_Paulo' } : { date: start },
      end: event.hora ? { dateTime: end, timeZone: 'America/Sao_Paulo' } : { date: end },
      colorId: '1',
    };
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 401) { disconnect(); return null; }
      return res.ok ? await res.json() : null;
    } catch (err) { console.error('Error creating event:', err); return null; }
  };

  const deleteEvent = async (eventId: string) => {
    if (!accessToken) return;
    try {
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) { console.error('Error deleting event:', err); }
  };

  return { isConnected, login, disconnect, createEvent, deleteEvent };
}

function _useStub() {
  // Mirrors the same useState calls as _useReal so hook counts stay consistent
  // if this module is ever hot-reloaded — both functions are only called when
  // GOOGLE_CONFIGURED is respectively true / false (decided at module load).
  const [, ] = useState<string | null>(null);
  const [isConnected] = useState(false);
  return {
    isConnected,
    login: () => { console.info('[Google Calendar] Not configured — set VITE_GOOGLE_CLIENT_ID to enable.'); },
    disconnect: () => {},
    createEvent: async () => null,
    deleteEvent: async () => {},
  };
}

// Resolved once at module load — hooks order is always consistent per instance
export const useGoogleCalendar = GOOGLE_CONFIGURED ? _useReal : _useStub;
