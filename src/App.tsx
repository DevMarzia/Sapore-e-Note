import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { SearchAndFilter } from './components/recipes/SearchAndFilter';
import { RecipeGrid } from './components/recipes/RecipeGrid';
import { RecipeDetailModal } from './components/recipes/RecipeDetailModal';
import { AddRecipeModal } from './components/recipes/AddRecipeModal';
import { SupabaseConfigModal } from './components/ui/SupabaseConfigModal';
import { ToastContainer } from './components/ui/Toast';
import { recipeService } from './services/recipeService';
import { isSupabaseConfigured, getSupabaseClient } from './lib/supabase';
import { Recipe, RecipeFormData, FilterCategory, ToastMessage, RecipeNutrition, UserProfile } from './types/recipe';
import { BookOpen, Utensils, Sparkles, AlertTriangle, Database } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileView } from './components/profile/UserProfileView';
import { EditProfileModal } from './components/profile/EditProfileModal';

export default function App() {
  const { user, profile } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Tutte');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [isTableMissingOnSupabase, setIsTableMissingOnSupabase] = useState(false);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { recipes: fetched, source, isTableMissing } = await recipeService.getRecipes();
      setRecipes(fetched);
      setIsSupabaseActive(source === 'supabase' && isSupabaseConfigured());
      setIsTableMissingOnSupabase(Boolean(isTableMissing));
    } catch (err) {
      console.error('Errore caricamento ricette:', err);
      addToast('error', 'Impossibile caricare le ricette');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FilterCategory, number> = {
      Tutte: recipes.length,
      Antipasti: 0,
      Primi: 0,
      Secondi: 0,
      Dolci: 0,
    };

    recipes.forEach((r) => {
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      }
    });

    return counts;
  }, [recipes]);

  // Filter recipes according to active category and search text (title & ingredients)
  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return recipes.filter((recipe) => {
      // Category check
      if (activeCategory !== 'Tutte' && recipe.category !== activeCategory) {
        return false;
      }

      // Search query check (title or any ingredient name)
      if (query) {
        const titleMatches = recipe.title.toLowerCase().includes(query);
        const ingredientMatches = recipe.ingredients.some((ing) =>
          ing.name.toLowerCase().includes(query)
        );
        return titleMatches || ingredientMatches;
      }

      return true;
    });
  }, [recipes, activeCategory, searchQuery]);

  const handleCreateRecipe = async (formData: RecipeFormData) => {
    try {
      const created = await recipeService.createRecipe(formData, profile);
      setRecipes((prev) => [created, ...prev]);
      addToast('success', `Ricetta "${created.title}" aggiunta con successo!`);
      // If we're filtering on a different category, switch to the new recipe's category or Tutte
      if (activeCategory !== 'Tutte' && activeCategory !== created.category) {
        setActiveCategory(created.category);
      }
    } catch (err: any) {
      console.error('Errore creazione ricetta:', err);
      addToast('error', err.message || 'Errore durante la creazione della ricetta');
      throw err;
    }
  };

  const handleUpdateNutrition = async (recipeId: string, nutrition: RecipeNutrition) => {
    try {
      await recipeService.updateRecipeNutrition(recipeId, nutrition);
      setRecipes((prev) =>
        prev.map((r) => (r.id === recipeId ? { ...r, nutrition } : r))
      );
      if (selectedRecipe && selectedRecipe.id === recipeId) {
        setSelectedRecipe((prev) => (prev ? { ...prev, nutrition } : null));
      }
    } catch (e) {
      console.warn('Errore salvataggio nutrizione:', e);
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setSelectedRecipe(null);
    setIsAddModalOpen(true);
  };

  const handleUpdateRecipe = async (id: string, formData: RecipeFormData) => {
    try {
      const updated = await recipeService.updateRecipe(id, formData, profile);
      setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedRecipe && selectedRecipe.id === id) {
        setSelectedRecipe(updated);
      }
      addToast('success', `Ricetta "${updated.title}" modificata e salvata con successo!`);
      setRecipeToEdit(null);
    } catch (err: any) {
      console.error('Errore aggiornamento ricetta:', err);
      addToast('error', err.message || 'Errore durante il salvataggio delle modifiche');
      throw err;
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      await recipeService.deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      addToast('info', 'Ricetta rimossa dal ricettario');
    } catch (err) {
      console.error('Errore eliminazione:', err);
      addToast('error', 'Impossibile eliminare la ricetta');
    }
  };

  const handleResetDemo = () => {
    const demo = recipeService.resetToDemo();
    setRecipes(demo);
    setActiveCategory('Tutte');
    setSearchQuery('');
    addToast('success', 'Ricettario ripristinato alle ricette dimostrative originali!');
  };

  const handleClearFilters = () => {
    setActiveCategory('Tutte');
    setSearchQuery('');
  };

  const handleAuthorClick = async (author: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    is_private?: boolean;
  }) => {
    // Set immediate viewing with available data
    const initialProfile: UserProfile = {
      id: author.id,
      username: author.username,
      full_name: author.full_name || '',
      avatar_url: author.avatar_url || '',
      bio: author.bio || '',
      is_private: author.is_private === true,
    };
    setViewingProfile(initialProfile);
    setSelectedRecipe(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch fresh profile with privacy status from Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('profiles').select('*');
        if (author.id && author.id.length > 10) {
          query = query.eq('id', author.id);
        } else {
          query = query.eq('username', author.username);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          setViewingProfile({
            id: data.id,
            username: data.username,
            full_name: data.full_name || '',
            avatar_url: data.avatar_url || '',
            bio: data.bio || '',
            is_private: data.is_private === true,
            created_at: data.created_at,
          });
        }
      } catch (err) {
        console.warn('Errore lettura dati profilo chef:', err);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f7] text-[#1f1f1f]">
      {/* Top Navbar */}
      <Navbar
        onOpenAddModal={() => {
          setRecipeToEdit(null);
          setIsAddModalOpen(true);
        }}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenAuthModal={(tab) => {
          setAuthModalTab(tab || 'login');
          setIsAuthModalOpen(true);
        }}
        onViewMyProfile={() => {
          if (profile) {
            setViewingProfile(profile);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setAuthModalTab('login');
            setIsAuthModalOpen(true);
          }
        }}
        onViewFeed={() => {
          setViewingProfile(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setViewingProfile(null);
        }}
        isSupabaseActive={isSupabaseActive}
        isInProfileView={Boolean(viewingProfile)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {viewingProfile ? (
          <UserProfileView
            profile={viewingProfile}
            recipes={recipes}
            onBackToFeed={() => setViewingProfile(null)}
            onSelectRecipe={setSelectedRecipe}
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
            onShareProfile={(uname) => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.origin + '#profile-' + uname);
              }
              addToast('info', `Link profilo @${uname} copiato!`);
            }}
          />
        ) : (
          <>
            {/* Banner if Supabase credentials entered but table 'recipes' missing in DB */}
            {isTableMissingOnSupabase && isSupabaseConfigured() && (
              <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-200/90 text-amber-900 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-900" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-sm text-amber-950">
                      Tabella 'recipes' non trovata su Supabase (Causa dell'errore 404)
                    </p>
                    <p className="text-amber-800 mt-1 leading-relaxed">
                      Le tue credenziali Supabase sono valide, ma la tabella <code className="px-1.5 py-0.5 bg-amber-200/70 rounded font-mono font-bold text-amber-950">recipes</code> non è ancora stata creata nel database.
                      Esegui lo script SQL nel SQL Editor di Supabase per abilitare la persistenza nel cloud.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#990f4b] hover:bg-[#ad3d5e] text-white shadow-xs shrink-0 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Database className="w-4 h-4" />
                  <span>Apri Script SQL per Supabase</span>
                </button>
              </div>
            )}

            {/* Editorial Hero Header */}
            <section className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4dedf]/60 border border-[#d27f87]/30 text-xs font-semibold text-[#990f4b] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-[#990f4b]" />
                <span>Social Ricettario & Community Gastronomica</span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-[1.15] text-balance">
                Il Tuo Ricettario Digitale
              </h1>

              <p className="mt-3.5 text-sm sm:text-base text-stone-600 leading-relaxed text-pretty max-w-2xl mx-auto">
                Crea, importa ricette da Instagram Reel o siti web con revisione prima di salvare, scopri i piatti della community ed esplora i profili degli altri chef.
              </p>

              {/* Quick Metrics Bar with Typographic Separators */}
              <div className="mt-5 flex items-center justify-center gap-4 text-xs font-medium text-stone-500 tabular-nums">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#c05f72]" />
                  <strong className="text-stone-800">{recipes.length}</strong> ricette salvate
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#c05f72]" />
                  <strong className="text-stone-800">4</strong> categorie
                </span>
              </div>
            </section>

            {/* Search Bar & Category Filters */}
            <section className="mb-10 sm:mb-12">
              <SearchAndFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                categoryCounts={categoryCounts}
              />
            </section>

            {/* Recipes Grid */}
            <section>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-200/80">
                <div className="flex items-baseline gap-2">
                  <h2 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
                    {activeCategory === 'Tutte' ? 'Tutte le Ricette' : activeCategory}
                  </h2>
                  <span className="text-xs text-stone-500 tabular-nums">
                    ({filteredRecipes.length} {filteredRecipes.length === 1 ? 'risultato' : 'risultati'})
                  </span>
                </div>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#990f4b] hover:underline"
                  >
                    Cancella ricerca
                  </button>
                )}
              </div>

              <RecipeGrid
                recipes={filteredRecipes}
                isLoading={isLoading}
                onSelectRecipe={setSelectedRecipe}
                onAuthorClick={handleAuthorClick}
                onOpenAddModal={() => {
                  setRecipeToEdit(null);
                  setIsAddModalOpen(true);
                }}
                onClearFilters={handleClearFilters}
                hasFiltersApplied={activeCategory !== 'Tutte' || searchQuery.trim() !== ''}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onResetDemo={handleResetDemo}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        totalRecipes={recipes.length}
      />

      {/* Modals */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onDeleteRecipe={handleDeleteRecipe}
        onEditRecipe={handleEditRecipe}
        onAuthorClick={handleAuthorClick}
        onUpdateNutrition={handleUpdateNutrition}
      />

      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setRecipeToEdit(null);
        }}
        onSubmit={handleCreateRecipe}
        recipeToEdit={recipeToEdit}
        onUpdate={handleUpdateRecipe}
      />

      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigUpdated={loadRecipes}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
        onSuccess={() => {
          addToast('success', 'Accesso effettuato con successo!');
          loadRecipes();
        }}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onUpdated={() => {
          addToast('success', 'Profilo aggiornato con successo!');
          if (profile) setViewingProfile(profile);
        }}
      />

      {/* Toast Feedback Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
