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
  ExternalLink,
  Flame,
  Clock,
  Users,
  Lock,
  Globe,
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
  onShareProfile,
}) => {
  const { user: currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Tutte');
  const [copiedShare, setCopiedShare] = useState(false);

  const isOwner = Boolean(
    currentUser && (currentUser.id === profile.id || currentUser.user_metadata?.username === profile.username)
  );

  const isPrivateAndNotOwner = Boolean(profile.is_private && !isOwner);

  // Filter recipes created by this user
  const userRecipes = useMemo(() => {
    if (isPrivateAndNotOwner) return [];
    return recipes.filter((r) => {
      if (r.user_id && r.user_id === profile.id) return true;
      if (r.author?.username && r.author.username.toLowerCase() === profile.username.toLowerCase()) return true;
      // If owner and recipes have no user_id or match
      if (isOwner && !r.user_id) return true;
      return false;
    });
  }, [recipes, profile, isOwner, isPrivateAndNotOwner]);

  const filteredRecipes = useMemo(() => {
    if (activeCategory === 'Tutte') return userRecipes;
    return userRecipes.filter((r) => r.category === activeCategory);
  }, [userRecipes, activeCategory]);

  const categories: FilterCategory[] = ['Tutte', 'Antipasti', 'Primi', 'Secondi', 'Dolci'];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
    if (onShareProfile) onShareProfile(profile.username);
  };

  // If the account is marked private by the chef and the current viewer is not the owner:
  if (isPrivateAndNotOwner) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200 max-w-2xl mx-auto py-4">
        {/* Back button */}
        <div>
          <button
            type="button"
            onClick={onBackToFeed}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-[#990f4b] hover:bg-[#faf7f7] border border-stone-200 transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Torna a Esplora Ricette</span>
          </button>
        </div>

        {/* Private Profile Screen */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-stone-200 shadow-sm text-center flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-3 border-stone-300 bg-stone-100 flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || profile.username}
                  className="w-full h-full object-cover blur-xs opacity-75"
                />
              ) : (
                <div className="w-full h-full bg-[#f4dedf]/60 flex items-center justify-center text-[#990f4b] font-editorial text-3xl font-bold">
                  {(profile.full_name || profile.username).slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900">
            {profile.full_name || profile.username}
          </h1>
          <p className="text-sm font-semibold text-[#990f4b] mt-0.5">
            @{profile.username}
          </p>

          <div className="mt-6 p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 max-w-md">
            <div className="flex items-center justify-center gap-2 text-amber-900 font-bold text-sm mb-1.5">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Questo Profilo è Privato</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Lo chef ha impostato il proprio ricettario come privato. Le ricette, le dosi e i dettagli gastronomici sono riservati e consultabili unicamente dal titolare dell'account.
            </p>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={onBackToFeed}
              className="px-6 py-2.5 rounded-xl font-semibold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs text-xs transition-colors cursor-pointer"
            >
              Torna a Esplora Ricette
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBackToFeed}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-600 hover:text-[#990f4b] hover:bg-[#faf7f7] border border-stone-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Torna a Esplora Ricette</span>
        </button>
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
                  <span
                    onClick={isOwner ? onOpenEditProfile : undefined}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                      profile.is_private
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    } ${isOwner ? 'cursor-pointer hover:opacity-80' : ''}`}
                    title={isOwner ? 'Clicca su Modifica Profilo per cambiare visibilità' : undefined}
                  >
                    {profile.is_private ? (
                      <Lock className="w-3 h-3 text-amber-700" />
                    ) : (
                      <Globe className="w-3 h-3 text-emerald-700" />
                    )}
                    <span>{profile.is_private ? 'Privato' : 'Pubblico'}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {isOwner ? (
                  <button
                    type="button"
                    onClick={onOpenEditProfile}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#d27f87] text-[#990f4b] hover:bg-[#faf7f7] shadow-2xs transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifica Profilo</span>
                  </button>
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

            {/* Bio */}
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed pt-1">
              {profile.bio || 'Appassionato della buona tavola e del ricettario italiano.'}
            </p>

            {/* Meta badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-stone-500 tabular-nums">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#990f4b]" />
                <strong className="text-stone-800">{userRecipes.length}</strong> ricette create
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#c05f72]" />
                <span>Membro della Community</span>
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
              {isOwner ? 'Le Mie Ricette' : `Ricette di @${profile.username}`}
            </h2>
            <p className="text-xs text-stone-500">
              {userRecipes.length === 1
                ? '1 creazione gastronomica pubblicata'
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

                  {/* Quick Owner Actions */}
                  {isOwner && (
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onEditRecipe(recipe)}
                        className="px-2.5 py-1 text-stone-600 hover:text-[#990f4b] hover:bg-[#faf7f7] rounded-lg transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modifica</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteRecipe(recipe.id)}
                        className="px-2.5 py-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-semibold cursor-pointer"
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
          <div className="p-12 text-center bg-stone-50/60 rounded-3xl border border-dashed border-stone-200">
            <ChefHat className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-base font-bold font-editorial text-stone-700">
              Nessuna ricetta in questa categoria
            </p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {isOwner
                ? 'Clicca su "+ Nuova Ricetta" nella barra in alto per aggiungere la tua prima delizia culinaria!'
                : `Questo chef non ha ancora pubblicato ricette per ${activeCategory.toLowerCase()}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
