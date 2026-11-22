import React, { useEffect, useRef, useState } from 'react';
import { Activity } from '../types';
import { endsBefore1930, formatNeighborShortName } from '../data/mockData';

interface ActivityDetailViewProps {
  activity: Activity;
  currentNeighborName: string;
  invitedBy?: string | null;
  openedViaInvite?: boolean;
  onSaveNeighborName: (name: string) => void;
  onBack: () => void;
  onToggleAttendance: (activityId: string, neighborName: string) => void;
  onNotify?: (msg: string) => void;
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
  invitedBy,
  openedViaInvite = false,
  onSaveNeighborName,
  onBack,
  onToggleAttendance,
  onNotify,
}) => {
  const [nameInput, setNameInput] = useState<string>(currentNeighborName || '');
  const [isEditingName, setIsEditingName] = useState<boolean>(
    !currentNeighborName || openedViaInvite
  );
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [inviterNameInput, setInviterNameInput] = useState<string>(currentNeighborName || '');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const enrollmentSectionRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const suggestedCap = activity.suggestedCapacity || 12;
  const attendeesList = activity.attendees && activity.attendees.length > 0
    ? activity.attendees
    : [{ uid: 'org', name: activity.creatorName, role: 'Organizador', verified: true }];
  const enrolledCount = Math.max(activity.attendeesCount, attendeesList.length);
  const progressPct = Math.min(Math.round((enrolledCount / suggestedCap) * 100), 100);
  const finishesBeforeDark = endsBefore1930(activity.endTime, activity.startTime);

  // When opened via an invitation deep-link, scroll to and focus the registration form
  useEffect(() => {
    if (!openedViaInvite) return;
    if (!activity.isAttending) {
      setIsEditingName(true);
    }
    const timer = window.setTimeout(() => {
      enrollmentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!activity.isAttending) {
        nameInputRef.current?.focus({ preventScroll: true });
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [openedViaInvite, activity.id, activity.isAttending]);

  const rawInviter = inviterNameInput.trim() || nameInput.trim() || currentNeighborName.trim();
  const formattedInviter = rawInviter ? formatNeighborShortName(rawInviter) : '';

  const buildShareUrl = (): string => {
    if (typeof window === 'undefined') {
      return `https://parques-vivos.vercel.app/?actividad=${encodeURIComponent(activity.id)}`;
    }
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set('actividad', activity.id);
    if (formattedInviter) {
      url.searchParams.set('invitadoPor', formattedInviter);
    }
    return url.toString();
  };

  const buildShareMessage = (shareUrl: string): string => {
    const senderPhrase = formattedInviter
      ? `¡Hola! ${formattedInviter} te invita`
      : '¡Hola! Te invito';
    const schedulePhrase = `${activity.dayLabel || 'Hoy'} de ${activity.startTime || '17:30'} a ${activity.endTime || '18:30'}`;
    return `${senderPhrase} a "${activity.title}" en Parque Almagro (${schedulePhrase}, sector ${activity.locationName}). Inscríbete aquí: ${shareUrl}`;
  };

  const persistInviterIfNeeded = () => {
    if (formattedInviter && !currentNeighborName) {
      onSaveNeighborName(formattedInviter);
      setNameInput(formattedInviter);
    }
  };

  const handleCopyInviteLink = async () => {
    persistInviterIfNeeded();
    const shareUrl = buildShareUrl();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopiedLink(true);
      onNotify?.('Enlace de invitación copiado al portapapeles.');
      window.setTimeout(() => setCopiedLink(false), 2600);
    } catch {
      onNotify?.('No se pudo copiar automáticamente. Copia el enlace mostrado.');
    }
  };

  const handleShareWhatsApp = () => {
    persistInviterIfNeeded();
    const shareUrl = buildShareUrl();
    const text = encodeURIComponent(buildShareMessage(shareUrl));
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    persistInviterIfNeeded();
    const shareUrl = buildShareUrl();
    const senderPhrase = formattedInviter
      ? `¡Hola! ${formattedInviter} te invita`
      : '¡Hola! Te invito';
    const text = encodeURIComponent(
      `${senderPhrase} a "${activity.title}" en Parque Almagro (${activity.dayLabel || 'Hoy'} · ${activity.startTime || '17:30'}–${activity.endTime || '18:30'}). ¡Inscríbete aquí!`
    );
    const encodedUrl = encodeURIComponent(shareUrl);
    window.open(
      `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleNativeShare = async () => {
    persistInviterIfNeeded();
    const shareUrl = buildShareUrl();
    const shareText = buildShareMessage(shareUrl);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${activity.title} | Parque Almagro`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    await handleCopyInviteLink();
  };

  const handleAttendanceSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanName = formatNeighborShortName(nameInput || currentNeighborName || 'Vecino A.');
    onSaveNeighborName(cleanName);
    setNameInput(cleanName);
    if (!inviterNameInput.trim()) {
      setInviterNameInput(cleanName);
    }
    setIsEditingName(false);
    onToggleAttendance(activity.id, cleanName);
  };

  const previewShareUrl = buildShareUrl();

  return (
    <div className="space-y-4 pb-4">
      {/* Top navigation & Share trigger */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1f6a42] hover:text-[#164d2f] py-1.5 px-1 rounded-lg cursor-pointer"
        >
          <span aria-hidden="true">←</span>
          <span>Volver al mapa</span>
        </button>

        <button
          type="button"
          aria-expanded={isShareOpen}
          aria-controls="share-activity-panel"
          onClick={() => setIsShareOpen((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-colors cursor-pointer ${
            isShareOpen
              ? 'bg-[#1f6a42] text-white border-[#1f6a42]'
              : 'bg-white text-[#1f6a42] border-[#b7dac2] hover:bg-[#eef6f0]'
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 fill-none stroke-current"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Compartir actividad</span>
        </button>
      </div>

      {/* Invitation banner when user opens a shared activity link */}
      {openedViaInvite ? (
        <div
          role="region"
          aria-label="Invitación a la actividad"
          className="p-3.5 rounded-2xl bg-[#eaf6ee] border border-[#b7dac2] text-[#173a25] space-y-1"
        >
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#1f6a42]">
            Invitación vecinal · Parque Almagro
          </p>
          <p className="text-sm font-semibold leading-snug">
            {invitedBy ? (
              <>
                <strong className="font-extrabold text-[#112a1b]">{invitedBy}</strong> te invitó a
                participar en esta actividad. ¡Completa tu inscripción abajo para ir juntos!
              </>
            ) : (
              <>
                Te invitaron a participar en esta actividad. ¡Completa tu inscripción abajo para
                sumarte al grupo!
              </>
            )}
          </p>
        </div>
      ) : null}

      {/* Expandable Share Activity Panel */}
      {isShareOpen ? (
        <section
          id="share-activity-panel"
          aria-labelledby="share-panel-heading"
          className="bg-white p-4 rounded-2xl border-2 border-[#b7dac2] shadow-xs space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                id="share-panel-heading"
                className="text-sm font-extrabold text-[#16241b] leading-snug"
              >
                Invitar amigos a esta actividad
              </h3>
              <p className="text-xs text-[#526558] mt-0.5">
                Quien abra tu enlace irá directo al formulario de inscripción de esta actividad.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsShareOpen(false)}
              className="text-xs font-bold text-[#4b5e51] hover:text-[#16241b] py-1 px-2 rounded-lg cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div>
            <label
              htmlFor="inviter-short-name"
              className="block text-xs font-bold text-[#2f4335] mb-1"
            >
              Tu nombre en la invitación
            </label>
            <span id="inviter-name-hint" className="block text-xs text-[#596c5f] mb-1.5">
              Tu amigo verá que tú lo estás invitando (ej: Bastián N.).
            </span>
            <input
              id="inviter-short-name"
              name="inviterName"
              type="text"
              autoComplete="given-name"
              aria-describedby="inviter-name-hint"
              value={inviterNameInput}
              onChange={(e) => setInviterNameInput(e.target.value)}
              placeholder="Ej: Bastián N."
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
            />
          </div>

          {/* Social Share Actions */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#1f6a42] hover:bg-[#185434] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShareTelegram}
              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#eef4ef] hover:bg-[#e1ece3] text-[#1c3323] border border-[#c8d8ca] text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Enviar por Telegram</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                copiedLink
                  ? 'bg-[#e4f2e8] text-[#1f6a42] border-[#96cba6]'
                  : 'bg-white text-[#1f6a42] border-[#b7dac2] hover:bg-[#f2f8f4]'
              }`}
            >
              {copiedLink ? '✓ Enlace de invitación copiado' : 'Copiar link de invitación'}
            </button>

            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
              <button
                type="button"
                onClick={handleNativeShare}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-white hover:bg-[#f2f8f4] text-[#283c2e] border border-[#cbd6c9] text-xs font-extrabold transition-colors cursor-pointer"
              >
                Más redes sociales…
              </button>
            ) : null}
          </div>

          <div className="px-3 py-2 rounded-xl bg-[#f4f7f3] border border-[#dfe6dd] text-[11px] text-[#4b5e51] break-all">
            <span className="font-bold text-[#2b3f31]">Link: </span>
            <span>{previewShareUrl}</span>
          </div>
        </section>
      ) : null}

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

      {/* Formulario de inscripción y Aforo sugerido (non-restrictive public park capacity per Hito 2 Learning #3) */}
      <section
        id="inscripcion-actividad"
        ref={enrollmentSectionRef}
        className={`bg-white p-4 rounded-2xl border space-y-2.5 transition-all ${
          openedViaInvite && !activity.isAttending
            ? 'border-2 border-[#1f6a42] ring-2 ring-[#1f6a42]/15'
            : 'border-[#dfe6dd]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h3
            id="enrollment-heading"
            className="text-xs font-extrabold uppercase tracking-wider text-[#4b5e51]"
          >
            {openedViaInvite && !activity.isAttending
              ? 'Formulario de inscripción'
              : 'Inscripción y aforo sugerido'}
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

        <form
          aria-labelledby="enrollment-heading"
          onSubmit={handleAttendanceSubmit}
          className="space-y-2.5 pt-0.5"
        >
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
                ref={nameInputRef}
                id="attendee-short-name"
                name="attendeeName"
                type="text"
                autoComplete="given-name"
                enterKeyHint="done"
                aria-describedby="attendee-name-hint"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ej: Bastián N."
                className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
              />
            </div>
          ) : !activity.isAttending && currentNeighborName ? (
            <div className="flex items-center justify-between text-xs text-[#4b5e51] pt-0.5">
              <span>
                Te inscribirás como{' '}
                <strong className="text-[#18261d]">{currentNeighborName}</strong>
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
            type="submit"
            className={`w-full min-h-[48px] py-3 px-4 rounded-xl text-base font-extrabold transition-colors cursor-pointer ${
              activity.isAttending
                ? 'bg-[#e4f2e8] text-[#1f6a42] border border-[#b7dac2] hover:bg-[#d6ebdc]'
                : 'bg-[#1f6a42] text-white hover:bg-[#185434]'
            }`}
          >
            {activity.isAttending ? '✓ Inscrito · Cancelar inscripción' : 'Inscribirme'}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => downloadIcsReminder(activity)}
            className="text-xs font-bold text-[#3f5847] hover:text-[#1f6a42] underline py-1 px-1 cursor-pointer"
          >
            Guardar recordatorio en calendario (.ics)
          </button>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="text-xs font-extrabold text-[#1f6a42] hover:text-[#164d2f] underline py-1 px-1 cursor-pointer"
          >
            Invitar a un amigo →
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
