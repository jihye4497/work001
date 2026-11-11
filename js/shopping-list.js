import { CATEGORIES } from './ingredients.js';
import { servingLabel } from './servings.js';
import { ingredientKey } from './ingredient-matching.js';

export function selectedServings(selection, household) {
  return selection.servings ?? household * selection.times;
}

export function aggregate(ingredients, recipes, selectedRecipes, servings) {
  const byId = new Map(ingredients.map(i => [i.id, i]));
  const byRecipe = new Map(recipes.map(r => [r.id, r]));
  const rows = new Map();
  for (const selection of selectedRecipes) {
    const recipe = byRecipe.get(selection.recipeId);
    if (!recipe) throw new Error('선택 메뉴의 데이터를 찾을 수 없어요.');
    for (const item of recipe.ingredients) {
      const ingredient = byId.get(selection.ingredientReplacements?.[item.ingredientId] || item.ingredientId);
      if (!ingredient) throw new Error('재료 데이터를 찾을 수 없어요.');
      const row = rows.get(ingredient.id) || { ingredient, totals: new Map(), unknown: false, uses: [] };
      const amount = item.amount === null ? null : item.amount * selectedServings(selection, servings) / recipe.baseServings;
      if (amount === null || item.unit === null) row.unknown = true;
      else row.totals.set(item.unit, (row.totals.get(item.unit) || 0) + amount);
      if (recipe.servingsStatus === 'estimated') row.estimated = true;
      row.uses.push({ name: recipe.name, amount, unit: item.unit, note: item.note, servingLabel: servingLabel(recipe), servings: selectedServings(selection, servings), times: 1 });
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
const isDrinkingWater = ingredient => ['물', '생수'].includes(ingredient.name.trim());

export function partitionShoppingRows(rows, pantryIds = [], ingredients = []) {
  const keys = new Set(ingredients.filter(i => pantryIds.includes(i.id)).map(ingredientKey));
  return ['구매할 재료', '집에 있는 재료'].map(title => ({title, rows: rows.filter(row => {
    const group = pantryIds.includes(row.ingredient.id) || keys.has(ingredientKey(row.ingredient)) ? '집에 있는 재료' : '구매할 재료';
    return group === title && (title !== '구매할 재료' || !isDrinkingWater(row.ingredient));
  })}));
}
export function copyText(rows, checkedIds, pantryIds, ingredients = []) {
  const lines = [];
  const groups = pantryIds === undefined ? CATEGORIES.map(title => ({title, rows: rows.filter(r => r.ingredient.category === title)})) : partitionShoppingRows(rows, pantryIds, ingredients);
  for (const {title: category, rows: group} of groups) {
    if (!group.length) continue;
    lines.push(category);
    for (const row of group) lines.push(`[${checkedIds.includes(row.ingredient.id) ? 'x' : ' '}] ${row.ingredient.name}: ${totalText(row)}${pantryIds !== undefined && row.ingredient.isSeasoning ? ' (양념)' : ''}${row.estimated ? ' (인분 추정 포함)' : ''}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

// Copy only explicitly selected purchase rows; leave the full-list exporter available for legacy callers.
export function selectedCopyText(rows, selectedIds) {
  const selected = new Set(selectedIds);
  return rows.filter(row=>selected.has(row.ingredient.id)&&!isDrinkingWater(row.ingredient)).map(row=>`${row.ingredient.name}: ${totalText(row)}`).join('\n');
}
