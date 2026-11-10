export const CATEGORIES = ['채소·버섯', '육류·해산물', '두부·계란·기타', '양념·조미료'];

export function validateData(ingredients, recipes) {
  if (!Array.isArray(ingredients) || !Array.isArray(recipes)) throw new Error('데이터 형식이 올바르지 않아요.');
  const ids = new Set();
  for (const i of ingredients) {
    if (!i || typeof i.id !== 'string' || !i.id || ids.has(i.id) || typeof i.name !== 'string' || !i.name ||
      !CATEGORIES.includes(i.category) || !Array.isArray(i.aliases) || !i.aliases.every(x => typeof x === 'string') ||
      typeof i.isSeasoning !== 'boolean' || typeof i.isQuickPick !== 'boolean') throw new Error('재료 데이터를 확인해 주세요.');
    ids.add(i.id);
  }
  const recipeIds = new Set();
  for (const r of recipes) {
    if (!r || typeof r.id !== 'string' || !r.id || recipeIds.has(r.id) || typeof r.name !== 'string' || !r.name ||
      !Number.isFinite(r.baseServings) || r.baseServings <= 0 || !Array.isArray(r.ingredients) || !r.ingredients.length ||
      typeof r.cookingType !== 'string' || !r.cookingType || typeof r.sourceNote !== 'string' || !r.sourceNote ||
      !(r.imagePath === null || typeof r.imagePath === 'string') ||
      !(r.cookMinutes === null || (Number.isFinite(r.cookMinutes) && r.cookMinutes > 0))) throw new Error('메뉴 데이터를 확인해 주세요.');
    recipeIds.add(r.id);
    if (r.servingsStatus !== undefined && !['explicit', 'estimated'].includes(r.servingsStatus)) throw new Error('인분 확인 상태를 확인해 주세요.');
    if (r.servingsStatus === 'estimated' && (typeof r.servingsEvidence !== 'string' || !r.servingsEvidence.trim())) throw new Error('추정 인분의 근거를 확인해 주세요.');
    for (const i of r.ingredients) {
      if (!i || !ids.has(i.ingredientId) || !(i.amount === null || (Number.isFinite(i.amount) && i.amount >= 0)) ||
        !(i.unit === null || (typeof i.unit === 'string' && i.unit.length > 0)) ||
        !(i.note === null || typeof i.note === 'string')) throw new Error('메뉴별 재료량을 확인해 주세요.');
    }
  }
  return { ingredients, recipes };
}

export function searchIngredients(ingredients, query) {
  const q = query.trim().normalize('NFKC').toLocaleLowerCase('ko');
  if (!q) return [];
  return ingredients.filter(i => [i.name, ...i.aliases].some(n => n.normalize('NFKC').toLocaleLowerCase('ko').includes(q)));
}

export async function loadData() {
  const urls = ['../data/ingredients.json', '../data/recipes.json'];
  const data = await Promise.all(urls.map(async path => {
    const response = await fetch(new URL(path, import.meta.url));
    if (!response.ok) throw new Error('데이터를 불러오지 못했어요.');
    return response.json();
  }));
  return validateData(...data);
}
