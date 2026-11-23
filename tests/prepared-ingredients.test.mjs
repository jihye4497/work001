import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {aggregate,totalText,preparationText,partitionShoppingRows,selectedCopyText} from '../js/shopping-list.js';
import {searchIngredients} from '../js/ingredients.js';
import {browseIngredients} from '../js/ingredient-browse.js';
import {matchIngredient,representativeIngredient} from '../js/ingredient-matching.js';
import {replacementsFor} from '../js/recommendations.js';
import {syncMenuIngredients} from '../js/menu-ingredients.js';
import {defaultDraft,createStore,KEYS} from '../js/storage.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
const get=name=>ingredients.find(i=>i.name===name),byId=new Map(ingredients.map(i=>[i.id,i]));
const recipe=(name,id='fixture')=>({id,name:'준비 재료',baseServings:1,ingredients:[{ingredientId:get(name).id,amount:100,unit:'g',note:`원문 ${name} 100g`}]});

test('온도만 다른 물은 구매·검색에서 제외하고 제품·산초 형태·매실 농도는 수량 구분',()=>{
 for(const name of ['따뜻한물','물미지근한것','얼음물']){
  assert.deepEqual(searchIngredients(ingredients,name),[]);
  const r=recipe(name),rows=aggregate(ingredients,[r],[{recipeId:r.id,servings:1}],1);
  assert.equal(totalText(rows[0]),'100g');assert.equal(partitionShoppingRows(rows,[],ingredients)[0].rows.length,0);assert.equal(selectedCopyText(rows,[get(name).id]),'');
 }
 for(const [a,b] of [['산초가루','산초'],['매실액','매실청'],['매실엑기스','매실청'],['매실농축액','매실청'],['매실원액','매실청']])assert.equal(representativeIngredient(get(a),byId).id,get(b).id);
 assert.equal(matchIngredient(get('저염소금').id,get('소금').id,{name:''},byId),0);
 const r={...recipe('산초'),ingredients:['산초','산초가루','매실청','매실농축액','매실원액'].map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:null}))};
 const rows=aggregate(ingredients,[r],[{recipeId:r.id,servings:1}],1);
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='산초')),'산초 10g + 산초가루 10g');
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='매실청')),'매실청 10g + 매실농축액 10g + 매실원액 10g');
});

test('멸치육수는 액체 구매항목 대신 대체 준비 안내, 코인·멸치 양으로 잘못 환산하지 않음',()=>{
 const r=recipe('멸치 육수'),before=JSON.stringify(r),selection={recipeId:r.id,servings:2};
 const rows=aggregate(ingredients,[r],[selection],1);
 assert.equal(rows[0].ingredient.name,'국멸치 또는 멸치 육수 코인');assert.equal(totalText(rows[0]),'수량 미기재');
 assert.match(preparationText(rows[0]),/멸치 육수 200g 준비/);assert.match(preparationText(rows[0]),/제품의 물 용량/);
 assert.match(selectedCopyText(rows,[rows[0].ingredient.id]),/국멸치 또는 멸치 육수 코인: 수량 미기재/);
 assert.ok(!searchIngredients(ingredients,'멸치').some(i=>i.id===get('멸치 육수').id));
 assert.ok(!browseIngredients(ingredients,'양념').some(i=>i.id===get('멸치 육수').id));
 for(const name of ['국멸치','멸치 육수 코인']){
  const target=get(name).id,replacements=replacementsFor(r,ingredients,[target]);
  assert.equal(replacements[get('멸치 육수').id],target);
  const converted=aggregate(ingredients,[r],[{...selection,ingredientReplacements:replacements}],1);
  assert.equal(converted[0].ingredient.id,target);assert.equal(totalText(converted[0]),'수량 미기재');
  assert.equal(partitionShoppingRows(rows,[target],ingredients)[0].rows.length,0);
  assert.equal(matchIngredient(target,get('멸치 육수').id,r,byId),0);
 }
 assert.equal(JSON.stringify(r),before);
 const replacements=replacementsFor(r,ingredients,[get('멸치 육수 코인').id]);
 const values=new Map([[KEYS.draft,JSON.stringify({...defaultDraft(),selectedRecipes:[{...selection,times:1,ingredientReplacements:replacements}]})]]);
 const store=createStore({getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)});store.reconcile(ingredients,[r]);assert.deepEqual(store.draft.selectedRecipes[0].ingredientReplacements,replacements);
});

test('물전분의 액체량은 전분 무게가 아니며 검토된 원문 전분 양만 반영',()=>{
 for(const [id,name,expected] of [['mfds-cookrcp01-3771','전분','60g'],['mfds-cookrcp01-543','전분','20g'],['mincook-blog-665','감자전분','2스푼']]){
  const original=recipes.find(r=>r.id===id),item=original.ingredients.find(i=>/물전분|물녹말|녹말물|전분물/.test(getById(i.ingredientId).name));
  const r={...original,baseServings:1,ingredients:[item]},before=JSON.stringify(r),rows=aggregate(ingredients,[r],[{recipeId:r.id,servings:2}],1);
  assert.equal(rows[0].ingredient.id,get(name).id);assert.equal(totalText(rows[0]),expected);assert.equal(JSON.stringify(r),before);
 }
 const r=recipe('물전분'),rows=aggregate(ingredients,[r],[{recipeId:r.id,servings:1}],1);
 assert.equal(rows[0].ingredient.id,get('전분').id);assert.equal(totalText(rows[0]),'수량 미기재');assert.match(preparationText(rows[0]),/물전분 100g 준비/);
 for(const category of ['농산물','육·수산','기타','양념'])assert.ok(!browseIngredients(ingredients,category).some(i=>/^(물전분|물녹말|녹말물|전분물)$/.test(i.name)));
 const draft={...defaultDraft(),selectedRecipes:[{recipeId:r.id,servings:1,times:1}]};syncMenuIngredients(draft,ingredients,[r]);assert.ok(draft.selectedIngredientIds.includes(get('전분').id));assert.ok(!draft.selectedIngredientIds.includes(get('물전분').id));
});
function getById(id){return byId.get(id);}

test('골뱅이 국물은 통조림 부속액으로 안내하며 이미 있는 캔 수량에 중복 추가하지 않음',()=>{
 const original=recipes.find(r=>r.id==='mincook-blog-82'),before=JSON.stringify(original);
 const rows=aggregate(ingredients,[original],[{recipeId:original.id,servings:original.baseServings}],1);
 const snail=rows.find(r=>r.ingredient.name==='골뱅이');
 assert.equal(totalText(snail),'2캔');assert.match(preparationText(snail),/추가로 계산하지 않아요/);
 assert.equal(rows.some(r=>r.ingredient.name==='골뱅이 국물'||r.ingredient.name==='골뱅이 통조림'),false);
 assert.equal(JSON.stringify(original),before);
 const r=recipe('골뱅이 국물'),liquidRows=aggregate(ingredients,[r],[{recipeId:r.id,servings:1}],1);
 assert.equal(liquidRows[0].ingredient.name,'골뱅이 통조림');assert.equal(totalText(liquidRows[0]),'수량 미기재');assert.match(preparationText(liquidRows[0]),/골뱅이 국물 100g 준비/);
 assert.ok(!searchIngredients(ingredients,'골뱅이').some(i=>i.name==='골뱅이 국물'));
});
