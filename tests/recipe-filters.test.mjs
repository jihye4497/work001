import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FOOD_CATEGORIES, applyRecipeCategories, toggleFoodCategory, excludedRecipeResults } from '../js/recipe-filters.js';
import { createStore, KEYS, defaultDraft, validDraft } from '../js/storage.js';
import { MODES, recommend } from '../js/recommendations.js';
const read = async path => JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const ingredients = await read('data/ingredients.json');
const raw = await read('data/recipes.json');
const catalog = await read('data/recipe-categories.json');
const recipes = applyRecipeCategories(raw,catalog);
const memory = () => { const map = new Map(); return { getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v) }; };

test('전체 메뉴 분류는 안정적인 ID로 연결하고 누락·이름 변경·잘못된 종류를 거절',()=>{
  assert.ok(recipes.length>=1033);
  assert.equal(catalog.entries.length,recipes.length);
  assert.ok(recipes.every(r=>r.foodCategories.length && r.foodCategories.every(c=>FOOD_CATEGORIES.includes(c))));
  assert.throws(()=>applyRecipeCategories(raw,{entries:catalog.entries.slice(1)}));
  assert.throws(()=>applyRecipeCategories(raw,{entries:[...catalog.entries,catalog.entries[0]]}));
  assert.throws(()=>applyRecipeCategories([{...raw[0],name:'바뀐 메뉴'}],catalog));
});

test('종류 다중 선택은 합집합·겸용 중복 없음·전체 복귀·두 추천 방식 유지',()=>{
  const draft=defaultDraft();draft.selectedIngredientIds=['onion'];draft.activeInterestIds=[...draft.selectedIngredientIds];
  draft.selectedFoodCategories=toggleFoodCategory([], '한식 주메뉴');
  draft.selectedFoodCategories=toggleFoodCategory(draft.selectedFoodCategories,'한식 반찬');
  for(const mode of MODES) {
    draft.activeRecommendationMode=mode;
    const result=recommend(ingredients,recipes,draft);
    assert.ok(result.length>8);
    assert.ok(result.every(x=>x.recipe.foodCategories.some(c=>draft.selectedFoodCategories.includes(c))));
    assert.equal(new Set(result.map(x=>x.recipe.id)).size,result.length);
    const all=recommend(ingredients,recipes,{...draft,selectedFoodCategories:[]});
    assert.deepEqual(result.map(x=>x.recipe.id),all.filter(x=>x.recipe.foodCategories.some(c=>draft.selectedFoodCategories.includes(c))).map(x=>x.recipe.id));
  }
  assert.deepEqual(toggleFoodCategory(['양식'],'양식'),[]);
  assert.deepEqual(toggleFoodCategory(['양식','중식'],'전체'),[]);
});

test('이전 장보기는 종류 필드 없이 복원되고 제외 설정은 새 장보기·설정 변경 후에도 유지',()=>{
  const storage=memory(),old=defaultDraft();delete old.selectedFoodCategories;
  old.selectedIngredientIds=['onion'];old.selectedRecipes=[{recipeId:'squid-stir',times:2}];
  storage.setItem(KEYS.draft,JSON.stringify(old));
  const store=createStore(storage);
  assert.deepEqual(store.draft.selectedFoodCategories,[]);
  assert.deepEqual(store.draft.selectedRecipes,old.selectedRecipes);
  store.setExcludedRecipeIds(['squid-stir']);
  store.draft.selectedFoodCategories=['중식','양식'];store.saveDraft();
  const restored=createStore(storage);
  assert.deepEqual(restored.draft.selectedFoodCategories,['중식','양식']);
  restored.saveSettings({'기본 식사 인원':3,'기본 추천 방식':MODES[1]});restored.reset();
  assert.deepEqual(createStore(storage).excludedRecipeIds,['squid-stir']);
  assert.deepEqual(createStore(storage).draft.selectedRecipes,[]);
  assert.equal(validDraft({...defaultDraft(),selectedFoodCategories:['없는 종류']}),false);
});

test('제외는 추천에서만 제거하고 기존 선택·횟수·사용 재료에는 영향 없음, 복원 즉시 재노출',()=>{
  const draft=defaultDraft();draft.selectedIngredientIds=['onion'];draft.activeInterestIds=[...draft.selectedIngredientIds];draft.selectedRecipes=[{recipeId:'potato-stir',times:3}];
  const before=JSON.stringify(draft);
  const hidden=recommend(ingredients,recipes,draft,['squid-stir','potato-stir']);
  assert.ok(!hidden.some(x=>x.recipe.id==='squid-stir'));
  assert.equal(JSON.stringify(draft),before);
  assert.ok(recommend(ingredients,recipes,draft,[]).some(x=>x.recipe.id==='squid-stir'));
});

test('제외 목록 검색은 전체 목록에서 찾고 10개씩 확장·빈 결과·개별 복원을 처리',()=>{
  const ids=recipes.slice(0,35).map(r=>r.id);
  assert.equal(excludedRecipeResults(recipes,ids).items.length,10);
  assert.equal(excludedRecipeResults(recipes,ids,'',20).items.length,20);
  assert.equal(excludedRecipeResults(recipes,ids,'',40).hasMore,false);
  const target=recipes[30];
  assert.ok(excludedRecipeResults(recipes,ids,target.name).items.some(r=>r.id===target.id));
  assert.equal(excludedRecipeResults(recipes,ids,'없는메뉴').total,0);
  assert.equal(excludedRecipeResults(recipes,ids.filter(id=>id!==target.id),target.name).total,0);
});

test('손상된 제외 설정·저장 실패가 기존 장보기를 초기화하지 않음',()=>{
  const storage=memory();const draft=defaultDraft();draft.selectedRecipes=[{recipeId:'squid-stir',times:2}];
  storage.setItem(KEYS.draft,JSON.stringify(draft));storage.setItem(KEYS.preferences,'broken');
  const store=createStore(storage);assert.deepEqual(store.excludedRecipeIds,[]);assert.deepEqual(store.draft.selectedRecipes,draft.selectedRecipes);assert.ok(store.warnings.length);
  const failed=createStore({getItem:()=>null,setItem(){throw Error('blocked');}});
  assert.equal(failed.setExcludedRecipeIds(['squid-stir']),false);
  assert.deepEqual(failed.excludedRecipeIds,['squid-stir']);assert.ok(failed.warnings.length);
});
