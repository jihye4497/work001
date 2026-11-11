import { matchIngredient, primaryIngredientIds } from './ingredient-matching.js';
export const MODES=['추가 구매 최소','관심 재료 활용'];
export const LEGACY_MODES=['재료 최대 활용형','추가 재료 최소형','여러 끼 식단형','세 가지 모두 비교'];
export const normalizeMode=mode=>mode==='재료 최대 활용형'?MODES[1]:MODES.includes(mode)?mode:MODES[0];
export const MODE_DESCRIPTIONS=[
  '관심 재료를 쓰는 메뉴 중 추가로 살 재료가 적은 순서예요. 같으면 집에 있는 재료를 더 많이 활용하는 메뉴를 먼저 보여드려요.',
  '선택한 관심 재료가 모두 들어가는 메뉴예요. 주재료로 활용하는 메뉴, 집에 있는 재료를 많이 쓰는 메뉴부터 보여드려요.'
];
export function recommend(ingredients,recipes,draft,excludedRecipeIds=[],pantryIds=[]) {
  const byId=new Map(ingredients.map(i=>[i.id,i]));
  const general=new Set(ingredients.filter(i=>!i.isSeasoning).map(i=>i.id));
  const planned=draft.selectedIngredientIds.filter(id=>general.has(id));
  const active=(draft.activeInterestIds??planned).filter(id=>planned.includes(id));
  if(!active.length)return [];
  const selected=new Set(draft.selectedRecipes.map(s=>s.recipeId)),excluded=new Set(excludedRecipeIds);
  const categories=draft.selectedFoodCategories||[],mode=normalizeMode(draft.activeRecommendationMode),result=[];
  for(const recipe of recipes) {
    if(selected.has(recipe.id)||excluded.has(recipe.id)||(categories.length&&!recipe.foodCategories?.some(c=>categories.includes(c))))continue;
    const ids=[...new Set(recipe.ingredients.map(i=>i.ingredientId))].filter(id=>general.has(id));
    const primary=new Set(recipe.primaryIngredientIds??primaryIngredientIds(recipe,byId));
    const assignments=[],taken=new Set();
    for(const score of [2,1])for(const target of active) {
      if(assignments.some(a=>a.target===target))continue;
      const source=ids.find(id=>!taken.has(id)&&matchIngredient(id,target,recipe,byId)===score);
      if(source){assignments.push({source,target,score});taken.add(source);}
    }
    if(!assignments.length||(mode===MODES[1]&&assignments.length!==active.length))continue;
    const replacements={};for(const a of assignments)if(a.source!==a.target)replacements[a.source]=a.target;
    const owned=[],extra=[];
    for(const source of ids) {
      const assignment=assignments.find(a=>a.source===source);
      const effective=assignment?.target||source;
      const ownedId=pantryIds.find(target=>matchIngredient(effective,target,recipe,byId)===2)||(!assignment&&pantryIds.find(target=>matchIngredient(source,target,recipe,byId)===1));
      if(ownedId){owned.push(ownedId);if(!replacements[source]&&source!==ownedId)replacements[source]=ownedId;}
      else if(!planned.some(target=>matchIngredient(source,target,recipe,byId)>0))extra.push(source);
    }
    const mains=assignments.filter(a=>primary.has(a.source)).map(a=>a.target),uniqueOwned=[...new Set(owned)];
    const names=values=>values.map(id=>byId.get(id).name).join('·');
    result.push({recipe,matches:assignments.map(a=>a.target),mainMatches:mains,owned:uniqueOwned,shared:uniqueOwned,extra,replacements,
      substitutionCount:assignments.filter(a=>a.score===1).length,
      reasons:[mains.length?names(mains)+' 주재료 활용':names(assignments.map(a=>a.target))+' 재료 활용',
        '집에 있는 재료 '+uniqueOwned.length+'종 활용 · '+(extra.length?'추가 구매 '+extra.length+'종':'추가 구매 없음'),
        ...Object.entries(replacements).map(([from,to])=>byId.get(from).name+' → '+byId.get(to).name+' 활용')]});
  }
  result.sort((a,b)=>(mode===MODES[0]?a.extra.length-b.extra.length||b.owned.length-a.owned.length||b.mainMatches.length-a.mainMatches.length:b.mainMatches.length-a.mainMatches.length||b.owned.length-a.owned.length||a.extra.length-b.extra.length)||a.substitutionCount-b.substitutionCount||a.recipe.name.localeCompare(b.recipe.name,'ko')||a.recipe.id.localeCompare(b.recipe.id));
  return result;
}
export function searchMenus(recipes,query) {
  const q=query.trim().normalize('NFKC').toLocaleLowerCase('ko').replace(/\s/g,'');
  return q?recipes.filter(r=>r.name.normalize('NFKC').toLocaleLowerCase('ko').replace(/\s/g,'').includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'ko')):[];
}
export function recipeAvailability(recipe,ingredients,pantryIds) {
  const byId=new Map(ingredients.map(i=>[i.id,i])),owned=[],buy=[];
  for(const id of new Set(recipe.ingredients.map(i=>i.ingredientId))) {
    const ingredient=byId.get(id);if(!ingredient||ingredient.isSeasoning)continue;
    (pantryIds.some(target=>matchIngredient(id,target,recipe,byId)>0)?owned:buy).push(ingredient.name);
  }
  return {owned,buy};
}
export function replacementsFor(recipe,ingredients,targets) {
  const byId=new Map(ingredients.map(i=>[i.id,i])),replacements={};
  for(const item of recipe.ingredients){const target=targets.find(id=>matchIngredient(item.ingredientId,id,recipe,byId)===2)||targets.find(id=>matchIngredient(item.ingredientId,id,recipe,byId)===1);if(target&&target!==item.ingredientId)replacements[item.ingredientId]=target;}
  return replacements;
}
export function pageResults(results,visible=8){return {items:results.slice(0,visible),hasMore:results.length>visible};}
