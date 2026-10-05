import {
  Ingredient,
  IngredientNutrition,
  MacroNutrients,
  MicroNutrients,
  RecipeNutrition,
} from '../types/recipe';

interface NutritionPer100g {
  calories: number;
  proteins: number;
  carbs: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number; // mg
  potassium: number; // mg
  calcium: number; // mg
  iron: number; // mg
  vitaminC: number; // mg
  vitaminA: number; // mcg
  magnesium: number; // mg
}

// Built-in verified Nutritional Database (CREA / USDA values per 100g)
const BASE_NUTRITION_DB: Record<string, NutritionPer100g> = {
  pane: { calories: 265, proteins: 9.0, carbs: 49.0, sugars: 3.2, fat: 3.2, saturatedFat: 0.7, fiber: 2.7, sodium: 490, potassium: 115, calcium: 260, iron: 3.6, vitaminC: 0, vitaminA: 0, magnesium: 25 },
  pomodoro: { calories: 18, proteins: 0.9, carbs: 3.9, sugars: 2.6, fat: 0.2, saturatedFat: 0.03, fiber: 1.2, sodium: 5, potassium: 237, calcium: 10, iron: 0.3, vitaminC: 14, vitaminA: 42, magnesium: 11 },
  basilico: { calories: 23, proteins: 3.2, carbs: 2.7, sugars: 0.3, fat: 0.6, saturatedFat: 0.04, fiber: 1.6, sodium: 4, potassium: 295, calcium: 177, iron: 3.2, vitaminC: 18, vitaminA: 264, magnesium: 64 },
  aglio: { calories: 149, proteins: 6.4, carbs: 33.1, sugars: 1.0, fat: 0.5, saturatedFat: 0.09, fiber: 2.1, sodium: 17, potassium: 401, calcium: 181, iron: 1.7, vitaminC: 31, vitaminA: 0, magnesium: 25 },
  olio: { calories: 884, proteins: 0.0, carbs: 0.0, sugars: 0.0, fat: 100.0, saturatedFat: 14.0, fiber: 0.0, sodium: 2, potassium: 1, calcium: 1, iron: 0.6, vitaminC: 0, vitaminA: 0, magnesium: 0 },
  pasta: { calories: 355, proteins: 12.5, carbs: 71.0, sugars: 3.0, fat: 1.8, saturatedFat: 0.4, fiber: 3.2, sodium: 6, potassium: 210, calcium: 21, iron: 1.3, vitaminC: 0, vitaminA: 0, magnesium: 53 },
  tagliatelle: { calories: 365, proteins: 14.0, carbs: 68.0, sugars: 2.5, fat: 3.5, saturatedFat: 1.0, fiber: 3.0, sodium: 25, potassium: 190, calcium: 25, iron: 1.8, vitaminC: 0, vitaminA: 20, magnesium: 45 },
  funghi: { calories: 26, proteins: 3.7, carbs: 3.3, sugars: 1.7, fat: 0.4, saturatedFat: 0.05, fiber: 2.2, sodium: 5, potassium: 318, calcium: 3, iron: 0.5, vitaminC: 2.1, vitaminA: 0, magnesium: 9 },
  burro: { calories: 717, proteins: 0.9, carbs: 0.1, sugars: 0.1, fat: 81.1, saturatedFat: 51.4, fiber: 0.0, sodium: 11, potassium: 24, calcium: 24, iron: 0.02, vitaminC: 0, vitaminA: 684, magnesium: 2 },
  parmigiano: { calories: 431, proteins: 38.5, carbs: 4.1, sugars: 0.1, fat: 28.6, saturatedFat: 17.3, fiber: 0.0, sodium: 700, potassium: 125, calcium: 1184, iron: 0.9, vitaminC: 0, vitaminA: 280, magnesium: 44 },
  spigola: { calories: 97, proteins: 18.4, carbs: 0.6, sugars: 0.0, fat: 2.0, saturatedFat: 0.5, fiber: 0.0, sodium: 68, potassium: 256, calcium: 20, iron: 0.4, vitaminC: 0, vitaminA: 15, magnesium: 30 },
  patate: { calories: 77, proteins: 2.0, carbs: 17.5, sugars: 0.8, fat: 0.1, saturatedFat: 0.03, fiber: 2.2, sodium: 6, potassium: 421, calcium: 12, iron: 0.8, vitaminC: 19.7, vitaminA: 1, magnesium: 23 },
  olive: { calories: 145, proteins: 1.0, carbs: 3.8, sugars: 0.5, fat: 15.3, saturatedFat: 2.0, fiber: 3.3, sodium: 800, potassium: 42, calcium: 52, iron: 1.6, vitaminC: 0, vitaminA: 20, magnesium: 11 },
  vino: { calories: 82, proteins: 0.1, carbs: 2.6, sugars: 0.6, fat: 0.0, saturatedFat: 0.0, fiber: 0.0, sodium: 5, potassium: 71, calcium: 9, iron: 0.5, vitaminC: 0, vitaminA: 0, magnesium: 10 },
  savoiardi: { calories: 378, proteins: 8.5, carbs: 75.0, sugars: 42.0, fat: 3.8, saturatedFat: 1.2, fiber: 1.8, sodium: 110, potassium: 120, calcium: 45, iron: 1.2, vitaminC: 0, vitaminA: 40, magnesium: 15 },
  mascarpone: { calories: 455, proteins: 4.6, carbs: 3.0, sugars: 3.0, fat: 47.0, saturatedFat: 31.0, fiber: 0.0, sodium: 55, potassium: 110, calcium: 120, iron: 0.2, vitaminC: 0, vitaminA: 380, magnesium: 8 },
  uova: { calories: 155, proteins: 13.0, carbs: 1.1, sugars: 1.1, fat: 11.0, saturatedFat: 3.3, fiber: 0.0, sodium: 124, potassium: 126, calcium: 50, iron: 1.2, vitaminC: 0, vitaminA: 160, magnesium: 10 },
  zucchero: { calories: 387, proteins: 0.0, carbs: 100.0, sugars: 100.0, fat: 0.0, saturatedFat: 0.0, fiber: 0.0, sodium: 1, potassium: 2, calcium: 1, iron: 0.05, vitaminC: 0, vitaminA: 0, magnesium: 0 },
  caffe: { calories: 2, proteins: 0.1, carbs: 0.3, sugars: 0.0, fat: 0.0, saturatedFat: 0.0, fiber: 0.0, sodium: 2, potassium: 49, calcium: 2, iron: 0.01, vitaminC: 0, vitaminA: 0, magnesium: 3 },
  cacao: { calories: 228, proteins: 19.6, carbs: 57.9, sugars: 1.8, fat: 13.7, saturatedFat: 8.1, fiber: 33.2, sodium: 21, potassium: 1524, calcium: 128, iron: 13.9, vitaminC: 0, vitaminA: 0, magnesium: 499 },
  melanzane: { calories: 25, proteins: 1.0, carbs: 5.9, sugars: 3.5, fat: 0.2, saturatedFat: 0.03, fiber: 3.0, sodium: 2, potassium: 229, calcium: 9, iron: 0.2, vitaminC: 2.2, vitaminA: 1, magnesium: 14 },
  mozzarella: { calories: 280, proteins: 28.0, carbs: 3.1, sugars: 1.0, fat: 17.0, saturatedFat: 11.0, fiber: 0.0, sodium: 350, potassium: 95, calcium: 505, iron: 0.4, vitaminC: 0, vitaminA: 180, magnesium: 20 },
  riso: { calories: 360, proteins: 6.7, carbs: 80.4, sugars: 0.2, fat: 0.6, saturatedFat: 0.2, fiber: 1.0, sodium: 3, potassium: 103, calcium: 6, iron: 0.8, vitaminC: 0, vitaminA: 0, magnesium: 28 },
  zafferano: { calories: 310, proteins: 11.4, carbs: 65.4, sugars: 0.0, fat: 5.8, saturatedFat: 1.6, fiber: 3.9, sodium: 148, potassium: 1724, calcium: 111, iron: 11.1, vitaminC: 80.8, vitaminA: 27, magnesium: 264 },
  brodo: { calories: 7, proteins: 0.6, carbs: 0.4, sugars: 0.2, fat: 0.3, saturatedFat: 0.1, fiber: 0.0, sodium: 320, potassium: 45, calcium: 5, iron: 0.1, vitaminC: 0.5, vitaminA: 2, magnesium: 3 },
  cipolla: { calories: 40, proteins: 1.1, carbs: 9.3, sugars: 4.2, fat: 0.1, saturatedFat: 0.04, fiber: 1.7, sodium: 4, potassium: 146, calcium: 23, iron: 0.2, vitaminC: 7.4, vitaminA: 0, magnesium: 10 },
  manzo: { calories: 250, proteins: 26.0, carbs: 0.0, sugars: 0.0, fat: 15.0, saturatedFat: 6.0, fiber: 0.0, sodium: 72, potassium: 318, calcium: 18, iron: 2.6, vitaminC: 0, vitaminA: 0, magnesium: 21 },
  pollo: { calories: 165, proteins: 31.0, carbs: 0.0, sugars: 0.0, fat: 3.6, saturatedFat: 1.0, fiber: 0.0, sodium: 74, potassium: 256, calcium: 15, iron: 1.0, vitaminC: 0, vitaminA: 10, magnesium: 29 },
  latte: { calories: 64, proteins: 3.3, carbs: 4.8, sugars: 4.8, fat: 3.6, saturatedFat: 2.3, fiber: 0.0, sodium: 43, potassium: 157, calcium: 120, iron: 0.1, vitaminC: 1.0, vitaminA: 28, magnesium: 11 },
  farina: { calories: 364, proteins: 10.3, carbs: 76.3, sugars: 0.3, fat: 1.0, saturatedFat: 0.2, fiber: 2.7, sodium: 2, potassium: 107, calcium: 15, iron: 1.2, vitaminC: 0, vitaminA: 0, magnesium: 22 },
  gramigna: { calories: 355, proteins: 12.5, carbs: 71.5, sugars: 2.8, fat: 1.5, saturatedFat: 0.3, fiber: 3.0, sodium: 5, potassium: 180, calcium: 18, iron: 1.4, vitaminC: 0, vitaminA: 0, magnesium: 45 },
  salsiccia: { calories: 315, proteins: 16.2, carbs: 0.8, sugars: 0.4, fat: 28.0, saturatedFat: 10.5, fiber: 0.0, sodium: 850, potassium: 270, calcium: 18, iron: 1.5, vitaminC: 0.5, vitaminA: 5, magnesium: 18 },
  salsicce: { calories: 315, proteins: 16.2, carbs: 0.8, sugars: 0.4, fat: 28.0, saturatedFat: 10.5, fiber: 0.0, sodium: 850, potassium: 270, calcium: 18, iron: 1.5, vitaminC: 0.5, vitaminA: 5, magnesium: 18 },
  panna: { calories: 290, proteins: 2.5, carbs: 3.5, sugars: 3.5, fat: 30.0, saturatedFat: 19.0, fiber: 0.0, sodium: 40, potassium: 110, calcium: 90, iron: 0.1, vitaminC: 0.8, vitaminA: 320, magnesium: 10 },
  concentrato: { calories: 95, proteins: 4.5, carbs: 18.0, sugars: 12.0, fat: 0.5, saturatedFat: 0.1, fiber: 4.2, sodium: 60, potassium: 900, calcium: 35, iron: 2.8, vitaminC: 22.0, vitaminA: 85, magnesium: 30 },
  pepe: { calories: 251, proteins: 10.4, carbs: 38.6, sugars: 0.6, fat: 3.3, saturatedFat: 1.4, fiber: 25.3, sodium: 20, potassium: 1329, calcium: 443, iron: 9.7, vitaminC: 0, vitaminA: 27, magnesium: 171 },
  default: { calories: 120, proteins: 3.5, carbs: 15.0, sugars: 3.0, fat: 4.0, saturatedFat: 1.0, fiber: 2.0, sodium: 80, potassium: 150, calcium: 40, iron: 1.0, vitaminC: 5, vitaminA: 30, magnesium: 20 },
};

