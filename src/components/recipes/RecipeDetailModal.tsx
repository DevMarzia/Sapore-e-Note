import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Users,
  Calendar,
  Trash2,
  CheckCircle2,
  Circle,
  UtensilsCrossed,
  Award,
  Activity,
  ChefHat,
  Flame,
  Instagram,
  Globe,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Recipe, RecipeNutrition } from '../../types/recipe';
import { NutritionDashboard } from './NutritionDashboard';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  onDeleteRecipe: (id: string) => void;
  onEditRecipe?: (recipe: Recipe) => void;
  onAuthorClick?: (author: { id: string; username: string; full_name?: string; avatar_url?: string; bio?: string }) => void;
  onUpdateNutrition?: (recipeId: string, nutrition: RecipeNutrition) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  onDeleteRecipe,
  onEditRecipe,
  onAuthorClick,
  onUpdateNutrition,
}) => {
  const [activeTab, setActiveTab] = useState<'recipe' | 'nutrition'>('recipe');
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageError, setImageError] = useState(false);

  const author = recipe?.author || (recipe?.user_id ? {
    id: recipe.user_id,
    username: 'chef_community',
    full_name: 'Chef Community',
    avatar_url: '',
    bio: '',
  } : null);

  useEffect(() => {
    // Reset checked state when opening a recipe
    setCheckedIngredients({});
    setCompletedSteps({});
    setConfirmDelete(false);
    setImageError(false);
    setActiveTab('recipe');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recipe, onClose]);

  if (!recipe) return null;

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      const allDone = recipe.steps.length > 0 && recipe.steps.every((s) => updated[s.id]);
      if (allDone && !prev[id]) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#990f4b', '#c05f72', '#e39e9c', '#f59e0b', '#10b981'],
        });
      }
      return updated;
    });
  };

  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;
  const completedStepCount = Object.values(completedSteps).filter(Boolean).length;
  const allStepsFinished = recipe.steps.length > 0 && completedStepCount === recipe.steps.length;

  const formattedDate = recipe.created_at
    ? new Date(recipe.created_at).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Sticky Header Close Bar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi finestra"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 shadow-md flex items-center justify-center transition-colors cursor-pointer border border-stone-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1">
          {/* Hero Image Section */}
          <div className="relative w-full h-64 sm:h-76 bg-stone-100">
            {recipe.image_url && !imageError ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                onError={() => setImageError(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-[#faf7f7] via-[#f7eeee] to-[#f4dedf] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white/90 border border-[#d27f87]/40 flex items-center justify-center text-[#990f4b] shadow-xs mb-3">
                  <UtensilsCrossed className="w-8 h-8 stroke-[1.5]" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider text-[#990f4b]">
                  {recipe.category}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-stone-950/75 via-stone-950/25 to-transparent" />

            {/* Badges and Title on Image Bottom */}
            <div className="absolute bottom-4 left-5 right-5 text-white">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-md bg-[#990f4b] text-white shadow-xs mb-2">
                {recipe.category}
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold leading-tight drop-shadow-xs">
                {recipe.title}
              </h2>
            </div>
          </div>

          {/* Navigation Tab Bar inside Modal */}
          <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 sm:px-8 py-2.5 flex items-center justify-between gap-4">
            <div className="inline-flex p-1 bg-stone-100/90 rounded-xl border border-stone-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('recipe')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'recipe'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5 text-[#990f4b]" />
                <span>Ricetta & Cucina</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('nutrition')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'nutrition'
                    ? 'bg-[#990f4b] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Dashboard Nutrizionale</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 tabular-nums">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#c05f72]" /> {recipe.prep_time || '30 min'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#c05f72]" /> {recipe.servings || 4} porzioni
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* VIEW 1: RECIPE & PREPARATION */}
            {activeTab === 'recipe' && (
              <>
                {/* Author Information Box */}
                {author && (
                  <div className="flex items-center justify-between p-3.5 bg-[#faf7f7] rounded-xl border border-[#d27f87]/30 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#d27f87] bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        {author.avatar_url ? (
                          <img src={author.avatar_url} alt={author.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-editorial text-sm font-bold text-[#990f4b]">
                            {(author.full_name || author.username).slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-stone-900 text-xs sm:text-sm">
                            {author.full_name || `@${author.username}`}
                          </p>
                          <span className="text-[10px] text-stone-400">· Chef Creatore</span>
                        </div>
                        <p className="text-[#990f4b] font-medium text-[11px]">
                          @{author.username}
                        </p>
                      </div>
                    </div>
                    {onAuthorClick && (
                      <button
                        type="button"
                        onClick={() => {
                          onAuthorClick(author);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#faf7f7] text-[#990f4b] border border-[#d27f87] font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        Vedi Profilo Chef
                      </button>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200/80 text-xs sm:text-sm text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#c05f72]" />
                    <span className="font-medium text-stone-900">Preparazione:</span>
                    <span>{recipe.prep_time || '30 min'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#c05f72]" />
                    <span className="font-medium text-stone-900">Dosi per:</span>
                    <span>{recipe.servings || 4} porzioni</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('nutrition')}
                    className="flex items-center gap-1 text-[#990f4b] font-semibold hover:underline cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-[#990f4b]" />
                    <span>Vedi Calorie e Macro</span>
                  </button>
                </div>

                {/* Source Banner (Website or Instagram) */}
                {recipe.source_url && (
                  recipe.source_type === 'website' || (!recipe.source_url.includes('instagram.com') && recipe.source_type !== 'instagram') ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-linear-to-r from-sky-50/90 via-indigo-50/60 to-white rounded-xl border border-sky-200 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-stone-900 block">
                            Ricetta importata da Sito Web
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Consulta la pagina originale e i suggerimenti dello chef
                          </span>
                        </div>
                      </div>
                      <a
                        href={recipe.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
                      >
                        <span>Apri Fonte Web</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-linear-to-r from-pink-50/90 via-purple-50/60 to-white rounded-xl border border-pink-200 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-amber-500 via-pink-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Instagram className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-stone-900 block">
                            Ricetta importata da Instagram Reel
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Guarda il Reel originale per visualizzare il video della ricetta
                          </span>
                        </div>
                      </div>
                      <a
                        href={recipe.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
                      >
                        <span>Apri su Instagram</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )
                )}

                {/* Ingredients Section with Interactive Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-editorial text-xl font-bold text-stone-900">
                        Ingredienti
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Spunta gli ingredienti man mano che li pesi o li aggiungi
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#faf7f7] border border-[#d27f87]/40 text-[#990f4b] tabular-nums">
                      {checkedCount} di {recipe.ingredients.length} pronti
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {recipe.ingredients.map((ing) => {
                      const isChecked = Boolean(checkedIngredients[ing.id]);
                      return (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => toggleIngredient(ing.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-stone-50/80 border-stone-200 text-stone-400'
                              : 'bg-white border-stone-200 hover:border-[#d27f87] text-stone-800 shadow-2xs'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckCircle2 className="w-4 h-4 text-[#990f4b]" />
                            ) : (
                              <Circle className="w-4 h-4 text-stone-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                            <span className={`text-xs sm:text-sm ${isChecked ? 'line-through' : 'font-medium'}`}>
                              {ing.name}
                            </span>
                            <span className="text-xs font-semibold text-[#c05f72] shrink-0 tabular-nums">
                              {ing.amount}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preparation Steps Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-editorial text-xl font-bold text-stone-900">
                        Passaggi di Preparazione
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Segui i passaggi numerati passo dopo passo
                      </p>
                    </div>
                    {allStepsFinished && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                        <Award className="w-3.5 h-3.5" />
                        Piatto pronto!
                      </span>
                    )}
                  </div>

                  <div className="space-y-3.5">
                    {recipe.steps.map((stepItem, index) => {
                      const isDone = Boolean(completedSteps[stepItem.id]);
                      return (
                        <div
                          key={stepItem.id}
                          onClick={() => toggleStep(stepItem.id)}
                          className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-50/40 border-emerald-200 text-stone-500'
                              : 'bg-white border-stone-200 hover:border-[#d27f87] text-stone-800 shadow-2xs'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#990f4b] text-white'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                            <p className={isDone ? 'line-through text-stone-400' : 'text-stone-800'}>
                              {stepItem.instruction}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: DYNAMIC NUTRITION DASHBOARD */}
            {activeTab === 'nutrition' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <NutritionDashboard
                  recipe={recipe}
                  onUpdateRecipeNutrition={(data) => {
                    if (onUpdateNutrition) {
                      onUpdateNutrition(recipe.id, data);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="p-4 sm:px-8 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between gap-3">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#990f4b]">Confermi l'eliminazione?</span>
              <button
                type="button"
                onClick={() => {
                  onDeleteRecipe(recipe.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#990f4b] text-white hover:bg-[#ad3d5e] transition-colors"
              >
                Sì, elimina
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200 transition-colors"
              >
                Annulla
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#990f4b] transition-colors p-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina ricetta</span>
              </button>

              {onEditRecipe && (
                <>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      onEditRecipe(recipe);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#990f4b] hover:text-[#ad3d5e] transition-colors p-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifica</span>
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {activeTab === 'recipe' ? (
              <button
                type="button"
                onClick={() => setActiveTab('nutrition')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#990f4b]/10 text-[#990f4b] hover:bg-[#990f4b]/20 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Activity className="w-3.5 h-3.5" /> Dashboard Nutrizionale
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('recipe')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChefHat className="w-3.5 h-3.5" /> Torna alla Preparazione
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-900 text-white transition-colors cursor-pointer"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
