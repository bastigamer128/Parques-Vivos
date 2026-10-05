import React from 'react';
import { TreePine, Sparkles, HelpCircle, Shield, Type } from 'lucide-react';

interface HeaderProps {
  isLargeFont: boolean;
  onToggleLargeFont: () => void;
  onOpenTutorial: () => void;
  activeCount: number;
  isCalendarConnected: boolean;
  calendarUserEmail?: string | null;
  onConnectCalendar: () => void;
  onDisconnectCalendar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLargeFont,
  onToggleLargeFont,
  onOpenTutorial,
  activeCount,
  isCalendarConnected,
  calendarUserEmail,
  onConnectCalendar,
  onDisconnectCalendar,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md">
      {/* Top micro banner */}
      <div className="bg-emerald-950/40 px-3 py-1 text-xs flex items-center justify-between border-b border-emerald-700/50">
        <div className="flex items-center gap-1.5 font-medium text-emerald-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span>Parque Almagro • Santiago Centro</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] bg-emerald-700/50 px-2 py-0.5 rounded-full text-emerald-100">
          <Shield className="w-3 h-3 text-emerald-300" />
          <span>{activeCount} grupos activos</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 max-w-lg mx-auto">
        {/* Brand identity */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-inner border border-emerald-300/30 shrink-0">
            <TreePine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1">
              <h1 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-white truncate">
                Parques Vivos
              </h1>
              <span className="bg-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                Almagro
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-emerald-200/90 leading-none truncate hidden xs:block">
              Presencia comunitaria y seguridad
            </p>
          </div>
        </div>

        {/* Action toggles: Accessible Font Toggle, Calendar Link & Tutorial Help (Always visible, no overflow) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Google Calendar Link Button */}
          {isCalendarConnected ? (
            <button
              onClick={onDisconnectCalendar}
              aria-label="Google Calendar Vinculado"
              title={`Vinculado a ${calendarUserEmail || 'Google Calendar'}. Toca para desvincular.`}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-100 border border-emerald-400/60 text-xs font-bold transition-all active:scale-95 shadow-xs shrink-0"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="hidden md:inline">Calendar</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          ) : (
            <button
              onClick={onConnectCalendar}
              aria-label="Vincular con Google Calendar"
              title="Vincular con Google Calendar para sincronizar actividades"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/70 text-xs font-bold transition-all active:scale-95 shadow-xs shrink-0"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="hidden md:inline">Calendar</span>
            </button>
          )}

          {/* Accessibility Toggle Button - robust compact responsive label */}
          <button
            onClick={onToggleLargeFont}
            aria-label="Aumentar tamaño de letra para adultos mayores"
            title={isLargeFont ? 'Modo Texto Grande Activo (Toca para Normal)' : 'Activar Modo Texto Grande'}
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-black transition-all shadow-sm active:scale-95 shrink-0 ${
              isLargeFont
                ? 'bg-amber-400 text-stone-950 border-amber-300 ring-2 ring-amber-300'
                : 'bg-emerald-900/70 hover:bg-emerald-700 text-emerald-100 border-emerald-600/70'
            }`}
          >
            <Type className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isLargeFont ? 'text-stone-950 stroke-[3]' : 'text-amber-300'}`} />
            <span className="hidden sm:inline">{isLargeFont ? 'Grande' : 'Normal'}</span>
            <span className="sm:hidden">{isLargeFont ? 'A+' : 'A'}</span>
          </button>

          {/* Tutorial button - ALWAYS VISIBLE with shrink-0 */}
          <button
            onClick={onOpenTutorial}
            aria-label="Ver tutorial de uso"
            className="p-1.5 sm:p-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-700 text-emerald-200 hover:text-white border border-emerald-600/60 active:scale-95 transition-colors shrink-0 flex items-center justify-center shadow-xs"
            title="Ver tutorial y guía del parque"
          >
            <HelpCircle className="w-5 h-5 text-emerald-200" />
          </button>
        </div>
      </div>
    </header>
  );
};
