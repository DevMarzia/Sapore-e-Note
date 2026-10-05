import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, Check, Lock, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { profile, updateProfile, uploadAvatar } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isPrivate, setIsPrivate] = useState<boolean>(profile?.is_private === true);
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        is_private: isPrivate,
      });

      if (error) {
        setErrorMsg(error);
      } else {
        if (onUpdated) onUpdated();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore salvataggio profilo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <h2 className="font-editorial text-lg font-bold text-stone-900">
            Modifica Profilo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs text-stone-700">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800">
              {errorMsg}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center gap-2 pb-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#d27f87] bg-stone-100 flex items-center justify-center shadow-xs">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold font-editorial text-[#990f4b]">
                    {(fullName || profile.username).slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
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

          <div>
            <label className="block font-semibold text-stone-800 mb-1">
              Username (non modificabile)
            </label>
            <input
              type="text"
              disabled
              value={`@${profile.username}`}
              className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Il tuo nome o nome chef"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">
              Biografia
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Raccontaci la tua passione per la cucina, i tuoi piatti forti o la tua regione..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b] resize-none"
            />
          </div>

          {/* Privacy Toggle Card */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isPrivate ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-semibold text-stone-900 text-xs">
                    {isPrivate ? 'Profilo Privato' : 'Profilo Pubblico'}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {isPrivate
                      ? 'Solo tu puoi vedere le tue ricette'
                      : 'Tutti possono vedere il tuo ricettario'}
                  </div>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isPrivate}
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 ${
                  isPrivate ? 'bg-amber-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[10px] text-stone-500 leading-normal pt-1 border-t border-stone-200/70">
              {isPrivate
                ? 'Con il profilo Privato, se altre persone cliccano sul tuo account vedranno una schermata di profilo riservato e non potranno accedere alle tue ricette.'
                : 'Con il profilo Pubblico, qualsiasi visitatore può consultare il tuo ricettario, le dosi e i tuoi passaggi.'}
            </p>
          </div>

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
              className="px-5 py-2 rounded-xl font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Salva Modifiche</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
