import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, QrCode, ExternalLink, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface InviteNeighborModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteNeighborModal: React.FC<InviteNeighborModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('/qr-parques-vivos.png');
  const inviteUrl = 'https://parques-vivos.vercel.app';

  useEffect(() => {
    let isMounted = true;
    // Generate high-resolution, fully functional QR code
    QRCode.toDataURL(inviteUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [inviteUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      '¡Hola vecino! Te invito a unirte a Parques Vivos para Parque Almagro. Así coordinamos salidas grupales de deporte, paseos de mascotas y rondas seguras: ' +
        inviteUrl
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-200 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20">
              <QrCode className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h2 id="invite-modal-title" className="font-extrabold text-base leading-tight">
                Invitar a un Vecino
              </h2>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Comunidad Parque Almagro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-center space-y-4">
          <p className="text-xs text-stone-600 font-medium leading-relaxed">
            Cada nuevo vecino que se suma fortalece la seguridad y presencia colectiva en nuestro parque.
          </p>

          {/* Functional Real QR Code Card */}
          <div className="inline-block p-3.5 bg-white rounded-2xl border-2 border-stone-200 shadow-sm transition-all hover:shadow-md">
            <div className="relative group">
              <img
                src={qrCodeUrl}
                alt="Código QR para unirse a Parques Vivos Parque Almagro"
                className="w-48 h-48 mx-auto rounded-xl object-contain bg-white"
                width={192}
                height={192}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-stone-600">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Escanea con la cámara de tu celular</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <a
                href={qrCodeUrl}
                download="qr-parques-vivos-almagro.png"
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 hover:underline py-0.5"
              >
                <Download className="w-3 h-3" />
                <span>Guardar imagen</span>
              </a>
              <span className="text-stone-300">•</span>
              <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-stone-500 hover:text-stone-700 font-medium inline-flex items-center gap-1 hover:underline py-0.5"
              >
                <span>Probar link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Social Share Card Preview */}
          <div className="text-left bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Vista previa al compartir en redes (WhatsApp / Redes)
            </span>
            <div className="rounded-xl overflow-hidden border border-stone-200 bg-white shadow-xs">
              <img
                src="/fcfm_logo.jpg"
                alt="Logo FCFM Universidad de Chile"
                className="w-full h-24 object-cover object-center bg-white border-b border-stone-100"
              />
              <div className="p-2.5">
                <span className="text-[10px] font-medium text-stone-400 block uppercase tracking-wider">
                  parques-vivos.vercel.app
                </span>
                <p className="text-xs font-bold text-stone-800 leading-tight">
                  Parques Vivos - Parque Almagro
                </p>
                <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                  Plataforma comunitaria para coordinar actividades grupales y recuperar la seguridad y vida de barrio.
                </p>
              </div>
            </div>
          </div>

          {/* Copy link input */}
          <div className="space-y-1 text-left">
            <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
              Enlace directo para compartir
            </label>
            <div className="flex items-center gap-2 bg-stone-100 p-2 rounded-xl border border-stone-200 focus-within:border-emerald-500 transition-colors">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                aria-label="Enlace de invitación"
                className="bg-transparent text-xs text-stone-800 font-mono font-medium w-full px-1 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shrink-0 shadow-sm"
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
          </div>

          {/* WhatsApp sharing button */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm shadow-md shadow-green-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
