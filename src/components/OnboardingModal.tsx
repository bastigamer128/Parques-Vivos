import React, { useState } from 'react';
import { 
  MapPin, PlusCircle, Users, ShieldCheck, 
  ArrowRight, Check, X, Sparkles, Eye 
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Bienvenido a Parques Vivos',
      subtitle: 'Parque Almagro más activo y seguro',
      description: 'El miedo retrocede cuando los vecinos habitamos los espacios comunes. Esta plataforma nos ayuda a salir en grupo a hacer deporte, pasear mascotas o simplemente conversar.',
      icon: MapPin,
      badge: 'Paso 1 de 4: Mapa en Vivo',
      bgColor: 'from-emerald-600 to-teal-700',
      iconColor: 'text-emerald-100',
    },
    {
      title: 'Coordina y Suma Vecinos',
      subtitle: 'Botón Flotante "+ Actividad"',
      description: '¿Quieres salir a correr o sacar a tu perro pero no quieres ir solo? Presiona el botón "+ Actividad", define la hora y el punto del parque, y tus vecinos confirmarán asistencia.',
      icon: PlusCircle,
      badge: 'Paso 2 de 4: Convocatorias',
      bgColor: 'from-orange-500 to-amber-600',
      iconColor: 'text-orange-100',
    },
    {
      title: 'Foro y Comunidad Parque Almagro',
      subtitle: 'Voz vecinal y normas de convivencia',
      description: 'En el Foro compartimos ideas, reportamos luminarias o acordamos mejoras. En Comunidad encontrarás las normas vecinales e invitación con código QR para sumar más familias.',
      icon: Users,
      badge: 'Paso 3 de 4: Convivencia',
      bgColor: 'from-teal-600 to-emerald-800',
      iconColor: 'text-teal-100',
    },
    {
      title: 'Vecinos Verificados y Accesibilidad',
      subtitle: 'Modo Adulto Mayor y confianza',
      description: 'Cada participante cuenta con verificación territorial. Además, usa el botón "Texto Grande" en la cabecera para adaptar la letra a adultos mayores en cualquier momento.',
      icon: ShieldCheck,
      badge: 'Paso 4 de 4: Tu Perfil',
      bgColor: 'from-emerald-700 to-green-800',
      iconColor: 'text-emerald-100',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const current = steps[currentStep];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-200 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Step Banner with Graphic */}
        <div className={`p-6 bg-gradient-to-tr ${current.bgColor} text-white relative transition-colors duration-300`}>
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
              {current.badge}
            </span>

            <button
              onClick={onClose}
              className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white/90 active:scale-95 transition-all text-xs flex items-center gap-1 px-2"
            >
              <span>Saltar</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30 mb-3">
              <Icon className={`w-8 h-8 ${current.iconColor}`} />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {current.title}
            </h3>
            <p className="text-xs sm:text-sm text-white/80 font-medium mt-1">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Description body */}
        <div className="p-6 text-center space-y-5">
          <p className="text-stone-700 text-sm sm:text-base leading-relaxed font-medium">
            {current.description}
          </p>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-7 bg-orange-500'
                    : 'w-2 bg-stone-300 hover:bg-stone-400'
                }`}
                aria-label={`Ir al paso ${idx + 1}`}
              />
            ))}
          </div>

          {/* Buttons: Saltar tutorial vs Siguiente */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-3 rounded-xl border border-stone-300 text-stone-600 font-bold text-xs sm:text-sm hover:bg-stone-50"
            >
              Saltar
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  <span>Siguiente</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>¡Empezar a Explorar!</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Institutional Credit */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <span>Iniciativa desarrollada por estudiantes FCFM</span>
            <span>•</span>
            <span className="font-semibold text-stone-700">Universidad de Chile</span>
          </div>
        </div>
      </div>
    </div>
  );
};
