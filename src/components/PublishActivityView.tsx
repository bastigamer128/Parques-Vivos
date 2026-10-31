import React, { useEffect, useRef, useState } from 'react';
import { Activity, DayOption, SchematicZoneId } from '../types';
import {
  SCHEMATIC_ZONES,
  buildRawDateIso,
  computeEndTime,
  formatNeighborShortName,
} from '../data/mockData';
import { containsProfanity } from '../utils/profanityFilter';

interface PublishActivityViewProps {
  defaultOrganizerName: string;
  initialZoneId?: SchematicZoneId;
  onSaveOrganizerName: (name: string) => void;
  onPublishActivity: (activity: Omit<Activity, 'id'>) => void;
}

const DAY_OPTIONS: DayOption[] = [
  'Hoy',
  'Mañana',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const START_TIME_OPTIONS: string[] = [
  '07:30',
  '08:30',
  '09:00',
  '10:00',
  '10:30',
  '11:00',
  '12:00',
  '16:00',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
];

const DURATION_OPTIONS: Array<{ label: string; minutes: number }> = [
  { label: '45 min', minutes: 45 },
  { label: '1 hora', minutes: 60 },
  { label: '1 h 30 min', minutes: 90 },
  { label: '2 horas', minutes: 120 },
];

const SUGGESTED_CAPACITY_OPTIONS: number[] = [6, 10, 12, 15, 20, 25];

const dirtyFields = new WeakMap<Element, { interacted: boolean; blurred: boolean }>();

export const PublishActivityView: React.FC<PublishActivityViewProps> = ({
  defaultOrganizerName,
  initialZoneId,
  onSaveOrganizerName,
  onPublishActivity,
}) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [title, setTitle] = useState('');
  const [dayLabel, setDayLabel] = useState<DayOption>('Hoy');
  const [startTime, setStartTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [suggestedCapacity, setSuggestedCapacity] = useState(10);
  const [zoneId, setZoneId] = useState<SchematicZoneId>(initialZoneId || 'maquinas');
  const [organizerName, setOrganizerName] = useState(defaultOrganizerName || '');
  const [description, setDescription] = useState('');
  const [repeatsWeekly, setRepeatsWeekly] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialZoneId) {
      setZoneId(initialZoneId);
    }
  }, [initialZoneId]);

  // Sync ARIA invalid state and fallback classes after user interaction (:user-invalid pattern)
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const supportsUserInvalid =
      typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
        ? CSS.supports('selector(:user-invalid)')
        : false;

    const syncControl = (target: EventTarget | null, eventType: string) => {
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        return;
      }

      const prev = dirtyFields.get(target) || { interacted: false, blurred: false };
      if (eventType === 'input' || eventType === 'change') prev.interacted = true;
      if (eventType === 'blur') prev.blurred = true;
      dirtyFields.set(target, prev);

      if (!supportsUserInvalid && prev.interacted && prev.blurred) {
        const valid = target.checkValidity();
        target.classList.toggle('user-invalid-fallback', !valid);
        target.classList.toggle('user-valid-fallback', valid);
      }

      const isInvalidNow = supportsUserInvalid
        ? target.matches(':user-invalid')
        : target.classList.contains('user-invalid-fallback');

      if (isInvalidNow) {
        target.setAttribute('aria-invalid', 'true');
      } else {
        target.removeAttribute('aria-invalid');
      }
    };

    const onBlur = (e: Event) => syncControl(e.target, 'blur');
    const onInput = (e: Event) => syncControl(e.target, 'input');

    form.addEventListener('blur', onBlur, true);
    form.addEventListener('input', onInput);
    return () => {
      form.removeEventListener('blur', onBlur, true);
      form.removeEventListener('input', onInput);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModerationError(null);

    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }

    if (containsProfanity(title) || containsProfanity(description) || containsProfanity(organizerName)) {
      setModerationError('Por favor usa un lenguaje respetuoso para convocar a tus vecinos.');
      return;
    }

    const zone = SCHEMATIC_ZONES.find((z) => z.id === zoneId) || SCHEMATIC_ZONES[0];
    const endTime = computeEndTime(startTime, durationMinutes);
    const shortOrganizer = formatNeighborShortName(organizerName || 'Vecino A.');
    onSaveOrganizerName(shortOrganizer);

    onPublishActivity({
      title: title.trim(),
      description: description.trim(),
      locationName: zone.name,
      zoneId: zone.id,
      lat: zone.lat,
      lng: zone.lng,
      dayLabel,
      startTime,
      endTime,
      durationMinutes,
      suggestedCapacity,
      repeatsWeekly,
      date: `${dayLabel} · ${startTime}–${endTime}`,
      rawDate: buildRawDateIso(dayLabel, startTime),
      category: 'social',
      creatorName: shortOrganizer,
      creatorRole: 'Vecino verificado · Parque Almagro',
      creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      creatorVerified: true,
      attendeesCount: 1,
      isAttending: true,
      status: dayLabel === 'Hoy' ? 'activa' : 'proxima',
      schemaVersion: 2,
    });
  };

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-2xl font-extrabold text-[#16241b] tracking-tight">
          Publicar una actividad
        </h2>
        <p className="text-sm text-[#4f6255] mt-0.5">
          Un solo formulario, con lo básico para el Parque Almagro.
        </p>
      </div>

      {moderationError ? (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-800"
        >
          {moderationError}
        </div>
      ) : null}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-[#dfe6dd] space-y-4"
      >
        {/* Activity Title */}
        <div>
          <label htmlFor="pub-title" className="block text-sm font-bold text-[#18261d]">
            Título
          </label>
          <span id="pub-title-hint" className="block text-xs text-[#596c5f] mt-0.5 mb-1.5">
            Ej: Caminata de las 11, Paseo canino o Yoga suave.
          </span>
          <input
            id="pub-title"
            name="title"
            type="text"
            required
            minLength={3}
            maxLength={70}
            aria-describedby="pub-title-hint"
            aria-errormessage="pub-title-error"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Caminata de las 11"
            className="form-control w-full px-3.5 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
          />
          <div id="pub-title-error" className="field-error-msg">
            <span aria-hidden="true">⚠</span> Escribe un título claro de al menos 3 letras.
          </div>
        </div>

        {/* Day & Start time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pub-day" className="block text-sm font-bold text-[#18261d] mb-1.5">
              Día
            </label>
            <select
              id="pub-day"
              name="day"
              value={dayLabel}
              onChange={(e) => setDayLabel(e.target.value as DayOption)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pub-time" className="block text-sm font-bold text-[#18261d] mb-1.5">
              Hora de inicio
            </label>
            <select
              id="pub-time"
              name="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
            >
              {START_TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration & Suggested Capacity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pub-duration" className="block text-sm font-bold text-[#18261d] mb-1.5">
              Duración
            </label>
            <select
              id="pub-duration"
              name="duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.minutes} value={opt.minutes}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pub-capacity" className="block text-sm font-bold text-[#18261d] mb-1.5">
              Aforo sugerido
            </label>
            <select
              id="pub-capacity"
              name="suggestedCapacity"
              value={suggestedCapacity}
              onChange={(e) => setSuggestedCapacity(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
            >
              {SUGGESTED_CAPACITY_OPTIONS.map((cap) => (
                <option key={cap} value={cap}>
                  {cap} personas
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sector inside Parque Almagro */}
        <div>
          <label htmlFor="pub-zone" className="block text-sm font-bold text-[#18261d] mb-1.5">
            Lugar en el Parque Almagro
          </label>
          <select
            id="pub-zone"
            name="zoneId"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value as SchematicZoneId)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
          >
            {SCHEMATIC_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        {/* Organizer short name */}
        <div>
          <label htmlFor="pub-organizer" className="block text-sm font-bold text-[#18261d]">
            Tu nombre
          </label>
          <span id="pub-organizer-hint" className="block text-xs text-[#596c5f] mt-0.5 mb-1.5">
            Se mostrará como nombre e inicial (ej: Carla M.) para dar confianza a otros vecinos.
          </span>
          <input
            id="pub-organizer"
            name="organizerName"
            type="text"
            required
            minLength={2}
            maxLength={40}
            autoComplete="given-name"
            aria-describedby="pub-organizer-hint"
            aria-errormessage="pub-organizer-error"
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            placeholder="Ej: Bastián N."
            className="form-control w-full px-3.5 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm font-semibold text-[#16241b]"
          />
          <div id="pub-organizer-error" className="field-error-msg">
            <span aria-hidden="true">⚠</span> Ingresa tu nombre para identificar quién convoca.
          </div>
        </div>

        {/* Optional brief note */}
        <div>
          <label htmlFor="pub-desc" className="block text-sm font-bold text-[#18261d] mb-1">
            Nota breve <span className="font-normal text-[#596c5f]">(opcional)</span>
          </label>
          <input
            id="pub-desc"
            name="description"
            type="text"
            maxLength={160}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Punto de encuentro junto a las bancas, llevar agua."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd6c9] bg-[#fafcfa] text-sm text-[#16241b]"
          />
        </div>

        {/* Weekly recurrence checkbox */}
        <div className="pt-1">
          <label
            htmlFor="pub-weekly"
            className="inline-flex items-center gap-2.5 cursor-pointer py-1 text-sm font-semibold text-[#233528]"
          >
            <input
              id="pub-weekly"
              name="repeatsWeekly"
              type="checkbox"
              checked={repeatsWeekly}
              onChange={(e) => setRepeatsWeekly(e.target.checked)}
              className="w-4 h-4 accent-[#1f6a42] rounded"
            />
            <span>Se repite cada semana</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#1f6a42] hover:bg-[#185434] text-white text-base font-extrabold transition-colors cursor-pointer"
        >
          Publicar actividad
        </button>
      </form>
    </div>
  );
};
