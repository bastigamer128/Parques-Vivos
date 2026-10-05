import React, { useState } from 'react';
import { UserProfile, Activity } from '../types';
import { EditProfileModal } from './EditProfileModal';
import { 
  ShieldCheck, Award, Calendar, CheckCircle2, 
  MapPin, Edit3, Settings, Bell, PhoneCall, HelpCircle, 
  ChevronRight, ExternalLink 
} from 'lucide-react';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  attendingActivities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onOpenTutorial: () => void;
  onGoToCalendar?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  attendingActivities,
  onSelectActivity,
  onOpenTutorial,
  onGoToCalendar,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="w-full pb-24 bg-stone-100 min-h-screen">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Main Profile Card */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200 relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="flex flex-col items-center text-center">
            {/* Avatar with Verified Ring & Badge */}
            <div className="relative mb-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-lg"
              />
              {user.isVerified && (
                <div
                  className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1.5 rounded-full border-2 border-white shadow-md flex items-center justify-center"
                  title="Vecino Territorial Verificado"
                >
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-black text-stone-900 leading-snug">
              {user.name}
            </h2>

            {/* Verified badge tag */}
            <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-extrabold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Vecino Verificado Parque Almagro</span>
            </div>

            {/* Address area */}
            <div className="mt-2 flex items-center gap-1 text-xs text-stone-500 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>{user.addressArea}</span>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-3 text-stone-600 text-xs sm:text-sm max-w-sm leading-relaxed italic">
                &ldquo;{user.bio}&rdquo;
              </p>
            )}

            {/* Edit Profile Button */}
            <button
              onClick={() => setIsEditOpen(true)}
              className="mt-4 px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-300/80 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-600" />
              <span>Editar Perfil</span>
            </button>
          </div>

          {/* Simple Statistics Strip as strictly required: "Actividades creadas: 2" y "Asistencias: 5" */}
          <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-2 gap-3 text-center">
            <div className="bg-orange-50/70 border border-orange-200/80 p-3 rounded-2xl">
              <p className="text-2xl font-black text-orange-600">
                {user.activitiesCreated}
              </p>
              <p className="text-xs font-bold text-stone-700 mt-0.5">
                Actividades Creadas
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl">
              <p className="text-2xl font-black text-emerald-700">
                {user.activitiesAttended}
              </p>
              <p className="text-xs font-bold text-stone-700 mt-0.5">
                Asistencias Confirmadas
              </p>
            </div>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 sm:p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              <h3 className="font-extrabold text-sm sm:text-base">
                Verificación Territorial
              </h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-600/70 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-400/40">
              Activa
            </span>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Tu residencia fue validada por el comité de vecinos. Esto genera confianza y previene perfiles anónimos en Parque Almagro.
          </p>
        </div>

        {/* Mis Asistencias Confirmadas */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-stone-900 text-base">
                Mis Próximas Asistencias
              </h3>
            </div>
            {onGoToCalendar ? (
              <button
                onClick={onGoToCalendar}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
              >
                <span>Abrir Calendario</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-xs font-bold text-stone-500">
                {attendingActivities.length} agendadas
              </span>
            )}
          </div>

          {attendingActivities.length === 0 ? (
            <p className="text-xs text-stone-500 py-3 text-center">
              Aún no has confirmado asistencia a ninguna actividad. Explora el mapa y únete a un grupo.
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {attendingActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => onSelectActivity(act)}
                  className="p-3 rounded-2xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200/90 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1">
                        {act.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {act.date} • {act.locationName}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency & Neighborhood Security Contacts */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-stone-200 space-y-3">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-red-600" />
            <h3 className="font-extrabold text-stone-900 text-base">
              Teléfonos de Apoyo Inmediato
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <p className="text-[10px] text-stone-500 font-semibold uppercase">Seguridad Santiago</p>
              <p className="text-sm font-black text-stone-900 mt-0.5">1409</p>
              <p className="text-[10px] text-stone-500">Móvil patrullaje parque</p>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <p className="text-[10px] text-stone-500 font-semibold uppercase">Plan Cuadrante Carabineros</p>
              <p className="text-sm font-black text-stone-900 mt-0.5">133 / 4° Comisaría</p>
              <p className="text-[10px] text-stone-500">Sector Almagro</p>
            </div>
          </div>
        </div>

        {/* Tutorial Link */}
        <button
          onClick={onOpenTutorial}
          className="w-full py-3 px-4 rounded-2xl bg-stone-200/80 hover:bg-stone-300 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <HelpCircle className="w-4 h-4 text-emerald-800" />
          <span>Volver a ver el Tutorial de Inicio</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={user}
        onSave={onUpdateUser}
      />
    </div>
  );
};
