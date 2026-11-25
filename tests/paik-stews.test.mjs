import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { aggregate, totalText, partitionShoppingRows } from '../js/shopping-list.js';
import { servingLabel } from '../js/servings.js';
import { recommend, searchMenus } from '../js/recommendations.js';
import { defaultDraft, createStore } from '../js/storage.js';
const read=async path=>JSON.parse(await readFile(new URL(`../${path}`,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json');
const review=await read('data/source/paik-stews-review.json');
const pilot=recipes.filter(r=>review.entries.some(e=>e.recipeId===r.id));

test('ten distinct original videos preserve reviewed ingredient quantities, units, optional groups and attribution',()=>{
 assert.equal(pilot.length,10);assert.equal(new Set(pilot.map(r=>r.sourceUrl)).size,10);
 for(const r of pilot){
  const entry=review.entries.find(e=>e.recipeId===r.id);assert.ok(entry);
  assert.equal(entry.channelId,'UCyn-K7rZLXjGl7VXGweIlcA');assert.equal(r.sourceUrl,entry.sourceUrl);
  assert.equal(r.sourceName,'백종원의 요리비책');assert.equal(r.imagePath,null);
  assert.deepEqual(r.ingredients,entry.ingredients.filter(i=>!i.optional).map(({ingredientId,amount,unit,note})=>({ingredientId,amount,unit,note})));
  assert.equal(entry.ingredients.length,entry.ingredientText.split(/\r?\n/).filter(x=>x.trim()&&!/^[*\[]/.test(x.trim())).length);
  for(const item of r.ingredients){assert.ok(ingredients.some(i=>i.id===item.ingredientId));assert.ok(item.note.startsWith('원문: '));}
 }
 assert.equal(pilot.filter(r=>r.servingsStatus==='explicit').length,2);
 assert.equal(pilot.filter(r=>r.servingsStatus==='estimated').length,8);
 const budae=recipes.find(r=>r.id==='paik-8uwmFQH614M');
 assert.ok(!budae.ingredients.some(i=>i.ingredientId==='mfds-ingredient-6454befbdb61'));
 assert.equal(review.entries.find(e=>e.recipeId===budae.id).ingredients.filter(i=>i.optional).length,2);
});

test('two-portion kimchi stew scales to three portions without changing the source, owned items or cooking water behavior',()=>{
 const recipe=pilot.find(r=>r.name==='돼지고기 김치찌개');assert.equal(servingLabel(recipe),'2인분(추정)');
 const rows=aggregate(ingredients,recipes,[{recipeId:recipe.id,servings:3}],2);
 assert.equal(totalText(rows.find(r=>r.ingredient.id==='mfds-ingredient-48f0320f90f9')),'195g');
 assert.equal(totalText(rows.find(r=>r.ingredient.id==='kimchi')),'585g');
 assert.equal(recipe.ingredients[0].amount,130);
 const groups=partitionShoppingRows(rows,['kimchi'],ingredients);
 assert.ok(groups.every(g=>g.rows.every(r=>r.ingredient.id!=='water')));
 assert.ok(groups.some(g=>g.rows.some(r=>r.ingredient.id==='kimchi')));
 const unknown=aggregate(ingredients,recipes,[{recipeId:'paik-gUYeEasWU58',servings:4}],2);
 assert.equal(totalText(unknown.find(r=>r.ingredient.name==='쑥갓')),'수량 미기재');
 assert.equal(pilot.find(r=>r.id==='paik-gUYeEasWU58').baseServings,4);
});

test('new dishes participate in search and recommendation while legacy selections survive reconciliation',()=>{
 assert.ok(searchMenus(recipes,'찌개').some(r=>r.id==='paik-qWbHSOplcvY'));
 const d={...defaultDraft(),selectedIngredientIds:['kimchi'],activeInterestIds:['kimchi']};
 assert.ok(recommend(ingredients,recipes,d).some(x=>x.recipe.id==='paik-qWbHSOplcvY'));
 const map=new Map([['jmd_draft_v1',JSON.stringify({...d,selectedRecipes:[{recipeId:'kimchi-stew',servings:3,times:1},{recipeId:'paik-qWbHSOplcvY',servings:2,times:1}]})]]);
 const store=createStore({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});store.reconcile(ingredients,recipes);
 assert.deepEqual(store.draft.selectedRecipes.map(s=>[s.recipeId,s.servings]),[['kimchi-stew',3],['paik-qWbHSOplcvY',2]]);
});
