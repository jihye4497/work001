import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateData} from '../js/ingredients.js';
import {applyRecipeCategories} from '../js/recipe-filters.js';
import {aggregate,totalText} from '../js/shopping-list.js';
import {recommend,searchMenus} from '../js/recommendations.js';
import {createStore,defaultDraft} from '../js/storage.js';
import {servingLabel} from '../js/servings.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json');
const review=await read('data/source/paik-batch-03-review.json');
const get=id=>recipes.find(r=>r.id===`paik-${id}`);
const rows=(id,servings)=>{const r=get(id);return aggregate(ingredients,recipes,[{recipeId:r.id,servings:servings??r.baseServings}],1);};
const amount=(id,name,servings)=>totalText(rows(id,servings).find(r=>r.ingredient.name===name));

test('third batch has fifty distinct source videos, intact ingredient facts and searchable classified recipes',async()=>{
 assert.equal(review.entries.length,50);
 assert.equal(new Set(review.entries.map(e=>e.videoId)).size,50);
 validateData(ingredients,recipes);
 applyRecipeCategories(recipes,await read('data/recipe-categories.json'));
 for(const e of review.entries){
  const r=get(e.videoId);assert.ok(r);assert.equal(r.sourceUrl,e.sourceUrl);
  assert.equal(e.channelId,'UCyn-K7rZLXjGl7VXGweIlcA');
  assert.equal(e.ingredientHash,createHash('sha256').update(e.ingredientText).digest('hex'));
  assert.ok(e.ingredients.every(i=>e.ingredientText.includes(i.sourceText)));
  assert.equal(r.ingredients.length,e.ingredients.filter(i=>!i.omitted).length);
  assert.ok(searchMenus(recipes,r.name).some(x=>x.id===r.id));
  assert.equal(r.imagePath,null);
 }
});

test('one selected cooking version and intermediate chicken or sauce never multiply shopping quantities',()=>{
 assert.equal(amount('zS_o6psOt9g','캔 옥수수'),'340g');
 assert.equal(amount('zS_o6psOt9g','양파'),'25g');
 assert.equal(amount('bZWlQXGywRc','노랑 파프리카'),'120g');
 assert.equal(rows('bZWlQXGywRc').some(r=>r.ingredient.name==='된장'),false);
 assert.equal(amount('8l9H8FlhiOo','홍합'),'500g');
 assert.equal(amount('4TnaTTg1R_Q','바지락'),'500g');
 assert.equal(rows('4TnaTTg1R_Q').some(r=>['막걸리','청주'].includes(r.ingredient.name)),false);
 assert.equal(amount('kzYgtXDcGQ4','닭'),'1마리');
 assert.equal(amount('kzYgtXDcGQ4','닭',2),'0.5마리');
 assert.equal(amount('kfGi3rTct8c','진간장'),'140g');
});

test('source dry weight, user-approved sauce and egg totals, and original serving units calculate consistently',()=>{
 assert.equal(amount('xexAbSUQzSw','건미역'),'13g');
 assert.equal(amount('xexAbSUQzSw','건미역',2),'6.5g');
 assert.equal(amount('iWWQBoS3SL4','고추장'),'80g');
 assert.equal(amount('iWWQBoS3SL4','고추장',1),'40g');
 assert.equal(amount('At-u3lwsFtk','계란'),'200g');
 assert.equal(amount('At-u3lwsFtk','계란',2),'100g');
 assert.equal(amount('R0xWJ4c8wR4','칼국수면',1),'150g');
 assert.equal(amount('6e-IbuuD6ZU','물'),'270g');
 assert.equal(servingLabel(get('zfMHTfJ3Ih0')),'3인분');
 assert.equal(servingLabel(get('fEYJSPSGaLI')),'1인분');
 assert.match(servingLabel(get('eeiqjyYgPew')),/추정/);
});

test('existing and new selections restore together and new tofu dishes enter the unchanged recommendation flow',()=>{
 const selections=[{recipeId:'paik-qWbHSOplcvY',servings:3,times:1},{recipeId:'paik-nVzwOOJLt24',servings:4,times:1},{recipeId:'paik-Eino3yP-Wk0',servings:2,times:1}];
 const mem=new Map([['jmd_draft_v1',JSON.stringify({...defaultDraft(),selectedRecipes:selections})]]);
 const store=createStore({getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)});
 store.reconcile(ingredients,recipes);assert.deepEqual(store.draft.selectedRecipes,selections);
 const tofu=ingredients.find(i=>i.name==='두부');
 const d={...defaultDraft(),selectedIngredientIds:[tofu.id],activeInterestIds:[tofu.id]};
 assert.ok(recommend(ingredients,recipes,d).some(x=>x.recipe.id==='paik-Eino3yP-Wk0'));
});
