import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {batch50} from '../scripts/mincook-policy.mjs';
import {validateData} from '../js/ingredients.js';
import {applyRecipeCategories} from '../js/recipe-filters.js';
import {searchMenus} from '../js/recommendations.js';
import {aggregate} from '../js/shopping-list.js';
import {recipeSource} from '../js/recipe-sources.js';
import {createStore,defaultDraft} from '../js/storage.js';

const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json');
const review=await read('data/source/mincook-review.json');
const index=await read('data/source/mincook-blog-index.json');
const get=sourceId=>recipes.find(recipe=>recipe.id===`mincook-${sourceId}`);
const key=text=>text.normalize('NFKC').replace(/\s/g,'');
const blogArticleId=sourceUrl=>{
 try{
  const url=new URL(sourceUrl);
  if(url.protocol==='https:'&&url.hostname==='chef-choice.tistory.com'&&/^\/\d+\/?$/.test(url.pathname)&&!url.search&&!url.hash)return url.pathname.split('/')[1];
 }catch{}
 return null;
};

test('1mincook official-blog additions retain source facts, names and classifications',async()=>{
 assert.ok(batch50.length>0);
 assert.equal(review.entries.length,batch50.length);
 assert.equal(new Set(batch50.map(row=>row[0])).size,batch50.length);
 assert.deepEqual(new Set(review.entries.map(entry=>entry.sourceId)),new Set(batch50.map(row=>row[0])));
 validateData(ingredients,recipes);
 applyRecipeCategories(recipes,await read('data/recipe-categories.json'));
 for(const entry of review.entries){
  const recipe=get(entry.sourceId);assert.ok(recipe,entry.sourceId);
  assert.equal(recipe.name,entry.name);
  assert.equal(entry.nameSource,'official-blog');
  assert.ok(typeof entry.nameSourceText==='string'&&key(entry.nameSourceText).includes(key(recipe.name)),entry.sourceId);
  assert.equal(entry.ingredientHash,createHash('sha256').update(entry.ingredientText).digest('hex'));
  assert.ok(entry.ingredients.every(row=>entry.ingredientText.includes(row.sourceText)),entry.sourceId);
  const expected=entry.ingredients.filter(row=>!row.omitted);
  assert.equal(recipe.ingredients.length,expected.length);
  expected.forEach((row,n)=>{
   assert.equal(recipe.ingredients[n].ingredientId,row.ingredientId);
   assert.equal(recipe.ingredients[n].unit,row.unit);
   assert.equal(recipe.ingredients[n].amount,row.sourceAmount===null?null:row.sourceAmount*row.factor);
   const additionalFact=entry.additionalIngredientFacts?.find(fact=>fact.sourceText===row.sourceText);
   if(additionalFact?.reason)assert.ok(recipe.ingredients[n].note.includes(additionalFact.reason),'원문 표제·본문에서 보완한 사실의 근거를 장보기 재료 메모에 보존');
  });
  assert.ok(recipe.ingredients.some(row=>row.amount!==null),entry.sourceId);
  assert.ok(searchMenus(recipes,recipe.name).some(found=>found.id===recipe.id),recipe.name);
  assert.equal(recipe.imagePath,null);
 }
});

test('1mincook menus link to their actual official-blog article without inventing a video URL',()=>{
 const indexed=new Map(index.entries.map(entry=>[entry.sourceId,entry]));
 for(const entry of review.entries){
  const recipe=get(entry.sourceId),article=indexed.get(entry.sourceId);assert.ok(article);
  assert.equal(entry.sourceId,`blog-${entry.articleId}`);
  assert.equal(String(article.articleId),String(entry.articleId));
  assert.equal(blogArticleId(entry.sourceUrl),String(entry.articleId));
  assert.equal(blogArticleId(article.url),String(entry.articleId));
  assert.equal(recipe.sourceKind,'official-blog');
  assert.equal(recipe.sourceId,entry.sourceId);
  assert.equal(recipe.articleId,String(entry.articleId));
  assert.equal(recipe.sourceName,'1분요리 뚝딱이형');
  assert.equal(recipe.sourceUrl,entry.sourceUrl);
  assert.deepEqual(recipeSource(recipe),{name:entry.sourceName,url:entry.sourceUrl});
  assert.equal(recipes.filter(row=>blogArticleId(row.sourceUrl)===String(entry.articleId)).length,1,entry.sourceId);
  assert.equal(/youtube\.com|youtu\.be/.test(recipe.sourceUrl),false);
 }
});

