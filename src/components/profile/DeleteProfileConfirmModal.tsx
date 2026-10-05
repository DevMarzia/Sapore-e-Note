import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DeleteProfileConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteProfileConfirmModal: React.FC<DeleteProfileConfirmModalProps> = ({
  isOpen,
  onClose,
  onDeleted,
}) => {
  const { profile, deleteAccount } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !profile) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMsg('');
    try {
      const { error } = await deleteAccount();
      if (error) {
        setErrorMsg(error);
        setIsDeleting(false);
      } else {
        onDeleted();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore durante la cancellazione del profilo.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-red-100 bg-red-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-900 font-bold text-sm font-editorial">
            <div className="w-8 h-8 rounded-xl bg-red-200/80 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-700 stroke-[2.5]" />
            </div>
            <span>Eliminazione Definitiva Profilo</span>
          </div>

          {!isDeleting && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-red-100 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-stone-700">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800">
              {errorMsg}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
            <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Attenzione: Operazione Irreversibile</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Stai per eliminare definitivamente il profilo di <strong className="font-semibold text-stone-900">@{profile.username}</strong>.
            </p>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Questa azione cancellerà <strong>in modo permanente e persistente</strong>:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
              <li>I tuoi dati personali e la tua biografia</li>
              <li>La tua foto profilo da Supabase Storage</li>
              <li><strong>Tutte le ricette</strong> che hai creato e custodito nel tuo ricettario</li>
            </ul>
          </div>

          <p className="text-stone-500 text-[11px] leading-relaxed">
            Una volta confermata la cancellazione, i dati non potranno più essere recuperati o ripristinati.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Annulla, tieni il profilo
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-5 py-2.5 rounded-xl font-semibold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Eliminazione in corso...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Sì, elimina definitivamente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
