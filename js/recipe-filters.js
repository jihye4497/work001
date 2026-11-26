export const FOOD_CATEGORIES = ['메인요리','면요리','국·찌개','반찬','밥·죽','간식','소스·음료'];
export const LEGACY_FOOD_CATEGORIES=['한식 주메뉴','한식 반찬','한식 국·찌개','양식','일식','중식','그 밖','퓨전'];
export const validStoredFoodCategories=value=>Array.isArray(value)&&new Set(value).size===value.length&&value.every(c=>[...FOOD_CATEGORIES,...LEGACY_FOOD_CATEGORIES].includes(c));
// Country filters cannot map accurately to dish kinds. Reset only that filter,
// never the user's recipes, quantities, pantry or shopping selection.
export const restoreFoodCategories=value=>value.some(c=>LEGACY_FOOD_CATEGORIES.includes(c))?[]:[...value];
export const validFoodCategories = value => Array.isArray(value) && new Set(value).size === value.length && value.every(x => FOOD_CATEGORIES.includes(x));
export function toggleFoodCategory(current, category) {
  if (category === '전체') return [];
  if (!FOOD_CATEGORIES.includes(category)) throw new Error('음식 종류를 확인해 주세요.');
  return current.includes(category) ? current.filter(x => x !== category) : [...current, category];
}
export function applyRecipeCategories(recipes, catalog) {
  if (!catalog || !Array.isArray(catalog.entries)) throw new Error('메뉴 분류를 확인해 주세요.');
  const entries = new Map(catalog.entries.map(x => [x.recipeId, x]));
  if (entries.size !== catalog.entries.length) throw new Error('메뉴 분류가 중복됐어요.');
  return recipes.map(recipe => {
    const entry = entries.get(recipe.id);
    if (!entry || entry.name !== recipe.name || !validFoodCategories(entry.categories) || !entry.categories.length) throw new Error('메뉴 분류 검토가 필요해요.');
    return { ...recipe, foodCategories: entry.categories };
  });
}
export function excludedRecipeResults(recipes, excludedIds, query = '', visible = 10) {
  const ids = new Set(excludedIds), q = query.trim().normalize('NFKC').toLocaleLowerCase('ko');
  const matches = recipes.filter(r => ids.has(r.id) && r.name.normalize('NFKC').toLocaleLowerCase('ko').includes(q)).sort((a,b) => a.name.localeCompare(b.name,'ko'));
  return { items: matches.slice(0, visible), total: matches.length, hasMore: matches.length > visible };
}
