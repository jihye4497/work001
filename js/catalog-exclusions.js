// User requested removal from discovery, 2026-11-25. Keep archived data and saved selections.
export const isOfferedRecipe=recipe=>recipe.id!=='mfds-cookrcp01-1112';
export const isOfferedIngredient=ingredient=>!['mfds-ingredient-fa973b9a12df','mincook-ingredient-ac42d40730f5'].includes(ingredient.id);
