import { CATEGORIES } from './ingredients.js';

export function aggregate(ingredients, recipes, selectedRecipes, servings) {
  const byId = new Map(ingredients.map(i => [i.id, i]));
  const byRecipe = new Map(recipes.map(r => [r.id, r]));
  const rows = new Map();
  for (const selection of selectedRecipes) {
    const recipe = byRecipe.get(selection.recipeId);
    if (!recipe) throw new Error('선택 메뉴의 데이터를 찾을 수 없어요.');
    for (const item of recipe.ingredients) {
      const ingredient = byId.get(item.ingredientId);
      if (!ingredient) throw new Error('재료 데이터를 찾을 수 없어요.');
      const row = rows.get(ingredient.id) || { ingredient, totals: new Map(), unknown: false, uses: [] };
      const amount = item.amount === null ? null : item.amount * servings / recipe.baseServings * selection.times;
      if (amount === null || item.unit === null) row.unknown = true;
      else row.totals.set(item.unit, (row.totals.get(item.unit) || 0) + amount);
      row.uses.push({ name: recipe.name, amount, unit: item.unit, note: item.note });
      rows.set(ingredient.id, row);
    }
  }
  return [...rows.values()].sort((a, b) => CATEGORIES.indexOf(a.ingredient.category) - CATEGORIES.indexOf(b.ingredient.category) || a.ingredient.name.localeCompare(b.ingredient.name, 'ko'));
}

export function quantity(amount, unit) {
  if (amount === null || unit === null) return '수량 미기재';
  // Display-only rounding; all aggregation uses original numbers.
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 4 }).format(amount)}${unit}`;
}
export function totalText(row) {
  return [...row.totals].map(([unit, amount]) => quantity(amount, unit)).concat(row.unknown ? ['수량 미기재'] : []).join(' + ');
}
export function copyText(rows, checkedIds) {
  const lines = [];
  for (const category of CATEGORIES) {
    const group = rows.filter(r => r.ingredient.category === category);
    if (!group.length) continue;
    lines.push(category);
    for (const row of group) lines.push(`[${checkedIds.includes(row.ingredient.id) ? 'x' : ' '}] ${row.ingredient.name}: ${totalText(row)}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}
