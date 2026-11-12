import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateData, searchIngredients } from '../js/ingredients.js';
import { MODES, recommend, pageResults } from '../js/recommendations.js';
import { aggregate, totalText, copyText } from '../js/shopping-list.js';
import { createStore, KEYS, defaultDraft, validDraft } from '../js/storage.js';

const ingredients = JSON.parse(await readFile(new URL('../data/ingredients.json', import.meta.url)));
const recipes = JSON.parse(await readFile(new URL('../data/recipes.json', import.meta.url)));
const memory = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) }; };
const draft = (ids = ['onion']) => ({ ...defaultDraft(), selectedIngredientIds: ids, activeInterestIds: ids });
const recipe = (id, name, type, rows) => ({ id, name, baseServings: 2, cookMinutes: null, cookingType: type, imagePath: null, sourceNote: '테스트 전용', ingredients: rows.map(([ingredientId, amount, unit]) => ({ ingredientId, amount, unit, note: null })) });

test('실제 데이터 구조와 ID 참조 검증, 잘못된 필수값 거절', () => {
  assert.equal(validateData(ingredients, recipes).recipes.length, recipes.length);
  assert.ok(recipes.length >= 9);
  assert.throws(() => validateData([{ ...ingredients[0], aliases: null }], []));
  assert.throws(() => validateData(ingredients, [{ ...recipes[0], baseServings: 0 }]));
  assert.throws(() => validateData(ingredients, [{ ...recipes[0], ingredients: [{ ingredientId: 'missing', amount: 1, unit: 'g', note: null }] }]));
});
test('자동완성은 등록된 동의어만 표준 재료로 반환', () => {
  assert.equal(searchIngredients(ingredients, ' 달걀 ')[0].name, '계란');
  assert.deepEqual(searchIngredients(ingredients, '없는재료'), []);
  assert.deepEqual(searchIngredients(ingredients, ''), []);
});
test('인분·횟수 계산, 동일 단위만 합산, 단위 분리·미기재 유지', () => {
  const fixture = [recipe('a', '테스트 가', '볶음', [['squid', 1, '마리'], ['onion', 40, 'g'], ['salt', 1, 't']]), recipe('b', '테스트 나', '찌개', [['squid', 200, 'g'], ['onion', 10, 'g'], ['onion', null, '개']])];
  const rows = aggregate(ingredients, fixture, [{ recipeId: 'a', times: 3 }, { recipeId: 'b', times: 1 }], 1);
  assert.equal(totalText(rows.find(r => r.ingredient.id === 'squid')), '1.5마리 + 100g');
  assert.equal(totalText(rows.find(r => r.ingredient.id === 'onion')), '65g + 수량 미기재');
  assert.equal(rows.find(r => r.ingredient.id === 'salt').ingredient.category, '양념·조미료');
  assert.equal(rows.find(r => r.ingredient.id === 'onion').uses.length, 3);
  const text = copyText(rows, ['onion']);
  assert.match(text, /채소·버섯\n\[x\] 양파: 65g \+ 수량 미기재/);
  assert.match(text, /양념·조미료/);
});
test('T·t·밥숟가락 구분, 단위 미기재를 0으로 만들지 않음', () => {
  const fixture = [recipe('a', '테스트', '볶음', [['salt', 1, 'T'], ['salt', 2, 't'], ['salt', 1, '밥숟가락'], ['salt', 1, null]])];
  assert.equal(totalText(aggregate(ingredients, fixture, [{ recipeId: 'a', times: 1 }], 2)[0]), '1T + 2t + 1밥숟가락 + 수량 미기재');
});
test('모든 추천 후보는 관심 일반 재료 활용, 선택된 메뉴 중복 제외', () => {
  for (const ids of [['squid'], ['squid', 'potato'], ['squid', 'potato', 'onion']]) {
    const d = draft(ids); d.selectedRecipes = [{ recipeId: 'squid-stir', times: 2 }];
    for (const mode of MODES) {
      d.activeRecommendationMode = mode;
      const result = recommend(ingredients, recipes, d);
      assert.ok(result.every(r => r.matches.length > 0 && r.recipe.id !== 'squid-stir'));
      assert.equal(d.selectedRecipes[0].times, 2);
    }
  }
  assert.deepEqual(recommend(ingredients, recipes, draft(['salt'])), []);
  assert.deepEqual(recommend(ingredients, recipes, draft([])), []);
  assert.deepEqual(recommend(ingredients, recipes, draft(['unregistered-id'])), []);
  assert.ok(recommend(ingredients, recipes, draft(['enoki'])).every(r => r.matches.includes('enoki')));
});
test('두 모드 순위는 추가 구매와 주재료·보유 재료 활용을 구분하고 양념을 제외', () => {
  const rs = [recipe('a', '양파볶음', '볶음', [['onion', 1, '개'], ['potato', 1, '개'], ['salt', 1, 't']]), recipe('b', '나', '찌개', [['onion', 1, '개']])];
  const d = draft();
  d.activeRecommendationMode = MODES[0];
  assert.equal(recommend(ingredients, rs, d)[0].recipe.id, 'b');
  d.activeRecommendationMode = MODES[1];
  const result = recommend(ingredients, rs, d, [], ['potato']);
  assert.equal(result[0].recipe.id, 'a');
  assert.equal(result[0].extra.length, 0);
  assert.match(result[0].reasons.join(' '), /양파 주재료 활용/);
  assert.match(result[0].reasons.join(' '), /우리 집 재료 1종/);
});
test('동점은 활용 재료 수·메뉴명으로 결정, 8개씩 페이지 표시', () => {
  const rs = Array.from({ length: 18 }, (_, n) => recipe(String(n), `테스트${String(n).padStart(2,'0')}`, '볶음', [['onion', 1, '개']]));
  const results = recommend(ingredients, rs, draft());
  assert.equal(results[0].recipe.name, '테스트00');
  assert.equal(pageResults(results).items.length, 8);
  assert.equal(pageResults(results, 16).hasMore, true);
  assert.equal(pageResults(results, 24).items.length, 18);
  assert.equal(pageResults(results, 24).hasMore, false);
});
test('설정·현재 작업·추천 방식·체크 복원 및 작업만 초기화', () => {
  const storage = memory(); const first = createStore(storage);
  first.saveSettings({ '기본 식사 인원': 3, '기본 추천 방식': MODES[1] });
  first.draft.selectedIngredientIds = ['onion']; first.draft.selectedRecipes = [{ recipeId: 'squid-stir', times: 2 }];
  first.draft.activeRecommendationMode = MODES[0]; first.draft.checkedIngredientIds = ['onion']; first.saveDraft();
  const restored = createStore(storage);
  assert.equal(restored.settings['기본 식사 인원'], 3);
  assert.equal(restored.draft.selectedRecipes[0].times, 2);
  assert.equal(restored.draft.activeRecommendationMode, MODES[0]);
  assert.deepEqual(restored.draft.checkedIngredientIds, ['onion']);
  restored.reset();
  assert.deepEqual(restored.draft.selectedRecipes, []);
  assert.equal(restored.settings['기본 식사 인원'], 3);
  assert.equal(restored.draft.activeRecommendationMode, MODES[1]);
});
test('손상 JSON·미지원 스키마·저장 불가에도 메모리 상태 사용', () => {
  const storage = memory(); storage.setItem(KEYS.draft, '{broken');
  const recovered = createStore(storage); assert.ok(recovered.warnings.length); assert.deepEqual(recovered.draft.selectedRecipes, []);
  assert.equal(validDraft({ ...defaultDraft(), schemaVersion: 99 }), false);
  assert.equal(validDraft({ ...defaultDraft(), selectedRecipes: [{ recipeId: 'x', times: 0 }] }), false);
  const failed = createStore({ getItem() { throw new Error(); }, setItem() { throw new Error(); } });
  failed.draft.selectedIngredientIds.push('onion'); assert.equal(failed.saveDraft(), false);
  assert.deepEqual(failed.draft.selectedIngredientIds, ['onion']); assert.ok(failed.warnings.some(w => w.includes('저장하지 못했어요')));
});
test('삭제된 ID만 정리하고 유효한 메뉴와 횟수 보존', () => {
  const store = createStore(memory()); store.draft.selectedRecipes = [{ recipeId: 'squid-stir', times: 2 }, { recipeId: 'old', times: 1 }];
  store.reconcile(ingredients, recipes);
  assert.deepEqual(store.draft.selectedRecipes, [{ recipeId: 'squid-stir', times: 2 }]);
  assert.ok(store.warnings.length);
});


