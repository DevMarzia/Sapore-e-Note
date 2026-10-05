import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, Check, User, FileText, Globe, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DeleteProfileConfirmModal } from './DeleteProfileConfirmModal';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  onAccountDeleted?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  onAccountDeleted,
}) => {
  const { profile, updateProfile, uploadAvatar } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !profile) return null;

  const handleFileChange = (file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      let finalAvatarUrl = avatarPreview;
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        if (uploaded) finalAvatarUrl = uploaded;
      }

      const { error } = await updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl,
        is_private: false, // Profiles are always public
      });

      if (error) {
        setErrorMsg(error);
      } else {
        if (onUpdated) onUpdated();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante il salvataggio del profilo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f4dedf] text-[#990f4b] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-editorial text-lg font-bold text-stone-900 leading-none">
                  Configura il Tuo Profilo
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Personalizza il tuo nome e la tua presentazione per la community
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5 text-xs text-stone-700 max-h-[80vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center gap-2 pb-1">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Clicca per cambiare immagine profilo"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[#990f4b] bg-stone-100 flex items-center justify-center shadow-md">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold font-editorial text-[#990f4b]">
                      {(fullName || profile.username).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1">
                  <Camera className="w-5 h-5" />
                  <span>Carica</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#990f4b] font-semibold hover:underline cursor-pointer"
              >
                Cambia foto profilo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
            </div>

            {/* Read-only Username */}
            <div>
              <label className="block font-semibold text-stone-800 mb-1">
                Username Community
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 font-mono text-xs">
                <span>@{profile.username}</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                L'identificativo univoco del tuo profilo per menzioni e ricerche.
              </p>
            </div>

            {/* Full Name / Chef Name */}
            <div>
              <label className="block font-semibold text-stone-800 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#990f4b]" />
                <span>Nome Completo o Nome Chef</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Es. Mario Rossi o Chef Mario"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b] transition-all shadow-2xs"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Il nome visibile con cui verrai presentato sopra le tue ricette e nel tuo profilo.
              </p>
            </div>

            {/* Description / Bio */}
            <div>
              <label className="block font-semibold text-stone-800 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#990f4b]" />
                <span>Descrizione del Profilo (Biografia)</span>
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Racconta la tua passione per la cucina, le tue origini gastronomiche, i piatti che ami preparare..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b] resize-none transition-all shadow-2xs"
              />
              <p className="text-[11px] text-stone-400 mt-1">
                Una breve presentazione per gli altri appassionati di cucina della community.
              </p>
            </div>

            {/* Public Profile Badge Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-2.5 text-emerald-950">
              <Globe className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-emerald-900">Profilo Aperto e Pubblico: </span>
                Il tuo profilo e le ricette che crei sono visibili pubblicamente agli altri cuochi della community.
              </div>
            </div>

            {/* Zona Pericolosa: Eliminazione Profilo */}
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50/50 space-y-3">
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Gestione Account & Zona di Rimozione</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Vuoi cancellare il tuo account e tutte le tue ricette personali in modo permanente?
              </p>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-red-300 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina Profilo e Ricettario</span>
              </button>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-stone-600 hover:text-stone-800 font-medium cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Salva Configurazione</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Irreversible Confirmation Modal */}
      <DeleteProfileConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onDeleted={() => {
          setIsDeleteConfirmOpen(false);
          onClose();
          if (onAccountDeleted) onAccountDeleted();
        }}
      />
    </>
  );
};
