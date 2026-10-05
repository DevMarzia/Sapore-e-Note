import React from 'react';
import { ChefHat, RotateCcw } from 'lucide-react';

interface FooterProps {
  onResetDemo: () => void;
  onOpenConfig: () => void;
  totalRecipes: number;
}

export const Footer: React.FC<FooterProps> = ({ onResetDemo, onOpenConfig, totalRecipes }) => {
  return (
    <footer className="mt-20 border-t border-[#d27f87]/30 bg-white/60 backdrop-blur-xs py-8 text-stone-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-[#990f4b]" />
          <span className="font-editorial text-sm font-semibold text-stone-800">Sapore & Note</span>
          <span className="text-stone-300">·</span>
          <span>{totalRecipes} {totalRecipes === 1 ? 'ricetta salvata' : 'ricette salvate'}</span>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onOpenConfig}
            className="hover:text-[#990f4b] transition-colors"
          >
            Configurazione Supabase
          </button>
          <span className="text-stone-300">·</span>
          <button
            type="button"
            onClick={onResetDemo}
            className="flex items-center gap-1.5 hover:text-[#990f4b] transition-colors"
            title="Ripristina ricette dimostrative originali"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Ripristina Demo</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
