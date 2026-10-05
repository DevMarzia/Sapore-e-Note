import { Recipe, RecipeFormData, Ingredient, RecipeStep, RecipeNutrition, UserProfile } from '../types/recipe';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_DEMO_RECIPES } from '../lib/demoData';
import { calculateRecipeNutrition } from './nutritionService';

const LOCAL_STORAGE_RECIPES_KEY = 'sapore_note_recipes_v1';

function getLocalRecipes(): Recipe[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_RECIPES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECIPES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_RECIPES_KEY, JSON.stringify(INITIAL_DEMO_RECIPES));
      return INITIAL_DEMO_RECIPES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const hasGramigna = parsed.some((r: any) => r.id === 'demo-gramigna' || r.title?.toLowerCase().includes('gramigna'));
      if (!hasGramigna) {
        const withGramigna = [INITIAL_DEMO_RECIPES[0], ...parsed];
        saveLocalRecipes(withGramigna);
        return withGramigna;
      }
      return parsed;
    }
    return INITIAL_DEMO_RECIPES;
  } catch (e) {
    console.warn('Errore lettura ricette locali:', e);
    return INITIAL_DEMO_RECIPES;
  }
}

function saveLocalRecipes(recipes: Recipe[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECIPES_KEY, JSON.stringify(recipes));
    } catch (e) {
      console.warn('Errore salvataggio ricette locali:', e);
    }
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const recipeService = {
  isConfiguredWithSupabase(): boolean {
    return isSupabaseConfigured();
  },

  async getRecipes(): Promise<{ recipes: Recipe[]; source: 'supabase' | 'local'; isTableMissing?: boolean }> {
    const supabase = getSupabaseClient();
    let recipesToProcess: Recipe[] = [];
    let source: 'supabase' | 'local' = 'local';
    let isTableMissing = false;
    
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          if (
            error.code === '42P01' ||
            error.message?.toLowerCase().includes('relation') ||
            error.message?.toLowerCase().includes('not found') ||
            error.message?.toLowerCase().includes('does not exist')
          ) {
            isTableMissing = true;
          }
        }

        if (!error && data && data.length > 0) {
          recipesToProcess = data.map((item: any) => {
            const parsedNutrition = typeof item.nutrition === 'string' ? JSON.parse(item.nutrition) : item.nutrition;
            const parsedCalories = typeof item.calories === 'number' && item.calories > 0
              ? item.calories
              : (parsedNutrition?.calories ? Math.round(parsedNutrition.calories) : undefined);

            if (parsedNutrition && !parsedNutrition.calories && parsedCalories) {
              parsedNutrition.calories = parsedCalories;
            }

            return {
              id: item.id,
              user_id: item.user_id,
              author: item.author || (item.user_id ? {
                id: item.user_id,
                username: item.author_username || `chef_${item.user_id.slice(0, 5)}`,
                full_name: item.author_name || '',
                avatar_url: item.author_avatar || '',
              } : undefined),
              created_at: item.created_at,
              title: item.title,
              category: item.category,
              image_url: item.image_url,
              source_url: item.source_url,
              source_type: item.source_type,
              prep_time: item.prep_time || '30 min',
              servings: item.servings || 4,
              calories: parsedCalories,
              ingredients: typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : (item.ingredients || []),
              steps: typeof item.steps === 'string' ? JSON.parse(item.steps) : (item.steps || []),
              nutrition: parsedNutrition,
            };
          });
          source = 'supabase';
        } else {
          recipesToProcess = getLocalRecipes();
          source = error ? 'local' : 'supabase';
        }
      } catch (err) {
        console.warn('Eccezione Supabase:', err);
        recipesToProcess = getLocalRecipes();
        source = 'local';
      }
    } else {
      recipesToProcess = getLocalRecipes();
      source = 'local';
    }

    // Ensure recipes have nutrition calculated asynchronously if missing
    const enrichedRecipes = await Promise.all(
      recipesToProcess.map(async (r) => {
        if (!r.nutrition && r.ingredients.length > 0) {
          try {
            const calculated = await calculateRecipeNutrition(r.ingredients, r.servings || 4);
            const totalCalories = r.calories || calculated.calories;
            calculated.calories = totalCalories;
            return { ...r, calories: totalCalories, nutrition: calculated };
          } catch (e) {
            return r;
          }
        }
        if (r.nutrition && !r.calories) {
          return { ...r, calories: r.nutrition.calories };
        }
        return r;
      })
    );

    saveLocalRecipes(enrichedRecipes);
    return { recipes: enrichedRecipes, source, isTableMissing };
  },

  async uploadRecipeImage(file: File): Promise<string> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
        const filePath = `recipes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.warn('Errore upload Storage Supabase, fallback a Data URL:', uploadError.message);
          return await fileToDataUrl(file);
        }

        const { data } = supabase.storage.from('recipe-images').getPublicUrl(filePath);
        return data.publicUrl;
      } catch (err) {
        console.warn('Eccezione upload immagine su Supabase:', err);
        return await fileToDataUrl(file);
      }
    }

    // Local Base64 storage
    return await fileToDataUrl(file);
  },

  async createRecipe(formData: RecipeFormData, authorProfile?: UserProfile | null): Promise<Recipe> {
    let finalImageUrl = formData.image_url?.trim() || '';

    if (formData.imageFile) {
      try {
        finalImageUrl = await this.uploadRecipeImage(formData.imageFile);
      } catch (e) {
        console.warn('Errore upload immagine, proseguo senza o con fallback:', e);
      }
    }

    const processedIngredients: Ingredient[] = formData.ingredients
      .filter((ing) => ing.name.trim() !== '')
      .map((ing, idx) => ({
        id: `ing-${Date.now()}-${idx}`,
        name: ing.name.trim(),
        amount: ing.amount.trim() || 'q.b.',
      }));

    const processedSteps: RecipeStep[] = formData.steps
      .filter((stepText) => stepText.trim() !== '')
      .map((stepText, idx) => ({
        id: `step-${Date.now()}-${idx}`,
        step: idx + 1,
        instruction: stepText.trim(),
      }));

    // Calcolo dinamico valori nutrizionali tramite Web API
    let calculatedNutrition: RecipeNutrition | null | undefined = formData.nutrition;
    if (!calculatedNutrition) {
      try {
        calculatedNutrition = await calculateRecipeNutrition(
          processedIngredients,
          Number(formData.servings) || 4
        );
      } catch (err) {
        console.warn('Calcolo nutrizione fallito:', err);
      }
    }

    const totalCalories = typeof formData.calories === 'number' && formData.calories > 0
      ? Math.round(formData.calories)
      : (calculatedNutrition ? Math.round(calculatedNutrition.calories) : 0);

    if (calculatedNutrition) {
      calculatedNutrition.calories = totalCalories;
    }

    const newRecipePayload: any = {
      title: formData.title.trim(),
      category: formData.category,
      image_url: finalImageUrl,
      source_url: formData.source_url?.trim() || undefined,
      source_type: formData.source_type || (formData.source_url?.includes('instagram.com') ? 'instagram' : formData.source_url ? 'website' : 'manual'),
      ingredients: processedIngredients,
      steps: processedSteps,
      prep_time: formData.prep_time.trim() || '30 min',
      servings: Number(formData.servings) || 4,
      calories: totalCalories,
      nutrition: calculatedNutrition || null,
    };

    if (authorProfile) {
      newRecipePayload.user_id = authorProfile.id;
      newRecipePayload.author = authorProfile;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let { data, error } = await supabase
          .from('recipes')
          .insert([newRecipePayload])
          .select()
          .single();

        // Se le colonne author o calories non esistono ancora in Supabase, riprova escludendole
        if (error && error.message) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes('calories') || errMsg.includes('author') || errMsg.includes('user_id')) {
            console.warn("Colonne non presenti su Supabase, ritento:", error.message);
            const { calories, author, user_id, ...minimalPayload } = newRecipePayload;
            const retryRes = await supabase
              .from('recipes')
              .insert([minimalPayload])
              .select()
              .single();
            data = retryRes.data;
            error = retryRes.error;
          }
        }

        if (!error && data) {
          const rawNutrition = typeof data.nutrition === 'string' ? JSON.parse(data.nutrition) : data.nutrition;
          const rawCalories = typeof data.calories === 'number' && data.calories > 0
            ? data.calories
            : (rawNutrition?.calories ? Math.round(rawNutrition.calories) : totalCalories);

          const created: Recipe = {
            id: data.id,
            user_id: data.user_id || authorProfile?.id,
            author: data.author || authorProfile || undefined,
            created_at: data.created_at,
            title: data.title,
            category: data.category,
            image_url: data.image_url,
            source_url: data.source_url,
            source_type: data.source_type || newRecipePayload.source_type,
            prep_time: data.prep_time,
            servings: data.servings,
            calories: rawCalories,
            ingredients: typeof data.ingredients === 'string' ? JSON.parse(data.ingredients) : data.ingredients,
            steps: typeof data.steps === 'string' ? JSON.parse(data.steps) : data.steps,
            nutrition: rawNutrition,
          };
          // Aggiorna anche la cache locale
          const current = getLocalRecipes();
          saveLocalRecipes([created, ...current]);
          return created;
        }
        console.warn('Errore inserimento Supabase, salvataggio in local storage:', error?.message);
      } catch (err) {
        console.warn('Eccezione inserimento Supabase:', err);
      }
    }

    // Salva in LocalStorage
    const localRecipe: Recipe = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...newRecipePayload,
    };
    const current = getLocalRecipes();
    const updated = [localRecipe, ...current];
    saveLocalRecipes(updated);
    return localRecipe;
  },

  async updateRecipe(id: string, formData: RecipeFormData, authorProfile?: UserProfile | null): Promise<Recipe> {
    let finalImageUrl = formData.image_url?.trim() || '';

    if (formData.imageFile) {
      try {
        finalImageUrl = await this.uploadRecipeImage(formData.imageFile);
      } catch (e) {
        console.warn('Errore upload immagine, proseguo senza o con fallback:', e);
      }
    }

    const processedIngredients: Ingredient[] = formData.ingredients
      .filter((ing) => ing.name.trim() !== '')
      .map((ing, idx) => ({
        id: `ing-${Date.now()}-${idx}`,
        name: ing.name.trim(),
        amount: ing.amount.trim() || 'q.b.',
      }));

    const processedSteps: RecipeStep[] = formData.steps
      .filter((stepText) => stepText.trim() !== '')
      .map((stepText, idx) => ({
        id: `step-${Date.now()}-${idx}`,
        step: idx + 1,
        instruction: stepText.trim(),
      }));

    // Calcolo dinamico valori nutrizionali
    let calculatedNutrition: RecipeNutrition | null | undefined = formData.nutrition;
    if (!calculatedNutrition) {
      try {
        calculatedNutrition = await calculateRecipeNutrition(
          processedIngredients,
          Number(formData.servings) || 4
        );
      } catch (err) {
        console.warn('Calcolo nutrizione fallito:', err);
      }
    }

    const totalCalories = typeof formData.calories === 'number' && formData.calories > 0
      ? Math.round(formData.calories)
      : (calculatedNutrition ? Math.round(calculatedNutrition.calories) : 0);

    if (calculatedNutrition) {
      calculatedNutrition.calories = totalCalories;
    }

    const updatePayload: any = {
      title: formData.title.trim(),
      category: formData.category,
      image_url: finalImageUrl,
      source_url: formData.source_url?.trim() || undefined,
      source_type: formData.source_type || (formData.source_url?.includes('instagram.com') ? 'instagram' : formData.source_url ? 'website' : 'manual'),
      ingredients: processedIngredients,
      steps: processedSteps,
      prep_time: formData.prep_time.trim() || '30 min',
      servings: Number(formData.servings) || 4,
      calories: totalCalories,
      nutrition: calculatedNutrition || null,
    };

    if (authorProfile) {
      updatePayload.user_id = authorProfile.id;
      updatePayload.author = authorProfile;
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let { data, error } = await supabase
          .from('recipes')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (error && error.message) {
          const errMsg = error.message.toLowerCase();
          if (errMsg.includes('calories') || errMsg.includes('author') || errMsg.includes('user_id')) {
            console.warn("Colonne non presenti su Supabase durante update, ritento:", error.message);
            const { calories, author, user_id, ...payloadWithoutAuthor } = updatePayload;
            const retryRes = await supabase
              .from('recipes')
              .update(payloadWithoutAuthor)
              .eq('id', id)
              .select()
              .single();
            data = retryRes.data;
            error = retryRes.error;
          }
        }

        if (!error && data) {
          const rawNutrition = typeof data.nutrition === 'string' ? JSON.parse(data.nutrition) : data.nutrition;
          const rawCalories = typeof data.calories === 'number' && data.calories > 0
            ? data.calories
            : (rawNutrition?.calories ? Math.round(rawNutrition.calories) : totalCalories);

          const updatedRecipe: Recipe = {
            id: data.id,
            user_id: data.user_id || authorProfile?.id,
            author: data.author || authorProfile || undefined,
            created_at: data.created_at,
            title: data.title,
            category: data.category,
            image_url: data.image_url,
            source_url: data.source_url,
            source_type: data.source_type || updatePayload.source_type,
            prep_time: data.prep_time,
            servings: data.servings,
            calories: rawCalories,
            ingredients: typeof data.ingredients === 'string' ? JSON.parse(data.ingredients) : data.ingredients,
            steps: typeof data.steps === 'string' ? JSON.parse(data.steps) : data.steps,
            nutrition: rawNutrition,
          };
          const current = getLocalRecipes();
          saveLocalRecipes(current.map((r) => (r.id === id ? updatedRecipe : r)));
          return updatedRecipe;
        }
      } catch (err) {
        console.warn('Eccezione update Supabase:', err);
      }
    }

    // Salva in LocalStorage
    const current = getLocalRecipes();
    const existing = current.find((r) => r.id === id);
    const updatedRecipe: Recipe = {
      id,
      created_at: existing?.created_at || new Date().toISOString(),
      ...updatePayload,
    };
    saveLocalRecipes(current.map((r) => (r.id === id ? updatedRecipe : r)));
    return updatedRecipe;
  },

  async updateRecipeNutrition(id: string, nutrition: RecipeNutrition): Promise<void> {
    const calories = Math.round(nutrition.calories || 0);
    const current = getLocalRecipes();
    const updated = current.map((r) => (r.id === id ? { ...r, calories, nutrition } : r));
    saveLocalRecipes(updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('recipes')
          .update({ calories, nutrition })
          .eq('id', id);

        if (error && error.message && error.message.toLowerCase().includes('calories')) {
          await supabase.from('recipes').update({ nutrition }).eq('id', id);
        }
      } catch (e) {
        console.warn('Errore aggiornamento nutrizione su Supabase:', e);
      }
    }
  },

  async deleteRecipe(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('recipes').delete().eq('id', id);
        if (error) {
          console.warn('Errore cancellazione su Supabase:', error.message);
        }
      } catch (e) {
        console.warn('Eccezione cancellazione su Supabase:', e);
      }
    }

    // Rimuovi da locale
    const current = getLocalRecipes();
    const filtered = current.filter((r) => r.id !== id);
    saveLocalRecipes(filtered);
    return true;
  },

  resetToDemo(): Recipe[] {
    saveLocalRecipes(INITIAL_DEMO_RECIPES);
    return INITIAL_DEMO_RECIPES;
  },
};

