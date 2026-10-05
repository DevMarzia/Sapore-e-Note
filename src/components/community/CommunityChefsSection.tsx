import React, { useMemo } from 'react';
import { ChefHat, BookOpen, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { Recipe, UserProfile } from '../../types/recipe';
import { useAuth } from '../../context/AuthContext';

interface CommunityChefsSectionProps {
  recipes: Recipe[];
  onSelectAuthor: (author: UserProfile) => void;
  searchFilter?: string;
}

export const CommunityChefsSection: React.FC<CommunityChefsSectionProps> = ({
  recipes,
  onSelectAuthor,
  searchFilter = '',
}) => {
  const { user: currentUser, profile: currentProfile } = useAuth();

  // Aggregate unique authors and their recipe counts
  const authors = useMemo(() => {
    const authorMap = new Map<
      string,
      {
        profile: UserProfile;
        recipeCount: number;
        recentCategories: Set<string>;
      }
    >();

    recipes.forEach((recipe) => {
      if (recipe.author && recipe.author.username) {
        const key = recipe.author.username.toLowerCase();
        const existing = authorMap.get(key);
        if (existing) {
          existing.recipeCount++;
          if (recipe.category) existing.recentCategories.add(recipe.category);
        } else {
          authorMap.set(key, {
            profile: recipe.author,
            recipeCount: 1,
            recentCategories: new Set(recipe.category ? [recipe.category] : []),
          });
        }
      }
    });

    let list = Array.from(authorMap.values()).map((item) => ({
      ...item.profile,
      recipeCount: item.recipeCount,
      categories: Array.from(item.recentCategories),
    }));

    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase().replace(/^@/, '');
      list = list.filter(
        (a) =>
          a.username.toLowerCase().includes(q) ||
          (a.full_name && a.full_name.toLowerCase().includes(q)) ||
          (a.bio && a.bio.toLowerCase().includes(q))
      );
    }

    return list;
  }, [recipes, searchFilter]);

  if (authors.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-stone-200/80 shadow-xs">
        <ChefHat className="w-10 h-10 text-stone-300 mx-auto mb-2" />
        <p className="font-editorial text-base font-bold text-stone-700">
          Nessun autore trovato per "{searchFilter}"
        </p>
        <p className="text-xs text-stone-500 mt-1">
          Prova a cercare con un altro nome o username.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#f4dedf] flex items-center justify-center text-[#990f4b]">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-editorial text-lg font-bold text-stone-900 leading-none">
              Creator & Cuochi della Community
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Esplora i profili dei creator ed entra nei loro ricettari
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#990f4b] tabular-nums">
          {authors.length} {authors.length === 1 ? 'autore' : 'autori'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors.map((author) => {
          const isMe =
            currentUser &&
            (currentProfile?.username?.toLowerCase() === author.username.toLowerCase() ||
              currentUser.id === author.id);

          return (
            <div
              key={author.username}
              onClick={() => onSelectAuthor(author)}
              className="group bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md hover:border-[#d27f87] transition-all flex flex-col justify-between cursor-pointer hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-[#990f4b]/20 group-hover:border-[#990f4b] transition-colors bg-stone-100 flex items-center justify-center">
                      {author.avatar_url ? (
                        <img
                          src={author.avatar_url}
                          alt={author.full_name || author.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#f4dedf] text-[#990f4b] flex items-center justify-center font-bold text-sm">
                          {(author.full_name || author.username).slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {isMe && (
                      <span
                        title="Il tuo profilo"
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#990f4b] text-white flex items-center justify-center border-2 border-white text-[10px]"
                      >
                        <UserCheck className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-editorial text-base font-bold text-stone-900 truncate group-hover:text-[#990f4b] transition-colors">
                        {author.full_name || `@${author.username}`}
                      </h4>
                    </div>
                    <p className="text-xs font-semibold text-[#990f4b] truncate">
                      @{author.username}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-500 tabular-nums">
                      <span className="flex items-center gap-1 font-medium text-stone-700">
                        <BookOpen className="w-3 h-3 text-[#c05f72]" />
                        {author.recipeCount} {author.recipeCount === 1 ? 'ricetta' : 'ricette'}
                      </span>
                      {author.categories && author.categories.length > 0 && (
                        <>
                          <span aria-hidden="true" className="text-stone-300">·</span>
                          <span className="truncate text-stone-500">
                            {author.categories.slice(0, 2).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                  {author.bio || 'Chef appassionato di sapori e cucina italiana.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#990f4b]">
                <span>{isMe ? 'Il Mio Ricettario' : 'Visita Profilo'}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
