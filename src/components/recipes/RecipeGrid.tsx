import React from 'react';
import { ChefHat, SearchX, Plus } from 'lucide-react';
import { Recipe } from '../../types/recipe';
import { RecipeCard } from './RecipeCard';
import { SkeletonCard } from '../ui/SkeletonCard';

interface RecipeGridProps {
  recipes: Recipe[];
  isLoading: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onAuthorClick?: (author: { id: string; username: string; full_name?: string; avatar_url?: string; bio?: string }) => void;
  onOpenAddModal: () => void;
  onClearFilters: () => void;
  hasFiltersApplied: boolean;
}

export const RecipeGrid: React.FC<RecipeGridProps> = ({
  recipes,
  isLoading,
  onSelectRecipe,
  onAuthorClick,
  onOpenAddModal,
  onClearFilters,
  hasFiltersApplied,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-[#d27f87]/50 max-w-lg mx-auto shadow-xs">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#faf7f7] border border-[#d27f87]/30 flex items-center justify-center text-[#990f4b] mb-4">
          {hasFiltersApplied ? (
            <SearchX className="w-8 h-8 stroke-[1.5]" />
          ) : (
            <ChefHat className="w-8 h-8 stroke-[1.5]" />
          )}
        </div>
        <h3 className="font-editorial text-xl font-bold text-stone-900 mb-2">
          {hasFiltersApplied ? 'Nessuna ricetta trovata' : 'Il tuo ricettario è ancora vuoto'}
        </h3>
        <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">
          {hasFiltersApplied
            ? 'Prova a modificare i termini di ricerca o a selezionare una categoria diversa.'
            : 'Inizia subito ad aggiungere le tue creazioni culinarie per averle sempre a portata di mano.'}
        </p>

        {hasFiltersApplied ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            Azzera filtri di ricerca
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Aggiungi la tua prima ricetta
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onSelect={onSelectRecipe}
          onAuthorClick={onAuthorClick}
        />
      ))}
    </div>
  );
};
