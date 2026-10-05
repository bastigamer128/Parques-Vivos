export type CategoryType = 'deporte' | 'mascotas' | 'cultura' | 'seguridad' | 'infantil' | 'social';

export interface Activity {
  id: string;
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  date: string; // e.g. "Hoy, 18:30 hrs" or "Sábado 10:00 hrs"
  rawDate: string;
  category: CategoryType;
  creatorName: string;
  creatorRole: string;
  creatorAvatar: string;
  attendeesCount: number;
  isAttending?: boolean;
  status: 'activa' | 'proxima' | 'finalizada';
  safetyTip?: string;
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
