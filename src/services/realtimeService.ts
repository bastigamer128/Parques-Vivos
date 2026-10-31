import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Activity, Attendee, ForumComment, ForumPost } from '../types';
import {
  V2_INITIAL_ACTIVITIES,
  PARQUE_ALMAGRO_BOUNDS_POLYGON,
  formatNeighborShortName,
  normalizeActivityToV2,
} from '../data/mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with HTTP Long-Polling for mobile & iFrame reliability
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId || undefined
);

// Local device / user identifier for cross-device sync
export function getDeviceId(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'node-env-device';
  }
  let id = localStorage.getItem('parques_vivos_device_id');
  if (!id) {
    id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('parques_vivos_device_id', id);
  }
  return id;
}

export function getSavedNeighborName(): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'Vecino A.';
  }
  return localStorage.getItem('parques_vivos_neighbor_name_v2') || '';
}

export function saveNeighborName(name: string): string {
  const formatted = formatNeighborShortName(name);
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('parques_vivos_neighbor_name_v2', formatted);
  }
  return formatted;
}

/**
 * Recursively strips undefined keys from objects and arrays so Firestore writes never fail.
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = sanitizeForFirestore(value);
      } else if (Array.isArray(value)) {
        clean[key] = value.map((item) =>
          item !== null && typeof item === 'object' ? sanitizeForFirestore(item) : item
        );
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as Partial<T>;
}

const LEGACY_V1_SEED_IDS = new Set([
  'act-almagro-1',
  'act-almagro-2',
  'act-almagro-3',
  'act-almagro-4',
  'act-almagro-5',
  'act-almagro-6',
  'act-almagro-7',
]);

/**
 * Seeds the simplified Parque Almagro v2 activities once and cleans legacy v1 demo entries.
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const v2SeedFlagRef = doc(db, 'park_settings', 'prototype_v2_seed');
    const v2SeedSnap = await getDoc(v2SeedFlagRef);
    const activitiesRef = collection(db, 'activities');
    const actSnap = await getDocs(activitiesRef);

    if (!v2SeedSnap.exists() || actSnap.empty) {
      const batch = writeBatch(db);

      // Remove old verbose v1 seed items if present
      actSnap.forEach((docItem) => {
        if (LEGACY_V1_SEED_IDS.has(docItem.id)) {
          batch.delete(docItem.ref);
        }
      });

      for (const act of V2_INITIAL_ACTIVITIES) {
        const actDoc = doc(db, 'activities', act.id);
        const cleanAct = sanitizeForFirestore({
          ...act,
          attendeeUids: (act.attendees || []).map((a) => a.uid),
          createdAt: Date.now(),
        });
        batch.set(actDoc, cleanAct);
      }

      batch.set(v2SeedFlagRef, {
        seededAt: Date.now(),
        version: 2,
      });

      await batch.commit();
    }
  } catch (err) {
    console.error('Error during Firestore v2 initial seeding:', err);
  }
}

function sortActivitiesByTime(items: Activity[]): Activity[] {
  const dayRank: Record<string, number> = {
    Hoy: 0,
    Mañana: 1,
    Miércoles: 2,
    Jueves: 3,
    Viernes: 4,
    Sábado: 5,
    Domingo: 6,
  };
  return [...items].sort((a, b) => {
    const rankA = dayRank[a.dayLabel || 'Hoy'] ?? 3;
    const rankB = dayRank[b.dayLabel || 'Hoy'] ?? 3;
    if (rankA !== rankB) return rankA - rankB;
    return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
  });
}

/**
 * Real-time subscription to activities collection (Parque Almagro only).
 */
