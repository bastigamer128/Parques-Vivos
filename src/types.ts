export type CategoryType = 'deporte' | 'mascotas' | 'cultura' | 'seguridad' | 'infantil' | 'social';

export type SchematicZoneId =
  | 'maquinas'
  | 'sendero-norte'
  | 'explanada'
  | 'escalinata'
  | 'canil'
  | 'juegos'
  | 'metro'
  | 'pradera-poniente'
  | 'sacramentinos';

export type TimeFilter = 'hoy' | 'manana' | 'semana' | 'antes-1930';

export type DayOption = 'Hoy' | 'Mañana' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface ParkLandmark {
  id: string;
  name: string;
  shortLabel: string;
  streetRef: string;
  description: string;
  category: 'transporte' | 'deporte' | 'patrimonio' | 'servicios' | 'entorno';
  x: number;
  y: number;
  /** Linked activity zone if users want to schedule an activity right here */
  zoneId?: SchematicZoneId;
}

export interface Attendee {
  uid: string;
  name: string; // Privacy-safe format: "Nombre I." (e.g., "Daniela P.")
  role: string; // e.g., "Vecina", "Estudiante", "Organizador"
  verified?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  locationName: string;
  zoneId?: SchematicZoneId;
  lat: number;
  lng: number;
  date: string; // e.g. "Hoy · 10:30–11:30"
  dayLabel?: DayOption | string;
  startTime?: string; // "HH:MM" (24h), e.g., "10:30"
  endTime?: string; // "HH:MM" (24h), e.g., "11:30"
  durationMinutes?: number;
  suggestedCapacity?: number; // Aforo sugerido (no excluyente)
  repeatsWeekly?: boolean;
  rawDate: string;
  category: CategoryType;
  creatorName: string;
  creatorRole: string;
  creatorAvatar: string;
  creatorVerified?: boolean;
  attendeesCount: number;
  attendees?: Attendee[];
  isAttending?: boolean;
  status: 'activa' | 'proxima' | 'finalizada';
  safetyTip?: string;
  schemaVersion?: number;
}

export type ForumCategory = 'Todas' | 'Ideas' | 'Reseñas' | 'Panorama';

export interface ForumComment {
  id: string;
  postId: string;
  authorName: string;
  authorAvatar: string;
  authorBadge?: string;
  timeAgo: string;
  content: string;
  likes: number;
  isLiked?: boolean;
  replyToAuthor?: string;
}

export interface ForumPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorBadge?: string;
  timeAgo: string;
  category: 'Ideas' | 'Reseñas' | 'Panorama';
  content: string;
  imageUrl?: string;
  isOwner?: boolean;
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  comments?: ForumComment[];
  tag?: string;
}

export interface Neighbor {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isVerified: boolean;
  badgeColor: string;
}

export interface UserProfile {
  name: string;
  email: string;
  addressArea: string;
  avatar: string;
  isVerified: boolean;
  activitiesCreated: number;
  activitiesAttended: number;
  reputationPoints: number;
  bio: string;
}
