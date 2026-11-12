import { canonicalIngredientName } from './ingredient-aliases.js';
// Preparation notes do not define a different salt product. Salt water is intentionally separate.
export function isPlainSaltVariant(ingredient) {
  return /^소금\((?:데치는용|쓴맛제거용)\)$/.test(ingredient?.name?.replace(/\s/g,'')||'');
}
const nameIndexes=new WeakMap();
export function representativeIngredient(ingredient,byId) {
  if(isPlainSaltVariant(ingredient))return byId.get('salt')||ingredient;
  const name=canonicalIngredientName(ingredient);
  if(!name)return ingredient;
  if(!nameIndexes.has(byId))nameIndexes.set(byId,new Map([...byId.values()].map(item=>[item.name,item])));
  return nameIndexes.get(byId).get(name)||ingredient;
}
export function ingredientKey(ingredient) {
  if(!ingredient)return '';
  if(ingredient.id==='salt'||isPlainSaltVariant(ingredient))return 'salt';
  const canonical=canonicalIngredientName(ingredient);if(canonical)return `named:${canonical}`;
  const n=ingredient.name.replace(/\s/g,''),prep=/다진|갈은|분쇄|민찌/.test(n)?'다진:':'';
  if(/돼지|돈육|한돈|삼겹/.test(n)) {
    const cut=/목살|목심/.test(n)?'목살':/앞다리|전지/.test(n)?'앞다리':/삼겹/.test(n)?'삼겹살':/사태/.test(n)?'사태':null;
    if(cut)return `돼지:${prep}${cut}`;
  }
  return ingredient.id;
}
export function matchIngredient(sourceId,targetId,recipe,byId) {
  if(sourceId===targetId)return 2;
  const a=ingredientKey(byId.get(sourceId)),b=ingredientKey(byId.get(targetId));
  if(a&&a===b)return 2;
  const cuts=new Set(['돼지:앞다리','돼지:목살','돼지:삼겹살']);
  return /김치찌개/.test(recipe.name)&&cuts.has(a)&&cuts.has(b)?1:0;
}
export function primaryIngredientIds(recipe,ingredients) {
  const byId=ingredients instanceof Map?ingredients:new Map(ingredients.map(i=>[i.id,i]));
  const compact=s=>s.replace(/[\s()·]/g,''),title=compact(recipe.name);
  const overrides={'kimchi-stew':['kimchi','pork'],'doenjang-stew':['tofu'],'curry':['pork','potato','carrot']};
  if(overrides[recipe.id])return overrides[recipe.id].filter(id=>recipe.ingredients.some(i=>i.ingredientId===id));
  return [...new Set(recipe.ingredients.map(i=>i.ingredientId))].filter(id=>{
    const i=byId.get(id);if(!i||i.isSeasoning)return false;
    if([i.name,...i.aliases].some(s=>compact(s).length>=2&&title.includes(compact(s))))return true;
    const rules=[[/오징어/,/오징어/],[/새우/,/새우/],[/팽이/,/팽이/],[/양파/,/양파/],[/감자/,/감자/],[/계란|달걀|다마고/,/계란|달걀/],[/닭|치킨|삼계|초계/,/닭/],[/소고기|쇠고기|육회|불고기/,/소고기|쇠고기|우육|우민찌/],[/돼지|삼겹|돈육|폭찹/,/돼지|삼겹|돈육|한돈/],[/두부/,/두부/],[/김치/,/김치/],[/버섯/,/버섯|양송이|새송이|느타리/],[/전복/,/전복/],[/꽃게/,/꽃게/],[/낙지/,/낙지/],[/주꾸미|쭈꾸미/,/주꾸미|쭈꾸미/]];
    return rules.some(([dish,food])=>dish.test(title)&&food.test(compact(i.name)));
  });
}
