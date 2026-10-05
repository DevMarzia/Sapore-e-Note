import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Share2,
  Edit3,
  BookOpen,
  Sparkles,
  ChefHat,
  Trash2,
  Globe,
  Plus,
  Flame,
  Clock,
  Users,
  Settings,
} from 'lucide-react';
import { Recipe, UserProfile, FilterCategory } from '../../types/recipe';
import { useAuth } from '../../context/AuthContext';

interface UserProfileViewProps {
  profile: UserProfile;
  recipes: Recipe[];
  onBackToFeed: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
  onOpenEditProfile: () => void;
  onOpenAddModal?: () => void;
  onShareProfile?: (username: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  profile,
  recipes,
  onBackToFeed,
  onSelectRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onOpenEditProfile,
  onOpenAddModal,
  onShareProfile,
}) => {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Tutte');
  const [copiedShare, setCopiedShare] = useState(false);

  // Check if viewing own profile
  const isOwner = Boolean(
    currentUser &&
      (currentUser.id === profile.id ||
        (currentProfile?.username &&
          currentProfile.username.toLowerCase() === profile.username.toLowerCase()) ||
        (currentUser.user_metadata?.username &&
          currentUser.user_metadata.username.toLowerCase() === profile.username.toLowerCase()))
  );

  // Strict filtering of recipes for this profile
  const userRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // Direct user_id match
      if (r.user_id && profile.id && r.user_id === profile.id) return true;

      // Author username match
      if (
        r.author?.username &&
        profile.username &&
        r.author.username.toLowerCase() === profile.username.toLowerCase()
      ) {
        return true;
      }

      // Author ID match
      if (r.author?.id && profile.id && r.author.id === profile.id) {
        return true;
      }

      return false;
    });
  }, [recipes, profile]);

  const filteredRecipes = useMemo(() => {
    if (activeCategory === 'Tutte') return userRecipes;
    return userRecipes.filter((r) => r.category === activeCategory);
  }, [userRecipes, activeCategory]);

  const categories: FilterCategory[] = ['Tutte', 'Antipasti', 'Primi', 'Secondi', 'Dolci'];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + '#profile-' + profile.username);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
    if (onShareProfile) onShareProfile(profile.username);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation Bar with Back Button & Context Badge */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToFeed}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-[#990f4b] hover:bg-white border border-stone-200 transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Torna a Esplora Ricette</span>
        </button>

        <div className="text-xs text-stone-500 font-medium">
          {isOwner ? (
            <span className="inline-flex items-center gap-1.5 text-[#990f4b] font-semibold bg-[#f4dedf]/70 px-3 py-1 rounded-full border border-[#d27f87]/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Il Tuo Ricettario Personale</span>
            </span>
          ) : (
            <span className="text-stone-500">
              Profilo pubblico di <strong className="text-stone-800">@{profile.username}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-white via-[#fcf9f9] to-[#f7eeee] border border-stone-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Large Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-3 border-[#990f4b] bg-white shadow-md flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#f4dedf] flex items-center justify-center text-[#990f4b] font-editorial text-3xl font-bold">
                  {(profile.full_name || profile.username).slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#990f4b] text-white flex items-center justify-center shadow-xs border-2 border-white">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                  {profile.full_name || profile.username}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                  <p className="text-sm font-semibold text-[#990f4b]">
                    @{profile.username}
                  </p>
                  {/* Public Badge */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <Globe className="w-3 h-3 text-emerald-700" />
                    <span>Profilo Pubblico</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={onOpenEditProfile}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#d27f87] text-[#990f4b] hover:bg-[#faf7f7] shadow-2xs transition-colors cursor-pointer"
                      title="Configura nome, descrizione e foto"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configura Profilo</span>
                    </button>

                    {onOpenAddModal && (
                      <button
                        type="button"
                        onClick={onOpenAddModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Aggiungi Ricetta</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#990f4b]" />
                    <span>{copiedShare ? 'Link Copiato!' : 'Condividi Profilo'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Description / Bio */}
            <div className="pt-1">
              {profile.bio ? (
                <p className="text-xs sm:text-sm text-stone-700 max-w-2xl leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              ) : isOwner ? (
                <p className="text-xs text-stone-400 italic max-w-2xl leading-relaxed">
                  Nessuna descrizione inserita. Clicca su{' '}
                  <button
                    type="button"
                    onClick={onOpenEditProfile}
                    className="text-[#990f4b] underline font-medium hover:text-[#ad3d5e] cursor-pointer"
                  >
                    "Configura Profilo"
                  </button>{' '}
                  per aggiungere una presentazione e far conoscere la tua passione per la cucina.
                </p>
              ) : (
                <p className="text-xs text-stone-500 italic">
                  Nessuna descrizione disponibile per questo chef.
                </p>
              )}
            </div>

            {/* Meta badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-stone-500 tabular-nums">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#990f4b]" />
                <strong className="text-stone-800">{userRecipes.length}</strong>{' '}
                {userRecipes.length === 1 ? 'ricetta salvata' : 'ricette salvate'}
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#c05f72]" />
                <span>{isOwner ? 'Il Tuo Spazio Personale' : 'Membro della Community'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Recipes Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <h2 className="font-editorial text-xl font-bold text-stone-900">
              {isOwner ? 'Le Mie Ricette Personali' : `Ricette di @${profile.username}`}
            </h2>
            <p className="text-xs text-stone-500">
              {isOwner
                ? 'Tutte le ricette create da te e custodite nel tuo ricettario'
                : `${userRecipes.length} creazioni gastronomiche pubblicate`}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const count = cat === 'Tutte' ? userRecipes.length : userRecipes.filter((r) => r.category === cat).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#990f4b] text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="group bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md hover:border-[#d27f87] transition-all flex flex-col cursor-pointer"
                onClick={() => onSelectRecipe(recipe)}
              >
                <div className="relative w-full h-48 bg-stone-100 overflow-hidden">
                  <img
                    src={recipe.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-white/95 text-[#990f4b] border border-stone-200 shadow-2xs backdrop-blur-xs">
                      {recipe.category}
                    </span>
                  </div>

                  {recipe.nutrition && (
                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-stone-900/80 text-white backdrop-blur-xs shadow-xs tabular-nums">
                        <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {Math.round(recipe.nutrition.calories / (recipe.servings || 4))} kcal
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-editorial text-base font-bold text-stone-900 group-hover:text-[#990f4b] transition-colors line-clamp-2">
                      {recipe.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-stone-500 tabular-nums">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#c05f72]" />
                        <span>{recipe.prep_time || '30 min'}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#c05f72]" />
                        <span>{recipe.servings || 4} porz.</span>
                      </span>
                    </div>
                  </div>

                  {/* Owner Controls on Card (Edit & Delete) */}
                  {isOwner && (
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onEditRecipe(recipe)}
                        className="px-2.5 py-1 text-stone-700 hover:text-[#990f4b] hover:bg-[#faf7f7] rounded-lg transition-colors flex items-center gap-1 font-semibold cursor-pointer border border-stone-200"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#990f4b]" />
                        <span>Modifica</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Sei sicuro di voler eliminare la ricetta "${recipe.title}"?`)) {
                            onDeleteRecipe(recipe.id);
                          }
                        }}
                        className="px-2.5 py-1 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Elimina</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State for user recipes */
          <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-stone-200 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-[#f4dedf] text-[#990f4b] flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold font-editorial text-stone-800">
              {isOwner
                ? 'Non hai ancora aggiunto ricette al tuo ricettario'
                : `Nessuna ricetta trovata per ${activeCategory !== 'Tutte' ? activeCategory.toLowerCase() : 'questo chef'}`}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
              {isOwner
                ? 'Salva la tua prima delizia culinaria o importa un piatto da Instagram Reel o da un sito web per iniziare la tua collezione personale.'
                : 'Questo chef non ha ancora ricette salvate in questa categoria.'}
            </p>

            {isOwner && onOpenAddModal && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs text-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crea la tua prima ricetta</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
