import React, { useState } from 'react';
import { Activity } from '../types';
import { endsBefore1930, formatNeighborShortName } from '../data/mockData';

interface ActivityDetailViewProps {
  activity: Activity;
  currentNeighborName: string;
  onSaveNeighborName: (name: string) => void;
  onBack: () => void;
  onToggleAttendance: (activityId: string, neighborName: string) => void;
}

function downloadIcsReminder(activity: Activity): void {
  const start = new Date(activity.rawDate);
  const validStart = Number.isNaN(start.getTime()) ? new Date() : start;
  const durationMs = (activity.durationMinutes || 60) * 60 * 1000;
  const end = new Date(validStart.getTime() + durationMs);

  const toIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parques Vivos//Parque Almagro//ES',
    'BEGIN:VEVENT',
    `UID:${activity.id}@parquesvivos.cl`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(validStart)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${activity.title} - Parque Almagro`,
    `LOCATION:${activity.locationName}, Parque Almagro, Santiago Centro`,
    `DESCRIPTION:${(activity.description || 'Encuentro vecinal en Parque Almagro').replace(/\n/g, ' ')} (Organiza: ${activity.creatorName})`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${activity.title.toLowerCase().replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({
  activity,
  currentNeighborName,
  onSaveNeighborName,
  onBack,
  onToggleAttendance,
}) => {
  const [nameInput, setNameInput] = useState<string>(currentNeighborName || '');
  const [isEditingName, setIsEditingName] = useState<boolean>(!currentNeighborName);

  const suggestedCap = activity.suggestedCapacity || 12;
  const attendeesList = activity.attendees && activity.attendees.length > 0
    ? activity.attendees
    : [{ uid: 'org', name: activity.creatorName, role: 'Organizador', verified: true }];
  const enrolledCount = Math.max(activity.attendeesCount, attendeesList.length);
  const progressPct = Math.min(Math.round((enrolledCount / suggestedCap) * 100), 100);
  const finishesBeforeDark = endsBefore1930(activity.endTime, activity.startTime);

  const handleAttendanceClick = () => {
    const cleanName = formatNeighborShortName(nameInput || currentNeighborName || 'Vecino A.');
    onSaveNeighborName(cleanName);
    setNameInput(cleanName);
    setIsEditingName(false);
    onToggleAttendance(activity.id, cleanName);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1f6a42] hover:text-[#164d2f] py-1.5 px-1 rounded-lg cursor-pointer"
      >
        <span aria-hidden="true">←</span>
        <span>Volver al mapa</span>
      </button>

      {/* Title & clear schedule/sector chips (larger horario typography per Hito 2 v2) */}
      <div>
        <h2 className="text-2xl font-extrabold text-[#16241b] tracking-tight leading-snug">
          {activity.title}
        </h2>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="schedule-time inline-flex items-center px-3 py-1.5 rounded-full bg-[#eef2ed] border border-[#d5dfd4] text-sm font-extrabold text-[#18261d]">
            {activity.dayLabel || 'Hoy'} · {activity.startTime || '17:30'}–{activity.endTime || '18:30'}
          </span>

          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#eef2ed] border border-[#d5dfd4] text-sm font-semibold text-[#2d4033]">
            {activity.locationName}
          </span>

          {activity.repeatsWeekly ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#eef2ed] border border-[#d5dfd4] text-xs font-semibold text-[#3c5142]">
              Cada semana
            </span>
          ) : null}

          {finishesBeforeDark ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#e4f2e8] text-[#1f6a42] text-xs font-bold">
              Termina antes de las 19:30
            </span>
          ) : null}
        </div>
      </div>

      {/* Organizer line */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-sm text-[#2d4033]">
          Organiza: <strong className="font-extrabold text-[#16241b]">{activity.creatorName}</strong>
        </p>
        {activity.creatorVerified !== false ? (
          <span className="px-2.5 py-1 rounded-full bg-[#e4f2e8] text-[#1f6a42] text-[11px] font-extrabold tracking-wide uppercase">
            Perfil verificado
          </span>
        ) : null}
      </div>

      {/* Short description if provided */}
      {activity.description ? (
        <p className="text-sm text-[#35483b] leading-relaxed bg-white p-3.5 rounded-2xl border border-[#dfe6dd]">
          {activity.description}
        </p>
      ) : null}

      {/* Aforo sugerido (non-restrictive public park capacity per Hito 2 Learning #3) */}
      <section className="bg-white p-4 rounded-2xl border border-[#dfe6dd] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4b5e51]">
            Aforo sugerido
          </h3>
          <span className="text-xs font-semibold text-[#5a6d60]">
            Parque abierto · No excluyente
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Personas inscritas respecto al aforo sugerido"
          aria-valuenow={enrolledCount}
          aria-valuemin={0}
          aria-valuemax={suggestedCap}
          className="w-full h-2.5 rounded-full bg-[#e3ebe1] overflow-hidden"
        >
          <div
            className="h-full bg-[#1f6a42] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="text-sm font-semibold text-[#2a3d30]">
          {enrolledCount} de {suggestedCap} personas inscritas (aforo sugerido)
        </p>

        {/* Neighbor short name for Compañía Visible */}
        {!activity.isAttending && isEditingName ? (
          <div className="pt-1">
            <label
              htmlFor="attendee-short-name"
              className="block text-xs font-bold text-[#2f4335] mb-1"
            >
              Tu nombre para la lista de vecinos
            </label>
            <span id="attendee-name-hint" className="block text-xs text-[#596c5f] mb-1.5">
              Solo se mostrará tu nombre e inicial (ej: Daniela P.).
            </span>
            <input
              id="attendee-short-name"
              type="text"
              autoComplete="given-name"
              aria-describedby="attendee-name-hint"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Ej: Bastián N."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
            />
          </div>
        ) : !activity.isAttending && currentNeighborName ? (
          <div className="flex items-center justify-between text-xs text-[#4b5e51] pt-0.5">
            <span>
              Te inscribirás como <strong className="text-[#18261d]">{currentNeighborName}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="font-bold text-[#1f6a42] underline cursor-pointer py-1 px-1"
            >
              Cambiar
            </button>
          </div>
        ) : null}

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleAttendanceClick}
          className={`w-full min-h-[48px] py-3 px-4 rounded-xl text-base font-extrabold transition-colors cursor-pointer ${
            activity.isAttending
              ? 'bg-[#e4f2e8] text-[#1f6a42] border border-[#b7dac2] hover:bg-[#d6ebdc]'
              : 'bg-[#1f6a42] text-white hover:bg-[#185434]'
          }`}
        >
          {activity.isAttending ? '✓ Inscrito · Cancelar inscripción' : 'Inscribirme'}
        </button>

        <div className="flex justify-center pt-0.5">
          <button
            type="button"
            onClick={() => downloadIcsReminder(activity)}
            className="text-xs font-bold text-[#3f5847] hover:text-[#1f6a42] underline py-1 px-2 cursor-pointer"
          >
            Guardar recordatorio en mi calendario (.ics)
          </button>
        </div>
      </section>

      {/* QUIÉNES VAN (Compañía visible - Atributo R3) */}
      <section className="bg-white p-4 rounded-2xl border border-[#dfe6dd] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4b5e51]">
            Quiénes van ({attendeesList.length})
          </h3>
          <span className="text-xs text-[#5a6d60]">Nombre e inicial</span>
        </div>

        <ul role="list" className="divide-y divide-[#edf1ec] list-none p-0 m-0">
          {attendeesList.map((person) => {
            const initial = person.name.trim().charAt(0).toUpperCase() || 'V';
            return (
              <li
                key={`${person.uid}-${person.name}`}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    aria-hidden="true"
                    className="w-9 h-9 rounded-full bg-[#e4f2e8] text-[#1f6a42] font-extrabold text-sm flex items-center justify-center shrink-0"
                  >
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#16241b] truncate">
                      {person.name}
                    </p>
                    <p className="text-xs text-[#596c5f] truncate">
                      {person.role}
                    </p>
                  </div>
                </div>

                {person.verified ? (
                  <span className="text-[11px] font-bold text-[#1f6a42] bg-[#eef6f0] px-2.5 py-0.5 rounded-full shrink-0">
                    Verificado
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
