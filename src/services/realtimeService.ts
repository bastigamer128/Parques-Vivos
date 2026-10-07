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
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Activity, ForumPost, ForumComment, UserProfile } from '../types';
import { INITIAL_ACTIVITIES, INITIAL_POSTS, PARQUE_ALMAGRO_BOUNDS_POLYGON } from '../data/mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID and robust HTTP Long-Polling
// (Prevents WebSockets drops and "Could not reach Cloud Firestore backend [code=unavailable]" inside iFrames and mobile browsers)
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

// Track posts created by this device so the author can always delete them
export function trackCreatedPost(postId: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const saved = localStorage.getItem('parques_vivos_my_posts');
    const list: string[] = saved ? JSON.parse(saved) : [];
    if (!list.includes(postId)) {
      list.push(postId);
      localStorage.setItem('parques_vivos_my_posts', JSON.stringify(list));
    }
  } catch {}
}

export function untrackCreatedPost(postId: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const saved = localStorage.getItem('parques_vivos_my_posts');
    if (saved) {
      const list: string[] = JSON.parse(saved);
      const filtered = list.filter((id) => id !== postId);
      localStorage.setItem('parques_vivos_my_posts', JSON.stringify(filtered));
    }
  } catch {}
}

export function isPostOwnedByDevice(postId: string, creatorUid?: string): boolean {
  if (creatorUid && creatorUid === getDeviceId()) return true;
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    const saved = localStorage.getItem('parques_vivos_my_posts');
    if (saved) {
      const list: string[] = JSON.parse(saved);
      return list.includes(postId);
    }
  } catch {}
  return false;
}

/**
 * Crucial Helper: Firestore throws errors if ANY object property has value `undefined`.
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

/**
 * Helper to determine numerical timestamp from post ID or creation date for reliable sorting
 */
function getTimestampForPost(data: Record<string, any>, docId: string): number {
  if (typeof data.createdAt === 'number' && data.createdAt > 0) {
    return data.createdAt;
  }
  if (docId.startsWith('post-')) {
    const numericPart = Number(docId.replace('post-', ''));
    if (!isNaN(numericPart) && numericPart > 1000000000000) {
      return numericPart;
    }
    // Mock post IDs (post-0, post-1, post-2...) - higher index means older
    if (!isNaN(numericPart)) {
      return 1000000000000 - numericPart * 1000000;
    }
  }
  return 0;
}

/**
 * Seed initial activities and forum posts to Firestore if collections are empty.
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const activitiesRef = collection(db, 'activities');
    const actSnap = await getDocs(activitiesRef);
    if (actSnap.empty) {
      console.log('Seeding initial activities to Firestore...');
      const batch = writeBatch(db);
      for (const act of INITIAL_ACTIVITIES) {
        const actDoc = doc(db, 'activities', act.id);
        const cleanAct = sanitizeForFirestore({
          ...act,
          createdAt: Date.now(),
        });
        batch.set(actDoc, cleanAct);
      }
      await batch.commit();
      console.log('Initial activities seeded successfully');
    }

    const postsRef = collection(db, 'forum_posts');
    const postSnap = await getDocs(postsRef);
    if (postSnap.empty) {
      console.log('Seeding initial forum posts to Firestore...');
      const batch = writeBatch(db);
      let offset = 0;
      for (const post of INITIAL_POSTS) {
        const postDoc = doc(db, 'forum_posts', post.id);
        const cleanPost = sanitizeForFirestore({
          ...post,
          createdAt: Date.now() - offset * 60000,
          likedBy: [],
        });
        batch.set(postDoc, cleanPost);
        offset += 15;
      }
      await batch.commit();
      console.log('Initial forum posts seeded successfully');
    }

    const boundariesDocRef = doc(db, 'park_settings', 'boundaries');
    const boundsSnap = await getDoc(boundariesDocRef);
    if (!boundsSnap.exists()) {
      console.log('Seeding initial park boundaries to Firestore...');
      const serialized = PARQUE_ALMAGRO_BOUNDS_POLYGON.map(([lat, lng]) => ({
        lat: Number(lat),
        lng: Number(lng),
      }));
      await setDoc(boundariesDocRef, {
        polygonCoords: serialized,
        updatedAt: Date.now(),
        updatedBy: 'system-seed',
      });
      console.log('Initial park boundaries seeded successfully');
    }
  } catch (err) {
    console.error('Error during Firestore initial seeding:', err);
  }
}

/**
 * Real-time subscription to activities collection.
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
        const data = docSnap.data();
        const attendeeUids = Array.isArray(data.attendeeUids) ? data.attendeeUids : [];
        const isAttending = attendeeUids.includes(deviceId) || Boolean(data.isAttending);

        items.push({
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          locationName: data.locationName || '',
          lat: Number(data.lat),
          lng: Number(data.lng),
          date: data.date || '',
          rawDate: data.rawDate || '',
          category: data.category || 'social',
          creatorName: data.creatorName || '',
          creatorRole: data.creatorRole || '',
          creatorAvatar: data.creatorAvatar || '',
          attendeesCount: Number(data.attendeesCount) || 1,
          isAttending,
          status: data.status || 'activa',
          safetyTip: data.safetyTip,
        });
      });

      if (items.length > 0) {
        onUpdate(items);
      }
    },
    (err) => {
      console.error('Firestore activities snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Real-time subscription to forum posts collection.
 * Reliably fires whenever any user across any device adds, deletes, or comments on a thread.
 */
