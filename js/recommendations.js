export const MODES = ['재료 최대 활용형', '추가 재료 최소형', '여러 끼 식단형'];
export const MODE_DESCRIPTIONS = [
  '관심 식재료를 여러 개 활용하고 선택 메뉴와 일반 재료를 공유하는 메뉴를 먼저 보여줘요.',
  '관심 식재료와 선택 메뉴의 재료를 기준으로, 새로 필요한 일반 재료 종류가 적은 메뉴를 먼저 보여줘요.',
  '선택 메뉴에 없는 조리 유형을 먼저 보여줘요. 관심 식재료와 공통 재료도 함께 고려해요.'
];

export function recommend(ingredients, recipes, draft) {
  const general = new Set(ingredients.filter(i => !i.isSeasoning).map(i => i.id));
  const interests = new Set(draft.selectedIngredientIds.filter(id => general.has(id)));
  if (!interests.size) return [];
  const selected = recipes.filter(r => draft.selectedRecipes.some(s => s.recipeId === r.id));
  const used = new Set(selected.flatMap(r => r.ingredients.map(i => i.ingredientId)).filter(id => general.has(id)));
  const types = new Set(selected.map(r => r.cookingType));
  const names = new Map(ingredients.map(i => [i.id, i.name]));
  const pool = recipes.filter(r => !selected.some(s => s.id === r.id)).map(recipe => {
    const ids = [...new Set(recipe.ingredients.map(i => i.ingredientId))].filter(id => general.has(id));
    const matches = ids.filter(id => interests.has(id));
    const shared = ids.filter(id => used.has(id));
    const extra = ids.filter(id => !used.has(id) && !interests.has(id));
    return { recipe, matches, shared, extra, variety: types.size > 0 && !types.has(recipe.cookingType) ? 1 : 0 };
  }).filter(x => x.matches.length > 0);
  const mode = draft.activeRecommendationMode;
  pool.sort((a, b) => {
    let rank = 0;
    if (mode === MODES[1]) rank = a.extra.length - b.extra.length;
    else if (mode === MODES[2]) rank = b.variety - a.variety;
    else rank = (b.matches.length * 10 + b.shared.length) - (a.matches.length * 10 + a.shared.length);
    return rank || b.matches.length - a.matches.length || a.recipe.name.localeCompare(b.recipe.name, 'ko') || a.recipe.id.localeCompare(b.recipe.id);
  });
  return pool.map(x => ({ ...x, reasons: [
    `관심 식재료 ${x.matches.map(id => names.get(id)).join('·')}를 활용해요.`,
    ...(x.shared.length ? [`선택 메뉴와 ${x.shared.map(id => names.get(id)).join('·')}를 함께 써요.`] : []),
    `추가 일반 재료 ${x.extra.length}종이 필요해요.`,
    ...(x.variety ? ['선택 메뉴에 없는 조리 유형이에요.'] : [])
  ] }));
}

export function pageResults(results, visible = 8) {
  return { items: results.slice(0, visible), hasMore: results.length > visible };
}
