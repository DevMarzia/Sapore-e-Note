import React, { useState } from 'react';
import { Clock, Users, UtensilsCrossed, Sparkles, Flame, Instagram, Globe, User } from 'lucide-react';
import { Recipe, UserProfile } from '../../types/recipe';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onAuthorClick?: (author: UserProfile) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect, onAuthorClick }) => {
  const [imageError, setImageError] = useState(false);

  // Category subtle color accents
  const categoryAccents: Record<string, string> = {
    Antipasti: 'text-amber-800 bg-amber-50/90 border-amber-200/60',
    Primi: 'text-rose-800 bg-rose-50/90 border-rose-200/60',
    Secondi: 'text-emerald-800 bg-emerald-50/90 border-emerald-200/60',
    Dolci: 'text-purple-800 bg-purple-50/90 border-purple-200/60',
  };

  const badgeStyle = categoryAccents[recipe.category] || 'text-stone-800 bg-stone-100 border-stone-200';

  const totalCalories = typeof recipe.calories === 'number' && recipe.calories > 0
    ? recipe.calories
    : (recipe.nutrition?.calories ? Math.round(recipe.nutrition.calories) : null);

  const caloriesPerServing = totalCalories
    ? Math.round(totalCalories / Math.max(1, recipe.servings || 4))
    : null;

  return (
    <article
      onClick={() => onSelect(recipe)}
      className="group bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-[#d27f87] transition-all duration-200 flex flex-col h-full cursor-pointer hover:-translate-y-0.5"
    >
      {/* Recipe Image Slot */}
      <div className="relative w-full h-52 bg-stone-100 overflow-hidden">
        {recipe.image_url && !imageError ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
        ) : (
          /* Styled Fallback Container per Zero-Broken-Image Policy */
          <div className="w-full h-full bg-linear-to-br from-[#faf7f7] via-[#f7eeee] to-[#f4dedf] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-white/80 border border-[#d27f87]/40 flex items-center justify-center text-[#990f4b] shadow-xs mb-2">
              <UtensilsCrossed className="w-6 h-6 stroke-[1.5]" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#990f4b]">
              {recipe.category}
            </span>
          </div>
        )}

        {/* Category Pill Tag Overlay */}
        <div className="absolute top-3 left-3">
          <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-md border backdrop-blur-xs shadow-xs ${badgeStyle}`}>
            {recipe.category}
          </span>
        </div>

        {/* Source Badge (Instagram Reel or Website) */}
        {recipe.source_url && (
          <div className="absolute top-3 right-3">
            {recipe.source_type === 'website' || (!recipe.source_url.includes('instagram.com') && recipe.source_type !== 'instagram') ? (
              <span
                title="Importata da Sito Web"
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white/95 text-sky-800 border border-sky-200 backdrop-blur-xs shadow-xs"
              >
                <Globe className="w-3 h-3 text-sky-600" />
                <span>Web</span>
              </span>
            ) : (
              <span
                title="Importata da Instagram Reel"
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md bg-white/95 text-pink-700 border border-pink-200 backdrop-blur-xs shadow-xs"
              >
                <Instagram className="w-3 h-3 text-pink-600" />
                <span>Reel</span>
              </span>
            )}
          </div>
        )}

        {/* Nutrition Calorie Overlay (if calculated) */}
        {caloriesPerServing && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-stone-900/80 text-white backdrop-blur-xs shadow-xs tabular-nums">
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              {caloriesPerServing} kcal
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-editorial text-lg font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-[#990f4b] transition-colors">
          {recipe.title}
        </h3>

        {/* Unboxed Metadata with Typographic Separator Discipline */}
        <div className="mt-2.5 flex items-center gap-2 text-xs text-stone-500 tabular-nums">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#c05f72]" />
            <span>{recipe.prep_time || '30 min'}</span>
          </span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#c05f72]" />
            <span>{recipe.servings || 4} porzioni</span>
          </span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span>{recipe.ingredients.length} ingredienti</span>
        </div>

        {/* Ingredients Quick Teaser */}
        <p className="mt-3 text-xs text-stone-600 line-clamp-2 leading-relaxed">
          {recipe.ingredients.map((i) => i.name).slice(0, 4).join(', ')}
          {recipe.ingredients.length > 4 ? '...' : ''}
        </p>

        {/* Card Footer CTA */}
        <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-[#990f4b]">
          {recipe.author ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (recipe.author && onAuthorClick) {
                  onAuthorClick(recipe.author);
                }
              }}
              className="flex items-center gap-1.5 text-stone-600 hover:text-[#990f4b] transition-colors truncate max-w-[140px]"
            >
              {recipe.author.avatar_url ? (
                <img
                  src={recipe.author.avatar_url}
                  alt={recipe.author.username}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span className="truncate">@{recipe.author.username}</span>
            </button>
          ) : (
            <span className="group-hover:underline">Vedi ricetta</span>
          )}
          <span className="inline-flex items-center gap-1 text-[#990f4b] font-medium ml-auto">
            <span>Nutrizione</span>
            <Sparkles className="w-3.5 h-3.5 text-[#c05f72] opacity-70 group-hover:opacity-100 transition-opacity" />
          </span>
        </div>
      </div>
    </article>
  );
};

