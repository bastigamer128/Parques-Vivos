import {
  Activity,
  Attendee,
  ForumPost,
  Neighbor,
  ParkLandmark,
  SchematicZoneId,
  UserProfile,
} from '../types';

export const PARK_MAP_WIDTH = 960;
export const PARK_MAP_HEIGHT = 600;

export interface SchematicZone {
  id: SchematicZoneId;
  name: string;
  shortLabel: string;
  /** Coordinates inside the 960x600 Parque Almagro canvas */
  x: number;
  y: number;
  /** Real coordinates inside Parque Almagro (used for .ics / calendar metadata) */
  lat: number;
  lng: number;
}

/**
 * Sectores convocables dentro del Parque Almagro (Poniente -> Oriente: Dieciocho a Basílica Sacramentinos).
 */
export const SCHEMATIC_ZONES: SchematicZone[] = [
  {
    id: 'maquinas',
    name: 'Máquinas de ejercicio y Calistenia',
    shortLabel: 'Máquinas',
    x: 586,
    y: 166,
    lat: -33.45190,
    lng: -70.65420,
  },
  {
    id: 'explanada',
    name: 'Explanada Monumento Central',
    shortLabel: 'Explanada central',
    x: 504,
    y: 262,
    lat: -33.45210,
    lng: -70.65360,
  },
  {
    id: 'sendero-norte',
    name: 'Sendero norte (Santa Isabel)',
    shortLabel: 'Sendero norte',
    x: 726,
    y: 142,
    lat: -33.45150,
    lng: -70.65350,
  },
  {
    id: 'metro',
    name: 'Acceso Metro Parque Almagro (L3)',
    shortLabel: 'Metro L3',
    x: 898,
    y: 148,
    lat: -33.45140,
    lng: -70.65056,
  },
  {
    id: 'juegos',
    name: 'Juegos infantiles y Pérgola',
    shortLabel: 'Juegos y pérgola',
    x: 724,
    y: 326,
    lat: -33.45205,
    lng: -70.65220,
  },
  {
    id: 'canil',
    name: 'Canil cerrado (Zona canina)',
    shortLabel: 'Canil cerrado',
    x: 336,
    y: 336,
    lat: -33.45220,
    lng: -70.65550,
  },
  {
    id: 'pradera-poniente',
    name: 'Pradera poniente (Dieciocho)',
    shortLabel: 'Pradera poniente',
    x: 138,
    y: 226,
    lat: -33.45225,
    lng: -70.65660,
  },
  {
    id: 'escalinata',
    name: 'Escalinata oriente (San Diego)',
    shortLabel: 'Escalinata',
    x: 798,
    y: 236,
    lat: -33.45175,
    lng: -70.65100,
  },
  {
    id: 'sacramentinos',
    name: 'Plazoleta Basílica Sacramentinos',
    shortLabel: 'Plazoleta Sacramentinos',
    x: 902,
    y: 336,
    lat: -33.45132,
    lng: -70.64905,
  },
];

/**
 * Todos los puntos clave reales del Parque Almagro y su borde inmediato para orientar al vecino.
 */
