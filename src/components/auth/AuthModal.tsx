import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Sparkles, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { signIn, signUp, signInWithGoogle } = useAuth();

  // Reset all fields so no sensitive credentials remain in memory or in the form
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setUsername('');
    setFullName('');
    setErrorMsg('');
  };

  // Reset form whenever modal opens or closes or defaultTab changes
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setActiveTab(defaultTab);
    } else {
      resetForm();
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (error) {
      setErrorMsg(error);
    } else {
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Inserisci sia email che password.');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password || !username.trim()) {
      setErrorMsg('Tutti i campi obbligatori devono essere compilati.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La password deve avere almeno 6 caratteri.');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, username, fullName);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error);
    } else {
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-[#990f4b] text-white p-6 pb-7">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#e39e9c]" />
            </div>
            <span className="font-editorial text-xl font-bold tracking-tight">Sapore & Note</span>
          </div>

          <h2 className="text-lg font-bold">
            {activeTab === 'login' ? 'Bentornato nel Ricettario' : 'Entra nella Community'}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {activeTab === 'login'
              ? 'Accedi per salvare, condividere e gestire le tue ricette culinarie.'
              : 'Crea il tuo profilo personale e scopri le delizie degli altri chef.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setPassword('');
              setShowPassword(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-[#990f4b] border-b-2 border-[#990f4b]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setPassword('');
              setShowPassword(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'bg-white text-[#990f4b] border-b-2 border-[#990f4b]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Registrati
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="mb-5">
            <button
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-xs shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{activeTab === 'login' ? 'Continua con Google' : 'Registrati con Google'}</span>
            </button>

            <div className="relative mt-4 flex items-center justify-center">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-2.5 text-[10px] text-stone-400 font-medium uppercase tracking-wider absolute">
                oppure con email
              </span>
            </div>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs text-stone-700">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="iltuonome@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                    title={showPassword ? 'Nascondi password' : 'Mostra password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Accedi al Ricettario</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs text-stone-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="es. Martina Russo"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Username <span className="text-[#990f4b]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-400 font-bold">@</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="martina_food"
                      className="w-full pl-7 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Email <span className="text-[#990f4b]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chef@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Password <span className="text-[#990f4b]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 6 caratteri"
                    className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                    title={showPassword ? 'Nascondi password' : 'Mostra password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Crea Profilo e Inizia</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-stone-100 text-center text-xs text-stone-500">
            <span>{activeTab === 'login' ? 'Non hai ancora un account? ' : 'Hai già un account? '}</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab(activeTab === 'login' ? 'register' : 'login');
                setPassword('');
                setShowPassword(false);
                setErrorMsg('');
              }}
              className="text-[#990f4b] font-semibold hover:underline cursor-pointer"
            >
              {activeTab === 'login' ? 'Crea un account' : 'Accedi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
