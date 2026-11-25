import { ingredientKey, representativeIngredient } from './ingredient-matching.js';
import { preparedPurchase } from './prepared-ingredients.js';

// Keep deliberate choices separate from ingredients derived from chosen menus.
export function syncMenuIngredients(draft, ingredients, recipes, pantryIds = []) {
  const byId = new Map(ingredients.map(i => [i.id, i]));
  const canonicalIds=ids=>[...new Set(ids.map(id=>representativeIngredient(byId.get(id),byId)?.id).filter(Boolean))];
  for(const field of ['selectedIngredientIds','activeInterestIds','manualIngredientIds','suppressedAutoIngredientIds','checkedIngredientIds','excludedShoppingIngredientIds'])if(draft[field])draft[field]=canonicalIds(draft[field]);
  const byRecipe = new Map(recipes.map(r => [r.id, r]));
  draft.manualIngredientIds ??= [...draft.selectedIngredientIds];
  draft.suppressedAutoIngredientIds ??= [];
  draft.manualIngredientIds = draft.manualIngredientIds.filter(id => byId.has(id));
  draft.suppressedAutoIngredientIds = draft.suppressedAutoIngredientIds.filter(id => byId.has(id));
  const owned = new Set(pantryIds.map(id => ingredientKey(byId.get(id))));
  const auto = new Set();
  for (const selection of draft.selectedRecipes) {
    for (const item of byRecipe.get(selection.recipeId)?.ingredients || []) {
      if(byRecipe.get(selection.recipeId)?.components?.some(c=>c.id===item.componentId&&c.mode==='batch')&&(selection.componentBatches?.[item.componentId]??1)===0)continue;
      const id = selection.ingredientReplacements?.[item.ingredientId] || item.ingredientId;
      const prepared=preparedPurchase(item,byRecipe.get(selection.recipeId),byId,selection.ingredientReplacements?.[item.ingredientId]);
      const ingredient = representativeIngredient(prepared?.ingredient||byId.get(id),byId);
      if (ingredient && !ingredient.isSeasoning && !owned.has(ingredientKey(ingredient)) && !draft.suppressedAutoIngredientIds.includes(ingredient.id)) auto.add(ingredient.id);
    }
  }
  const next = [...new Set([...draft.manualIngredientIds, ...auto])];
  draft.activeInterestIds = [...new Set(draft.activeInterestIds.filter(id => next.includes(id)))];
  draft.selectedIngredientIds = next;
  return draft;
}
