import React, { useState, useEffect } from 'react';
import { X, Database, CheckCircle2, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import {
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  isSupabaseConfigured,
} from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.key);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomSupabaseCredentials(url, anonKey);
    setIsSaved(true);
    onConfigUpdated();
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleResetToLocal = () => {
    clearCustomSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    onConfigUpdated();
  };

  const sqlCode = `-- Tabella recipes con colonne calories e nutrition integrate
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Antipasti', 'Primi', 'Secondi', 'Dolci')),
    image_url TEXT,
    source_url TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    prep_time TEXT,
    servings INT DEFAULT 4,
    calories INT DEFAULT 0,
    nutrition JSONB,
    source_type TEXT DEFAULT 'manual'
);

ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS calories INT DEFAULT 0;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS nutrition JSONB;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accesso pubblico" ON public.recipes FOR ALL USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Storage pubblico" ON storage.objects FOR ALL USING (bucket_id = 'recipe-images');`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#990f4b]/10 text-[#990f4b] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-editorial text-lg font-bold text-stone-900">
                Integrazione Supabase
              </h2>
              <p className="text-[11px] text-stone-500">
                Database PostgreSQL + Storage bucket per le immagini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700">
          {/* Status banner */}
          <div
            className={`p-3 rounded-xl border flex items-center gap-3 ${
              isConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold">
                {isConfigured
                  ? 'Client Supabase configurato e attivo'
                  : 'Modalità Locale / Fallback attiva'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isConfigured
                  ? 'Le ricette e le immagini vengono salvate direttamente nel tuo database Supabase.'
                  : 'Puoi usare l\'app al 100%: le ricette create vengono memorizzate nel browser (LocalStorage) e convertite in locale.'}
              </p>
            </div>
          </div>

          {/* Config credentials form */}
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Project URL (es. https://xyzcompany.supabase.co)
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#990f4b] focus:border-[#990f4b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Anon Public Key (eyJhbGciOi...)
              </label>
              <input
                type="text"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#990f4b] focus:border-[#990f4b]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleResetToLocal}
                className="text-stone-500 hover:text-stone-700 underline text-xs cursor-pointer"
              >
                Ripristina modalità locale
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#990f4b] hover:bg-[#ad3d5e] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{isSaved ? 'Salvato!' : 'Salva Credenziali'}</span>
              </button>
            </div>
          </form>

          {/* SQL Setup Script */}
          <div className="border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-stone-800 text-xs">
                Script SQL per Supabase (supabase_setup.sql)
              </span>
              <button
                type="button"
                onClick={copySql}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiato!' : 'Copia SQL'}</span>
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-stone-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-36 leading-relaxed">
              {sqlCode}
            </pre>
            <p className="text-[11px] text-stone-500 mt-2 flex items-center gap-1">
              <span>Esegui lo script nel SQL Editor di</span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[#990f4b] hover:underline inline-flex items-center gap-0.5 font-medium"
              >
                Supabase Dashboard <ExternalLink className="w-3 h-3 inline" />
              </a>
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
