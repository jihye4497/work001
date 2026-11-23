import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {batch50} from '../scripts/moony-policy.mjs';
import {validateData} from '../js/ingredients.js';
import {applyRecipeCategories} from '../js/recipe-filters.js';
import {searchMenus} from '../js/recommendations.js';
import {aggregate} from '../js/shopping-list.js';
import {recipeSource} from '../js/recipe-sources.js';
import {createStore,defaultDraft} from '../js/storage.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json');
const review=await read('data/source/moony-review.json');
const index=await read('data/source/moony-video-index.json');
const get=id=>recipes.find(r=>r.id===`moony-${id}`);

test('Moony additions retain verified source facts, unique IDs, classifications and searchability',async()=>{
 assert.ok(batch50.length>0);
 assert.equal(review.entries.length,batch50.length);
 assert.equal(new Set(batch50.map(r=>r[0])).size,batch50.length);
 assert.deepEqual(new Set(review.entries.map(e=>e.videoId)),new Set(batch50.map(r=>r[0])));
 validateData(ingredients,recipes);
 applyRecipeCategories(recipes,await read('data/recipe-categories.json'));
 for(const entry of review.entries){
  const recipe=get(entry.videoId);assert.ok(recipe,entry.videoId);
  assert.equal(recipe.name,entry.nameSource==='editorial-ingredients'?entry.editorialName:entry.descriptionMenuName);
  const key=s=>s.normalize('NFKC').replace(/\s/g,'');
  if(entry.nameSource==='editorial-ingredients'){assert.equal(entry.nameSourceText,entry.ingredientText);assert.ok(entry.nameSourceEvidence);assert.equal(recipe.nameSource,'editorial-ingredients');}
  else assert.ok(typeof entry.nameSourceText==='string'&&key(entry.nameSourceText).includes(key(entry.descriptionMenuName)),entry.videoId);
  assert.equal(entry.ingredientHash,createHash('sha256').update(entry.ingredientText).digest('hex'));
  assert.ok(entry.ingredients.every(row=>entry.ingredientText.includes(row.sourceText)),entry.videoId);
  const expected=entry.ingredients.filter(row=>!row.omitted);
  assert.equal(recipe.ingredients.length,expected.length);
  expected.forEach((row,n)=>{
   assert.equal(recipe.ingredients[n].ingredientId,row.ingredientId);
   assert.equal(recipe.ingredients[n].unit,row.unit);
   assert.equal(recipe.ingredients[n].amount,row.sourceAmount===null?null:row.sourceAmount*row.factor);
  });
  assert.ok(searchMenus(recipes,recipe.name).some(found=>found.id===recipe.id),recipe.name);
  assert.equal(recipe.imagePath,null);
 }
});

test('Moony recipes credit the original publisher and a verified long-form video',()=>{
 const indexed=new Map(index.entries.map(e=>[e.videoId,e]));
 for(const entry of review.entries){
  const recipe=get(entry.videoId),video=indexed.get(entry.videoId);assert.ok(video);
  assert.equal(entry.channelId,video.channelId);
  assert.equal(entry.sourceName,video.sourceName);
  assert.equal(entry.channelId,'UCQg7opkHC1IIHYsIRuivMbw');
  assert.equal(entry.sourceName,'무니키친MoonyKitchen');
  assert.ok(['long-form','video','not-listed-as-short'].includes(video.videoFormat),entry.videoId);
  assert.equal(recipe.sourceName,entry.sourceName);
  assert.deepEqual(recipeSource(recipe),{name:entry.sourceName,url:entry.sourceUrl});
  assert.equal(recipe.sourceUrl,`https://www.youtube.com/watch?v=${entry.videoId}`);
  assert.equal(/백종원의 요리비책|Kitchen Caden|KBS Entertain/.test(recipe.sourceNote),false);
 }
});

test('Moony shopping quantities use the selected servings without changing source units or unspecified quantities',()=>{
 const recipe=review.entries.map(e=>get(e.videoId)).find(r=>r.ingredients.some(i=>i.amount!==null));
 assert.ok(recipe);
 const at=servings=>aggregate(ingredients,recipes,[{recipeId:recipe.id,servings}],1);
 const original=at(recipe.baseServings),doubled=at(recipe.baseServings*2);
 assert.equal(doubled.length,original.length);
 for(const row of original){
  const other=doubled.find(r=>r.ingredient.id===row.ingredient.id);assert.ok(other);
  assert.equal(other.unknown,row.unknown);
  assert.equal(other.totals.size,row.totals.size);
  for(const [unit,amount] of row.totals)assert.ok(Math.abs(other.totals.get(unit)-amount*2)<1e-10);
 }
});

