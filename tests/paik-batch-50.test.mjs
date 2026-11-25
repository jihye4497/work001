import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {aggregate,totalText} from '../js/shopping-list.js';
import {servingLabel} from '../js/servings.js';
import {validateData} from '../js/ingredients.js';
import {applyRecipeCategories} from '../js/recipe-filters.js';
import {recommend,searchMenus} from '../js/recommendations.js';
import {defaultDraft} from '../js/storage.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json'),catalog=await read('data/recipe-categories.json');
const review=await read('data/source/paik-batch-50-review.json');
const pilot=await read('data/source/paik-stews-review.json');
const recipe=id=>recipes.find(r=>r.id===`paik-${id}`);
const amount=(id,name,servings)=>{
 const r=recipe(id),rows=aggregate(ingredients,recipes,[{recipeId:r.id,servings:servings??r.baseServings}],1);
 return rows.find(row=>row.ingredient.name===name);
};

test('50 reviewed videos are separate searchable dishes with complete classifications, literal ingredients and source hashes',()=>{
 assert.equal(review.entries.length,50);assert.equal(new Set(review.entries.map(e=>e.videoId)).size,50);
 const firstTwoBatches=new Set([...review.entries,...pilot.entries].map(e=>e.recipeId));
 assert.equal(firstTwoBatches.size,60);
 assert.equal(recipes.filter(r=>firstTwoBatches.has(r.id)).length,60);
 validateData(ingredients,recipes);const enriched=applyRecipeCategories(recipes,catalog);
 for(const e of review.entries){
  const r=recipe(e.videoId);assert.ok(r);assert.equal(r.sourceUrl,e.sourceUrl);assert.equal(r.imagePath,null);
  assert.equal(e.channelId,'UCyn-K7rZLXjGl7VXGweIlcA');
  assert.equal(e.ingredientHash,createHash('sha256').update(e.ingredientText).digest('hex'));
  assert.ok(e.ingredients.every(i=>e.ingredientText.includes(i.sourceText)));
  assert.equal(r.ingredients.length,e.ingredients.filter(i=>!i.omitted).length);
  assert.ok(searchMenus(recipes,r.name).some(x=>x.id===r.id));
  for(const i of r.ingredients){
   const food=ingredients.find(x=>x.id===i.ingredientId);assert.ok(food);
   if(!food.isSeasoning){
    const d={...defaultDraft(),selectedIngredientIds:[food.id],activeInterestIds:[food.id]};
    assert.ok(recommend(ingredients,enriched,d).some(x=>x.recipe.id===r.id),`${r.name}: ${food.name}`);
   }
  }
 }
});

test('range servings retain the source wording and use the upper bound for quantities; invalid ranges fail validation',()=>{
 const r=recipe('cUQzxhmYdGs');assert.equal(servingLabel(r),'1~2인분');assert.equal(r.baseServings,2);
 assert.equal(totalText(amount('cUQzxhmYdGs','양배추',1)),'100g');
 assert.equal(servingLabel(recipe('WT9tCViPddU')),'3~4인분');
 assert.equal(servingLabel(recipe('1F4soB3rlMI')),'2~3인분');
 for(const servingsRange of [{min:2,max:1},{min:0,max:2},{min:1,max:3},{min:1.5,max:2}])assert.throws(()=>validateData(ingredients,[{...r,servingsRange}]));
});

test('mixed subrecipe yields scale only the amount used, keeping noodles and eggs at their own recipe amounts',()=>{
 assert.equal(totalText(amount('l3-pOzj3c6g','진간장')),'50g');
 assert.equal(totalText(amount('l3-pOzj3c6g','소면')),'100g');
 assert.equal(totalText(amount('vjWddRRR58M','진간장')),'50g');
 assert.equal(totalText(amount('llZ1ii59BVs','유부')),'3개');
 assert.equal(totalText(amount('llZ1ii59BVs','진간장')),'6g');
 assert.equal(totalText(amount('1F4soB3rlMI','토마토소스')),'227.5g');
 assert.equal(totalText(amount('1F4soB3rlMI','계란')),'3개');
 assert.equal(totalText(amount('1F4soB3rlMI','토마토소스',6)),'455g');
 assert.equal(totalText(amount('-8qL_l94cJ8','닭')),'750g');
});

test('intermediate ingredients are not purchased twice, ranges of weight are not guessed and source units remain distinct',()=>{
 assert.equal(totalText(amount('7VNH9Fvvus0','감자')),'400g');
 assert.equal(totalText(amount('gVw9OXujilo','전복')),'5마리');
 assert.equal(totalText(amount('p6r5xcrG6u0','고구마')),'2개');
 assert.equal(totalText(amount('Zkxiydlmplw','오징어')),'1마리');
 assert.equal(totalText(amount('YLd78Yqoy9I','꽃게')),'2마리');
 assert.equal(totalText(amount('MTF3kcG6mmI','김가루')),'수량 미기재');
 assert.ok(!review.entries.flatMap(e=>e.ingredients).some(i=>i.ingredientId&&/전량/.test(ingredients.find(x=>x.id===i.ingredientId).name)));
});
