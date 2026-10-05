import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
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
import { INITIAL_ACTIVITIES, INITIAL_POSTS } from '../data/mockData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Local device / user identifier for cross-device sync
export function getDeviceId(): string {
  let id = localStorage.getItem('parques_vivos_device_id');
  if (!id) {
    id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('parques_vivos_device_id', id);
  }
  return id;
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
        batch.set(actDoc, {
          ...act,
          createdAt: Date.now(),
        });
      }
      await batch.commit();
      console.log('Initial activities seeded successfully');
    }

    const postsRef = collection(db, 'forum_posts');
    const postSnap = await getDocs(postsRef);
    if (postSnap.empty) {
      console.log('Seeding initial forum posts to Firestore...');
      const batch = writeBatch(db);
      for (const post of INITIAL_POSTS) {
        const postDoc = doc(db, 'forum_posts', post.id);
        batch.set(postDoc, {
          ...post,
          createdAt: Date.now(),
        });
      }
      await batch.commit();
      console.log('Initial forum posts seeded successfully');
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
  
  return onSnapshot(
    activitiesRef,
    (snapshot) => {
      const items: Activity[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
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
 */
export function subscribeToForumPosts(
  onUpdate: (posts: ForumPost[]) => void,
  onError?: (error: Error) => void
): () => void {
  const postsRef = collection(db, 'forum_posts');

  return onSnapshot(
    postsRef,
    (snapshot) => {
      const items: ForumPost[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          authorName: data.authorName || 'Vecino',
          authorAvatar: data.authorAvatar || '',
          authorBadge: data.authorBadge,
          timeAgo: data.timeAgo || 'Recién',
          category: data.category || 'Ideas',
          content: data.content || '',
          imageUrl: data.imageUrl,
          isOwner: data.creatorUid === getDeviceId(),
          likes: Number(data.likes) || 0,
          isLiked: Array.isArray(data.likedBy) && data.likedBy.includes(getDeviceId()),
          commentsCount: Number(data.commentsCount) || (Array.isArray(data.comments) ? data.comments.length : 0),
          comments: Array.isArray(data.comments) ? data.comments : [],
          tag: data.tag,
        });
      });

      // Sort by creation time or ID
      items.sort((a, b) => b.id.localeCompare(a.id));

      if (items.length > 0) {
        onUpdate(items);
      }
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
  await setDoc(docRef, {
    ...activity,
    creatorUid: deviceId,
    attendeeUids: [deviceId],
    createdAt: Date.now(),
  });
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
 */
export async function createRealtimeForumPost(
  post: ForumPost
): Promise<void> {
  const deviceId = getDeviceId();
  const docRef = doc(db, 'forum_posts', post.id);
  
  await setDoc(docRef, {
    ...post,
    creatorUid: deviceId,
    likedBy: [deviceId],
    createdAt: Date.now(),
  });
}

/**
 * Delete a forum post from real-time Firestore (by author).
 */
export async function deleteRealtimeForumPost(postId: string): Promise<void> {
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
 */
export async function addRealtimeComment(
  postId: string,
  comment: ForumComment
): Promise<void> {
  const docRef = doc(db, 'forum_posts', postId);
  
  await updateDoc(docRef, {
    comments: arrayUnion(comment),
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
  const deviceId = getDeviceId();
  const docRef = doc(db, 'forum_posts', postId);
  
  // Read current comments to update specific comment like
  const postSnap = await getDocs(collection(db, 'forum_posts'));
  const postDoc = postSnap.docs.find((d) => d.id === postId);
  if (!postDoc) return;

  const data = postDoc.data();
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

  await updateDoc(docRef, {
    comments: updatedComments,
  });
}
