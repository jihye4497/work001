import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {batch50} from '../scripts/caden-policy.mjs';
import {validateData} from '../js/ingredients.js';
import {applyRecipeCategories} from '../js/recipe-filters.js';
import {searchMenus} from '../js/recommendations.js';
import {aggregate,totalText} from '../js/shopping-list.js';
import {recipeSource} from '../js/recipe-sources.js';
import {createStore,defaultDraft} from '../js/storage.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json');
const review=await read('data/source/caden-review.json');
const videoIndex=await read('data/source/caden-video-index.json');
const get=id=>recipes.find(r=>r.id===`caden-${id}`);
const channelId='UCWyjY6ykM58LO5ipzRgIzGA';
const sourceName='정호영의 오늘도 요리 Kitchen Caden';
const rows=(id,servings)=>{const recipe=get(id);assert.ok(recipe,id);return aggregate(ingredients,recipes,[{recipeId:recipe.id,servings:servings??recipe.baseServings}],1);};

test('Caden reviewed videos retain source facts, valid ingredient references, classifications and searchable recipes',async()=>{
 assert.ok(batch50.length>0);
 assert.equal(review.entries.length,batch50.length);
 assert.equal(new Set(batch50.map(r=>r[0])).size,batch50.length);
 assert.deepEqual(new Set(review.entries.map(e=>e.videoId)),new Set(batch50.map(r=>r[0])));
 validateData(ingredients,recipes);
 applyRecipeCategories(recipes,await read('data/recipe-categories.json'));
 for(const entry of review.entries){
  const recipe=get(entry.videoId);assert.ok(recipe,entry.videoId);
  assert.equal(entry.channelId,channelId);
  assert.equal(recipe.sourceUrl,entry.sourceUrl);
  assert.equal(entry.ingredientHash,createHash('sha256').update(entry.ingredientText).digest('hex'));
  assert.ok(entry.ingredients.every(row=>entry.ingredientText.includes(row.sourceText)),entry.videoId);
  assert.equal(recipe.ingredients.length,entry.ingredients.filter(row=>!row.omitted).length);
  assert.ok(searchMenus(recipes,recipe.name).some(found=>found.id===recipe.id),recipe.name);
  assert.equal(recipe.imagePath,null);
 }
});

test('Caden attribution uses its actual channel name and original video link without borrowing another publisher',()=>{
 for(const entry of review.entries){
  const recipe=get(entry.videoId);
  assert.equal(recipe.sourceName,sourceName);
  assert.deepEqual(recipeSource(recipe),{name:sourceName,url:entry.sourceUrl});
  assert.equal(recipe.sourceUrl,`https://www.youtube.com/watch?v=${entry.videoId}`);
  assert.equal(recipe.sourceNote.includes('백종원의 요리비책'),false);
 }
});

test('two-portion uni jjapagetti scales noodles and minced pork belly to one portion without unit conversion',()=>{
 const recipe=get('iExAnB9aQXE');assert.ok(recipe);
 assert.equal(recipe.baseServings,2);
 const whole=rows('iExAnB9aQXE'),single=rows('iExAnB9aQXE',1);
 const noodles=list=>list.find(row=>row.ingredient.name==='짜장라면');
 const pork=list=>list.find(row=>/다진/.test(row.ingredient.name)&&/삼겹/.test(row.ingredient.name));
 assert.ok(noodles(whole));assert.ok(pork(whole));
 assert.equal(totalText(noodles(whole)),'2개');
 assert.equal(totalText(noodles(single)),'1개');
 assert.equal(totalText(pork(whole)),'100g');
 assert.equal(totalText(pork(single)),'50g');
});

test('user-verified plum extract overrides duplicated description once, while ingredient portions do not become explicit recipe yields',()=>{
 const entry=review.entries.find(e=>e.videoId==='Z0NMTwkZVYM');
 assert.equal(entry.ingredientText.split('매실액(1큰술)').length-1,2);
 const corrected=get('Z0NMTwkZVYM').ingredients.filter(i=>i.note.includes('사용자 영상 직접 확인'));
 assert.equal(corrected.length,1);assert.equal(corrected[0].amount,1.2);assert.equal(corrected[0].unit,'스푼');
 assert.equal(entry.sourceCorrections[0].confirmedBy,'사용자 영상 직접 확인');
 for(const id of ['VOLdYvZKGYk','l5ctHOjWzg0','ktUEcwWfPzU','Nf64M49MMYk'])assert.equal(get(id).servingsStatus,'estimated');
});

test('Caden playlist coverage accounts for all videos while excluding Shorts and another channel’s video',async()=>{
 const coverage=await read('data/source/caden-coverage.json');
 assert.equal(videoIndex.entries.length,321);
 assert.equal(coverage.entries.length,videoIndex.entries.length);
 assert.equal(new Set(coverage.entries.map(e=>e.videoId)).size,coverage.entries.length);
 assert.deepEqual(new Set(coverage.entries.map(e=>e.videoId)),new Set(videoIndex.entries.map(e=>e.videoId)));
 const statuses=['registered','pending','excluded-short','excluded-other-channel'];
 assert.equal(statuses.reduce((sum,status)=>sum+coverage.entries.filter(e=>e.status===status).length,0),coverage.entries.length);
 for(const status of statuses)assert.equal(coverage.counts[status],coverage.entries.filter(e=>e.status===status).length,status);
 const shortIds=new Set(videoIndex.entries.filter(e=>e.videoFormat==='short').map(e=>e.videoId));
 assert.equal(shortIds.size,189);
 for(const entry of coverage.entries){
  if(entry.status==='registered')assert.ok(get(entry.videoId),entry.videoId);
  else assert.equal(get(entry.videoId),undefined,entry.videoId);
  if(shortIds.has(entry.videoId))assert.equal(entry.status,'excluded-short',entry.videoId);
 }
 assert.deepEqual(new Set(coverage.entries.filter(e=>e.status==='registered').map(e=>e.videoId)),new Set(batch50.map(r=>r[0])));
 assert.equal(get('Qh0cCRehZ_Y'),undefined);
 assert.equal(coverage.entries.find(e=>e.videoId==='Qh0cCRehZ_Y').status,'excluded-other-channel');
});

test('Caden additions restore together with Paik and initial Tefal selections while preserving each serving count',()=>{
 const selections=[
  {recipeId:'squid-stir',servings:4,times:1},
  {recipeId:'paik-qWbHSOplcvY',servings:3,times:1},
  {recipeId:'caden-iExAnB9aQXE',servings:1,times:1}
 ];
 const memory=new Map([['jmd_draft_v1',JSON.stringify({...defaultDraft(),selectedRecipes:selections})]]);
 const store=createStore({getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)});
 store.reconcile(ingredients,recipes);
 assert.deepEqual(store.draft.selectedRecipes,selections);
 assert.equal(totalText(rows('iExAnB9aQXE',1).find(row=>row.ingredient.name==='짜장라면')),'1개');
});