export function subscribeToActivities(
  onUpdate: (activities: Activity[]) => void,
  onError?: (error: Error) => void
): () => void {
  const activitiesRef = collection(db, 'activities');
  const deviceId = getDeviceId();

  return onSnapshot(
    activitiesRef,
    (snapshot) => {
      const items: Activity[] = [];
      snapshot.forEach((docSnap) => {
        if (LEGACY_V1_SEED_IDS.has(docSnap.id)) return;
        const data = docSnap.data();
        items.push(
          normalizeActivityToV2(
            {
              ...data,
              id: docSnap.id,
            },
            deviceId
          )
        );
      });

      if (items.length > 0) {
        onUpdate(sortActivitiesByTime(items));
      }
    },
    (err) => {
      console.error('Firestore activities snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Create a new Parque Almagro activity in real-time Firestore.
 */
export async function createRealtimeActivity(activity: Activity): Promise<void> {
  const deviceId = getDeviceId();
  const docRef = doc(db, 'activities', activity.id);
  const initialAttendees: Attendee[] =
    activity.attendees && activity.attendees.length > 0
      ? activity.attendees
      : [
          {
            uid: deviceId,
            name: formatNeighborShortName(activity.creatorName),
            role: 'Organizador',
            verified: true,
          },
        ];

  const cleanData = sanitizeForFirestore({
    ...activity,
    creatorUid: deviceId,
    attendees: initialAttendees,
    attendeeUids: initialAttendees.map((a) => a.uid),
    attendeesCount: initialAttendees.length,
    schemaVersion: 2,
    createdAt: Date.now(),
  });
  await setDoc(docRef, cleanData);
}

/**
 * Toggle attendance and update visible attendee list ("Compañía visible") in real-time Firestore.
 */
export async function updateRealtimeAttendance(
  activityId: string,
  shouldAttend: boolean,
  neighborDisplayName?: string
): Promise<void> {
  const deviceId = getDeviceId();
  const docRef = doc(db, 'activities', activityId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const existingAttendees: Attendee[] = Array.isArray(data.attendees) ? [...data.attendees] : [];
  const existingUids: string[] = Array.isArray(data.attendeeUids) ? [...data.attendeeUids] : [];
  const shortName = formatNeighborShortName(neighborDisplayName || getSavedNeighborName() || 'Vecino A.');

  let nextAttendees: Attendee[];
  let nextUids: string[];

  if (shouldAttend) {
    const filtered = existingAttendees.filter((a) => a.uid !== deviceId);
    nextAttendees = [
      ...filtered,
      {
        uid: deviceId,
        name: shortName,
        role: 'Vecino',
        verified: true,
      },
    ];
    nextUids = Array.from(new Set([...existingUids, deviceId]));
  } else {
    nextAttendees = existingAttendees.filter((a) => a.uid !== deviceId);
    nextUids = existingUids.filter((uid) => uid !== deviceId);
  }

  const nextCount = Math.max(nextAttendees.length, 0);

  await updateDoc(docRef, {
    attendees: nextAttendees.map((a) => sanitizeForFirestore(a)),
    attendeeUids: nextUids,
    attendeesCount: nextCount,
  });
}

// Keep legacy forum/boundary exports so any older module still compiles cleanly
export function subscribeToForumPosts(
  onUpdate: (posts: ForumPost[]) => void
): () => void {
  onUpdate([]);
  return () => {};
}

export async function createRealtimeForumPost(post: ForumPost): Promise<void> {
  const docRef = doc(db, 'forum_posts', post.id);
  await setDoc(docRef, sanitizeForFirestore(post));
}

export async function deleteRealtimeForumPost(postId: string): Promise<void> {
  await deleteDoc(doc(db, 'forum_posts', postId));
}

export async function toggleRealtimePostLike(postId: string, currentlyLiked: boolean): Promise<void> {
  await updateDoc(doc(db, 'forum_posts', postId), {
    likes: increment(currentlyLiked ? -1 : 1),
  });
}

export async function addRealtimeComment(postId: string, comment: ForumComment): Promise<void> {
  await updateDoc(doc(db, 'forum_posts', postId), {
    comments: arrayUnion(sanitizeForFirestore(comment)),
    commentsCount: increment(1),
  });
}

export async function toggleRealtimeCommentLike(_postId: string, _commentId: string): Promise<void> {}

export function subscribeToParkBoundaries(
  onUpdate: (coords: [number, number][]) => void
): () => void {
  onUpdate(PARQUE_ALMAGRO_BOUNDS_POLYGON);
  return () => {};
}

export async function saveRealtimeParkBoundaries(_coords: [number, number][]): Promise<void> {}
export async function resetRealtimeParkBoundaries(): Promise<void> {}
export { arrayRemove };
