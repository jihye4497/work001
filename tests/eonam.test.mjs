import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {batch50} from '../scripts/eonam-policy.mjs';
import {validateData} from '../js/ingredients.js';
import {applyRecipeCategories} from '../js/recipe-filters.js';
import {searchMenus} from '../js/recommendations.js';
import {aggregate,totalText} from '../js/shopping-list.js';
import {recipeSource} from '../js/recipe-sources.js';
import {createStore,defaultDraft} from '../js/storage.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json');
const review=await read('data/source/eonam-review.json');
const index=await read('data/source/eonam-video-index.json');
const get=id=>recipes.find(r=>r.id===`eonam-${id}`);
const byIngredient=new Map(ingredients.map(i=>[i.id,i]));
const rows=(id,servings)=>{const recipe=get(id);assert.ok(recipe,id);return aggregate(ingredients,recipes,[{recipeId:recipe.id,servings:servings??recipe.baseServings}],1);};

test('Eonam additions preserve verified ingredient facts, source hashes, unique IDs, classifications and searchability',async()=>{
 assert.ok(batch50.length>0);
 assert.equal(review.entries.length,batch50.length);
 assert.equal(new Set(batch50.map(r=>r[0])).size,batch50.length);
 assert.deepEqual(new Set(review.entries.map(e=>e.videoId)),new Set(batch50.map(r=>r[0])));
 validateData(ingredients,recipes);
 applyRecipeCategories(recipes,await read('data/recipe-categories.json'));
 for(const entry of review.entries){
  const recipe=get(entry.videoId);assert.ok(recipe,entry.videoId);
  assert.equal(entry.ingredientHash,createHash('sha256').update(entry.ingredientText).digest('hex'));
  assert.ok(entry.ingredients.every(row=>entry.ingredientText.includes(row.sourceText)),entry.videoId);
  assert.equal(recipe.ingredients.length,entry.ingredients.filter(row=>!row.omitted).length);
  assert.ok(searchMenus(recipes,recipe.name).some(found=>found.id===recipe.id),recipe.name);
  assert.equal(recipe.imagePath,null);
 }
});

test('Eonam recipes credit their actual KBS publisher and original video instead of another recipe source',()=>{
 const indexed=new Map(index.entries.map(e=>[e.videoId,e]));
 for(const entry of review.entries){
  const recipe=get(entry.videoId),video=indexed.get(entry.videoId);assert.ok(video);
  assert.equal(entry.channelId,video.channelId);
  assert.equal(entry.sourceName,video.sourceName);
  assert.equal(entry.channelId,'UCK1sVuXaDvJeNwl9noN5nOA');
  assert.equal(recipe.sourceName,entry.sourceName);
  assert.deepEqual(recipeSource(recipe),{name:entry.sourceName,url:entry.sourceUrl});
  assert.equal(recipe.sourceUrl,`https://www.youtube.com/watch?v=${entry.videoId}`);
  assert.equal(/백종원의 요리비책|Kitchen Caden/.test(recipe.sourceNote),false);
 }
});

test('king pork cutlet quantities double from the original yield while T, t and grinder turns retain source units',()=>{
 const id='HyHZML6OyDo',recipe=get(id);assert.ok(recipe);
 const pork=list=>list.find(row=>/안심/.test(row.ingredient.name)&&row.ingredient.category==='육류·해산물');
 assert.equal(totalText(pork(rows(id))),'400g');
 assert.equal(totalText(pork(rows(id,recipe.baseServings*2))),'800g');
 const salt=recipe.ingredients.find(i=>byIngredient.get(i.ingredientId)?.name==='소금'&&i.unit==='T');
 assert.ok(salt);assert.ok(Math.abs(salt.amount-1/3)<1e-12);
 const ginger=recipe.ingredients.find(i=>/생강/.test(byIngredient.get(i.ingredientId)?.name??'')&&i.unit==='t');
 assert.ok(ginger);assert.equal(ginger.amount,0.5);
 const pepper=recipe.ingredients.find(i=>/후추/.test(byIngredient.get(i.ingredientId)?.name??'')&&i.unit==='바퀴');
 assert.ok(pepper);assert.equal(pepper.amount,20);
});

test('Eonam coverage accounts for the entire playlist and duplicate videos point to registered recipes',async()=>{
 const coverage=await read('data/source/eonam-coverage.json');
 assert.equal(index.entries.length,174);
 assert.equal(coverage.entries.length,index.entries.length);
 assert.equal(new Set(coverage.entries.map(e=>e.videoId)).size,coverage.entries.length);
 assert.deepEqual(new Set(coverage.entries.map(e=>e.videoId)),new Set(index.entries.map(e=>e.videoId)));
 const statuses=['registered','pending','excluded-short','excluded-duplicate','excluded-nonrecipe'];
 assert.equal(statuses.reduce((n,s)=>n+coverage.entries.filter(e=>e.status===s).length,0),coverage.entries.length);
 for(const status of statuses)assert.equal(coverage.counts[status],coverage.entries.filter(e=>e.status===status).length,status);
 const registered=new Set(coverage.entries.filter(e=>e.status==='registered').map(e=>e.videoId));
 assert.deepEqual(registered,new Set(batch50.map(r=>r[0])));
 for(const entry of coverage.entries){
  if(entry.status==='registered')assert.ok(get(entry.videoId),entry.videoId);
  else assert.equal(get(entry.videoId),undefined,entry.videoId);
  if(entry.status==='excluded-duplicate'){
   assert.equal(typeof entry.duplicateOf,'string');
   const target=entry.duplicateOf.startsWith('eonam-')?entry.duplicateOf.slice(6):entry.duplicateOf;
   assert.ok(registered.has(target),`${entry.videoId} -> ${target}`);
  }
 }
 for(const video of index.entries){
  assert.equal(video.videoFormat,'long-form',video.videoId);
  assert.match(video.formatEvidence,/isShortsEligible=False/,video.videoId);
 }
});

test('Eonam selections restore alongside Tefal, Paik and Caden without altering the chosen servings',()=>{
 const selections=[
  {recipeId:'squid-stir',servings:4,times:1},
  {recipeId:'paik-qWbHSOplcvY',servings:3,times:1},
  {recipeId:'caden-iExAnB9aQXE',servings:1,times:1},
  {recipeId:'eonam-HyHZML6OyDo',servings:2,times:1}
 ];
 const memory=new Map([['jmd_draft_v1',JSON.stringify({...defaultDraft(),selectedRecipes:selections})]]);
 const store=createStore({getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)});
 store.reconcile(ingredients,recipes);
 assert.deepEqual(store.draft.selectedRecipes,selections);
});
