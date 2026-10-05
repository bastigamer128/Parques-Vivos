import React, { useState } from 'react';
import { X, Copy, Check, Share2, QrCode, Sparkles } from 'lucide-react';

interface InviteNeighborModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteNeighborModal: React.FC<InviteNeighborModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const inviteUrl = 'https://parquesvivos.cl/almagro?inv=comunidad-2026';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      '¡Hola vecino! Te invito a unirte a Parques Vivos para Parque Almagro. Así coordinamos salidas grupales de deporte, paseos de mascotas y rondas seguras: ' + inviteUrl
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-200 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-300" />
            <h2 className="font-extrabold text-base">Invitar a un Vecino</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body with QR Code */}
        <div className="p-6 text-center space-y-4">
          <p className="text-xs text-stone-600 font-medium">
            Cada nuevo vecino que se suma fortalece la seguridad y presencia colectiva en nuestro Parque Almagro.
          </p>

          {/* Clean Vector QR Code Simulation */}
          <div className="inline-block p-4 bg-white rounded-2xl border-2 border-stone-200 shadow-md">
            <svg
              className="w-44 h-44 mx-auto"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer boundary */}
              <rect width="120" height="120" fill="white" />
              {/* Top Left Finder */}
              <rect x="10" y="10" width="30" height="30" rx="4" fill="#047857" />
              <rect x="16" y="16" width="18" height="18" rx="2" fill="white" />
              <rect x="21" y="21" width="8" height="8" rx="1" fill="#047857" />

              {/* Top Right Finder */}
              <rect x="80" y="10" width="30" height="30" rx="4" fill="#047857" />
              <rect x="86" y="16" width="18" height="18" rx="2" fill="white" />
              <rect x="91" y="21" width="8" height="8" rx="1" fill="#047857" />

              {/* Bottom Left Finder */}
              <rect x="10" y="80" width="30" height="30" rx="4" fill="#047857" />
              <rect x="16" y="86" width="18" height="18" rx="2" fill="white" />
              <rect x="21" y="91" width="8" height="8" rx="1" fill="#047857" />

              {/* QR Pattern dots */}
              <rect x="46" y="12" width="6" height="6" fill="#1e293b" />
              <rect x="58" y="12" width="6" height="6" fill="#ea580c" />
              <rect x="68" y="18" width="6" height="6" fill="#1e293b" />
              <rect x="46" y="26" width="6" height="6" fill="#1e293b" />
              <rect x="60" y="32" width="6" height="6" fill="#1e293b" />

              <rect x="14" y="50" width="6" height="6" fill="#ea580c" />
              <rect x="26" y="58" width="6" height="6" fill="#1e293b" />
              <rect x="40" y="46" width="10" height="10" fill="#047857" />
              <rect x="56" y="46" width="8" height="8" fill="#1e293b" />
              <rect x="70" y="46" width="8" height="8" fill="#ea580c" />
              <rect x="86" y="52" width="8" height="8" fill="#1e293b" />
              <rect x="100" y="52" width="6" height="6" fill="#1e293b" />

              <rect x="48" y="66" width="6" height="6" fill="#1e293b" />
              <rect x="62" y="66" width="6" height="6" fill="#047857" />
              <rect x="76" y="66" width="6" height="6" fill="#1e293b" />
              <rect x="90" y="74" width="6" height="6" fill="#ea580c" />

              <rect x="48" y="84" width="6" height="6" fill="#ea580c" />
              <rect x="60" y="92" width="6" height="6" fill="#1e293b" />
              <rect x="72" y="84" width="6" height="6" fill="#1e293b" />
              <rect x="88" y="92" width="8" height="8" fill="#047857" />
              <rect x="102" y="84" width="6" height="6" fill="#1e293b" />

              {/* Center icon */}
              <circle cx="60" cy="60" r="13" fill="#047857" />
              <circle cx="60" cy="60" r="10" fill="white" />
              <circle cx="60" cy="60" r="6" fill="#ea580c" />
            </svg>
            <p className="text-[11px] font-bold text-stone-500 mt-2">
              Escanear con la cámara del celular
            </p>
          </div>

          {/* Copy link input */}
          <div className="flex items-center gap-2 bg-stone-100 p-2 rounded-xl border border-stone-200">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent text-xs text-stone-700 font-mono w-full px-1 outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          {/* WhatsApp sharing button */}
          <button
            onClick={handleWhatsApp}
            className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
