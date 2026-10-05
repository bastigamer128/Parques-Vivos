import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Activity } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup and obtain Calendar token
export const signInWithGoogleCalendar = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Calendar');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Error al conectar con Google Calendar:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCalendarAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutCalendar = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Calculate start and end ISO strings with fallback
export const getEventTimeRange = (rawDate?: string): { startIso: string; endIso: string } => {
  let startDate: Date;
  if (rawDate) {
    startDate = new Date(rawDate);
    if (isNaN(startDate.getTime())) {
      startDate = new Date();
      startDate.setHours(startDate.getHours() + 1, 0, 0, 0);
    }
  } else {
    startDate = new Date();
    startDate.setHours(startDate.getHours() + 1, 0, 0, 0);
  }

  // End date is 1 hour after start
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
  };
};

// Create Google Calendar event
export const createCalendarEvent = async (
  activity: Activity,
  token?: string
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> => {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) {
    return { success: false, error: 'Token no disponible. Inicia sesión con Google.' };
  }

  const { startIso, endIso } = getEventTimeRange(activity.rawDate);

  const eventPayload = {
    summary: `Parques Vivos: ${activity.title}`,
    description: `${activity.description}\n\n📍 Lugar: ${activity.locationName} (Parque Almagro)\n👤 Organiza: ${activity.creatorName}\n🛡️ Recomendación de seguridad: ${activity.safetyTip || 'Mantenerse juntos y cuidar las pertenencias.'}\n\nCoordinado a través de Parques Vivos Santiago.`,
    location: `${activity.locationName}, Parque Almagro, Santiago Centro, Chile`,
    start: {
      dateTime: startIso,
      timeZone: 'America/Santiago',
    },
    end: {
      dateTime: endIso,
      timeZone: 'America/Santiago',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 120 },
      ],
    },
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { success: false, error: errData.error?.message || 'Error al crear evento en Google Calendar' };
    }

    const data = await response.json();
    return { success: true, eventId: data.id, htmlLink: data.htmlLink };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con Google Calendar' };
  }
};

// Remove Google Calendar event with explicit user confirmation (Mandatory per Workspace Skill)
export const deleteCalendarEvent = async (
  eventId: string,
  eventTitle: string,
  token?: string
): Promise<boolean> => {
  const confirmed = window.confirm(`¿Deseas desvincular y eliminar "${eventTitle}" de tu Google Calendar?`);
  if (!confirmed) return false;

  const accessToken = token || cachedAccessToken;
  if (!accessToken) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
};
