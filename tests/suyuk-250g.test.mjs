import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyCalculationBasis} from '../js/recipe-calculation-basis.js';
import {SUYUK_RAW_MEAT_GRAMS,SUYUK_SERVINGS_REVIEWS,applySuyukServingReview} from '../js/suyuk-servings-review.js';
import {aggregate} from '../js/shopping-list.js';
const read=async p=>JSON.parse(await readFile(new URL('../data/'+p,import.meta.url),'utf8'));
const [raw,ingredients]=await Promise.all(['recipes.json','ingredients.json'].map(read));
const effective=applyCalculationBasis(raw);
test('수육250g기준을 승인된15메뉴에만 정수반올림 적용하고 원문수량 보존',()=>{
 assert.equal(Object.keys(SUYUK_SERVINGS_REVIEWS).length,15);
 for(const [id,grams] of Object.entries(SUYUK_RAW_MEAT_GRAMS)){
  const r=effective.find(r=>r.id===id),original=raw.find(r=>r.id===id);
  assert.equal(r.baseServings,Math.max(1,Math.round(grams/250)),id);
  assert.equal(r.calculationMode,'servings');
  const restored=aggregate(ingredients,[r],[{recipeId:id,servings:r.baseServings,times:1}],1).flatMap(row=>row.uses);
  assert.ok(original.ingredients.every(i=>restored.some(u=>u.note===i.note&&u.amount===i.amount&&u.unit===i.unit)),id);
  assert.deepEqual(applyCalculationBasis([r])[0],r,id);
 }
 assert.equal(effective.find(r=>r.id==='mincook-blog-442').baseServings,12);
 assert.equal(effective.find(r=>r.id==='mincook-blog-91').baseServings,2);
 assert.equal(effective.find(r=>r.id==='mincook-blog-112').baseServings,3);
});
test('일반요리·명시인분·중량미기재·국물전골에는 새수육규칙 적용하지 않음',()=>{
 for(const recipe of raw.filter(r=>!SUYUK_SERVINGS_REVIEWS[r.id]))assert.equal(applySuyukServingReview(recipe),recipe,recipe.id);
 const explicit={...raw.find(r=>r.id==='mincook-blog-442'),servingsStatus:'explicit'};
 assert.equal(applySuyukServingReview(explicit),explicit);
 for(const id of ['mincook-blog-277','mincook-blog-460','mincook-blog-348','mincook-blog-200'])assert.equal(effective.find(r=>r.id===id).baseServings,raw.find(r=>r.id===id).baseServings);
});