export const PARK_KEY_LANDMARKS: ParkLandmark[] = [
  {
    id: 'lm-metro',
    name: 'Acceso Metro Parque Almagro (Línea 3)',
    shortLabel: 'Acceso Metro L3',
    streetRef: 'San Diego esq. Santa Isabel',
    description: 'Salida principal de Línea 3 con explanada iluminada; punto ideal para encontrarse o volver acompañados.',
    category: 'transporte',
    x: 898,
    y: 148,
    zoneId: 'metro',
  },
  {
    id: 'lm-sacramentinos',
    name: 'Basílica de los Sacramentinos y Plazoleta',
    shortLabel: 'Sacramentinos',
    streetRef: 'Santa Isabel con Arturo Prat (Oriente)',
    description: 'Hito patrimonial del extremo oriente donde se reúnen ferias de libros, trueque y familias.',
    category: 'patrimonio',
    x: 902,
    y: 336,
    zoneId: 'sacramentinos',
  },
  {
    id: 'lm-monumento',
    name: 'Monumento y Explanada Central',
    shortLabel: 'Explanada central',
    streetRef: 'Eje Paseo Bulnes · Centro del parque',
    description: 'Explanada circular despejada en el corazón del parque para yoga, paseos grupales y encuentro vecinal.',
    category: 'patrimonio',
    x: 504,
    y: 262,
    zoneId: 'explanada',
  },
  {
    id: 'lm-bulnes',
    name: 'Acceso Peatonal Paseo Bulnes',
    shortLabel: 'Paseo Bulnes',
    streetRef: 'Cruce norte por Calle Santa Isabel',
    description: 'Paseo cívico peatonal iluminado que conecta desde el norte directo a la explanada central.',
    category: 'transporte',
    x: 504,
    y: 62,
    zoneId: 'explanada',
  },
  {
    id: 'lm-maquinas',
    name: 'Máquinas de Ejercicio y Calistenia',
    shortLabel: 'Máquinas y barras',
    streetRef: 'Costado Nataniel Cox · Sendero norte',
    description: 'Circuito de barras y máquinas al aire libre muy activo en las mañanas por grupos de vecinas y deportistas.',
    category: 'deporte',
    x: 586,
    y: 166,
    zoneId: 'maquinas',
  },
  {
    id: 'lm-sendero-norte',
    name: 'Sendero Norte Iluminado',
    shortLabel: 'Sendero norte',
    streetRef: 'Borde Calle Santa Isabel (Nataniel a San Diego)',
    description: 'Ruta principal de trote y caminata con luminarias peatonales paralela a Santa Isabel.',
    category: 'deporte',
    x: 726,
    y: 142,
    zoneId: 'sendero-norte',
  },
  {
    id: 'lm-juegos',
    name: 'Juegos Infantiles, Pérgola y Bebedero',
    shortLabel: 'Juegos y pérgola',
    streetRef: 'Tramo Nataniel Cox – San Diego',
    description: 'Zona familiar sombreada con juegos infantiles, bancas, pérgola circular y bebedero de agua.',
    category: 'servicios',
    x: 724,
    y: 326,
    zoneId: 'juegos',
  },
  {
    id: 'lm-escalinata',
    name: 'Escalinata y Terraza Oriente',
    shortLabel: 'Escalinata',
    streetRef: 'Costado poniente de Calle San Diego',
    description: 'Graderías abiertas hacia el parque junto al cruce peatonal hacia el Metro Parque Almagro.',
    category: 'servicios',
    x: 798,
    y: 236,
    zoneId: 'escalinata',
  },
  {
    id: 'lm-canil',
    name: 'Canil Cerrado Municipal',
    shortLabel: 'Canil cerrado',
    streetRef: 'Entre San Ignacio y Lord Cochrane',
    description: 'Recinto cercado con doble reja de seguridad para socialización y juego libre de mascotas.',
    category: 'servicios',
    x: 336,
    y: 336,
    zoneId: 'canil',
  },
  {
    id: 'lm-rocas',
    name: 'Sector Rocas y Arboleda',
    shortLabel: 'Zona de rocas',
    streetRef: 'Norte de tramo San Ignacio – Lord Cochrane',
    description: 'Punto de referencia tradicional de grandes rocas entre árboles identificado por los vecinos.',
    category: 'entorno',
    x: 338,
    y: 174,
  },
  {
    id: 'lm-pradera',
    name: 'Pradera Verde Poniente',
    shortLabel: 'Pradera poniente',
    streetRef: 'Entre Calle Dieciocho y San Ignacio',
    description: 'Amplia explanada de pasto y sombra tranquila para picnics, lectura, mateadas y descanso.',
    category: 'deporte',
    x: 138,
    y: 226,
    zoneId: 'pradera-poniente',
  },
  {
    id: 'lm-cousino',
    name: 'Entorno Palacio Cousiño',
    shortLabel: 'Palacio Cousiño',
    streetRef: 'Borde poniente por Calle Dieciocho',
    description: 'Referencia patrimonial e histórica en el extremo poniente del Parque Almagro.',
    category: 'patrimonio',
    x: 112,
    y: 378,
    zoneId: 'pradera-poniente',
  },
  {
    id: 'lm-ucentral',
    name: 'Campus Universidad Central',
    shortLabel: 'U. Central',
    streetRef: 'Borde sur · Calle Mensía de los Nidos',
    description: 'Edificios universitarios colindantes al sur del parque con alto flujo estudiantil diurno.',
    category: 'entorno',
    x: 436,
    y: 524,
  },
];

