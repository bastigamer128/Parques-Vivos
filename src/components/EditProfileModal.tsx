import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, Save, User, MapPin, Mail, FileText } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSave: (updated: Partial<UserProfile>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [name, setName] = useState(user.name);
  const [addressArea, setAddressArea] = useState(user.addressArea);
  const [bio, setBio] = useState(user.bio);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || user.name,
      addressArea: addressArea.trim() || user.addressArea,
      bio: bio.trim() || user.bio,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-stone-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
          <h2 className="font-extrabold text-base">Editar Perfil Vecinal</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-emerald-900/60 hover:bg-emerald-900 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Nombre de Usuario
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Sector / Cuadra de Residencia
            </label>
            <input
              type="text"
              value={addressArea}
              onChange={(e) => setAddressArea(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Biografía / Presentación Vecinal
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-stone-300 font-bold text-stone-700 text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