test('1mincook selected servings scale original units and retain unspecified quantities',()=>{
 const recipe=review.entries.map(entry=>get(entry.sourceId)).find(row=>row.ingredients.some(ingredient=>ingredient.amount!==null));
 assert.ok(recipe);
 const at=servings=>aggregate(ingredients,recipes,[{recipeId:recipe.id,servings}],1);
 const original=at(recipe.baseServings),doubled=at(recipe.baseServings*2);
 assert.equal(doubled.length,original.length);
 for(const row of original){
  const other=doubled.find(candidate=>candidate.ingredient.id===row.ingredient.id);assert.ok(other);
  assert.equal(other.unknown,row.unknown);
  assert.equal(other.totals.size,row.totals.size);
  for(const [unit,amount] of row.totals)assert.ok(Math.abs(other.totals.get(unit)-amount*2)<1e-10);
 }
});

test('soft-tofu egg marinade preserves boiled eggs, spoon units and its original 700g tofu batch',()=>{
 const recipe=get('blog-787');assert.ok(recipe);
 assert.equal(recipe.name,'순두부계란장');
 assert.equal(recipe.sourceUrl,'https://chef-choice.tistory.com/787');
 const tofu=recipe.ingredients.find(row=>/순두부/.test(row.note));
 assert.ok(tofu);assert.equal(tofu.amount,700);assert.equal(tofu.unit,'g');
 const eggs=recipe.ingredients.find(row=>/삶은\s*(?:계란|달걀)/.test(row.note));
 assert.ok(eggs);assert.equal(eggs.amount,5);assert.equal(eggs.unit,'개');
 const eggDefinition=ingredients.find(ingredient=>ingredient.id===eggs.ingredientId);assert.ok(eggDefinition);
 assert.match(eggDefinition.name,/삶은\s*(?:계란|달걀)/,'원문의 삶은 계란을 별도 근거 없이 날계란으로 바꾸지 않음');
 const chili=recipe.ingredients.find(row=>/고춧가루/.test(row.note));
 assert.ok(chili);assert.equal(chili.amount,4);assert.equal(chili.unit,'숟가락');
 const doubled=aggregate(ingredients,recipes,[{recipeId:recipe.id,servings:recipe.baseServings*2}],1);
 assert.equal(doubled.find(row=>row.ingredient.id===tofu.ingredientId)?.totals.get('g'),1400);
 assert.equal(doubled.find(row=>row.ingredient.id===eggs.ingredientId)?.totals.get('개'),10);
});

test('clam noodles count the same 1kg clams once across cleaning and cooking sections',()=>{
 const recipe=get('blog-705');assert.ok(recipe);
 const clamRows=recipe.ingredients.filter(row=>/바지락/.test(row.note));
 assert.equal(clamRows.length,1,'같은 바지락을 해감과 본조리에 중복 구매하지 않음');
 assert.equal(clamRows[0].amount,1);assert.equal(clamRows[0].unit,'kg');
 const totals=aggregate(ingredients,recipes,[{recipeId:recipe.id,servings:recipe.baseServings}],1);
 assert.equal(totals.find(row=>row.ingredient.id===clamRows[0].ingredientId)?.totals.get('kg'),1);
});

test('four meat pies scale one-pie pastry and cheese while preserving the four-pie filling batch',()=>{
 const recipe=get('blog-524'),entry=review.entries.find(row=>row.sourceId==='blog-524');assert.ok(recipe);assert.ok(entry);
 const pastry=entry.ingredients.find(row=>!row.omitted&&/페스트리/.test(row.sourceText));
 const cheese=entry.ingredients.find(row=>!row.omitted&&/모(?:짜|차)렐라/.test(row.sourceText));
 const beef=entry.ingredients.find(row=>!row.omitted&&/소고기/.test(row.sourceText));
 assert.ok(pastry);assert.ok(cheese);assert.ok(beef);
 assert.equal(pastry.sourceAmount,160);assert.equal(pastry.unit,'g');assert.equal(pastry.factor,4);assert.equal(pastry.amount,640);
 assert.equal(cheese.sourceAmount,70);assert.equal(cheese.unit,'g');assert.equal(cheese.factor,4);assert.equal(cheese.amount,280);
 assert.equal(beef.sourceAmount,500);assert.equal(beef.unit,'g');assert.equal(beef.factor,1);assert.equal(beef.amount,500);
 assert.equal(recipe.ingredients.find(row=>row.ingredientId===pastry.ingredientId)?.amount,640);
 assert.equal(recipe.ingredients.find(row=>row.ingredientId===cheese.ingredientId)?.amount,280);
});

