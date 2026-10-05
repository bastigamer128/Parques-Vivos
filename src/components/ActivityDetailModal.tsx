import React from 'react';
import { Activity } from '../types';
import { CATEGORY_CONFIG } from '../data/mockData';
import { 
  X, MapPin, Calendar, Clock, User, ShieldCheck, 
  Users, CheckCircle2, AlertTriangle, Share2 
} from 'lucide-react';

interface ActivityDetailModalProps {
  activity: Activity | null;
  onClose: () => void;
  onToggleAttendance: (activityId: string) => void;
  isCalendarConnected?: boolean;
  calendarUserEmail?: string | null;
  isSyncedToCalendar?: boolean;
  onConnectCalendar?: () => void;
  onManualSyncCalendar?: (activity: Activity) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  onClose,
  onToggleAttendance,
  isCalendarConnected = false,
  calendarUserEmail,
  isSyncedToCalendar = false,
  onConnectCalendar,
  onManualSyncCalendar,
}) => {
  if (!activity) return null;

  const catConfig = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.deporte;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300 border border-stone-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header with Category Tint */}
        <div className="relative p-5 pb-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-orange-50 border-b border-stone-200">
          <div className="flex items-center justify-between gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${catConfig.bgBadge} ${catConfig.textBadge} border ${catConfig.border}`}>
              <span>{catConfig.label}</span>
            </span>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-stone-600 shadow-sm border border-stone-200 active:scale-95 transition-all"
              aria-label="Cerrar detalles"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-2.5 leading-snug">
            {activity.title}
          </h2>

          <div className="flex items-center gap-2 mt-2 text-stone-600 text-sm">
            <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="font-semibold text-stone-800">{activity.locationName}</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Date, Time & Attendees Grid */}
          <div className="grid grid-cols-2 gap-2.5 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">Fecha y Hora</p>
                <p className="font-bold text-sm text-stone-900">{activity.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-stone-500">Asistentes</p>
                <p className="font-bold text-sm text-orange-700">
                  {activity.attendeesCount} vecinos confirmados
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
              Sobre la actividad
            </h3>
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
              {activity.description}
            </p>
          </div>

          {/* Organizer / Creator Info */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-xl">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
              Organizado por un vecino verificado
            </h3>
            <div className="flex items-center gap-3">
              <img
                src={activity.creatorAvatar}
                alt={activity.creatorName}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-sm"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-stone-900 text-sm">
                    {activity.creatorName}
                  </h4>
                  <span title="Vecino verificado">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium">
                  {activity.creatorRole}
                </p>
              </div>
            </div>
          </div>

          {/* Safety & Collective Protection Tip */}
          {activity.safetyTip && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Seguridad comunitaria: </span>
                <span>{activity.safetyTip}</span>
              </div>
            </div>
          )}

          {/* Google Calendar Card */}
          <div className="bg-gradient-to-r from-blue-50/80 via-emerald-50/50 to-orange-50/50 border border-blue-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              </div>

              <div className="min-w-0">
                <h4 className="text-xs font-black text-stone-900 leading-tight">
                  Google Calendar
                </h4>
                <p className="text-[11px] text-stone-600 truncate">
                  {isCalendarConnected
                    ? isSyncedToCalendar
                      ? `✓ Agendado en tu Google Calendar (${calendarUserEmail || 'cuenta'})`
                      : 'Vinculado. Al confirmar asistencia se agendará automáticamente.'
                    : 'Vincúlalo para agregar automáticamente tus actividades'}
                </p>
              </div>
            </div>

            {isCalendarConnected ? (
              isSyncedToCalendar ? (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                  <span>✓ Agendado</span>
                </span>
              ) : onManualSyncCalendar ? (
                <button
                  type="button"
                  onClick={() => onManualSyncCalendar(activity)}
                  className="text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0 shadow-xs active:scale-95"
                >
                  Agendar
                </button>
              ) : null
            ) : onConnectCalendar ? (
              <button
                type="button"
                onClick={onConnectCalendar}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 px-2.5 py-1 rounded-lg shrink-0 shadow-xs active:scale-95"
              >
                Vincular
              </button>
            ) : null}
          </div>
        </div>

        {/* Modal Footer with Primary Attendance Button */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center gap-3">
          <button
            onClick={() => onToggleAttendance(activity.id)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
              activity.isAttending
                ? 'bg-emerald-700 text-white hover:bg-emerald-800 ring-2 ring-emerald-400'
                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-600/30'
            }`}
          >
            {activity.isAttending ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                <span>¡Asistencia Confirmada! (Cancelar)</span>
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                <span>Confirmar Asistencia</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
