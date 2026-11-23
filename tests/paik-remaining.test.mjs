import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {batch50} from '../scripts/paik-batch-remaining-policy.mjs';
import {validateData} from '../js/ingredients.js';
import {applyRecipeCategories} from '../js/recipe-filters.js';
import {aggregate,totalText} from '../js/shopping-list.js';
import {searchMenus} from '../js/recommendations.js';
import {createStore,defaultDraft} from '../js/storage.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json');
const review=await read('data/source/paik-batch-remaining-review.json');
const get=id=>recipes.find(r=>r.id===`paik-${id}`);
const rows=(id,servings)=>{const r=get(id);assert.ok(r,id);return aggregate(ingredients,recipes,[{recipeId:r.id,servings:servings??r.baseServings}],1);};
const row=(id,name,servings)=>{const result=rows(id,servings).find(r=>r.ingredient.name===name);assert.ok(result,`${id}: ${name}`);return result;};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('remaining batch preserves verified source facts and all recipes are searchable with valid classifications',async()=>{
 assert.ok(batch50.length>0);
 assert.equal(review.entries.length,batch50.length);
 assert.equal(new Set(batch50.map(r=>r[0])).size,batch50.length);
 assert.deepEqual(new Set(review.entries.map(e=>e.videoId)),new Set(batch50.map(r=>r[0])));
 validateData(ingredients,recipes);
 applyRecipeCategories(recipes,await read('data/recipe-categories.json'));
 for(const e of review.entries){
  const r=get(e.videoId);assert.ok(r,e.videoId);
  assert.equal(e.channelId,'UCyn-K7rZLXjGl7VXGweIlcA');
  assert.equal(r.sourceUrl,e.sourceUrl);
  assert.equal(e.ingredientHash,createHash('sha256').update(e.ingredientText).digest('hex'));
  assert.ok(e.ingredients.every(i=>e.ingredientText.includes(i.sourceText)),e.videoId);
  assert.equal(r.ingredients.length,e.ingredients.filter(i=>!i.omitted).length);
  assert.ok(searchMenus(recipes,r.name).some(found=>found.id===r.id),r.name);
  assert.equal(r.imagePath,null);
 }
});

test('six-portion boiled beans and seven-portion intestine mix contribute only one bowl of original ingredients',()=>{
 near(row('BH07T3aJFrw','대두').totals.get('g'),500/6);
 near(row('BH07T3aJFrw','물').totals.get('L'),0.25);
 assert.equal(row('BH07T3aJFrw','물').totals.get('g'),180);
 assert.equal(totalText(row('BH07T3aJFrw','소면')),'100g');
 near(row('ZE3X6f6E3Ss','초벌소곱창').totals.get('g'),500/7);
 near(row('ZE3X6f6E3Ss','초벌소깐양').totals.get('g'),500/7);
 assert.equal(totalText(row('ZE3X6f6E3Ss','라면')),'1개');
 assert.equal(rows('ZE3X6f6E3Ss').some(r=>r.ingredient.name==='만능곱창무침'),false);
});

test('two-portion kelp noodles use half the four-portion stock while fifty-portion soup scales in original units',()=>{
 assert.equal(totalText(row('iij0bMkadEw','건다시마')),'27g');
 assert.equal(totalText(row('iij0bMkadEw','건다시마',1)),'13.5g');
 assert.equal(totalText(row('iij0bMkadEw','칼국수면')),'225g');
 assert.equal(rows('iij0bMkadEw').some(r=>r.ingredient.name==='다시마 육수'),false);
 assert.equal(get('RTj2_VKVSBI').baseServings,50);
 assert.equal(totalText(row('RTj2_VKVSBI','물',1)),'0.16L');
 assert.equal(totalText(row('RTj2_VKVSBI','소금',1)),'1.2g');
 assert.equal(totalText(row('RTj2_VKVSBI','콩나물',1)),'18g');
});

test('public playlist coverage accounts for every source video without publishing pending recipes',async()=>{
 const coverage=await read('data/source/paik-playlist-coverage.json');
 const candidates=await read('data/source/paik-playlist-candidates.json');
 const entries=coverage.entries;
 assert.equal(entries.length,candidates.entries.length);
 assert.equal(new Set(entries.map(e=>e.videoId)).size,entries.length);
 assert.deepEqual(new Set(entries.map(e=>e.videoId)),new Set(candidates.entries.map(e=>e.videoId)));
 const statuses=['existing','added','pending','excluded-short'];
 assert.equal(statuses.reduce((sum,s)=>sum+entries.filter(e=>e.status===s).length,0),entries.length);
 for(const e of entries){
  if(['pending','excluded-short'].includes(e.status))assert.equal(get(e.videoId),undefined,e.videoId);
  else assert.ok(get(e.videoId),e.videoId);
 }
 assert.deepEqual(new Set(entries.filter(e=>e.status==='added').map(e=>e.videoId)),new Set(batch50.map(r=>r[0])));
});

test('new large-batch and single-bowl recipes restore alongside earlier selections without changing requested servings',()=>{
 const selections=[
  {recipeId:'paik-qWbHSOplcvY',servings:3,times:1},
  {recipeId:'paik-Eino3yP-Wk0',servings:2,times:1},
  {recipeId:'paik-BH07T3aJFrw',servings:1,times:1},
  {recipeId:'paik-RTj2_VKVSBI',servings:4,times:1}
 ];
 const mem=new Map([['jmd_draft_v1',JSON.stringify({...defaultDraft(),selectedRecipes:selections})]]);
 const store=createStore({getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)});
 store.reconcile(ingredients,recipes);
 assert.deepEqual(store.draft.selectedRecipes,selections);
 assert.equal(totalText(row('RTj2_VKVSBI','물',4)),'0.64L');
});