test('chicken noodles preserve the original total two servings of noodles despite a repeated ingredient row',()=>{
 const recipe=get('blog-27');assert.ok(recipe);
 assert.equal(recipe.baseServings,2);assert.equal(recipe.servingsStatus,'explicit');
 const noodles=recipe.ingredients.filter(row=>/칼국수면/.test(row.note));
 assert.equal(noodles.length,1);
 assert.equal(noodles[0].amount,2);assert.equal(noodles[0].unit,'인분');
 const totals=aggregate(ingredients,recipes,[{recipeId:recipe.id,servings:2}],1);
 assert.equal(totals.find(row=>row.ingredient.id===noodles[0].ingredientId)?.totals.get('인분'),2);
});

test('user-confirmed two 1kg chickens are purchased as 2kg once, while recipe servings remain estimated',()=>{
 const recipe=get('blog-727'),entry=review.entries.find(row=>row.sourceId==='blog-727');
 assert.ok(recipe);assert.ok(entry);
 assert.ok(entry.ingredientText.includes('닭 : 2kg'));
 assert.ok(entry.ingredientText.includes('닭 (2마리) : 2kg'));
 const chicken=recipe.ingredients.filter(row=>/^원문:\s*닭\s*(?:\(|:)/.test(row.note));
 assert.equal(chicken.length,1);
 assert.equal(chicken[0].amount,2);assert.equal(chicken[0].unit,'kg');
 assert.ok(entry.sourceCorrections.some(row=>row.reviewer==='사용자'&&row.amount===2&&row.unit==='kg'));
 assert.equal(recipe.servingsStatus,'estimated');
 const totals=aggregate(ingredients,recipes,[{recipeId:recipe.id,servings:recipe.baseServings}],1);
 assert.equal(totals.find(row=>row.ingredient.id===chicken[0].ingredientId)?.totals.get('kg'),2);
});

test('1mincook coverage accounts for every public blog article and preserves pending and duplicate decisions',async()=>{
 const coverage=await read('data/source/mincook-coverage.json');
 assert.equal(index.completePublicTraversal,true);
 assert.equal(coverage.sourceKind,'official-blog');
 assert.equal(coverage.publicArticleCount,index.entries.length);
 assert.equal(coverage.entries.length,index.entries.length);
 assert.equal(new Set(coverage.entries.map(entry=>entry.sourceId)).size,coverage.entries.length);
 assert.deepEqual(new Set(coverage.entries.map(entry=>entry.sourceId)),new Set(index.entries.map(entry=>entry.sourceId)));
 const statuses=Object.keys(coverage.counts);
 assert.ok(['registered','pending','existing','excluded-duplicate','excluded-nonrecipe'].every(status=>statuses.includes(status)));
 assert.equal(statuses.reduce((count,status)=>count+coverage.entries.filter(entry=>entry.status===status).length,0),coverage.entries.length);
 for(const status of statuses)assert.equal(coverage.counts[status],coverage.entries.filter(entry=>entry.status===status).length,status);
 const registered=new Set(coverage.entries.filter(entry=>entry.status==='registered').map(entry=>entry.sourceId));
 assert.deepEqual(registered,new Set(batch50.map(row=>row[0])));
 for(const entry of coverage.entries){
  assert.equal(blogArticleId(entry.sourceUrl),String(entry.articleId));
  if(entry.status==='registered')assert.ok(get(entry.sourceId),entry.sourceId);
  else assert.equal(get(entry.sourceId),undefined,entry.sourceId);
  if(entry.status==='existing')assert.ok(recipes.some(recipe=>recipe.id===entry.recipeId&&blogArticleId(recipe.sourceUrl)===String(entry.articleId)),entry.sourceId);
  if(entry.status==='excluded-duplicate'){
   assert.equal(typeof entry.duplicateOf,'string');
   assert.ok(registered.has(entry.duplicateOf)||recipes.some(recipe=>recipe.id===entry.duplicateOf),entry.sourceId);
  }
 }
});

test('1mincook blog selection restores alongside all earlier sources without changing servings',()=>{
 const added=review.entries.map(entry=>get(entry.sourceId))[0];assert.ok(added);
 const selections=[
  {recipeId:'squid-stir',servings:4,times:1},
  {recipeId:'paik-qWbHSOplcvY',servings:3,times:1},
  {recipeId:'caden-iExAnB9aQXE',servings:1,times:1},
  {recipeId:'eonam-HyHZML6OyDo',servings:2,times:1},
  {recipeId:'moony-kLF6onKMarI',servings:2,times:1},
  {recipeId:added.id,servings:3,times:1}
 ];
 const memory=new Map([['jmd_draft_v1',JSON.stringify({...defaultDraft(),selectedRecipes:selections})]]);
 const store=createStore({getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)});
 store.reconcile(ingredients,recipes);
 assert.deepEqual(store.draft.selectedRecipes,selections);
});
