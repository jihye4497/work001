import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend, MODES, replacementsFor, searchMenus } from '../js/recommendations.js';
import { aggregate, partitionShoppingRows, copyText, totalText } from '../js/shopping-list.js';
import { createStore, defaultDraft, KEYS } from '../js/storage.js';
import { primaryIngredientIds } from '../js/ingredient-matching.js';
const food=(id,name,isSeasoning=false)=>({id,name,aliases:[],isSeasoning,category:isSeasoning?'양념·조미료':'육류·해산물'});
const foods=[food('squid','오징어'),food('shrimp','새우'),food('crab','꽃게'),food('onion','양파'),food('potato','감자'),food('salt','소금',true),food('front','돼지 앞다리살'),food('neck','돼지고기 목살'),food('neck2','돼지 목심'),food('beef','소고기 사태'),food('mince','다진 돼지 목살')];
const dish=(id,name,ids)=>({id,name,baseServings:1,cookingType:'볶음',ingredients:ids.map(ingredientId=>({ingredientId,amount:10,unit:'g',note:null}))});
const draft=ids=>({...defaultDraft(),selectedIngredientIds:ids,activeInterestIds:ids,activeRecommendationMode:MODES[1]});
test('관심 재료 활용은 활성 1·2·3개 모두 포함하며 없으면 다른 메뉴로 채우지 않음',()=>{
 const recipes=[dish('a','오징어볶음',['squid']),dish('b','오징어 새우볶음',['squid','shrimp']),dish('c','모둠볶음',['squid','shrimp','crab'])];
 assert.equal(recommend(foods,recipes,draft(['squid'])).length,3);
 assert.equal(recommend(foods,recipes,draft(['squid','shrimp'])).length,2);
 assert.equal(recommend(foods,recipes,draft(['squid','shrimp','crab'])).length,1);
 assert.deepEqual(recommend(foods,recipes,draft(['squid','potato'])),[]);
 assert.deepEqual(recommend(foods,recipes,{...draft(['squid']),activeInterestIds:[]}),[]);
});
test('관심 활용은 주재료 우선, 구매 최소는 추가 구매 수 우선·동률이면 보유 활용 우선',()=>{
 const recipes=[dish('a','오징어볶음',['squid','onion','potato']),dish('b','해물볶음',['squid','onion']),dish('c','간단볶음',['squid'])];
 const d=draft(['squid']);
 assert.equal(recommend(foods,recipes,d,[],['onion'])[0].recipe.id,'a');
 d.activeRecommendationMode=MODES[0];
 assert.deepEqual(recommend(foods,recipes,d,[],['onion']).map(r=>r.recipe.id),['b','c','a']);
 assert.deepEqual(primaryIngredientIds(recipes[0],foods),['squid']);
});
test('김치찌개 부위 대체는 실제 선택 부위로 합산하고 동일 부위·종류를 우선, 다짐육·소고기는 대체 안함',()=>{
 const stew=dish('stew','김치찌개',['front','onion','salt']);
 const result=recommend(foods,[stew],draft(['neck']),[],['onion'])[0];
 assert.deepEqual(result.replacements,{front:'neck'});
 const rows=aggregate(foods,[stew],[{recipeId:'stew',times:2,ingredientReplacements:result.replacements}],3);
 assert.equal(totalText(rows.find(r=>r.ingredient.id==='neck')),'60g');
 assert.ok(!rows.some(r=>r.ingredient.id==='front'));
 assert.deepEqual(partitionShoppingRows(rows,['onion'],foods).map(g=>g.rows.map(r=>r.ingredient.id)),[['neck','salt'],['onion']]);
 assert.match(copyText(rows,[],['onion'],foods),/구매할 재료\n\[ \] 돼지고기 목살: 60g/);
 assert.deepEqual(recommend(foods,[stew],draft(['beef'])),[]);
 assert.deepEqual(recommend(foods,[stew],draft(['mince'])),[]);
 assert.deepEqual(recommend(foods,[dish('roast','수육',['front'])],draft(['neck'])),[]);
 assert.deepEqual(replacementsFor(stew,foods,['neck','front']),{});
 assert.deepEqual(replacementsFor(dish('x','구이',['neck']),foods,['neck2']),{neck:'neck2'});
});
test('메뉴 검색은 전체 메뉴명·공백을 검색하며 목록을 바꾸지 않음',()=>{
 const recipes=[dish('a','김치찌개',['front']),dish('b','새우 볶음',['shrimp'])];
 assert.deepEqual(searchMenus(recipes,' 김 치 찌 개 ').map(r=>r.id),['a']);
 assert.equal(searchMenus(recipes,'새우볶음').length,1);
 assert.equal(recipes.length,2);
});
test('예전 세 방식 저장값을 변환하고 보유·제외는 새 장보기 후 유지, 검색·활성 재료는 초기화',()=>{
 const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 values.set(KEYS.draft,JSON.stringify({schemaVersion:1,selectedIngredientIds:['squid'],selectedRecipes:[{recipeId:'a',times:3}],checkedIngredientIds:[],activeRecommendationMode:'재료 최대 활용형'}));
 const s=createStore(storage);assert.equal(s.draft.activeRecommendationMode,MODES[1]);assert.deepEqual(s.draft.activeInterestIds,['squid']);
 s.setPantryIngredientIds(['onion']);s.setExcludedRecipeIds(['b']);s.draft.menuQuery='김치';s.saveDraft();
 const restored=createStore(storage);assert.equal(restored.draft.selectedRecipes[0].times,3);
 assert.equal(restored.draft.menuQuery,'김치');restored.reset();
 assert.deepEqual(restored.pantryIngredientIds,['onion']);assert.deepEqual(restored.excludedRecipeIds,['b']);
 assert.equal(restored.draft.menuQuery,'');assert.deepEqual(restored.draft.activeInterestIds,[]);
});

test('양념은 보유 선택 시에만 보유 구획으로 이동하며 접힘과 무관한 복사에 포함',()=>{
 const recipe=dish('a','오징어볶음',['squid','salt']);
 const rows=aggregate(foods,[recipe],[{recipeId:'a',times:1}],1);
 assert.deepEqual(partitionShoppingRows(rows,[],foods).map(g=>g.rows.map(r=>r.ingredient.id)),[['squid','salt'],[]]);
 assert.deepEqual(partitionShoppingRows(rows,['salt'],foods).map(g=>g.rows.map(r=>r.ingredient.id)),[['squid'],['salt']]);
 assert.match(copyText(rows,[],['salt'],foods),/집에 있는 재료\n\[ \] 소금: 10g \(양념\)/);
});

test('구매 최소는 관심 해제에 영향받지 않고 보유만으로 추천하며 미보유 양념을 추가 구매에 포함',()=>{
 const recipes=[dish('a','오징어볶음',['squid','onion']),dish('b','오징어무침',['squid','salt'])];
 const d={...draft(['squid']),activeRecommendationMode:MODES[0],activeInterestIds:[]};
 assert.equal(recommend(foods,recipes,d,[],['onion']).length,2);
 const ownedOnly={...d,selectedIngredientIds:[]};
 const result=recommend(foods,recipes,ownedOnly,[],['squid','onion']);
 assert.equal(result[0].recipe.id,'a');assert.deepEqual(result[0].extra,[]);
 assert.deepEqual(result.find(r=>r.recipe.id==='b').extra,['salt']);
 assert.deepEqual(recommend(foods,recipes,ownedOnly),[]);
 d.activeRecommendationMode=MODES[1];assert.deepEqual(recommend(foods,recipes,d,[],['squid']),[]);
});
