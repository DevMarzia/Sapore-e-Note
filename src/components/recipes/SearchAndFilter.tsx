import React from 'react';
import { Search, X, ChefHat, Utensils, Users } from 'lucide-react';
import { FilterCategory } from '../../types/recipe';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
  categoryCounts: Record<FilterCategory, number>;
  activeTab?: 'recipes' | 'chefs';
  onTabChange?: (tab: 'recipes' | 'chefs') => void;
  chefsCount?: number;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categoryCounts,
  activeTab = 'recipes',
  onTabChange,
  chefsCount = 0,
}) => {
  const categories: FilterCategory[] = ['Tutte', 'Antipasti', 'Primi', 'Secondi', 'Dolci'];

  return (
    <div className="space-y-4">
      {/* Mode Tabs: Esplora Ricette vs Esplora Creator */}
      {onTabChange && (
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200 shadow-2xs">
            <button
              type="button"
              onClick={() => onTabChange('recipes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'recipes'
                  ? 'bg-white text-[#990f4b] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Utensils className="w-4 h-4 text-[#990f4b]" />
              <span>Esplora Ricette</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                  activeTab === 'recipes' ? 'bg-[#f4dedf] text-[#990f4b]' : 'bg-stone-200 text-stone-600'
                }`}
              >
                {categoryCounts.Tutte}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('chefs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'chefs'
                  ? 'bg-white text-[#990f4b] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-4 h-4 text-[#990f4b]" />
              <span>Creator & Profili</span>
              {chefsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                    activeTab === 'chefs' ? 'bg-[#f4dedf] text-[#990f4b]' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {chefsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Unified Search Input Bar */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            activeTab === 'chefs'
              ? 'Cerca chef o creator per nome o @username...'
              : 'Cerca per titolo, ingrediente o autore (es. basilico, funghi, @martina_russo)...'
          }
          className="w-full pl-10 pr-10 py-3 bg-white border border-[#d27f87]/40 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b] transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            title="Cancella ricerca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Tabs (only when viewing recipes) */}
      {activeTab === 'recipes' && (
        <div className="flex items-center justify-center overflow-x-auto py-1 px-2 no-scrollbar">
          <div className="inline-flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-xl border border-stone-200/80">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const count = categoryCounts[cat] || 0;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onCategoryChange(cat)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#990f4b] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-200/70 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
