export type RecipeCategory = 'Antipasti' | 'Primi' | 'Secondi' | 'Dolci';

export type FilterCategory = 'Tutte' | RecipeCategory;

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

export interface RecipeStep {
  id: string;
  step: number;
  instruction: string;
}

export interface MacroNutrients {
  proteins: number; // in grams
  carbohydrates: number; // in grams
  sugars: number; // in grams
  fats: number; // in grams
  saturatedFats: number; // in grams
  fiber: number; // in grams
}

export interface MicroNutrients {
  sodium: number; // in mg
  potassium: number; // in mg
  calcium: number; // in mg
  iron: number; // in mg
  vitaminC: number; // in mg
  vitaminA: number; // in mcg
  magnesium: number; // in mg
}

export interface IngredientNutrition {
  ingredientId: string;
  name: string;
  originalAmount: string;
  estimatedGrams: number;
  calories: number;
  macros: MacroNutrients;
  micros: MicroNutrients;
  source: 'openfoodfacts-api' | 'nutrition-db';
}

export interface RecipeNutrition {
  calories: number; // Total kcal
  totalWeightGrams: number; // Total estimated weight in grams
  macros: MacroNutrients;
  micros: MicroNutrients;
  ingredientsBreakdown: IngredientNutrition[];
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  is_private?: boolean;
  created_at?: string;
}

export interface Recipe {
  id: string;
  user_id?: string;
  author?: UserProfile;
  created_at?: string;
  title: string;
  category: RecipeCategory;
  image_url?: string;
  source_url?: string;
  source_type?: 'manual' | 'instagram' | 'website';
  ingredients: Ingredient[];
  steps: RecipeStep[];
  prep_time?: string;
  servings?: number;
  calories?: number;
  nutrition?: RecipeNutrition | null;
}

export interface RecipeFormData {
  title: string;
  category: RecipeCategory;
  image_url?: string;
  source_url?: string;
  source_type?: 'manual' | 'instagram' | 'website';
  imageFile?: File | null;
  ingredients: Omit<Ingredient, 'id'>[];
  steps: string[];
  prep_time: string;
  servings: number;
  calories?: number;
  nutrition?: RecipeNutrition | null;
}

export interface ExtractedRecipeData {
  title: string;
  category: RecipeCategory;
  prep_time: string;
  servings: number;
  calories?: number;
  image_url: string;
  source_url: string;
  source_type?: 'manual' | 'instagram' | 'website';
  ingredients: Array<{ name: string; amount: string }>;
  steps: string[];
  nutrition?: RecipeNutrition | null;
}

export type ExtractedReelData = ExtractedRecipeData;

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
