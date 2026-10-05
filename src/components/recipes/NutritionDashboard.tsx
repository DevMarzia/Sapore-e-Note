import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  Scale,
  Activity,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { Recipe, RecipeNutrition } from '../../types/recipe';
import {
  calculateRecipeNutrition,
  scaleNutrition,
  DAILY_RECOMMENDED,
} from '../../services/nutritionService';

interface NutritionDashboardProps {
  recipe: Recipe;
  onUpdateRecipeNutrition?: (nutrition: RecipeNutrition) => void;
  compact?: boolean;
}

type PortionMode = 'per_serving' | 'total' | 'custom_servings' | 'custom_grams';

export const NutritionDashboard: React.FC<NutritionDashboardProps> = ({
  recipe,
  onUpdateRecipeNutrition,
  compact = false,
}) => {
  const [nutrition, setNutrition] = useState<RecipeNutrition | null>(recipe.nutrition || null);
  const [isLoading, setIsLoading] = useState(!recipe.nutrition);
  const [portionMode, setPortionMode] = useState<PortionMode>('per_serving');
  const [customServings, setCustomServings] = useState<number>(recipe.servings || 4);
  const [customGrams, setCustomGrams] = useState<number>(250);
  const [showIngredientsDetail, setShowIngredientsDetail] = useState(false);
  const [showMicros, setShowMicros] = useState(true);

  // Compute or load nutrition
  const fetchNutrition = async () => {
    setIsLoading(true);
    try {
      const data = await calculateRecipeNutrition(recipe.ingredients, recipe.servings || 4);
      setNutrition(data);
      if (onUpdateRecipeNutrition) {
        onUpdateRecipeNutrition(data);
      }
    } catch (err) {
      console.error('Errore calcolo valori nutrizionali:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!recipe.nutrition) {
      fetchNutrition();
    } else {
      const nut = { ...recipe.nutrition };
      if (recipe.calories && (!nut.calories || nut.calories === 0)) {
        nut.calories = recipe.calories;
      }
      setNutrition(nut);
    }
  }, [recipe.id, recipe.ingredients, recipe.servings, recipe.calories, recipe.nutrition]);

  // Scaled nutritional values
  const scaled = useMemo(() => {
    if (!nutrition) return null;
    let customVal = customServings;
    if (portionMode === 'custom_grams') {
      customVal = customGrams;
    }
    return scaleNutrition(nutrition, recipe.servings || 4, portionMode, customVal);
  }, [nutrition, recipe.servings, portionMode, customServings, customGrams]);

  // Macro calorie energy ratios (Proteine: 4 kcal/g, Carbo: 4 kcal/g, Grassi: 9 kcal/g)
  const macroPercentages = useMemo(() => {
    if (!scaled || scaled.calories === 0) return { p: 0, c: 0, f: 0 };
    const pKcal = scaled.macros.proteins * 4;
    const cKcal = scaled.macros.carbohydrates * 4;
    const fKcal = scaled.macros.fats * 9;
    const totalMacroKcal = Math.max(1, pKcal + cKcal + fKcal);

    return {
      p: Math.round((pKcal / totalMacroKcal) * 100),
      c: Math.round((cKcal / totalMacroKcal) * 100),
      f: Math.round((fKcal / totalMacroKcal) * 100),
    };
  }, [scaled]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-44 bg-stone-200 rounded" />
          <div className="h-4 w-28 bg-stone-100 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-stone-100 rounded-xl" />
          ))}
        </div>
        <div className="h-24 bg-stone-50 rounded-xl mt-3" />
      </div>
    );
  }

  if (!nutrition || !scaled) {
    return (
      <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-center text-xs text-stone-500">
        Nessun dato nutrizionale disponibile.{' '}
        <button
          onClick={fetchNutrition}
          className="text-[#990f4b] underline font-medium cursor-pointer"
        >
          Calcola ora con API
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
      {/* Header with Title and Mode Badges */}
      <div className="p-5 sm:p-6 border-b border-stone-100 bg-linear-to-b from-[#faf7f7] to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#990f4b]/10 text-[#990f4b] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                Dashboard Nutrizionale & Calorie
              </h3>
              <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                <span>Dati calcolati dinamicamente via Open Food Facts API</span>
                <span className="text-stone-300">·</span>
                <button
                  type="button"
                  onClick={fetchNutrition}
                  title="Ricalcola dati dall'API"
                  className="inline-flex items-center gap-1 text-[11px] text-[#990f4b] hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Aggiorna
                </button>
              </p>
            </div>
          </div>

          <div className="text-xs text-stone-500 text-right sm:self-center">
            <span className="font-medium text-stone-800">{scaled.label}</span>
          </div>
        </div>

        {/* Dynamic Quantity Controller Controls */}
        <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/70 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPortionMode('per_serving')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              portionMode === 'per_serving'
                ? 'bg-[#990f4b] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            1 Porzione standard
          </button>

          <button
            type="button"
            onClick={() => setPortionMode('total')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              portionMode === 'total'
                ? 'bg-[#990f4b] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            Intera ricetta ({recipe.servings || 4} porzioni)
          </button>

          <button
            type="button"
            onClick={() => setPortionMode('custom_servings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              portionMode === 'custom_servings'
                ? 'bg-[#990f4b] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            Porzioni personalizzate
          </button>

          <button
            type="button"
            onClick={() => setPortionMode('custom_grams')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              portionMode === 'custom_grams'
                ? 'bg-[#990f4b] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            Grammi assunti
          </button>
        </div>

        {/* Dynamic Inputs when Custom mode is selected */}
        {portionMode === 'custom_servings' && (
          <div className="mt-3 p-3 bg-white rounded-xl border border-stone-200 flex items-center justify-between gap-4 animate-in fade-in duration-150">
            <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#c05f72]" /> Quante porzioni desideri calcolare?
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCustomServings(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    customServings === num
                      ? 'bg-[#990f4b] text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {num}
                </button>
              ))}
              <div className="flex items-center gap-1 pl-2 border-l border-stone-200">
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={customServings}
                  onChange={(e) => setCustomServings(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-14 px-2 py-1 text-xs border border-stone-300 rounded text-center font-bold"
                />
                <span className="text-[11px] text-stone-500">porzioni</span>
              </div>
            </div>
          </div>
        )}

        {portionMode === 'custom_grams' && (
          <div className="mt-3 p-3 bg-white rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#c05f72]" />
              <div>
                <span className="text-xs font-semibold text-stone-800">
                  Quantità di cibo cucinato o assunto
                </span>
                <span className="block text-[11px] text-stone-400">
                  (Peso totale ricetta: ~{nutrition.totalWeightGrams}g)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max={Math.max(800, nutrition.totalWeightGrams)}
                step="10"
                value={customGrams}
                onChange={(e) => setCustomGrams(parseInt(e.target.value, 10))}
                className="w-36 accent-[#990f4b]"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={customGrams}
                  onChange={(e) => setCustomGrams(Math.max(1, parseInt(e.target.value, 10) || 100))}
                  className="w-18 px-2 py-1 text-xs border border-stone-300 rounded text-center font-bold"
                />
                <span className="text-xs font-semibold text-stone-600">g</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Dynamic Calorie Hero Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4.5 bg-linear-to-br from-[#faf7f7] via-white to-[#fcedef] rounded-xl border border-[#d27f87]/30">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-xl bg-[#990f4b] text-white flex items-center justify-center shadow-xs">
              <Flame className="w-7 h-7 fill-white/20 stroke-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#990f4b] tabular-nums tracking-tight">
                  {scaled.calories}
                </span>
                <span className="text-sm font-bold text-stone-700 uppercase tracking-wider">
                  kcal
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Apporto energetico stimato · ca. {scaled.weightGrams}g di porzione
              </p>
            </div>
          </div>

          <div className="sm:border-l sm:border-[#d27f87]/30 sm:pl-6 text-xs text-stone-600 space-y-1">
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <span>Fabbisogno giornaliero (2000 kcal):</span>
              <strong className="text-stone-900 tabular-nums">
                {Math.round((scaled.calories / DAILY_RECOMMENDED.calories) * 100)}% VNR
              </strong>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#990f4b] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((scaled.calories / DAILY_RECOMMENDED.calories) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Macronutrients Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-[#c05f72]" /> Macronutrienti Principali
            </h4>
            <span className="text-[11px] text-stone-400">
              Rapporto energetico: {macroPercentages.p}% P · {macroPercentages.c}% C · {macroPercentages.f}% G
            </span>
          </div>

          {/* Visual Color Distribution Bar */}
          <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex mb-3.5 shadow-2xs">
            <div
              style={{ width: `${macroPercentages.p}%` }}
              className="bg-emerald-600 transition-all duration-300"
              title={`Proteine: ${macroPercentages.p}%`}
            />
            <div
              style={{ width: `${macroPercentages.c}%` }}
              className="bg-amber-500 transition-all duration-300"
              title={`Carboidrati: ${macroPercentages.c}%`}
            />
            <div
              style={{ width: `${macroPercentages.f}%` }}
              className="bg-[#990f4b] transition-all duration-300"
              title={`Grassi: ${macroPercentages.f}%`}
            />
          </div>

          {/* 4 Macro Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Proteine */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
                <span>Proteine</span>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>
              <div className="font-editorial text-xl font-bold text-stone-900 tabular-nums">
                {scaled.macros.proteins}
                <span className="text-xs font-sans font-normal text-stone-500 ml-0.5">g</span>
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                {Math.round((scaled.macros.proteins / DAILY_RECOMMENDED.proteins) * 100)}% VNR
              </span>
            </div>

            {/* Carboidrati */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70">
              <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-1">
                <span>Carboidrati</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="font-editorial text-xl font-bold text-stone-900 tabular-nums">
                {scaled.macros.carbohydrates}
                <span className="text-xs font-sans font-normal text-stone-500 ml-0.5">g</span>
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                di cui zuccheri: {scaled.macros.sugars}g
              </span>
            </div>

            {/* Grassi */}
            <div className="p-3.5 rounded-xl bg-[#faf2f4] border border-[#d27f87]/50">
              <div className="flex items-center justify-between text-xs text-[#990f4b] font-semibold mb-1">
                <span>Grassi Totali</span>
                <span className="w-2 h-2 rounded-full bg-[#990f4b]" />
              </div>
              <div className="font-editorial text-xl font-bold text-stone-900 tabular-nums">
                {scaled.macros.fats}
                <span className="text-xs font-sans font-normal text-stone-500 ml-0.5">g</span>
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                di cui saturi: {scaled.macros.saturatedFats}g
              </span>
            </div>

            {/* Fibre */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between text-xs text-stone-700 font-semibold mb-1">
                <span>Fibre</span>
                <span className="w-2 h-2 rounded-full bg-stone-400" />
              </div>
              <div className="font-editorial text-xl font-bold text-stone-900 tabular-nums">
                {scaled.macros.fiber}
                <span className="text-xs font-sans font-normal text-stone-500 ml-0.5">g</span>
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                {Math.round((scaled.macros.fiber / DAILY_RECOMMENDED.fiber) * 100)}% VNR
              </span>
            </div>
          </div>
        </div>

        {/* Micronutrients Section (Vitamins & Minerals) */}
        <div>
          <button
            type="button"
            onClick={() => setShowMicros(!showMicros)}
            className="flex items-center justify-between w-full py-2 text-xs font-bold text-stone-800 uppercase tracking-wider hover:text-[#990f4b] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#c05f72]" /> Micronutrienti, Minerali & Vitamine
            </span>
            {showMicros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMicros && (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 animate-in fade-in duration-150">
              <div className="p-2.5 bg-stone-50/70 rounded-lg border border-stone-200 text-xs">
                <span className="text-stone-500 block text-[11px]">Calcio</span>
                <span className="font-bold text-stone-900 tabular-nums text-sm">
                  {scaled.micros.calcium} mg
                </span>
                <span className="text-[10px] text-stone-400 block">
                  {Math.round((scaled.micros.calcium / DAILY_RECOMMENDED.calcium) * 100)}% VNR
                </span>
              </div>

              <div className="p-2.5 bg-stone-50/70 rounded-lg border border-stone-200 text-xs">
                <span className="text-stone-500 block text-[11px]">Ferro</span>
                <span className="font-bold text-stone-900 tabular-nums text-sm">
                  {scaled.micros.iron} mg
                </span>
                <span className="text-[10px] text-stone-400 block">
                  {Math.round((scaled.micros.iron / DAILY_RECOMMENDED.iron) * 100)}% VNR
                </span>
              </div>

              <div className="p-2.5 bg-stone-50/70 rounded-lg border border-stone-200 text-xs">
                <span className="text-stone-500 block text-[11px]">Potassio</span>
                <span className="font-bold text-stone-900 tabular-nums text-sm">
                  {scaled.micros.potassium} mg
                </span>
                <span className="text-[10px] text-stone-400 block">
                  {Math.round((scaled.micros.potassium / DAILY_RECOMMENDED.potassium) * 100)}% VNR
                </span>
              </div>

              <div className="p-2.5 bg-stone-50/70 rounded-lg border border-stone-200 text-xs">
                <span className="text-stone-500 block text-[11px]">Sodio</span>
                <span className="font-bold text-stone-900 tabular-nums text-sm">
                  {scaled.micros.sodium} mg
                </span>
                <span className="text-[10px] text-stone-400 block">
                  {Math.round((scaled.micros.sodium / DAILY_RECOMMENDED.sodium) * 100)}% VNR
                </span>
              </div>

              <div className="p-2.5 bg-stone-50/70 rounded-lg border border-stone-200 text-xs">
                <span className="text-stone-500 block text-[11px]">Vitamina C</span>
                <span className="font-bold text-stone-900 tabular-nums text-sm">
                  {scaled.micros.vitaminC} mg
                </span>
                <span className="text-[10px] text-stone-400 block">
                  {Math.round((scaled.micros.vitaminC / DAILY_RECOMMENDED.vitaminC) * 100)}% VNR
                </span>
              </div>

              <div className="p-2.5 bg-stone-50/70 rounded-lg border border-stone-200 text-xs">
                <span className="text-stone-500 block text-[11px]">Vitamina A</span>
                <span className="font-bold text-stone-900 tabular-nums text-sm">
                  {scaled.micros.vitaminA} µg
                </span>
                <span className="text-[10px] text-stone-400 block">
                  {Math.round((scaled.micros.vitaminA / DAILY_RECOMMENDED.vitaminA) * 100)}% VNR
                </span>
              </div>

              <div className="p-2.5 bg-stone-50/70 rounded-lg border border-stone-200 text-xs">
                <span className="text-stone-500 block text-[11px]">Magnesio</span>
                <span className="font-bold text-stone-900 tabular-nums text-sm">
                  {scaled.micros.magnesium} mg
                </span>
                <span className="text-[10px] text-stone-400 block">
                  {Math.round((scaled.micros.magnesium / DAILY_RECOMMENDED.magnesium) * 100)}% VNR
                </span>
              </div>

              <div className="p-2.5 bg-stone-50/70 rounded-lg border border-stone-200 text-xs flex flex-col justify-center">
                <span className="text-[10px] text-stone-400">Valori di Riferimento</span>
                <span className="text-stone-700 font-semibold text-[11px]">Reg. UE 1169/2011</span>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Breakdown per Ingredient (Collapsible) */}
        {!compact && (
          <div className="border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={() => setShowIngredientsDetail(!showIngredientsDetail)}
              className="flex items-center justify-between w-full py-1 text-xs font-bold text-stone-800 uppercase tracking-wider hover:text-[#990f4b] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#c05f72]" /> Dettaglio Calorie per Singolo Ingrediente
              </span>
              {showIngredientsDetail ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showIngredientsDetail && (
              <div className="mt-3 overflow-x-auto animate-in fade-in duration-150">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-400 font-semibold text-[11px]">
                      <th className="py-2 pr-3">Ingrediente</th>
                      <th className="py-2 px-2 text-right">Dose stimata</th>
                      <th className="py-2 px-2 text-right">Calorie</th>
                      <th className="py-2 px-2 text-right">Proteine</th>
                      <th className="py-2 px-2 text-right">Carboidrati</th>
                      <th className="py-2 px-2 text-right">Grassi</th>
                      <th className="py-2 pl-2 text-right">Origine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {nutrition.ingredientsBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="py-2 pr-3 font-medium text-stone-900">{item.name}</td>
                        <td className="py-2 px-2 text-right tabular-nums text-stone-500">
                          {item.estimatedGrams}g ({item.originalAmount})
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums font-bold text-[#990f4b]">
                          {item.calories} kcal
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">{item.macros.proteins}g</td>
                        <td className="py-2 px-2 text-right tabular-nums">{item.macros.carbohydrates}g</td>
                        <td className="py-2 px-2 text-right tabular-nums">{item.macros.fats}g</td>
                        <td className="py-2 pl-2 text-right text-[10px] text-stone-400">
                          {item.source === 'openfoodfacts-api' ? 'API OpenFoodFacts' : 'DB Nutrizionale'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