test('메뉴별 정수 인분은 원본 비례 계산·저장 복원하고 잘못된 인분을 거절',()=>{
 const fixture=[{...recipe('portion','인분 테스트','찌개',[['onion',400,'g']]),baseServings:4}];
 const d=draft();d.selectedRecipes=[{recipeId:'portion',times:2,servings:3}];
 assert.equal(totalText(aggregate(ingredients,fixture,d.selectedRecipes,2)[0]),'300g');
 assert.equal(totalText(aggregate(ingredients,fixture,d.selectedRecipes,4)[0]),'300g');
 const storage=memory();const store=createStore(storage);store.draft.selectedRecipes=d.selectedRecipes;store.saveDraft();
 assert.equal(createStore(storage).draft.selectedRecipes[0].servings,3);
 for(const servings of [0,-1,1.5,'3',null,Number.MAX_SAFE_INTEGER+1]) {
  assert.equal(validDraft({...d,selectedRecipes:[{recipeId:'portion',times:1,servings}]}),false);
 }
 assert.equal(validDraft(d),true);
});


test('물·생수는 구매와 선택 복사에서 제외하고 원본 합산·탄산수·육수는 보존',async()=>{
 const {partitionShoppingRows,selectedCopyText}=await import('../js/shopping-list.js');
 const names=['물','생수','탄산수','육수'];
 const items=names.map(name=>ingredients.find(i=>i.name===name));assert.ok(items.every(Boolean));
 const r=recipe('water-check','물 제외 확인','찌개',items.map(i=>[i.id,100,'g']));
 const rows=aggregate(ingredients,[r],[{recipeId:r.id,times:1}],2);
 assert.equal(rows.length,4);assert.ok(rows.every(row=>totalText(row)==='100g'));
 const groups=partitionShoppingRows(rows,[],ingredients);
 assert.deepEqual(new Set(groups[0].rows.map(row=>row.ingredient.name)),new Set(['탄산수','육수']));
 const copied=selectedCopyText(rows,items.map(i=>i.id));
 assert.deepEqual(new Set(copied.split('\n')),new Set(['탄산수: 100g','육수: 100g']));
 assert.equal(partitionShoppingRows(rows,[items[0].id],ingredients)[1].rows[0].ingredient.name,'물');
 assert.equal(r.ingredients.length,4);
});


