import React from 'react';
import { Search, X } from 'lucide-react';
import { FilterCategory } from '../../types/recipe';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: FilterCategory;
  onCategoryChange: (category: FilterCategory) => void;
  categoryCounts: Record<FilterCategory, number>;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categoryCounts,
}) => {
  const categories: FilterCategory[] = ['Tutte', 'Antipasti', 'Primi', 'Secondi', 'Dolci'];

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cerca per titolo o ingrediente (es. basilico, funghi, mascarpone)..."
          className="w-full pl-10 pr-10 py-3 bg-white border border-[#d27f87]/40 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#990f4b]/20 focus:border-[#990f4b] transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
            title="Cancella ricerca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
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
    </div>
  );
};