// In-memory cache for API results
const apiCache = new Map<string, NutritionPer100g>();

/**
 * Extracts estimated grams from human-readable amount strings like:
 * "400g", "1kg", "4 fette", "2 cucchiai", "4 uova", "300ml", "q.b."
 */
export function parseAmountToGrams(amountStr: string, ingredientName: string): number {
  if (!amountStr) return 100;
  const str = amountStr.toLowerCase().trim();
  const name = ingredientName.toLowerCase().trim();

  // 1. Direct grams (e.g. "400g", "400 g", "400 gr", "400 grammi")
  const gramMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|grammi)/i);
  if (gramMatch) {
    return parseFloat(gramMatch[1].replace(',', '.'));
  }

  // 2. Kilograms (e.g. "1kg", "1.5 kg")
  const kgMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|chili|chilogrammi)/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1].replace(',', '.')) * 1000;
  }

  // 3. Milliliters / Liters (e.g. "300ml", "1.2 litri", "1 l")
  const mlMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|millilitri)/i);
  if (mlMatch) {
    return parseFloat(mlMatch[1].replace(',', '.'));
  }
  const literMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:l|litri|litro)/i);
  if (literMatch) {
    return parseFloat(literMatch[1].replace(',', '.')) * 1000;
  }

  // 4. Cucchiai / Cucchiaini (tablespoon / teaspoon)
  const spoonMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:cucchiai|cucchiaio)/i);
  if (spoonMatch) {
    const qty = parseFloat(spoonMatch[1].replace(',', '.'));
    return name.includes('olio') ? qty * 10 : qty * 15;
  }
  const tspMatch = str.match(/(\d+(?:[.,]\d+)?)\s*(?:cucchiaini|cucchiaino)/i);
  if (tspMatch) {
    const qty = parseFloat(tspMatch[1].replace(',', '.'));
    return qty * 5;
  }

  // 5. Uova / Fette / Spicchi
  if (name.includes('uov') || name.includes('uova')) {
    const eggCount = str.match(/(\d+)/);
    if (eggCount) return parseInt(eggCount[1], 10) * 60; // 60g average egg
    return 60;
  }
  if (str.includes('fett') || str.includes('fette')) {
    const sliceCount = str.match(/(\d+)/);
    if (sliceCount) return parseInt(sliceCount[1], 10) * 35; // 35g slice of bread
    return 70;
  }
  if (str.includes('spicch')) {
    const cloveCount = str.match(/(\d+)/);
    if (cloveCount) return parseInt(cloveCount[1], 10) * 5;
    return 5;
  }
  if (str.includes('mazzetto')) {
    return 30;
  }
  if (str.includes('foglie') || str.includes('foglia')) {
    const leafCount = str.match(/(\d+)/);
    if (leafCount) return parseInt(leafCount[1], 10) * 1.5;
    return 10;
  }
  if (str.includes('dose') || str.includes('bustin')) {
    return 2;
  }
  if (str.includes('noce') || name.includes('noce')) {
    return 15; // 1 noce di burro è circa 15g
  }
  if (name.includes('salsicci') || name.includes('salsicce')) {
    const sausageCount = str.match(/(\d+)/);
    if (sausageCount) return parseInt(sausageCount[1], 10) * 90; // 90g per salsiccia
    return 180;
  }
  if (str.includes('bicchier')) {
    return 120;
  }
  if (str.includes('tazz')) {
    return 80;
  }
  if (str.includes('q.b') || str.includes('qb') || str.includes('pizzico')) {
    return 5;
  }

  // Pure number check (e.g. "2 filetti")
  const numOnly = str.match(/(\d+(?:[.,]\d+)?)/);
  if (numOnly) {
    const val = parseFloat(numOnly[1].replace(',', '.'));
    if (name.includes('spigola') || name.includes('pesce') || name.includes('filett')) {
      return val * 180;
    }
    if (name.includes('pomodor')) {
      return val * 80;
    }
    if (name.includes('melanzan')) {
      return val * 300;
    }
    return val * 50;
  }

  return 100;
}

