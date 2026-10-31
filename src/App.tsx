/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Activity, Attendee, SchematicZoneId, TimeFilter } from './types';
import {
  V2_INITIAL_ACTIVITIES,
  endsBefore1930,
  formatNeighborShortName,
  normalizeActivityToV2,
} from './data/mockData';
import {
  createRealtimeActivity,
  getDeviceId,
  getSavedNeighborName,
  saveNeighborName,
  seedInitialDataIfEmpty,
  subscribeToActivities,
  updateRealtimeAttendance,
} from './services/realtimeService';
import { ParqueAlmagroMap } from './components/ParqueAlmagroMap';
import { ActivityDetailView } from './components/ActivityDetailView';
import { PublishActivityView } from './components/PublishActivityView';
import { BottomNav, MainTab } from './components/BottomNav';

const STORAGE_KEY_V2 = 'parques_vivos_almagro_v2_activities';

const FILTER_OPTIONS: Array<{ id: TimeFilter; label: string }> = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'manana', label: 'Mañana' },
  { id: 'semana', label: 'Toda la semana' },
  { id: 'antes-1930', label: 'Termina antes de las 19:30' },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<MainTab>('mapa');
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('hoy');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [preselectedZoneId, setPreselectedZoneId] = useState<SchematicZoneId | undefined>(undefined);

  // Accessibility toggle for older neighbors (60+)
  const [isLargeFont, setIsLargeFont] = useState<boolean>(() => {
    return localStorage.getItem('parques_vivos_large_font') === 'true';
  });

  // Neighbor short display name ("Nombre A.")
  const [neighborName, setNeighborName] = useState<string>(() => {
    return getSavedNeighborName();
  });

  // Activities state (localStorage fast initial load + Firestore live sync)
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_V2);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const deviceId = getDeviceId();
          return parsed.map((item) => normalizeActivityToV2(item, deviceId));
        }
      } catch {}
    }
    return V2_INITIAL_ACTIVITIES;
  });

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('parques_vivos_large_font', String(isLargeFont));
  }, [isLargeFont]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(activities));
  }, [activities]);

  // Seed & subscribe to Firestore real-time updates
  useEffect(() => {
    seedInitialDataIfEmpty();
    const unsubscribe = subscribeToActivities((liveActivities) => {
      setActivities(liveActivities);
    });
    return () => unsubscribe();
  }, []);

  // Derive filtered activities during render (no redundant effect)
  const filteredActivities = activities.filter((act) => {
    if (activeFilter === 'hoy') return (act.dayLabel || 'Hoy') === 'Hoy';
    if (activeFilter === 'manana') return act.dayLabel === 'Mañana';
    if (activeFilter === 'antes-1930') return endsBefore1930(act.endTime, act.startTime);
    return true; // 'semana'
  });

  const selectedActivity = selectedActivityId
    ? activities.find((a) => a.id === selectedActivityId) || null
    : null;

  const effectiveHighlightedActivity =
    filteredActivities.find((a) => a.id === highlightedId) ||
    filteredActivities[0] ||
    null;

  // Keep document title synchronized with current SPA view
  useEffect(() => {
    if (selectedActivity) {
      document.title = `${selectedActivity.title} | Parque Almagro`;
    } else if (currentTab === 'publicar') {
      document.title = 'Publicar actividad | Parque Almagro';
    } else {
      document.title = 'Parque Almagro | Actividades de los vecinos';
    }
  }, [currentTab, selectedActivity]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  const handleSaveNeighborName = (rawName: string) => {
    const clean = saveNeighborName(rawName);
    setNeighborName(clean);
  };

  const handleSelectTab = (tab: MainTab) => {
    setSelectedActivityId(null);
    setCurrentTab(tab);
  };

  const handleOpenActivityDetail = (activity: Activity) => {
    setHighlightedId(activity.id);
    setSelectedActivityId(activity.id);
    setCurrentTab('mapa');
  };

  const handleToggleAttendance = async (activityId: string, chosenName: string) => {
    const target = activities.find((a) => a.id === activityId);
    if (!target) return;

    const deviceId = getDeviceId();
    const nextAttending = !target.isAttending;
    const shortName = formatNeighborShortName(chosenName || neighborName || 'Vecino A.');

    // Optimistic UI update
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id !== activityId) return act;
        const currentList: Attendee[] = act.attendees ? [...act.attendees] : [];
        let nextList: Attendee[];
        if (nextAttending) {
          nextList = [
            ...currentList.filter((p) => p.uid !== deviceId),
            { uid: deviceId, name: shortName, role: 'Vecino', verified: true },
          ];
        } else {
          nextList = currentList.filter((p) => p.uid !== deviceId);
        }
        return {
          ...act,
          isAttending: nextAttending,
          attendees: nextList,
          attendeesCount: nextList.length,
        };
      })
    );

    showToast(
      nextAttending
        ? 'Listo, quedaste inscrito en la actividad.'
        : 'Inscripción cancelada.'
    );

    try {
      await updateRealtimeAttendance(activityId, nextAttending, shortName);
    } catch (err) {
      console.error('Error syncing attendance:', err);
    }
  };

  const handlePublishActivity = async (newActData: Omit<Activity, 'id'>) => {
    const deviceId = getDeviceId();
    const newId = `act-${Date.now()}`;
    const creatorShort = formatNeighborShortName(newActData.creatorName);

    const newActivity: Activity = {
      ...newActData,
      id: newId,
      creatorName: creatorShort,
      attendees: [
        {
          uid: deviceId,
          name: creatorShort,
          role: 'Organizador',
          verified: true,
        },
      ],
      attendeesCount: 1,
      isAttending: true,
    };

    setActivities((prev) => [...prev, newActivity]);
    setHighlightedId(newId);
    setSelectedActivityId(null);

    // Switch filter so user immediately sees their published activity on the map
    if (newActivity.dayLabel === 'Hoy') {
      setActiveFilter('hoy');
    } else if (newActivity.dayLabel === 'Mañana') {
      setActiveFilter('manana');
    } else {
      setActiveFilter('semana');
    }

    setCurrentTab('mapa');
    showToast('Actividad publicada. Ya aparece en el mapa.');

    try {
      await createRealtimeActivity(newActivity);
    } catch (err) {
      console.error('Error saving activity to Firestore:', err);
    }
  };

  return (
    <div className={`min-h-dvh bg-[#eef1ec] flex justify-center ${isLargeFont ? 'large-font' : ''}`}>
      <a
        href="#main-content"
        className="visually-hidden focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[#1f6a42] focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:font-bold"
      >
        Saltar al contenido principal
      </a>

      <div className="w-full max-w-[460px] bg-[#fafcfa] min-h-dvh sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:shadow-lg sm:border sm:border-[#d6e0d3] flex flex-col overflow-hidden">
        {/* Clean Parque Almagro Header */}
        <header className="px-4 pt-4 pb-3 bg-[#fafcfa] flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-[#16241b] tracking-tight leading-tight">
              Parque Almagro
            </h1>
            <p className="text-xs font-medium text-[#596c5f] mt-0.5">
              Actividades de los vecinos
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsLargeFont((v) => !v)}
              aria-pressed={isLargeFont}
              aria-label="Aumentar tamaño de letra"
              className={`min-h-[32px] px-2.5 py-1 rounded-full text-xs font-extrabold border transition-colors cursor-pointer ${
                isLargeFont
                  ? 'bg-[#1f6a42] text-white border-[#1f6a42]'
                  : 'bg-white text-[#2b3f31] border-[#d3ddd1] hover:bg-[#eef4ef]'
              }`}
            >
              A+
            </button>

            <span className="px-2.5 py-1 rounded-full bg-[#e4f2e8] text-[#1f6a42] text-[11px] font-extrabold tracking-wide uppercase">
              En vivo
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 pb-5 overflow-y-auto">
          {selectedActivity && currentTab === 'mapa' ? (
            <ActivityDetailView
              activity={selectedActivity}
              currentNeighborName={neighborName}
              onSaveNeighborName={handleSaveNeighborName}
              onBack={() => setSelectedActivityId(null)}
              onToggleAttendance={handleToggleAttendance}
            />
          ) : currentTab === 'publicar' ? (
            <PublishActivityView
              defaultOrganizerName={neighborName}
              initialZoneId={preselectedZoneId}
              onSaveOrganizerName={handleSaveNeighborName}
              onPublishActivity={handlePublishActivity}
            />
          ) : (
            <div className="space-y-3.5">
              {/* Time & twilight filter pills */}
              <search aria-label="Filtrar actividades del Parque Almagro">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 touch-pan-x">
                  {FILTER_OPTIONS.map((opt) => {
                    const isActive = activeFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setActiveFilter(opt.id)}
                        className={`shrink-0 min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#1f6a42] text-white border-[#1f6a42]'
                            : 'bg-white text-[#25372b] border-[#d7e0d5] hover:bg-[#f1f5f0]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </search>

              {/* Local interactive map exclusively of Parque Almagro */}
              <ParqueAlmagroMap
                activities={filteredActivities}
                highlightedId={effectiveHighlightedActivity?.id || null}
                onHighlight={setHighlightedId}
                onSelectActivity={handleOpenActivityDetail}
                onQuickPublishAtZone={(zoneId) => {
                  setPreselectedZoneId(zoneId);
                  setSelectedActivityId(null);
                  setCurrentTab('publicar');
                }}
              />

              {/* Highlighted preview card right below the schematic map (1-tap open) */}
              {effectiveHighlightedActivity ? (
                <button
                  type="button"
                  onClick={() => handleOpenActivityDetail(effectiveHighlightedActivity)}
                  className="w-full text-left bg-white hover:bg-[#f5f8f4] p-3.5 rounded-2xl border border-[#dfe6dd] flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-[#16241b] truncate">
                      {effectiveHighlightedActivity.title}
                    </p>
                    <p className="text-xs text-[#596c5f] mt-0.5 truncate">
                      {effectiveHighlightedActivity.locationName} ·{' '}
                      {effectiveHighlightedActivity.attendeesCount} de{' '}
                      {effectiveHighlightedActivity.suggestedCapacity || 12} cupos sugeridos
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="schedule-time text-sm font-bold text-[#334739]">
                      {effectiveHighlightedActivity.startTime}–{effectiveHighlightedActivity.endTime}
                    </p>
                    <span className="inline-block text-xs font-extrabold text-[#1f6a42] mt-0.5">
                      Ver detalle
                    </span>
                  </div>
                </button>
              ) : null}

              {/* Activities list (1 single tap opens detail directly) */}
              <section className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-extrabold uppercase tracking-wider text-[#596c5f]">
                    {filteredActivities.length}{' '}
                    {filteredActivities.length === 1 ? 'actividad' : 'actividades'}
                  </h2>
                </div>

                {filteredActivities.length > 0 ? (
                  <ul role="list" className="space-y-2 list-none p-0 m-0">
                    {filteredActivities.map((act) => {
                      const isHighlighted = effectiveHighlightedActivity?.id === act.id;
                      return (
                        <li key={act.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setHighlightedId(act.id)}
                            onClick={() => handleOpenActivityDetail(act)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                              isHighlighted
                                ? 'bg-white border-[#8d5c38] ring-1 ring-[#8d5c38]/20'
                                : 'bg-white border-[#dfe6dd] hover:border-[#b7c8b4]'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-extrabold text-[#16241b] truncate">
                                {act.title}
                              </p>
                              <p className="schedule-time text-xs font-medium text-[#526558] mt-0.5 truncate">
                                {act.dayLabel || 'Hoy'} · {act.startTime}–{act.endTime} ·{' '}
                                {act.locationName}
                              </p>
                            </div>

                            {act.isAttending ? (
                              <span className="px-2.5 py-1 rounded-full bg-[#e4f2e8] text-[#1f6a42] text-[11px] font-extrabold shrink-0">
                                ✓ Inscrito
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="bg-white p-4 rounded-2xl border border-[#dfe6dd] text-center space-y-2">
                    <p className="text-sm text-[#495c4f]">
                      Aún no hay actividades convocadas para este filtro.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('publicar')}
                      className="text-sm font-extrabold text-[#1f6a42] underline cursor-pointer py-1 px-2"
                    >
                      Publicar la primera actividad
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Polite toast banner inside main frame (matches Screen 6 of prototype) */}
          <div role="status" aria-live="polite" className="mt-3">
            {statusMessage ? (
              <div className="px-4 py-3 rounded-xl bg-[#193826] text-white text-xs font-bold shadow-md">
                {statusMessage}
              </div>
            ) : null}
          </div>
        </main>

        {/* Minimalist 2-tab Bottom Navigation: Mapa | Publicar */}
        <BottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />
      </div>
    </div>
  );
}
