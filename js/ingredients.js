import { representativeIngredient } from './ingredient-matching.js';
import { isCookingWater } from './ingredient-aliases.js';
import { applyRecipeImages } from './recipe-images.js';
import { applyRecipeCategories } from './recipe-filters.js';
import { primaryIngredientIds } from './ingredient-matching.js';
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
    if (r.servingsStatus !== undefined && !['explicit', 'estimated', 'user-confirmed'].includes(r.servingsStatus)) throw new Error('인분 확인 상태를 확인해 주세요.');
    if (['estimated','user-confirmed'].includes(r.servingsStatus) && (typeof r.servingsEvidence !== 'string' || !r.servingsEvidence.trim())) throw new Error('인분의 근거를 확인해 주세요.');
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
  const byId=new Map(ingredients.map(i=>[i.id,i]));
  return [...new Map(ingredients.filter(i => !isCookingWater(i) && [i.name, ...i.aliases].some(n => n.normalize('NFKC').toLocaleLowerCase('ko').includes(q))).map(i=>{const representative=representativeIngredient(i,byId);return [representative.id,representative];})).values()];
}

export async function loadData() {
  const urls = ['../data/ingredients.json', '../data/recipes.json', '../data/recipe-categories.json', '../data/recipe-images.json', '../data/generated-recipe-images.json'];
  const data = await Promise.all(urls.map(async path => {
    const response = await fetch(new URL(path, import.meta.url));
    if (!response.ok) throw new Error('데이터를 불러오지 못했어요.');
    return response.json();
  }));
  const byId=new Map(data[0].map(i=>[i.id,i]));
  const recipes=applyRecipeImages(applyRecipeCategories(data[1],data[2]),data[3],data[4]).map(r=>({...r,primaryIngredientIds:primaryIngredientIds(r,byId)}));
  return validateData(data[0],recipes);
}

// Display-only curation; imported ingredient definitions remain unchanged.
const QUICK_PICK_NAMES = {
  '채소·버섯': ['양파','팽이버섯','감자','당근','애호박','대파','청양고추','풋고추','표고버섯','단호박','마늘','양배추','오이','무','콩나물','시금치','브로콜리','깻잎','새송이버섯','양송이버섯'],
  '육류·해산물': ['오징어','돼지 앞다리살','새우','국멸치','소고기','삼겹살','닭다릿살','닭 가슴살','고등어','갈치','연어','꽃게','바지락','홍합','굴','낙지','주꾸미','베이컨','돼지고기 목심','소고기 다짐육'],
  '두부·계란·기타': ['계란','두부','쌀','김치','밥','순두부','연두부','우유','치즈','플레인 요거트','당면','소면','스파게티','어묵','떡','누룽지','밀가루','부침가루','전분','라이스페이퍼'],
  '양념·조미료': ['식용유','소금','후추가루','고추장','고춧가루','설탕','물엿','맛술','다진 마늘','참기름','된장','카레 가루','간장','국간장','식초','참깨','올리브유','굴소스','액젓','마요네즈']
};
export function quickPickIngredients(ingredients, category) {
  const group = ingredients.filter(i => i.category === category);
  return (QUICK_PICK_NAMES[category] || []).map(name => group.find(i => i.name === name)).filter(Boolean);
}
