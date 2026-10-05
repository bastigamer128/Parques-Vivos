import React, { useState } from 'react';
import { Neighbor } from '../types';
import { ACTIVE_NEIGHBORS } from '../data/mockData';
import { InviteNeighborModal } from './InviteNeighborModal';
import { 
  Users, ShieldCheck, HeartHandshake, Sparkles, 
  Share2, QrCode, BookOpen, AlertCircle, CheckCircle2, 
  MapPin, Award, Trees, MessageCircle 
} from 'lucide-react';

interface CommunityViewProps {
  onGoToForum: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ onGoToForum }) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const rules = [
    {
      title: '1. Cuidado Colectivo y Presencia',
      desc: 'Salimos juntos para que nadie esté solo. El parque habitado es el espacio más seguro para todos los vecinos.',
      icon: ShieldCheck,
      color: 'text-emerald-700 bg-emerald-100',
    },
    {
      title: '2. Tenencia Responsable de Mascotas',
      desc: 'Uso obligatorio de correa en senderos principales y uso libre dentro del canil. Recoger siempre los desechos.',
      icon: HeartHandshake,
      color: 'text-orange-700 bg-orange-100',
    },
    {
      title: '3. Respeto Acústico e Iluminación',
      desc: 'Cuidar el descanso de los vecinos colindantes después de las 22:00 hrs y reportar luminarias apagadas en la app.',
      icon: AlertCircle,
      color: 'text-amber-700 bg-amber-100',
    },
    {
      title: '4. Cero Basura y Cuidado Verde',
      desc: 'Llévate tus residuos a casa o deposítalos en los puntos limpios de San Diego y Mensía de los Nidos.',
      icon: Trees,
      color: 'text-teal-700 bg-teal-100',
    },
  ];

  return (
    <div className="w-full pb-24 bg-stone-100 min-h-screen">
      {/* Exclusive Single Panel: Comunidad Parque Almagro */}
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Superior Banner of Parque Almagro */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-emerald-900/10 text-white">
          <div className="h-48 sm:h-56 w-full relative">
            <img
              src="https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80"
              alt="Parque Almagro Santiago"
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay for high contrast readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/60 to-transparent" />
            
            {/* Top Badge */}
            <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span>Santiago Centro</span>
            </div>

            {/* Banner Content */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Panel Comunitario Oficial
                </span>
                <span className="text-emerald-300 text-xs font-semibold">
                  Junta de Vecinos #14
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Comunidad Parque Almagro
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 line-clamp-2">
                Unidos por un parque verde, iluminado y lleno de vida compartida entre San Diego y San Ignacio.
              </p>
            </div>
          </div>

          {/* Key Community Metric Stats Strip */}
          <div className="bg-emerald-900 p-3.5 grid grid-cols-3 gap-2 text-center border-t border-emerald-800">
            <div>
              <p className="text-xl sm:text-2xl font-black text-amber-400">428</p>
              <p className="text-[11px] text-emerald-200 font-semibold leading-tight">Vecinos Registrados</p>
            </div>
            <div className="border-x border-emerald-800 px-1">
              <p className="text-xl sm:text-2xl font-black text-white">12</p>
              <p className="text-[11px] text-emerald-200 font-semibold leading-tight">Grupos Semanales</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-emerald-300">96%</p>
              <p className="text-[11px] text-emerald-200 font-semibold leading-tight">Percepción Segura</p>
            </div>
          </div>
        </div>

        {/* Prominent Invite Button as requested */}
        <button
          onClick={() => setIsInviteOpen(true)}
          className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-base shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all ring-2 ring-orange-300/40"
        >
          <div className="w-8 h-8 rounded-xl bg-white/25 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="tracking-wide">Invitar a un Vecino al Parque</span>
        </button>

        {/* Normas de Convivencia */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <h3 className="font-extrabold text-stone-900 text-base">
              Normas de Convivencia del Parque
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            Acuerdos vecinales consensuados para que todos podamos disfrutar con tranquilidad.
          </p>

          <div className="space-y-2.5 pt-1">
            {rules.map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${rule.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm">
                      {rule.title}
                    </h4>
                    <p className="text-stone-600 text-xs mt-0.5 leading-relaxed">
                      {rule.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vecinos Activos */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              <h3 className="font-extrabold text-stone-900 text-base">
                Vecinos Activos y Coordinadores
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Voluntarios
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {ACTIVE_NEIGHBORS.map((neighbor) => (
              <div
                key={neighbor.id}
                className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center text-center hover:border-emerald-300 transition-all"
              >
                <div className="relative">
                  <img
                    src={neighbor.avatar}
                    alt={neighbor.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <span title="Vecino verificado" className="absolute bottom-0 right-0 bg-white rounded-full">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </span>
                </div>
                <h4 className="font-extrabold text-stone-900 text-xs mt-2">
                  {neighbor.name}
                </h4>
                <p className="text-[11px] text-stone-500 font-medium leading-tight mt-0.5">
                  {neighbor.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Link to Forum */}
        <div className="p-4 rounded-2xl bg-emerald-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h4 className="font-bold text-sm">¿Tienes una propuesta?</h4>
              <p className="text-xs text-emerald-200">Compártela en el Foro Vecinal</p>
            </div>
          </div>
          <button
            onClick={onGoToForum}
            className="px-3 py-2 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-sm active:scale-95"
          >
            Ir al Foro
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteNeighborModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />
    </div>
  );
};