/**
 * Cleans the ingredient string to find the most accurate search query
 */
function cleanQueryTerm(name: string): string {
  const lower = name.toLowerCase().replace(/['’]/g, ' ');
  const commonKeywords = [
    'tagliatelle', 'spaghetti', 'pasta', 'riso', 'pomodor', 'basilico', 'aglio',
    'olio', 'funghi', 'porcini', 'burro', 'parmigiano', 'spigola', 'patate',
    'olive', 'vino', 'savoiardi', 'mascarpone', 'uov', 'zucchero', 'caffe',
    'cacao', 'melanzan', 'mozzarella', 'zafferano', 'brodo', 'cipolla', 'manzo',
    'pollo', 'latte', 'farina', 'salmone', 'tonno', 'carote', 'zucchine'
  ];

  for (const kw of commonKeywords) {
    if (lower.includes(kw)) {
      if (kw === 'porcini') return 'funghi porcini';
      if (kw === 'uov') return 'uova';
      if (kw === 'pomodor') return 'pomodoro';
      if (kw === 'melanzan') return 'melanzane';
      return kw;
    }
  }

  // Strip noise words
  return lower
    .replace(/\b(fresco|freschi|freschissimi|sodi|secchi|dop|biologici|extravergine|d oliva|all uovo|macinato|tritato|a fette|maturi|ramati|datterini|trafilate)\b/gi, '')
    .trim()
    .split(/\s+/)[0] || lower;
}

/**
 * Finds local fallback nutrition for an ingredient
 */
function getLocalFallbackNutrition(name: string): NutritionPer100g {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(BASE_NUTRITION_DB)) {
    if (key !== 'default' && lower.includes(key)) {
      return value;
    }
  }
  return BASE_NUTRITION_DB.default;
}

/**
 * Fetches nutritional values per 100g from the Open Food Facts Free Web API.
 * Uses intelligent fallback and caching.
 */
export async function fetchNutritionFromAPI(ingredientName: string): Promise<{
  nutritionPer100g: NutritionPer100g;
  source: 'openfoodfacts-api' | 'nutrition-db';
}> {
  const searchTerm = cleanQueryTerm(ingredientName);

  // 1. Check in-memory cache
  if (apiCache.has(searchTerm)) {
    return {
      nutritionPer100g: apiCache.get(searchTerm)!,
      source: 'openfoodfacts-api',
    };
  }

  // 2. Fetch via internal server proxy (/api/nutrition or /api/food) to prevent CORS blocks
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    // Primary: internal Express proxy endpoint
    const endpoint = `/api/nutrition?q=${encodeURIComponent(searchTerm)}`;

    let res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    // Secondary fallback: /api/food proxy configured in vite.config.ts and server.ts
    if (!res.ok) {
      const foodProxyEndpoint = `/api/food/cgi/search.pl?search_terms=${encodeURIComponent(
        searchTerm
      )}&search_simple=1&action=process&json=1&page_size=1`;
      res = await fetch(foodProxyEndpoint, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    }

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.products && data.products.length > 0) {
        const nutriments = data.products[0].nutriments || {};

        const rawKcal = nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal_value'] ?? nutriments['energy-kcal'];
        const fallback = getLocalFallbackNutrition(ingredientName);

        // If Open Food Facts returned at least energy or proteins
        if (typeof rawKcal === 'number' && rawKcal > 0) {
          const apiNutrition: NutritionPer100g = {
            calories: Math.round(rawKcal),
            proteins: parseFloat((nutriments['proteins_100g'] ?? fallback.proteins).toFixed(1)),
            carbs: parseFloat((nutriments['carbohydrates_100g'] ?? fallback.carbs).toFixed(1)),
            sugars: parseFloat((nutriments['sugars_100g'] ?? fallback.sugars).toFixed(1)),
            fat: parseFloat((nutriments['fat_100g'] ?? fallback.fat).toFixed(1)),
            saturatedFat: parseFloat((nutriments['saturated-fat_100g'] ?? fallback.saturatedFat).toFixed(1)),
            fiber: parseFloat((nutriments['fiber_100g'] ?? fallback.fiber).toFixed(1)),
            sodium: Math.round((nutriments['sodium_100g'] ? nutriments['sodium_100g'] * 1000 : fallback.sodium)),
            potassium: Math.round((nutriments['potassium_100g'] ? nutriments['potassium_100g'] * 1000 : fallback.potassium)),
            calcium: Math.round((nutriments['calcium_100g'] ? nutriments['calcium_100g'] * 1000 : fallback.calcium)),
            iron: parseFloat((nutriments['iron_100g'] ? nutriments['iron_100g'] * 1000 : fallback.iron).toFixed(1)),
            vitaminC: parseFloat((nutriments['vitamin-c_100g'] ? nutriments['vitamin-c_100g'] * 1000 : fallback.vitaminC).toFixed(1)),
            vitaminA: parseFloat((nutriments['vitamin-a_100g'] ? nutriments['vitamin-a_100g'] * 1000000 : fallback.vitaminA).toFixed(0)),
            magnesium: Math.round((nutriments['magnesium_100g'] ? nutriments['magnesium_100g'] * 1000 : fallback.magnesium)),
          };

          apiCache.set(searchTerm, apiNutrition);
          return { nutritionPer100g: apiNutrition, source: 'openfoodfacts-api' };
        }
      }
    }
  } catch (err) {
    // Graceful fallback to verified food database
    // console.warn('Fetch nutrition API note:', err);
  }

  // 3. Fallback to verified local nutritional database
  const fallback = getLocalFallbackNutrition(ingredientName);
  return {
    nutritionPer100g: fallback,
    source: 'nutrition-db',
  };
}

