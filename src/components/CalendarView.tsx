import React, { useState, useMemo } from 'react';
import { Activity } from '../types';
import { CATEGORY_CONFIG } from '../data/mockData';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Users, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Compass, 
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';

interface CalendarViewProps {
  activities: Activity[];
  onToggleAttendance: (activityId: string) => void;
  onSelectActivity: (activity: Activity) => void;
  onGoToMap: () => void;
  isCalendarConnected: boolean;
  calendarUserEmail?: string | null;
  onConnectCalendar: () => void;
  syncedCalendarEvents: Record<string, string>;
  onManualSyncCalendar?: (activity: Activity) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  activities,
  onToggleAttendance,
  onSelectActivity,
  onGoToMap,
  isCalendarConnected,
  calendarUserEmail,
  onConnectCalendar,
  syncedCalendarEvents,
  onManualSyncCalendar,
}) => {
  // Calendar month navigation
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());
  const [filterMode, setFilterMode] = useState<'all' | 'selectedDay'>('all');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // All activities user is attending
  const attendingActivities = useMemo(() => {
    return activities.filter((act) => act.isAttending);
  }, [activities]);

  // Helper to parse activity date
  const parseActivityDate = (rawDate?: string): Date | null => {
    if (!rawDate) return null;
    const parsed = new Date(rawDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Map of days in current month to activities
  const monthActivitiesByDay = useMemo(() => {
    const map: Record<number, Activity[]> = {};
    attendingActivities.forEach((act) => {
      const d = parseActivityDate(act.rawDate);
      if (d && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const dayNum = d.getDate();
        if (!map[dayNum]) map[dayNum] = [];
        map[dayNum].push(act);
      }
    });
    return map;
  }, [attendingActivities, currentYear, currentMonth]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDay(now.getDate());
  };

  // Generate calendar days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Filter displayed activities
  const displayedActivities = useMemo(() => {
    if (filterMode === 'selectedDay' && selectedDay !== null) {
      return attendingActivities.filter((act) => {
        const d = parseActivityDate(act.rawDate);
        return d && d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === selectedDay;
      });
    }
    // Sort all attending activities by date
    return [...attendingActivities].sort((a, b) => {
      const dateA = parseActivityDate(a.rawDate)?.getTime() || 0;
      const dateB = parseActivityDate(b.rawDate)?.getTime() || 0;
      return dateA - dateB;
    });
  }, [attendingActivities, filterMode, selectedDay, currentYear, currentMonth]);

  return (
    <div className="flex-1 w-full bg-stone-100 flex flex-col pb-24 overflow-y-auto">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <CalendarDays className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">
                Mi Agenda Comunitaria
              </h2>
              <p className="text-xs text-emerald-200">
                Actividades en Parque Almagro a las que te has inscrito
              </p>
            </div>
          </div>

          <div className="bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/40 text-xs font-black text-emerald-200">
            {attendingActivities.length} {attendingActivities.length === 1 ? 'actividad' : 'actividades'}
          </div>
        </div>

        {/* Google Calendar Link Bar */}
        <div className="mt-2 pt-2.5 border-t border-emerald-700/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span className="text-[11px] font-medium text-emerald-100 truncate">
              {isCalendarConnected
                ? `Sincronizado con Google Calendar (${calendarUserEmail || 'Activo'})`
                : '¿Quieres sincronizar tu agenda con Google Calendar?'}
            </span>
          </div>

          {isCalendarConnected ? (
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-emerald-200 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md shrink-0 transition-colors"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <button
              onClick={onConnectCalendar}
              className="text-[11px] font-extrabold text-stone-900 bg-amber-400 hover:bg-amber-300 px-2.5 py-1 rounded-lg shrink-0 transition-transform active:scale-95 shadow-sm"
            >
              Vincular
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Interactive Calendar Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-base text-stone-900">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={handleToday}
                className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md"
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                aria-label="Mes anterior"
                className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 active:scale-95 transition-colors border border-stone-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Mes siguiente"
                className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 active:scale-95 transition-colors border border-stone-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Week Days Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekDayNames.map((d) => (
              <span key={d} className="text-[11px] font-bold text-stone-400 uppercase py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots for previous month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9 w-full rounded-lg" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasActivities = Boolean(monthActivitiesByDay[day]?.length);
              const isSelected = selectedDay === day;
              const isToday = 
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth &&
                new Date().getFullYear() === currentYear;

              return (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDay(day);
                    setFilterMode('selectedDay');
                  }}
                  className={`relative h-10 w-full rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-400'
                      : isToday
                      ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-500'
                      : hasActivities
                      ? 'bg-orange-50/80 text-orange-900 border border-orange-200 hover:bg-orange-100'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{day}</span>
                  {hasActivities && (
                    <div className="flex gap-0.5 mt-0.5">
                      {monthActivitiesByDay[day].slice(0, 3).map((act, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-amber-300' : 'bg-orange-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter toggle bar */}
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500 font-medium">
              {filterMode === 'selectedDay' && selectedDay !== null
                ? `Viendo: ${selectedDay} de ${monthNames[currentMonth]}`
                : `Viendo: Todas mis inscripciones (${attendingActivities.length})`}
            </span>

            {filterMode === 'selectedDay' && (
              <button
                onClick={() => setFilterMode('all')}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline"
              >
                Ver todas las fechas
              </button>
            )}
          </div>
        </div>

        {/* Activities Section Heading */}
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>
              {filterMode === 'selectedDay' && selectedDay !== null
                ? `Actividades del ${selectedDay} de ${monthNames[currentMonth]}`
                : 'Tus Próximos Encuentros'}
            </span>
          </h3>

          <span className="text-xs font-bold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full">
            {displayedActivities.length}
          </span>
        </div>

        {/* Empty state when no activities for selected filter or total */}
        {displayedActivities.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-xs border border-stone-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <Compass className="w-6 h-6 text-emerald-600" />
            </div>

            <div>
              <h4 className="font-extrabold text-stone-900 text-sm">
                {filterMode === 'selectedDay'
                  ? `No tienes actividades agendadas para el ${selectedDay} de ${monthNames[currentMonth]}`
                  : 'Aún no te has inscrito a ninguna actividad'}
              </h4>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                {filterMode === 'selectedDay'
                  ? 'Revisa otros días en el calendario o explora todas tus inscripciones.'
                  : 'Únete a clases de yoga, caminatas con mascotas o talleres para coordinarte con vecinos del Parque Almagro.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              {filterMode === 'selectedDay' && (
                <button
                  onClick={() => setFilterMode('all')}
                  className="px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold"
                >
                  Ver todas mis fechas
                </button>
              )}
              <button
                onClick={onGoToMap}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-600/20 active:scale-95 transition-all"
              >
                Explorar Actividades en el Mapa
              </button>
            </div>
          </div>
        ) : (
          /* List of Inscribed Activity Cards */
          <div className="space-y-3">
            {displayedActivities.map((activity) => {
              const catConf = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.deporte;
              const isSynced = Boolean(syncedCalendarEvents[activity.id]);

              return (
                <div
                  key={activity.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/90 hover:border-emerald-400 transition-all flex flex-col gap-3"
                >
                  {/* Top Bar: Category & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${catConf.bgBadge} ${catConf.textBadge}`}>
                      {catConf.label}
                    </span>

                    <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>{activity.date}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 
                      onClick={() => onSelectActivity(activity)}
                      className="font-black text-stone-900 text-base hover:text-emerald-700 cursor-pointer transition-colors leading-snug"
                    >
                      {activity.title}
                    </h4>
                    <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                      {activity.description}
                    </p>
                  </div>

                  {/* Location & Creator Meta */}
                  <div className="space-y-1 text-xs text-stone-500 pt-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span className="text-stone-700 truncate">{activity.locationName}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-stone-700">{activity.attendeesCount} vecinos participando</span>
                      </div>
                      <span className="text-stone-400">Organiza: {activity.creatorName}</span>
                    </div>
                  </div>

                  {/* Google Calendar Sync Tag */}
                  <div className="bg-stone-50 rounded-xl p-2 flex items-center justify-between border border-stone-100 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      {isSynced ? (
                        <span className="font-bold text-emerald-800">
                          Sincronizado en tu Google Calendar
                        </span>
                      ) : isCalendarConnected ? (
                        <span className="text-stone-500 font-medium">
                          No sincronizado aún
                        </span>
                      ) : (
                        <span className="text-stone-500">
                          Vincula Google Calendar para agendarla
                        </span>
                      )}
                    </div>

                    {!isSynced && isCalendarConnected && onManualSyncCalendar && (
                      <button
                        onClick={() => onManualSyncCalendar(activity)}
                        className="text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md shadow-xs active:scale-95"
                      >
                        Agendar
                      </button>
                    )}
                  </div>

                  {/* Actions Bar: Ver en mapa & Eliminar Asistencia */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectActivity(activity)}
                      className="text-xs font-bold text-stone-700 hover:text-emerald-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-stone-50 border border-stone-200 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      <span>Ver detalles y mapa</span>
                    </button>

                    {/* Eliminar Asistencia Button */}
                    <button
                      onClick={() => onToggleAttendance(activity.id)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95"
                      title="Eliminar tu asistencia a esta actividad"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Eliminar asistencia</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