export function getSchematicZone(zoneId?: string, locationName?: string): SchematicZone {
  if (zoneId) {
    const exact = SCHEMATIC_ZONES.find((z) => z.id === zoneId);
    if (exact) return exact;
  }
  const lower = (locationName || '').toLowerCase();
  if (lower.includes('máquina') || lower.includes('maquina') || lower.includes('calistenia') || lower.includes('barra')) {
    return SCHEMATIC_ZONES[0];
  }
  if (lower.includes('metro')) {
    return SCHEMATIC_ZONES[3];
  }
  if (lower.includes('norte') || lower.includes('santa isabel')) {
    return SCHEMATIC_ZONES[2];
  }
  if (lower.includes('canil') || lower.includes('perr') || lower.includes('mascota')) {
    return SCHEMATIC_ZONES[5];
  }
  if (lower.includes('juego') || lower.includes('pérgola') || lower.includes('pergola') || lower.includes('niñ')) {
    return SCHEMATIC_ZONES[4];
  }
  if (lower.includes('poniente') || lower.includes('dieciocho') || lower.includes('cousiño')) {
    return SCHEMATIC_ZONES[6];
  }
  if (lower.includes('sacramentinos') || lower.includes('plazoleta')) {
    return SCHEMATIC_ZONES[8];
  }
  if (lower.includes('escalinata') || lower.includes('san diego')) {
    return SCHEMATIC_ZONES[7];
  }
  return SCHEMATIC_ZONES[1]; // Explanada central
}

/**
 * Formats a full name into privacy-preserving "Nombre A." format (Aprendizaje 4, Hito 2).
 */
