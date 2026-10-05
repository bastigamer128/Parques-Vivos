import React, { useState, useEffect } from 'react';
import { CategoryType, Activity } from '../types';
import { PARQUE_ALMAGRO_ZONES, CATEGORY_CONFIG, isPointInsideParqueAlmagro } from '../data/mockData';
import { 
  X, Calendar, MapPin, Tag, FileText, ShieldAlert, 
  PlusCircle, CheckCircle2, Crosshair, AlertTriangle 
} from 'lucide-react';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateActivity: (activity: Omit<Activity, 'id' | 'attendeesCount' | 'isAttending' | 'status'>) => void;
  initialLocation?: {
    lat: number;
    lng: number;
    locationName?: string;
  } | null;
  onSelectOnMapMode?: () => void;
  isCalendarConnected?: boolean;
  onConnectCalendar?: () => void;
}

export const CreateActivityModal: React.FC<CreateActivityModalProps> = ({
  isOpen,
  onClose,
  onCreateActivity,
  initialLocation,
  onSelectOnMapMode,
  isCalendarConnected = false,
  onConnectCalendar,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('deporte');
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [dateStr, setDateStr] = useState('Hoy, 19:00 hrs');
  const [description, setDescription] = useState('');
  const [safetyTip, setSafetyTip] = useState('Llevar ropa visible y mantenerse en grupo.');

  // Custom coordinate if selected by tapping on map
  const [customCoord, setCustomCoord] = useState<{ lat: number; lng: number; name: string } | null>(null);

  // Sync initial location from map tap
  useEffect(() => {
    if (initialLocation) {
      setCustomCoord({
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        name: initialLocation.locationName || 'Punto seleccionado en el mapa',
      });
    }
  }, [initialLocation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    let finalLat: number;
    let finalLng: number;
    let finalLocationName: string;

    if (customCoord) {
      finalLat = customCoord.lat;
      finalLng = customCoord.lng;
      finalLocationName = customCoord.name;
    } else {
      const zone = PARQUE_ALMAGRO_ZONES[selectedZoneIndex] || PARQUE_ALMAGRO_ZONES[0];
      finalLat = zone.lat;
      finalLng = zone.lng;
      finalLocationName = zone.name;
    }

    onCreateActivity({
      title: title.trim(),
      description: description.trim(),
      locationName: finalLocationName,
      lat: finalLat,
      lng: finalLng,
      date: dateStr.trim(),
      rawDate: new Date().toISOString(),
      category,
      creatorName: 'Bastián González',
      creatorRole: 'Vecino Verificado Almagro',
      creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      safetyTip: safetyTip.trim() || undefined,
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setCustomCoord(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300 border border-stone-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-tight">Convocar Actividad</h2>
              <p className="text-xs text-emerald-200">Parque Almagro • Santiago</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-emerald-800/80 hover:bg-emerald-800 text-white active:scale-95 transition-all"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Location status badge when picked on map */}
          {customCoord ? (
            <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ubicación fijada en el mapa</span>
                </span>
                <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Dentro del Parque
                </span>
              </div>
              <p className="text-xs font-bold text-stone-800">
                {customCoord.name}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
                <span>Coord: {customCoord.lat.toFixed(5)}, {customCoord.lng.toFixed(5)}</span>
                <button
                  type="button"
                  onClick={() => setCustomCoord(null)}
                  className="text-xs font-bold text-orange-600 underline"
                >
                  Cambiar por zona estándar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Ubicación en Parque Almagro *
                </label>
                {onSelectOnMapMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectOnMapMode();
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-100/80 px-2 py-1 rounded-lg"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Tocar punto en el mapa</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedZoneIndex}
                  onChange={(e) => setSelectedZoneIndex(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 text-sm font-semibold bg-white appearance-none"
                >
                  {PARQUE_ALMAGRO_ZONES.map((zone, idx) => (
                    <option key={zone.name} value={idx}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-orange-600 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Nombre de la Actividad *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Caminata grupal nocturna con mascotas"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 text-sm font-medium"
            />
          </div>

          {/* Category Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Categoría *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_CONFIG) as CategoryType[]).map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const isSelected = category === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {conf.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Día y Hora Estimada *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="Ej: Hoy, 19:30 hrs o Sábado 10:00"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 text-sm font-medium"
              />
              <Calendar className="w-4 h-4 text-emerald-700 absolute left-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Descripción / ¿Qué haremos? *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica de qué trata, qué cosas llevar (agua, mat, correa) y motiva a los vecinos a sumarse."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 text-sm"
            />
          </div>

          {/* Safety Tip */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>Consejo de Seguridad para el Grupo (Opcional)</span>
            </label>
            <input
              type="text"
              value={safetyTip}
              onChange={(e) => setSafetyTip(e.target.value)}
              placeholder="Ej: Sector con buena iluminación frente a los juegos infantiles"
              className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50/50 text-stone-900 text-xs sm:text-sm"
            />
          </div>

          {/* Google Calendar Sync Indicator */}
          <div className="bg-gradient-to-r from-blue-50/90 to-emerald-50/90 border border-blue-200/90 rounded-xl p-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="text-xs font-semibold text-stone-800">
                {isCalendarConnected
                  ? 'Se sincronizará en tu Google Calendar'
                  : 'Sincronizar en Google Calendar'}
              </span>
            </div>

            {isCalendarConnected ? (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <span>✓ Vinculado</span>
              </span>
            ) : onConnectCalendar ? (
              <button
                type="button"
                onClick={onConnectCalendar}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-300 px-2.5 py-1 rounded-lg shrink-0 shadow-xs"
              >
                Vincular
              </button>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-3 rounded-xl border border-stone-300 font-bold text-stone-700 text-sm hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-lg shadow-orange-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar en el Mapa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
