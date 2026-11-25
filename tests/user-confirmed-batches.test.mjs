import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {USER_CONFIRMED_BATCH_RECIPES} from '../js/user-confirmed-batch-recipes.js';
import {applyCalculationBasis} from '../js/recipe-calculation-basis.js';
import {aggregate} from '../js/shopping-list.js';
import {servingLabel} from '../js/servings.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const [ingredients,raw]=await Promise.all([read('data/ingredients.json'),read('data/recipes.json')]);
const recipes=applyCalculationBasis(raw);
test('사용자 결정 미정34건을 전량1회 제조로 전환하고 기존 인분을 계산하지 않음',()=>{
 assert.equal(Object.keys(USER_CONFIRMED_BATCH_RECIPES).length,34);
 for(const id of Object.keys(USER_CONFIRMED_BATCH_RECIPES)){
  const r=recipes.find(r=>r.id===id);assert.ok(r,id);assert.equal(servingLabel(r),'1회 제조량');
  const rows=n=>aggregate(ingredients,[r],[{recipeId:id,times:1,servings:n}],n).flatMap(row=>row.uses).map(u=>[u.note,u.amount,u.unit]);
  assert.deepEqual(rows(1),rows(4),id);
  assert.equal(r.baseServings,raw.find(x=>x.id===id).baseServings);
 }
});
test('수육2건 원문누락 보완은 단위/미기재를 보존하며 두번 적용해도 중복되지 않음',()=>{
 const wine=recipes.find(r=>r.id==='mincook-blog-112'),bossam=recipes.find(r=>r.id==='mincook-blog-348');
 assert.equal(wine.ingredients.length,18);assert.equal(bossam.ingredients.length,13);
 assert.ok(wine.ingredients.some(i=>i.amount===1&&i.unit==='줌'&&i.note.includes('크게 한 줌')));
 assert.ok(wine.ingredients.some(i=>i.amount===10&&i.unit==='장'&&i.note.includes('깻잎')));
 assert.equal(bossam.ingredients.at(-1).amount,null);
 assert.deepEqual(applyCalculationBasis([wine,bossam]),[wine,bossam]);
});
test('인분검토 최초250건 이력을 유지하고 원본숫자와 적용숫자를 구분',async()=>{
 const report=await read('data/source/creator-meal-servings-review.json');
 assert.equal(report.summary.targetCount,250);assert.equal(report.summary.reviewedCount,250);
 assert.equal(report.summary.changedServingNumbers,report.entries.filter(e=>e.status==='applied-serving-correction').length);
 assert.equal(report.entries.length,250);
 for(const e of report.entries){assert.equal(e.currentBaseServings,raw.find(r=>r.id===e.recipeId).baseServings);assert.ok(e.reviewReason);}
});