export function formatNeighborShortName(rawName: string): string {
  const cleaned = rawName.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Vecino A.';
  const parts = cleaned.split(' ');
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[1].charAt(0).toUpperCase();
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

export function computeEndTime(startTime: string, durationMinutes: number): string {
  const [hStr, mStr] = startTime.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return '12:00';
  const totalMinutes = (h * 60 + m + durationMinutes) % (24 * 60);
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/**
 * Returns true if the activity ends at or before 19:30 (key twilight filter for Parque Almagro).
 */
export function endsBefore1930(endTime?: string, startTime?: string): boolean {
  const target = endTime || (startTime ? computeEndTime(startTime, 60) : '18:00');
  const [hStr, mStr] = target.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return true;
  return h * 60 + m <= 19 * 60 + 30;
}

export function buildRawDateIso(dayLabel: string, startTime: string): string {
  const now = new Date();
  if (dayLabel === 'Mañana') {
    now.setDate(now.getDate() + 1);
  } else if (dayLabel !== 'Hoy') {
    now.setDate(now.getDate() + 2);
  }
  const [hStr, mStr] = startTime.split(':');
  now.setHours(Number(hStr) || 11, Number(mStr) || 0, 0, 0);
  return now.toISOString();
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

/**
 * Actividades iniciales centradas exclusivamente en el Parque Almagro (Prototipo Hito 2 v2).
 */
export const V2_INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'v2-almagro-1',
    title: 'Ejercicio en las máquinas',
    description: 'Rutina suave de movilidad, fuerza y conversación entre vecinos frente al sendero norte.',
    locationName: 'Máquinas de ejercicio y Calistenia',
    zoneId: 'maquinas',
    lat: -33.45190,
    lng: -70.65420,
    dayLabel: 'Hoy',
    startTime: '10:30',
    endTime: '11:30',
    durationMinutes: 60,
    suggestedCapacity: 15,
    repeatsWeekly: true,
    date: 'Hoy · 10:30–11:30',
    rawDate: buildRawDateIso('Hoy', '10:30'),
    category: 'deporte',
    creatorName: 'Carla M.',
    creatorRole: 'Vecina verificada · Sector Nataniel',
    creatorAvatar: DEFAULT_AVATAR,
    creatorVerified: true,
    attendeesCount: 9,
    attendees: [
      { uid: 'seed-carla', name: 'Carla M.', role: 'Organizadora', verified: true },
      { uid: 'seed-abby', name: 'Abby R.', role: 'Vecina', verified: true },
      { uid: 'seed-berta', name: 'Berta S.', role: 'Vecina', verified: true },
      { uid: 'seed-hector', name: 'Héctor V.', role: 'Vecino' },
      { uid: 'seed-luisa', name: 'Luisa C.', role: 'Vecina', verified: true },
      { uid: 'seed-elena', name: 'Elena M.', role: 'Vecina' },
      { uid: 'seed-jorge', name: 'Jorge P.', role: 'Vecino' },
      { uid: 'seed-rosa', name: 'Rosa D.', role: 'Vecina' },
      { uid: 'seed-patricio', name: 'Patricio L.', role: 'Vecino' },
    ],
    isAttending: false,
    status: 'activa',
    safetyTip: 'Sector iluminado y concurrido durante toda la mañana.',
    schemaVersion: 2,
  },
  {
    id: 'v2-almagro-2',
    title: 'Paseo canino grupal',
    description: 'Recorrido tranquilo por el parque y socialización de mascotas en compañía vecinal antes del atardecer.',
    locationName: 'Explanada Monumento Central',
    zoneId: 'explanada',
    lat: -33.45210,
    lng: -70.65360,
    dayLabel: 'Hoy',
    startTime: '17:30',
    endTime: '18:30',
    durationMinutes: 60,
    suggestedCapacity: 10,
    repeatsWeekly: true,
    date: 'Hoy · 17:30–18:30',
    rawDate: buildRawDateIso('Hoy', '17:30'),
    category: 'mascotas',
    creatorName: 'Felipe A.',
    creatorRole: 'Vecino verificado · San Diego',
    creatorAvatar: DEFAULT_AVATAR,
    creatorVerified: true,
    attendeesCount: 6,
    attendees: [
      { uid: 'seed-felipe', name: 'Felipe A.', role: 'Organizador', verified: true },
      { uid: 'seed-daniela', name: 'Daniela P.', role: 'Vecina', verified: true },
      { uid: 'seed-hector2', name: 'Héctor V.', role: 'Vecino' },
      { uid: 'seed-ignacia', name: 'Ignacia S.', role: 'Estudiante' },
      { uid: 'seed-tomas', name: 'Tomás B.', role: 'Estudiante' },
      { uid: 'seed-marta', name: 'Marta G.', role: 'Vecina', verified: true },
    ],
    isAttending: false,
    status: 'activa',
    safetyTip: 'Traer correa y bolsitas; terminamos con luz de tarde.',
    schemaVersion: 2,
  },
  {
    id: 'v2-almagro-3',
    title: 'Trote suave en grupo',
    description: 'Vueltas a ritmo conversacional por el perímetro interior del Parque Almagro para salir acompañados.',
    locationName: 'Sendero norte (Santa Isabel)',
    zoneId: 'sendero-norte',
    lat: -33.45150,
    lng: -70.65350,
    dayLabel: 'Hoy',
    startTime: '19:00',
    endTime: '20:00',
    durationMinutes: 60,
    suggestedCapacity: 12,
    repeatsWeekly: false,
    date: 'Hoy · 19:00–20:00',
    rawDate: buildRawDateIso('Hoy', '19:00'),
    category: 'deporte',
    creatorName: 'Manuel S.',
    creatorRole: 'Vecino verificado · Santa Isabel',
    creatorAvatar: DEFAULT_AVATAR,
    creatorVerified: true,
    attendeesCount: 5,
    attendees: [
      { uid: 'seed-manuel', name: 'Manuel S.', role: 'Organizador', verified: true },
      { uid: 'seed-camila', name: 'Camila R.', role: 'Vecina', verified: true },
      { uid: 'seed-diego', name: 'Diego F.', role: 'Estudiante' },
      { uid: 'seed-valentina', name: 'Valentina M.', role: 'Vecina' },
      { uid: 'seed-andres', name: 'Andrés C.', role: 'Vecino' },
    ],
    isAttending: false,
    status: 'activa',
    safetyTip: 'Nos reunimos frente a Santa Isabel y terminamos todos juntos junto al Metro L3.',
    schemaVersion: 2,
  },
  {
    id: 'v2-almagro-4',
    title: 'Yoga al aire libre',
    description: 'Práctica matutina abierta a todas las edades y niveles. Solo necesitas traer mat o manta.',
    locationName: 'Explanada Monumento Central',
    zoneId: 'explanada',
    lat: -33.45210,
    lng: -70.65360,
    dayLabel: 'Mañana',
    startTime: '09:00',
    endTime: '10:00',
    durationMinutes: 60,
    suggestedCapacity: 20,
    repeatsWeekly: true,
    date: 'Mañana · 09:00–10:00',
    rawDate: buildRawDateIso('Mañana', '09:00'),
    category: 'deporte',
    creatorName: 'Valeria C.',
    creatorRole: 'Vecina verificada · Instructora',
    creatorAvatar: DEFAULT_AVATAR,
    creatorVerified: true,
    attendeesCount: 7,
    attendees: [
      { uid: 'seed-valeria', name: 'Valeria C.', role: 'Organizadora', verified: true },
      { uid: 'seed-paula', name: 'Paula G.', role: 'Vecina', verified: true },
      { uid: 'seed-sofia', name: 'Sofía L.', role: 'Estudiante' },
      { uid: 'seed-carmen', name: 'Carmen T.', role: 'Vecina', verified: true },
      { uid: 'seed-ernesto', name: 'Ernesto M.', role: 'Vecino', verified: true },
      { uid: 'seed-lucia', name: 'Lucía V.', role: 'Vecina' },
      { uid: 'seed-javiera', name: 'Javiera N.', role: 'Vecina' },
    ],
    isAttending: false,
    status: 'proxima',
    safetyTip: 'Pasto central despejado y soleado por la mañana.',
    schemaVersion: 2,
  },
  {
    id: 'v2-almagro-5',
    title: 'Ajedrez y mate vecinal',
    description: 'Mesas abiertas de ajedrez, conversación y mate compartido entre residentes y estudiantes del barrio.',
    locationName: 'Juegos infantiles y Pérgola',
    zoneId: 'juegos',
    lat: -33.45205,
    lng: -70.65220,
    dayLabel: 'Sábado',
    startTime: '16:00',
    endTime: '17:30',
    durationMinutes: 90,
    suggestedCapacity: 12,
    repeatsWeekly: true,
    date: 'Sábado · 16:00–17:30',
    rawDate: buildRawDateIso('Sábado', '16:00'),
    category: 'cultura',
    creatorName: 'Ernesto M.',
    creatorRole: 'Vecino verificado · Lord Cochrane',
    creatorAvatar: DEFAULT_AVATAR,
    creatorVerified: true,
    attendeesCount: 6,
    attendees: [
      { uid: 'seed-ernesto-org', name: 'Ernesto M.', role: 'Organizador', verified: true },
      { uid: 'seed-elena-r', name: 'Elena R.', role: 'Vecina', verified: true },
      { uid: 'seed-gabriel', name: 'Gabriel T.', role: 'Estudiante' },
      { uid: 'seed-vicente', name: 'Vicente C.', role: 'Estudiante' },
      { uid: 'seed-franco', name: 'Franco S.', role: 'Estudiante' },
      { uid: 'seed-enzo', name: 'Enzo I.', role: 'Estudiante' },
    ],
    isAttending: false,
    status: 'proxima',
    safetyTip: 'Actividad diurna familiar bajo la sombra de la pérgola.',
    schemaVersion: 2,
  },
];

/**
 * Normalizes any activity record (from Firestore or localStorage) so all v2 fields are guaranteed.
 */
export function normalizeActivityToV2(raw: Record<string, any>, currentDeviceId?: string): Activity {
  const zone = getSchematicZone(raw.zoneId, raw.locationName);
  let dayLabel: string = raw.dayLabel || 'Hoy';
  let startTime: string = raw.startTime || '';

  if (!startTime && typeof raw.date === 'string') {
    const timeMatch = raw.date.match(/(\d{1,2}:\d{2})/);
    startTime = timeMatch ? timeMatch[1].padStart(5, '0') : '17:30';
    if (/mañana/i.test(raw.date)) dayLabel = 'Mañana';
    else if (/sábado|sabado/i.test(raw.date)) dayLabel = 'Sábado';
    else if (/domingo/i.test(raw.date)) dayLabel = 'Domingo';
    else if (/viernes/i.test(raw.date)) dayLabel = 'Viernes';
    else if (/jueves/i.test(raw.date)) dayLabel = 'Jueves';
  }
  if (!startTime) startTime = '17:30';

  const durationMinutes = Number(raw.durationMinutes) || 60;
  const endTime = raw.endTime || computeEndTime(startTime, durationMinutes);
  const creatorShort = formatNeighborShortName(raw.creatorName || 'Vecino A.');

  const rawAttendees: Attendee[] = Array.isArray(raw.attendees)
    ? raw.attendees.map((a: any, idx: number) => ({
        uid: String(a?.uid || `att-${idx}`),
        name: formatNeighborShortName(String(a?.name || 'Vecino')),
        role: String(a?.role || 'Vecino'),
        verified: Boolean(a?.verified),
      }))
    : [
        {
          uid: String(raw.creatorUid || 'creator'),
          name: creatorShort,
          role: 'Organizador',
          verified: true,
        },
      ];

  const attendeeUids: string[] = Array.isArray(raw.attendeeUids) ? raw.attendeeUids : [];
  const isAttending = currentDeviceId
    ? attendeeUids.includes(currentDeviceId) || rawAttendees.some((a) => a.uid === currentDeviceId)
    : Boolean(raw.isAttending);

  const attendeesCount = Math.max(Number(raw.attendeesCount) || rawAttendees.length, rawAttendees.length);
  const suggestedCapacity = Math.max(Number(raw.suggestedCapacity) || 12, 4);

  return {
    id: String(raw.id || `act-${Date.now()}`),
    title: String(raw.title || 'Actividad vecinal'),
    description: String(raw.description || ''),
    locationName: zone.name,
    zoneId: zone.id,
    lat: Number(raw.lat) || zone.lat,
    lng: Number(raw.lng) || zone.lng,
    dayLabel,
    startTime,
    endTime,
    durationMinutes,
    suggestedCapacity,
    repeatsWeekly: Boolean(raw.repeatsWeekly),
    date: `${dayLabel} · ${startTime}–${endTime}`,
    rawDate: String(raw.rawDate || buildRawDateIso(dayLabel, startTime)),
    category: raw.category || 'social',
    creatorName: creatorShort,
    creatorRole: String(raw.creatorRole || 'Vecino verificado'),
    creatorAvatar: String(raw.creatorAvatar || DEFAULT_AVATAR),
    creatorVerified: raw.creatorVerified !== false,
    attendeesCount,
    attendees: rawAttendees,
    isAttending,
    status: raw.status || 'activa',
    safetyTip: raw.safetyTip ? String(raw.safetyTip) : undefined,
    schemaVersion: Number(raw.schemaVersion) || 2,
  };
}

// Keep legacy exports intact for backwards compatibility
export const PARQUE_ALMAGRO_BOUNDS_POLYGON: [number, number][] = [
  [-33.45130, -70.64890],
  [-33.45140, -70.65056],
  [-33.45150, -70.65350],
  [-33.45155, -70.65480],
  [-33.45160, -70.65620],
  [-33.45165, -70.65730],
  [-33.45275, -70.65730],
  [-33.45270, -70.65620],
  [-33.45265, -70.65480],
  [-33.45260, -70.65350],
  [-33.45250, -70.65056],
  [-33.45240, -70.64890],
];

export function isPointInsideParqueAlmagro(lat: number, lng: number): boolean {
  const minLat = -33.45315;
  const maxLat = -33.45105;
  const minLng = -70.65775;
  const maxLng = -70.64995;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

export const INITIAL_ACTIVITIES: Activity[] = V2_INITIAL_ACTIVITIES;
export const INITIAL_POSTS: ForumPost[] = [];
export const ACTIVE_NEIGHBORS: Neighbor[] = [];
export const INITIAL_USER: UserProfile = {
  name: 'Bastián N.',
  email: 'vecino@parquealmagro.cl',
  addressArea: 'Parque Almagro · Santiago Centro',
  avatar: DEFAULT_AVATAR,
  isVerified: true,
  activitiesCreated: 1,
  activitiesAttended: 3,
  reputationPoints: 100,
  bio: 'Vecino del Parque Almagro.',
};

export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string; bgBadge: string; textBadge: string; border: string }> = {
  deporte: { label: 'Deporte', icon: 'Activity', color: '#1f6a42', bgBadge: 'bg-emerald-100', textBadge: 'text-emerald-800', border: 'border-emerald-500' },
  mascotas: { label: 'Mascotas', icon: 'Dog', color: '#7d4925', bgBadge: 'bg-orange-100', textBadge: 'text-orange-800', border: 'border-orange-500' },
  cultura: { label: 'Cultura', icon: 'BookOpen', color: '#1f6a42', bgBadge: 'bg-sky-100', textBadge: 'text-sky-800', border: 'border-sky-500' },
  seguridad: { label: 'Cuidado', icon: 'ShieldCheck', color: '#1f6a42', bgBadge: 'bg-red-100', textBadge: 'text-red-800', border: 'border-red-500' },
  infantil: { label: 'Infantil', icon: 'Smile', color: '#1f6a42', bgBadge: 'bg-amber-100', textBadge: 'text-amber-800', border: 'border-amber-500' },
  social: { label: 'Vecinal', icon: 'Users', color: '#1f6a42', bgBadge: 'bg-green-100', textBadge: 'text-green-800', border: 'border-green-500' },
};

export const PARQUE_ALMAGRO_ZONES = SCHEMATIC_ZONES.map((z) => ({
  name: z.name,
  lat: z.lat,
  lng: z.lng,
}));
