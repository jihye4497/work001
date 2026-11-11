import { ingredientKey } from './ingredient-matching.js';

// Keep deliberate choices separate from ingredients derived from chosen menus.
export function syncMenuIngredients(draft, ingredients, recipes, pantryIds = []) {
  const byId = new Map(ingredients.map(i => [i.id, i]));
  const byRecipe = new Map(recipes.map(r => [r.id, r]));
  draft.manualIngredientIds ??= [...draft.selectedIngredientIds];
  draft.suppressedAutoIngredientIds ??= [];
  draft.manualIngredientIds = draft.manualIngredientIds.filter(id => byId.has(id));
  draft.suppressedAutoIngredientIds = draft.suppressedAutoIngredientIds.filter(id => byId.has(id));
  const owned = new Set(pantryIds.map(id => ingredientKey(byId.get(id))));
  const auto = new Set();
  for (const selection of draft.selectedRecipes) {
    for (const item of byRecipe.get(selection.recipeId)?.ingredients || []) {
      const id = selection.ingredientReplacements?.[item.ingredientId] || item.ingredientId;
      const ingredient = byId.get(id);
      if (ingredient && !ingredient.isSeasoning && !owned.has(ingredientKey(ingredient)) && !draft.suppressedAutoIngredientIds.includes(id)) auto.add(id);
    }
  }
  const next = [...new Set([...draft.manualIngredientIds, ...auto])];
  draft.activeInterestIds = [...new Set(draft.activeInterestIds.filter(id => next.includes(id)))];
  draft.selectedIngredientIds = next;
  return draft;
}