test('vegan latte takes its name from the description and preserves Tbsp, ml and espresso shots',()=>{
 const recipe=get('kLF6onKMarI');assert.ok(recipe);
 assert.equal(recipe.name,'비건라떼');
 assert.notEqual(recipe.name,recipe.sourceTitle);
 const original=recipe.ingredients;
 assert.ok(original.some(i=>i.note.includes('검은콩가루 2Tbsp')&&i.amount===2&&i.unit==='Tbsp'));
 assert.ok(original.some(i=>i.note.includes('흑임자가루 1Tbsp')&&i.amount===1&&i.unit==='Tbsp'));
 const milk=original.find(i=>i.note.includes('아몬드밀크 400ml'));
 assert.ok(milk);assert.equal(milk.amount,400);assert.equal(milk.unit,'ml');
 const espresso=original.find(i=>i.note.includes('에스프레소 2샷'));
 assert.ok(espresso);assert.equal(espresso.amount,2);assert.equal(espresso.unit,'샷');
 const doubled=aggregate(ingredients,recipes,[{recipeId:recipe.id,servings:recipe.baseServings*2}],1);
 assert.equal(doubled.find(row=>row.ingredient.id===milk.ingredientId)?.totals.get('ml'),800);
 assert.equal(doubled.find(row=>row.ingredient.id===espresso.ingredientId)?.totals.get('샷'),4);
});

test('Moony coverage accounts for each public video and keeps Shorts out of registered recipes',async()=>{
 const coverage=await read('data/source/moony-coverage.json');
 assert.equal(index.completePublicTraversal,true);
 assert.equal(coverage.entries.length,index.entries.length);
 assert.equal(new Set(coverage.entries.map(e=>e.videoId)).size,coverage.entries.length);
 assert.deepEqual(new Set(coverage.entries.map(e=>e.videoId)),new Set(index.entries.map(e=>e.videoId)));
 const statuses=Object.keys(coverage.counts);
 assert.ok(statuses.includes('registered')&&statuses.includes('pending')&&statuses.includes('excluded-short'));
 assert.equal(statuses.reduce((n,s)=>n+coverage.entries.filter(e=>e.status===s).length,0),coverage.entries.length);
 for(const status of statuses)assert.equal(coverage.counts[status],coverage.entries.filter(e=>e.status===status).length,status);
 const registered=new Set(coverage.entries.filter(e=>e.status==='registered').map(e=>e.videoId));
 assert.deepEqual(registered,new Set(batch50.map(r=>r[0])));
 for(const entry of coverage.entries){
  if(entry.status==='registered')assert.ok(get(entry.videoId),entry.videoId);
  else assert.equal(get(entry.videoId),undefined,entry.videoId);
  if(entry.status==='excluded-short')assert.equal(entry.videoFormat,'short');
  if(entry.status==='excluded-duplicate'){
   assert.equal(typeof entry.duplicateOf,'string');
   const target=entry.duplicateOf.startsWith('moony-')?entry.duplicateOf.slice(6):entry.duplicateOf;
   assert.ok(registered.has(target),`${entry.videoId} -> ${target}`);
  }
 }
});

test('Moony selections restore with all earlier recipe sources and preserve chosen servings',()=>{
 const moony=review.entries.map(e=>get(e.videoId))[0];assert.ok(moony);
 const selections=[
  {recipeId:'squid-stir',servings:4,times:1},
  {recipeId:'paik-qWbHSOplcvY',servings:3,times:1},
  {recipeId:'caden-iExAnB9aQXE',servings:1,times:1},
  {recipeId:'eonam-HyHZML6OyDo',servings:2,times:1},
  {recipeId:moony.id,servings:3,times:1}
 ];
 const memory=new Map([['jmd_draft_v1',JSON.stringify({...defaultDraft(),selectedRecipes:selections})]]);
 const store=createStore({getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)});
 store.reconcile(ingredients,recipes);
 assert.deepEqual(store.draft.selectedRecipes,selections);
});
