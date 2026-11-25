import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyCalculationBasis,selectedBatchCount,BATCH_RECIPE_REVIEWS} from '../js/recipe-calculation-basis.js';
import {aggregate} from '../js/shopping-list.js';
import {servingLabel} from '../js/servings.js';
import {createStore,defaultDraft,KEYS} from '../js/storage.js';
const read=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const [raw,ingredients]=await Promise.all([read('data/recipes.json'),read('data/ingredients.json')]);
const recipes=applyCalculationBasis(raw);
const amount=(id,ingredientId,people,count)=>aggregate(ingredients,recipes,[{recipeId:id,times:1,servings:people,...(count===undefined?{}:{batchCount:count})}],people).find(r=>r.ingredient.id===ingredientId);
test('모든 명시 제조형은 원문 전량/2회분·미기재 단위를 보존하고 인원과 분리',()=>{
 const sort=rows=>rows.map(r=>JSON.stringify(r)).sort();
 for(const id of Object.keys(BATCH_RECIPE_REVIEWS)){
  const recipe=recipes.find(r=>r.id===id);assert.ok(recipe,id);
  for(const [people,count] of [[1,1],[4,1],[2,2]]){
   const rows=aggregate(ingredients,recipes,[{recipeId:id,times:1,servings:people,batchCount:count}],people);
   assert.deepEqual(sort(rows.flatMap(r=>r.uses.map(u=>[u.note,u.amount,u.unit]))),sort(recipe.ingredients.map(i=>[i.note,i.amount===null?null:i.amount*count,i.unit])),id);
   assert.ok(rows.every(r=>!r.estimated),id);
  }
 }
});
test('원문에서 명확한 양파1개/비식재료 도구만 바로잡고 미확정 혼합메뉴는 제조형 전환하지 않음',()=>{
 const dumpling=recipes.find(r=>r.id==='mincook-blog-59');
 const onion=dumpling.ingredients.find(i=>i.note.startsWith('원문: 양파 : 큰 것 기준 1개'));
 assert.equal(onion.amount,1);assert.equal(onion.unit,'개');
 assert.equal(raw.find(r=>r.id===dumpling.id).ingredients.find(i=>i.ingredientId===onion.ingredientId).amount,null);
 assert.ok(!recipes.find(r=>r.id==='mincook-blog-238').ingredients.some(i=>i.note==='원문: 전기밥솥'));
 for(const article of [728,625,623,601,598,578])assert.equal(recipes.find(r=>r.id===`mincook-blog-${article}`).calculationMode,undefined);
 assert.equal(recipes.find(r=>r.id==='mincook-blog-238').calculationMode,'batch');
});
test('감동란·두부마요네즈·양파볶음은 인원과 무관하게 원문 전량을 제조횟수로 계산',()=>{
 for(const people of [1,2,4]){
  assert.equal(amount('moony-UOWYEGyvVs0','egg',people).totals.get('개'),6);
  assert.equal(amount('moony-kOS_EGIExvU','tofu',people).totals.get('g'),200);
  assert.equal(amount('paik-uAShnbgCLSU','onion',people).totals.get('kg'),15);
  const meat=recipes.find(r=>r.id==='caden-DX6ydTY05O4').ingredients[0].ingredientId;
  const rows=aggregate(ingredients,recipes,[{recipeId:'caden-DX6ydTY05O4',times:1,servings:people}],people);
  assert.ok(rows.some(r=>r.uses.some(u=>u.originalIngredientName===ingredients.find(i=>i.id===meat).name&&u.amount===500)));
 }
 assert.equal(amount('moony-UOWYEGyvVs0','egg',2,2).totals.get('개'),12);
 assert.equal(amount('moony-kOS_EGIExvU','tofu',2,2).totals.get('g'),400);
 assert.equal(amount('paik-uAShnbgCLSU','onion',2,2).totals.get('kg'),30);
 assert.equal(amount('moony-UOWYEGyvVs0','egg',2).estimated,undefined);
 assert.equal(amount('moony-UOWYEGyvVs0','egg',2,2).uses[0].batchTimes,2);
 assert.equal(servingLabel(recipes.find(r=>r.id==='moony-UOWYEGyvVs0')),'1회 제조량 · 달걀 6개');
 assert.equal(raw.find(r=>r.id==='moony-UOWYEGyvVs0').calculationMode,undefined);
});
test('기존 메뉴·인분·횟수는 지우지 않고 제조횟수 저장과 복원 및 불량값 검증',()=>{
 const old={recipeId:'moony-UOWYEGyvVs0',times:2,servings:4};
 const memory=new Map([[KEYS.draft,JSON.stringify({...defaultDraft(),selectedRecipes:[old]})]]);
 const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
 let store=createStore(storage);store.reconcile(ingredients,recipes);
 assert.deepEqual(store.draft.selectedRecipes[0],old);
 assert.equal(selectedBatchCount(store.draft.selectedRecipes[0]),2);
 store.draft.selectedRecipes[0].batchCount=3;store.saveDraft();
 store=createStore(storage);assert.equal(store.draft.selectedRecipes[0].batchCount,3);
 for(const batchCount of [0,-1,1.5,'2']){
  memory.set(KEYS.draft,JSON.stringify({...defaultDraft(),selectedRecipes:[{...old,batchCount}]}));
  assert.equal(createStore(storage).draft.selectedRecipes.length,0);
 }
});