/**
 * Calculates complete recipe nutrition from ingredient list and portions
 */
export async function calculateRecipeNutrition(
  ingredients: Ingredient[],
  servings: number = 4
): Promise<RecipeNutrition> {
  const safeServings = Math.max(1, servings);
  const breakdowns: IngredientNutrition[] = [];

  let totalCalories = 0;
  let totalWeightGrams = 0;

  const totalMacros: MacroNutrients = {
    proteins: 0,
    carbohydrates: 0,
    sugars: 0,
    fats: 0,
    saturatedFats: 0,
    fiber: 0,
  };

  const totalMicros: MicroNutrients = {
    sodium: 0,
    potassium: 0,
    calcium: 0,
    iron: 0,
    vitaminC: 0,
    vitaminA: 0,
    magnesium: 0,
  };

  // Fetch or lookup nutrition for all ingredients in parallel
  const results = await Promise.all(
    ingredients.map(async (ing) => {
      const grams = parseAmountToGrams(ing.amount, ing.name);
      const { nutritionPer100g, source } = await fetchNutritionFromAPI(ing.name);
      return { ing, grams, per100g: nutritionPer100g, source };
    })
  );

  for (const { ing, grams, per100g, source } of results) {
    const factor = grams / 100;
    const ingCalories = Math.round(per100g.calories * factor);

    const ingMacros: MacroNutrients = {
      proteins: parseFloat((per100g.proteins * factor).toFixed(1)),
      carbohydrates: parseFloat((per100g.carbs * factor).toFixed(1)),
      sugars: parseFloat((per100g.sugars * factor).toFixed(1)),
      fats: parseFloat((per100g.fat * factor).toFixed(1)),
      saturatedFats: parseFloat((per100g.saturatedFat * factor).toFixed(1)),
      fiber: parseFloat((per100g.fiber * factor).toFixed(1)),
    };

    const ingMicros: MicroNutrients = {
      sodium: Math.round(per100g.sodium * factor),
      potassium: Math.round(per100g.potassium * factor),
      calcium: Math.round(per100g.calcium * factor),
      iron: parseFloat((per100g.iron * factor).toFixed(1)),
      vitaminC: parseFloat((per100g.vitaminC * factor).toFixed(1)),
      vitaminA: parseFloat((per100g.vitaminA * factor).toFixed(0)),
      magnesium: Math.round(per100g.magnesium * factor),
    };

    breakdowns.push({
      ingredientId: ing.id,
      name: ing.name,
      originalAmount: ing.amount,
      estimatedGrams: Math.round(grams),
      calories: ingCalories,
      macros: ingMacros,
      micros: ingMicros,
      source,
    });

    totalCalories += ingCalories;
    totalWeightGrams += grams;

    totalMacros.proteins += ingMacros.proteins;
    totalMacros.carbohydrates += ingMacros.carbohydrates;
    totalMacros.sugars += ingMacros.sugars;
    totalMacros.fats += ingMacros.fats;
    totalMacros.saturatedFats += ingMacros.saturatedFats;
    totalMacros.fiber += ingMacros.fiber;

    totalMicros.sodium += ingMicros.sodium;
    totalMicros.potassium += ingMicros.potassium;
    totalMicros.calcium += ingMicros.calcium;
    totalMicros.iron += ingMicros.iron;
    totalMicros.vitaminC += ingMicros.vitaminC;
    totalMicros.vitaminA += ingMicros.vitaminA;
    totalMicros.magnesium += ingMicros.magnesium;
  }

  // Round values
  totalMacros.proteins = parseFloat(totalMacros.proteins.toFixed(1));
  totalMacros.carbohydrates = parseFloat(totalMacros.carbohydrates.toFixed(1));
  totalMacros.sugars = parseFloat(totalMacros.sugars.toFixed(1));
  totalMacros.fats = parseFloat(totalMacros.fats.toFixed(1));
  totalMacros.saturatedFats = parseFloat(totalMacros.saturatedFats.toFixed(1));
  totalMacros.fiber = parseFloat(totalMacros.fiber.toFixed(1));

  totalMicros.iron = parseFloat(totalMicros.iron.toFixed(1));
  totalMicros.vitaminC = parseFloat(totalMicros.vitaminC.toFixed(1));

  return {
    calories: Math.round(totalCalories),
    totalWeightGrams: Math.round(totalWeightGrams),
    macros: totalMacros,
    micros: totalMicros,
    ingredientsBreakdown: breakdowns,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Dynamic scale calculation: adjusts all nutritional values based on serving multiplier or gram portion.
 */
export function scaleNutrition(
  nutrition: RecipeNutrition,
  baseServings: number,
  mode: 'per_serving' | 'total' | 'custom_servings' | 'custom_grams',
  customValue: number
): {
  calories: number;
  weightGrams: number;
  macros: MacroNutrients;
  micros: MicroNutrients;
  label: string;
} {
  const safeBaseServings = Math.max(1, baseServings || 4);
  let factor = 1;
  let weight = nutrition.totalWeightGrams;
  let label = '';

  if (mode === 'per_serving') {
    factor = 1 / safeBaseServings;
    weight = Math.round(nutrition.totalWeightGrams / safeBaseServings);
    label = 'Valori per 1 singola porzione';
  } else if (mode === 'total') {
    factor = 1;
    weight = nutrition.totalWeightGrams;
    label = `Valori per l'intera ricetta (${safeBaseServings} porzioni)`;
  } else if (mode === 'custom_servings') {
    const servings = Math.max(0.25, customValue);
    factor = servings / safeBaseServings;
    weight = Math.round((nutrition.totalWeightGrams / safeBaseServings) * servings);
    label = `Valori per ${servings} ${servings === 1 ? 'porzione' : 'porzioni'}`;
  } else if (mode === 'custom_grams') {
    const grams = Math.max(1, customValue);
    factor = grams / (nutrition.totalWeightGrams || 100);
    weight = grams;
    label = `Valori per ${grams}g di cibo assunto`;
  }

  return {
    calories: Math.round(nutrition.calories * factor),
    weightGrams: Math.round(weight),
    macros: {
      proteins: parseFloat((nutrition.macros.proteins * factor).toFixed(1)),
      carbohydrates: parseFloat((nutrition.macros.carbohydrates * factor).toFixed(1)),
      sugars: parseFloat((nutrition.macros.sugars * factor).toFixed(1)),
      fats: parseFloat((nutrition.macros.fats * factor).toFixed(1)),
      saturatedFats: parseFloat((nutrition.macros.saturatedFats * factor).toFixed(1)),
      fiber: parseFloat((nutrition.macros.fiber * factor).toFixed(1)),
    },
    micros: {
      sodium: Math.round(nutrition.micros.sodium * factor),
      potassium: Math.round(nutrition.micros.potassium * factor),
      calcium: Math.round(nutrition.micros.calcium * factor),
      iron: parseFloat((nutrition.micros.iron * factor).toFixed(1)),
      vitaminC: parseFloat((nutrition.micros.vitaminC * factor).toFixed(1)),
      vitaminA: parseFloat((nutrition.micros.vitaminA * factor).toFixed(0)),
      magnesium: Math.round(nutrition.micros.magnesium * factor),
    },
    label,
  };
}

/**
 * Daily Reference Intakes (VNR - Valori Nutritivi di Riferimento UE per adulto, 2000 kcal)
 */
export const DAILY_RECOMMENDED = {
  calories: 2000,
  proteins: 50, // g
  carbohydrates: 260, // g
  sugars: 50, // g
  fats: 70, // g
  saturatedFats: 20, // g
  fiber: 30, // g
  sodium: 2000, // mg
  potassium: 3500, // mg
  calcium: 800, // mg
  iron: 14, // mg
  vitaminC: 80, // mg
  vitaminA: 800, // mcg
  magnesium: 375, // mg
};
