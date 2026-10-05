import React, { useState, useRef, useEffect } from 'react';
import { Plus, Database, Sparkles, LogOut, Settings, ChefHat, Compass, ChevronDown, BookMarked } from 'lucide-react';
import { FilterCategory } from '../../types/recipe';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenConfigModal: () => void;
  onOpenAuthModal: (tab?: 'login' | 'register') => void;
  onViewMyProfile: () => void;
  onViewFeed: () => void;
  activeCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  isSupabaseActive: boolean;
  isInProfileView?: boolean;
  isMyProfileView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenConfigModal,
  onOpenAuthModal,
  onViewMyProfile,
  onViewFeed,
  activeCategory,
  onSelectCategory,
  isSupabaseActive,
  isInProfileView = false,
  isMyProfileView = false,
}) => {
  const { user, profile, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const categories: FilterCategory[] = ['Tutte', 'Antipasti', 'Primi', 'Secondi', 'Dolci'];

  // Handle "+ Crea" click: if guest, prompt login/register modal; if logged in, open add recipe modal
  const handleCreateClick = () => {
    if (!user) {
      onOpenAuthModal('register');
    } else {
      onOpenAddModal();
    }
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#990f4b] text-white shadow-sm border-b border-[#ad3d5e]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark & Explore link */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div 
            onClick={onViewFeed}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Torna alla Home Community"
          >
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 group-hover:bg-white/15 transition-colors">
              <Sparkles className="w-5 h-5 text-[#e39e9c]" />
            </div>
            <div className="flex flex-col">
              <span className="font-editorial text-xl sm:text-2xl font-semibold tracking-tight text-white leading-none">
                Sapore & Note
              </span>
              <span className="text-[10px] text-[#e39e9c] font-medium tracking-wide">
                Social Ricettario
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={onViewFeed}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                !isInProfileView
                  ? 'bg-white/20 text-white shadow-2xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Esplora Ricette</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={onViewMyProfile}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isMyProfileView
                    ? 'bg-white text-[#990f4b] shadow-2xs font-bold'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>Il Mio Ricettario</span>
              </button>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Category Anchors (if in feed view) */}
        {!isInProfileView && (
          <nav className="hidden xl:flex items-center gap-5 text-xs sm:text-sm font-medium">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
                    isActive
                      ? 'text-white border-b-2 border-[#e39e9c] font-semibold'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Primary Actions & User Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Supabase status indicator */}
          <button
            type="button"
            onClick={onOpenConfigModal}
            title={isSupabaseActive ? 'Supabase attivo e connesso' : 'Modalità Locale attiva'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#e39e9c]" />
            <span className="hidden sm:inline">
              {isSupabaseActive ? 'Supabase' : 'Locale'}
            </span>
          </button>

          {/* Primary Action Button: "+ Crea" / "+ Nuova Ricetta" */}
          <button
            type="button"
            onClick={handleCreateClick}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white text-[#990f4b] hover:bg-[#faf7f7] shadow-xs hover:shadow transition-all whitespace-nowrap active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#990f4b] stroke-[2.5]" />
            <span className="hidden xs:inline">Nuova Ricetta</span>
            <span className="xs:hidden">Crea</span>
          </button>

          {/* Auth Section: Logged In Menu or Guest Login/Register */}
          {user ? (
            <div className="flex items-center gap-2" ref={menuRef}>
              {/* Prominent Profile Button */}
              <button
                type="button"
                onClick={onViewMyProfile}
                className={`flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isMyProfileView
                    ? 'bg-white text-[#990f4b] border-white shadow-xs'
                    : 'bg-white/15 hover:bg-white/25 border-white/20 text-white'
                }`}
                title="Vai al tuo ricettario personale"
              >
                <div className="w-6 h-6 rounded-lg overflow-hidden bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className={`text-xs font-bold ${isMyProfileView ? 'text-[#990f4b]' : 'text-white'}`}>
                      {(profile?.full_name || profile?.username || 'U').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-left hidden md:block leading-tight">
                  <p className="text-[10px] opacity-80 font-medium">Il Mio Ricettario</p>
                  <p className="text-xs font-bold truncate max-w-[100px]">
                    @{profile?.username || 'chef'}
                  </p>
                </div>
              </button>

              {/* User Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer text-white/80 hover:text-white"
                  title="Menu account"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-stone-800 shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {profile?.full_name || `@${profile?.username}`}
                      </p>
                      <p className="text-[11px] text-[#990f4b] font-semibold truncate">
                        @{profile?.username}
                      </p>
                    </div>

                    <div className="py-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onViewMyProfile();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2.5 font-semibold text-stone-800 cursor-pointer"
                      >
                        <ChefHat className="w-4 h-4 text-[#990f4b]" />
                        <span>Il Mio Ricettario Personale</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onViewFeed();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2.5 font-medium text-stone-700 cursor-pointer"
                      >
                        <Compass className="w-4 h-4 text-stone-400" />
                        <span>Esplora Community</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenConfigModal();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2.5 font-medium text-stone-700 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-stone-400" />
                        <span>Configura Supabase</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-stone-100 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2.5 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnetti</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Accedi
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal('register')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#e39e9c] hover:bg-[#d27f87] text-[#1e1b1b] shadow-2xs transition-colors cursor-pointer"
              >
                Registrati
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
