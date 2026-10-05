/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { MapView } from './components/MapView';
import { ForumView } from './components/ForumView';
import { CommunityView } from './components/CommunityView';
import { CalendarView } from './components/CalendarView';
import { ProfileView } from './components/ProfileView';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import { CreateActivityModal } from './components/CreateActivityModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Activity, ForumPost, UserProfile } from './types';
import { 
  INITIAL_ACTIVITIES, 
  INITIAL_POSTS, 
  INITIAL_USER 
} from './data/mockData';
import { 
  initCalendarAuth, 
  signInWithGoogleCalendar, 
  logoutCalendar, 
  createCalendarEvent, 
  deleteCalendarEvent 
} from './services/calendarService';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('mapa');

  // Accessibility State (Large font mode for elderly neighbors)
  const [isLargeFont, setIsLargeFont] = useState<boolean>(() => {
    return localStorage.getItem('parques_vivos_large_font') === 'true';
  });

  // Onboarding Tutorial State (Shows on first visit)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return localStorage.getItem('parques_vivos_tutorial_seen') !== 'true';
  });

  // Data State: Verified real OpenStreetMap coordinates for Parque Almagro
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('parques_vivos_activities_v5');
    if (saved) {
      try {
        const parsed: Activity[] = JSON.parse(saved);
        // Strictly verify that coordinates are inside the actual Parque Almagro green area (-33.4510 to -33.4532)
        const isAccurate = parsed.every((a) => a.lat <= -33.4510 && a.lat >= -33.4532);
        if (isAccurate && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    // Purge outdated cached versions
    localStorage.removeItem('parques_vivos_activities');
    localStorage.removeItem('parques_vivos_activities_v2');
    localStorage.removeItem('parques_vivos_activities_v3');
    localStorage.removeItem('parques_vivos_activities_v4');
    localStorage.setItem('parques_vivos_activities_v5', JSON.stringify(INITIAL_ACTIVITIES));
    return INITIAL_ACTIVITIES;
  });

  const [posts, setPosts] = useState<ForumPost[]>(() => {
    const saved = localStorage.getItem('parques_vivos_posts');
    if (saved) {
      try {
        const parsed: ForumPost[] = JSON.parse(saved);
        return parsed.map((p) => {
          if (!p.comments || p.comments.length === 0) {
            const initial = INITIAL_POSTS.find((ip) => ip.id === p.id);
            return {
              ...p,
              comments: initial?.comments || p.comments || [],
              commentsCount: (initial?.comments || p.comments || []).length,
            };
          }
          return p;
        });
      } catch {
        return INITIAL_POSTS;
      }
    }
    return INITIAL_POSTS;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('parques_vivos_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  // Modal States
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialLocation, setCreateModalInitialLocation] = useState<{
    lat: number;
    lng: number;
    locationName: string;
  } | null>(null);

  const handleOpenCreateModal = (
    initialCoords?: { lat: number; lng: number; locationName: string } | null
  ) => {
    setCreateModalInitialLocation(initialCoords || null);
    setIsCreateModalOpen(true);
  };

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Google Calendar Integration State
  const [calendarUser, setCalendarUser] = useState<any>(null);
  const [isCalendarConnected, setIsCalendarConnected] = useState<boolean>(false);
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [syncedCalendarEvents, setSyncedCalendarEvents] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('parques_vivos_calendar_synced');
    return saved ? JSON.parse(saved) : {};
  });

  // Persist synced calendar event mapping
  useEffect(() => {
    localStorage.setItem('parques_vivos_calendar_synced', JSON.stringify(syncedCalendarEvents));
  }, [syncedCalendarEvents]);

  // Initialize Firebase Auth listener for Google Calendar
  useEffect(() => {
    const unsubscribe = initCalendarAuth(
      (authUser, token) => {
        setCalendarUser(authUser);
        setCalendarToken(token);
        setIsCalendarConnected(true);
      },
      () => {
        setCalendarUser(null);
        setCalendarToken(null);
        setIsCalendarConnected(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Connect to Google Calendar via OAuth popup
  const handleConnectCalendar = async () => {
    try {
      showToast('Conectando con Google Calendar...');
      const res = await signInWithGoogleCalendar();
      if (res) {
        setCalendarUser(res.user);
        setCalendarToken(res.accessToken);
        setIsCalendarConnected(true);
        showToast(`¡Google Calendar vinculado! (${res.user.email || 'tu cuenta'})`);
      }
    } catch (err: any) {
      console.error('Error al conectar Google Calendar:', err);
      showToast('No se pudo completar la vinculación con Google Calendar.');
    }
  };

  // Disconnect Google Calendar
  const handleDisconnectCalendar = async () => {
    const confirmed = window.confirm('¿Deseas desvincular tu cuenta de Google Calendar de Parques Vivos?');
    if (!confirmed) return;
    await logoutCalendar();
    setCalendarUser(null);
    setCalendarToken(null);
    setIsCalendarConnected(false);
    showToast('Cuenta de Google Calendar desvinculada.');
  };

  // Manual sync for a specific activity
  const handleManualSyncCalendar = async (activity: Activity) => {
    if (!isCalendarConnected) {
      handleConnectCalendar();
      return;
    }
    showToast('Agendando actividad en Google Calendar...');
    const syncRes = await createCalendarEvent(activity, calendarToken || undefined);
    if (syncRes.success && syncRes.eventId) {
      setSyncedCalendarEvents((prev) => ({
        ...prev,
        [activity.id]: syncRes.eventId!,
      }));
      showToast('📅 ¡Agregado a tu Google Calendar con éxito!');
    } else {
      showToast(syncRes.error || 'No se pudo agendar en Google Calendar.');
    }
  };

  // Sync font size class to document root
  useEffect(() => {
    if (isLargeFont) {
      document.documentElement.classList.add('large-font');
    } else {
      document.documentElement.classList.remove('large-font');
    }
    localStorage.setItem('parques_vivos_large_font', String(isLargeFont));
  }, [isLargeFont]);

  // Persist activities
  useEffect(() => {
    localStorage.setItem('parques_vivos_activities_v5', JSON.stringify(activities));
  }, [activities]);

  // Persist posts
  useEffect(() => {
    localStorage.setItem('parques_vivos_posts', JSON.stringify(posts));
  }, [posts]);

  // Persist user
  useEffect(() => {
    localStorage.setItem('parques_vivos_user', JSON.stringify(user));
  }, [user]);

  const handleCloseTutorial = () => {
    setIsOnboardingOpen(false);
    localStorage.setItem('parques_vivos_tutorial_seen', 'true');
  };

  // Toggle Attendance with Automatic Google Calendar Sync!
  const handleToggleAttendance = async (activityId: string) => {
    const act = activities.find((a) => a.id === activityId);
    if (!act) return;

    const newAttending = !act.isAttending;
    const newCount = newAttending ? act.attendeesCount + 1 : Math.max(1, act.attendeesCount - 1);

    // Update user attended stat
    setUser((u) => ({
      ...u,
      activitiesAttended: newAttending
        ? u.activitiesAttended + 1
        : Math.max(0, u.activitiesAttended - 1),
    }));

    const updated = {
      ...act,
      isAttending: newAttending,
      attendeesCount: newCount,
    };

    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? updated : a))
    );

    if (selectedActivity?.id === activityId) {
      setSelectedActivity(updated);
    }

    if (newAttending) {
      // Automatic Google Calendar Sync on Attendance Confirmation
      if (isCalendarConnected) {
        showToast('¡Asistencia confirmada! Agendando en tu Google Calendar...');
        const syncRes = await createCalendarEvent(updated, calendarToken || undefined);
        if (syncRes.success && syncRes.eventId) {
          setSyncedCalendarEvents((prev) => ({
            ...prev,
            [activityId]: syncRes.eventId!,
          }));
          showToast('📅 ¡Asistencia confirmada y agregada automáticamente a tu Google Calendar!');
        } else {
          showToast('¡Asistencia confirmada! Tu presencia cuida el parque.');
        }
      } else {
        showToast('¡Asistencia confirmada! Puedes vincular Google Calendar arriba para agendarla.');
      }
    } else {
      // Cancelled attendance - remove from calendar if synced
      const existingEventId = syncedCalendarEvents[activityId];
      if (existingEventId && isCalendarConnected) {
        await deleteCalendarEvent(existingEventId, act.title, calendarToken || undefined);
        setSyncedCalendarEvents((prev) => {
          const next = { ...prev };
          delete next[activityId];
          return next;
        });
      }
      showToast('Has cancelado tu asistencia a esta actividad.');
    }
  };

  // Create New Activity with Automatic Google Calendar Sync!
  const handleCreateActivity = async (
    newActData: Omit<Activity, 'id' | 'attendeesCount' | 'isAttending' | 'status'>
  ) => {
    const newActivity: Activity = {
      ...newActData,
      id: `act-${Date.now()}`,
      attendeesCount: 1, // The creator is the first attendee
      isAttending: true,
      status: 'activa',
    };

    setActivities((prev) => [newActivity, ...prev]);
    setUser((u) => ({
      ...u,
      activitiesCreated: u.activitiesCreated + 1,
      activitiesAttended: u.activitiesAttended + 1,
    }));

    setSelectedActivity(newActivity);

    // If Google Calendar is linked, automatically add the created event to the user's calendar!
    if (isCalendarConnected) {
      showToast('Publicando y sincronizando con Google Calendar...');
      const syncRes = await createCalendarEvent(newActivity, calendarToken || undefined);
      if (syncRes.success && syncRes.eventId) {
        setSyncedCalendarEvents((prev) => ({
          ...prev,
          [newActivity.id]: syncRes.eventId!,
        }));
        showToast('🎉 ¡Actividad publicada y agregada automáticamente a tu Google Calendar!');
      } else {
        showToast('¡Actividad publicada con éxito en Parque Almagro!');
      }
    } else {
      showToast('¡Actividad publicada con éxito en Parque Almagro!');
    }
  };

  // Toggle Like on Forum Post
  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          return {
            ...post,
            isLiked,
            likes: isLiked ? post.likes + 1 : Math.max(0, post.likes - 1),
          };
        }
        return post;
      })
    );
  };

  // Add Forum Post
  const handleAddPost = (
    category: 'Ideas' | 'Reseñas' | 'Panorama',
    content: string
  ) => {
    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      authorName: user.name,
      authorAvatar: user.avatar,
      authorBadge: 'Vecino Verificado',
      timeAgo: 'Recién',
      category,
      content,
      likes: 1,
      isLiked: true,
      commentsCount: 0,
      comments: [],
      tag: '#AlmagroVivo',
    };

    setPosts((prev) => [newPost, ...prev]);
    showToast('¡Publicación compartida con los vecinos!');
  };

  // Add Comment / Thread Reply to a Post
  const handleAddComment = (
    postId: string,
    content: string,
    replyToAuthor?: string
  ) => {
    const newComment = {
      id: `c-${Date.now()}`,
      postId,
      authorName: user.name,
      authorAvatar: user.avatar,
      authorBadge: 'Vecino Verificado',
      timeAgo: 'Recién',
      content,
      likes: 0,
      isLiked: false,
      replyToAuthor,
    };

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const currentComments = post.comments || [];
          return {
            ...post,
            comments: [...currentComments, newComment],
            commentsCount: currentComments.length + 1,
          };
        }
        return post;
      })
    );

    showToast('¡Tu respuesta se publicó en el hilo!');
  };

  // Toggle Like on a Comment
  const handleToggleCommentLike = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId && post.comments) {
          return {
            ...post,
            comments: post.comments.map((c) => {
              if (c.id === commentId) {
                const isLiked = !c.isLiked;
                return {
                  ...c,
                  isLiked,
                  likes: isLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
                };
              }
              return c;
            }),
          };
        }
        return post;
      })
    );
  };

  // Update User Profile
  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
    showToast('Perfil actualizado correctamente.');
  };

  const attendingActivities = activities.filter((act) => act.isAttending);

  return (
    <div className={`min-h-screen bg-stone-100 flex flex-col font-sans transition-all duration-150 ${isLargeFont ? 'large-font' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-500/50 animate-in fade-in slide-in-from-top-4 duration-200 max-w-[90%] text-xs sm:text-sm font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header with Accessibility Toggle & Google Calendar Link */}
      <Header
        isLargeFont={isLargeFont}
        onToggleLargeFont={() => setIsLargeFont((prev) => !prev)}
        onOpenTutorial={() => setIsOnboardingOpen(true)}
        activeCount={activities.filter((a) => a.status === 'activa').length}
        isCalendarConnected={isCalendarConnected}
        calendarUserEmail={calendarUser?.email}
        onConnectCalendar={handleConnectCalendar}
        onDisconnectCalendar={handleDisconnectCalendar}
      />

      {/* Main Content View Container - Mobile First Centered Layout */}
      <main className="flex-1 w-full max-w-lg mx-auto relative flex flex-col">
        {currentTab === 'mapa' && (
          <MapView
            activities={activities}
            onSelectActivity={(act) => setSelectedActivity(act)}
            onOpenCreateModal={handleOpenCreateModal}
            selectedActivityId={selectedActivity?.id}
          />
        )}

        {currentTab === 'calendario' && (
          <CalendarView
            activities={activities}
            onToggleAttendance={handleToggleAttendance}
            onSelectActivity={(act) => setSelectedActivity(act)}
            onGoToMap={() => setCurrentTab('mapa')}
            isCalendarConnected={isCalendarConnected}
            calendarUserEmail={calendarUser?.email}
            onConnectCalendar={handleConnectCalendar}
            syncedCalendarEvents={syncedCalendarEvents}
            onManualSyncCalendar={handleManualSyncCalendar}
          />
        )}

        {currentTab === 'foro' && (
          <ForumView
            posts={posts}
            currentUser={user}
            onToggleLike={handleToggleLike}
            onAddPost={handleAddPost}
            onAddComment={handleAddComment}
            onToggleCommentLike={handleToggleCommentLike}
          />
        )}

        {currentTab === 'comunidad' && (
          <CommunityView onGoToForum={() => setCurrentTab('foro')} />
        )}

        {currentTab === 'perfil' && (
          <ProfileView
            user={user}
            onUpdateUser={handleUpdateUser}
            attendingActivities={attendingActivities}
            onSelectActivity={(act) => {
              setSelectedActivity(act);
              setCurrentTab('mapa');
            }}
            onOpenTutorial={() => setIsOnboardingOpen(true)}
            onGoToCalendar={() => setCurrentTab('calendario')}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation (5 tabs: Mapa, Calendario, Foro, Comunidad, Perfil) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        activitiesCount={activities.length}
        attendingCount={attendingActivities.length}
      />

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onToggleAttendance={handleToggleAttendance}
        isCalendarConnected={isCalendarConnected}
        calendarUserEmail={calendarUser?.email}
        isSyncedToCalendar={Boolean(selectedActivity && syncedCalendarEvents[selectedActivity.id])}
        onConnectCalendar={handleConnectCalendar}
        onManualSyncCalendar={handleManualSyncCalendar}
      />

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalInitialLocation(null);
        }}
        onCreateActivity={handleCreateActivity}
        initialLocation={createModalInitialLocation}
        isCalendarConnected={isCalendarConnected}
        onConnectCalendar={handleConnectCalendar}
        onSelectOnMapMode={() => {
          setIsCreateModalOpen(false);
          showToast('📍 Toca cualquier punto dentro del área verde del parque.');
        }}
      />

      {/* 4-Step Onboarding Tutorial Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={handleCloseTutorial}
      />
    </div>
  );
}