test('용도만 다른 소금은 대표 소금으로 검색·보유 매칭·동일 단위 합산하고 소금물은 분리',async()=>{
 const {matchIngredient}=await import('../js/ingredient-matching.js');
 const {partitionShoppingRows}=await import('../js/shopping-list.js');
 const byId=new Map(ingredients.map(i=>[i.id,i]));
 const blanch=ingredients.find(i=>i.name==='소금(데치는용)');const bitter=ingredients.find(i=>i.name==='소금(쓴맛 제거용)');
 const water=ingredients.find(i=>i.name==='소금물');const low=ingredients.find(i=>i.name==='저염소금');
 assert.deepEqual(searchIngredients(ingredients,'소금(데치는용)').map(i=>i.id),['salt']);
 const fixture=recipe('salt-check','소금 확인','찜',[[blanch.id,2,'g'],[bitter.id,3,'g'],['salt',1,'t'],[water.id,100,'mL'],[low.id,4,'g']]);
 assert.equal(matchIngredient(blanch.id,'salt',fixture,byId),2);assert.equal(matchIngredient(water.id,'salt',fixture,byId),0);assert.equal(matchIngredient(low.id,'salt',fixture,byId),0);
 const before=JSON.stringify(fixture);const rows=aggregate(ingredients,[fixture],[{recipeId:fixture.id,times:1}],2);
 assert.equal(totalText(rows.find(r=>r.ingredient.id==='salt')),'5g + 1t');
 assert.ok(rows.some(r=>r.ingredient.id===water.id));assert.ok(rows.some(r=>r.ingredient.id===low.id));
 const groups=partitionShoppingRows(rows,['salt'],ingredients);assert.deepEqual(groups[1].rows.map(r=>r.ingredient.id),['salt']);
 assert.equal(JSON.stringify(fixture),before);
});