export function subscribeToForumPosts(
  onUpdate: (posts: ForumPost[]) => void,
  onError?: (error: Error) => void
): () => void {
  const postsRef = collection(db, 'forum_posts');
  const currentDeviceId = getDeviceId();

  return onSnapshot(
    postsRef,
    (snapshot) => {
      const items: ForumPost[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];
        const isOwner = isPostOwnedByDevice(docSnap.id, data.creatorUid);

        items.push({
          id: docSnap.id,
          authorName: data.authorName || 'Vecino',
          authorAvatar: data.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          authorBadge: data.authorBadge || undefined,
          timeAgo: data.timeAgo || 'Recién',
          category: data.category || 'Ideas',
          content: data.content || '',
          imageUrl: data.imageUrl || undefined,
          isOwner,
          likes: Number(data.likes) || 0,
          isLiked: likedBy.includes(currentDeviceId),
          commentsCount: Number(data.commentsCount) || (Array.isArray(data.comments) ? data.comments.length : 0),
          comments: Array.isArray(data.comments) ? data.comments : [],
          tag: data.tag || undefined,
          createdAt: getTimestampForPost(data, docSnap.id),
        } as ForumPost & { createdAt: number });
      });

      // Sort with newest posts strictly at top (descending by timestamp)
      items.sort((a, b) => {
        const timeA = (a as any).createdAt || 0;
        const timeB = (b as any).createdAt || 0;
        return timeB - timeA;
      });

      // Deliver live posts to listener
      onUpdate(items);
    },
    (err) => {
      console.error('Firestore forum posts snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Create or save an activity in real-time Firestore.
 */
export async function createRealtimeActivity(activity: Activity): Promise<void> {
  const deviceId = getDeviceId();
  const docRef = doc(db, 'activities', activity.id);
  const cleanData = sanitizeForFirestore({
    ...activity,
    creatorUid: deviceId,
    attendeeUids: [deviceId],
    createdAt: Date.now(),
  });
  await setDoc(docRef, cleanData);
}

/**
 * Update attendance for an activity in real-time Firestore.
 */
export async function updateRealtimeAttendance(
  activityId: string,
  isAttending: boolean
): Promise<void> {
  const deviceId = getDeviceId();
  const docRef = doc(db, 'activities', activityId);
  
  if (isAttending) {
    await updateDoc(docRef, {
      attendeesCount: increment(1),
      attendeeUids: arrayUnion(deviceId),
    });
  } else {
    await updateDoc(docRef, {
      attendeesCount: increment(-1),
      attendeeUids: arrayRemove(deviceId),
    });
  }
}

/**
 * Create a new forum post in real-time Firestore.
 * Strips all undefined fields to guarantee successful Firestore delivery.
 */
export async function createRealtimeForumPost(
  post: ForumPost
): Promise<void> {
  const deviceId = getDeviceId();
  const docRef = doc(db, 'forum_posts', post.id);

  // Track ownership on this device
  trackCreatedPost(post.id);

  const cleanData = sanitizeForFirestore({
    ...post,
    creatorUid: deviceId,
    likedBy: [deviceId],
    likes: Number(post.likes) || 1,
    commentsCount: 0,
    comments: [],
    createdAt: Date.now(),
  });

  await setDoc(docRef, cleanData);
}

/**
 * Delete a forum post from real-time Firestore (by author).
 */
export async function deleteRealtimeForumPost(postId: string): Promise<void> {
  untrackCreatedPost(postId);
  const docRef = doc(db, 'forum_posts', postId);
  await deleteDoc(docRef);
}

/**
 * Toggle like on a forum post in real-time Firestore.
 */
export async function toggleRealtimePostLike(
  postId: string,
  currentlyLiked: boolean
): Promise<void> {
  const deviceId = getDeviceId();
  const docRef = doc(db, 'forum_posts', postId);
  
  if (currentlyLiked) {
    await updateDoc(docRef, {
      likes: increment(-1),
      likedBy: arrayRemove(deviceId),
    });
  } else {
    await updateDoc(docRef, {
      likes: increment(1),
      likedBy: arrayUnion(deviceId),
    });
  }
}

/**
 * Add a comment/reply to a forum post thread in real-time Firestore.
 * Strips undefined properties (e.g. replyToAuthor) before arrayUnion.
 */
export async function addRealtimeComment(
  postId: string,
  comment: ForumComment
): Promise<void> {
  const docRef = doc(db, 'forum_posts', postId);
  const cleanComment = sanitizeForFirestore(comment);
  
  await updateDoc(docRef, {
    comments: arrayUnion(cleanComment),
    commentsCount: increment(1),
  });
}

/**
 * Toggle like on a comment in a forum thread.
 */
export async function toggleRealtimeCommentLike(
  postId: string,
  commentId: string
): Promise<void> {
  const docRef = doc(db, 'forum_posts', postId);
  
  const postSnap = await getDoc(docRef);
  if (!postSnap.exists()) return;

  const data = postSnap.data();
  const comments: ForumComment[] = Array.isArray(data.comments) ? [...data.comments] : [];
  
  const updatedComments = comments.map((c) => {
    if (c.id === commentId) {
      const isLiked = !c.isLiked;
      return {
        ...c,
        isLiked,
        likes: isLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
      };
    }
    return c;
  });

  const cleanComments = updatedComments.map(c => sanitizeForFirestore(c));

  await updateDoc(docRef, {
    comments: cleanComments,
  });
}

/**
 * Real-time subscription to shared park boundaries in Firestore.
 * Ensures all users across all devices always view the exact same synchronized park limits.
 */
export function subscribeToParkBoundaries(
  onUpdate: (coords: [number, number][]) => void,
  onError?: (error: Error) => void
): () => void {
  const boundariesDocRef = doc(db, 'park_settings', 'boundaries');

  return onSnapshot(
    boundariesDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.polygonCoords) && data.polygonCoords.length >= 3) {
          const parsedCoords: [number, number][] = data.polygonCoords
            .map((point: any) => {
              if (Array.isArray(point)) {
                return [Number(point[0]), Number(point[1])] as [number, number];
              }
              if (point && typeof point === 'object' && 'lat' in point && 'lng' in point) {
                return [Number(point.lat), Number(point.lng)] as [number, number];
              }
              return [0, 0] as [number, number];
            })
            .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0);

          if (parsedCoords.length >= 3) {
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('parques_vivos_custom_polygon_v4', JSON.stringify(parsedCoords));
            }
            onUpdate(parsedCoords);
          }
        }
      }
    },
    (err) => {
      console.error('Firestore park boundaries snapshot error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save updated park perimeter boundaries to Firestore so all users see the update in real-time.
 */
export async function saveRealtimeParkBoundaries(
  coords: [number, number][]
): Promise<void> {
  const deviceId = getDeviceId();
  const boundariesDocRef = doc(db, 'park_settings', 'boundaries');
  const serialized = coords.map(([lat, lng]) => ({
    lat: Number(lat),
    lng: Number(lng),
  }));

  await setDoc(boundariesDocRef, {
    polygonCoords: serialized,
    updatedAt: Date.now(),
    updatedBy: deviceId,
  });

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('parques_vivos_custom_polygon_v4', JSON.stringify(coords));
  }
}

/**
 * Reset park perimeter boundaries back to official default in Firestore for all users.
 */
export async function resetRealtimeParkBoundaries(): Promise<void> {
  const deviceId = getDeviceId();
  const boundariesDocRef = doc(db, 'park_settings', 'boundaries');
  const serialized = PARQUE_ALMAGRO_BOUNDS_POLYGON.map(([lat, lng]) => ({
    lat: Number(lat),
    lng: Number(lng),
  }));

  await setDoc(boundariesDocRef, {
    polygonCoords: serialized,
    updatedAt: Date.now(),
    updatedBy: deviceId,
  });

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('parques_vivos_custom_polygon_v4');
  }
}
