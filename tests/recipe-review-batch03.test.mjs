import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {batch50} from '../scripts/moony-batch-03-policy.mjs';
import {aggregate,totalText} from '../js/shopping-list.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json'),review=await read('data/source/recipe-review-batch-03.json'),queue=await read('data/source/recipe-review-queue.json');
const get=id=>recipes.find(r=>r.id==='moony-'+id);
test('세 번째20개 검수는 신규12개·제외8개를 근거와 함께 보존',()=>{
 assert.equal(review.entries.length,20);assert.equal(new Set(review.entries.map(e=>e.sourceUrl)).size,20);
 for(const [action,count] of [['registered',12],['exclude',8]])assert.equal(review.entries.filter(e=>e.action===action).length,count);
 for(const [id,name] of batch50){const r=get(id);assert.ok(r,id);assert.equal(r.name,name);assert.equal(r.nameSource,'editorial-ingredients');assert.equal(r.servingsStatus,'estimated');}
 assert.ok(queue.nextBatch.every(e=>!review.entries.some(r=>r.sourceUrl===e.sourceUrl)));
});
test('사용자 확인 부채살과 파스타 본문 수량을 원문 표기·충돌 기록과 구분',async()=>{
 const source=await read('data/source/mincook-review.json');
 for(const id of ['blog-701','blog-572']){
  const r=recipes.find(r=>r.id==='mincook-'+id),e=source.entries.find(e=>e.sourceId===id);assert.ok(r);assert.ok(e);
  assert.equal(r.ingredients[0].ingredientId,ingredients.find(i=>i.name==='부채살').id);
  assert.match(r.ingredients[0].note,/원문 스테이크용 고기/);assert.match(r.ingredients[0].note,/사용자가 블로그에서 부채살 확인/);
  assert.equal(e.sourceCorrections[0].confirmedBy,'사용자 블로그 직접 확인');
 }
 const pasta=recipes.find(r=>r.id==='mincook-blog-636');
 const rows=aggregate(ingredients,recipes,[{recipeId:pasta.id,servings:pasta.baseServings}],1);
 const amount=name=>totalText(rows.find(r=>r.ingredient.name===name));
 assert.equal(amount('우유'),'200ml');assert.equal(amount('생크림'),'200ml');assert.equal(amount('물'),'150ml');assert.equal(amount('파스타'),'150g');
 const e=source.entries.find(e=>e.sourceId==='blog-636');assert.equal(e.sourceQuantityConflicts.length,3);
 assert.deepEqual(e.sourceQuantityConflicts.find(c=>c.ingredient==='물').table,{amount:100,unit:'g'});
});
test('범위·원단위·각각 사용한 재료·대체재 선택을 그대로 유지',()=>{
 const rows=id=>{const r=get(id);return aggregate(ingredients,recipes,[{recipeId:r.id,servings:r.baseServings}],1);};
 const tomato=rows('r-BA0P8uOkc');assert.equal(totalText(tomato.find(r=>r.ingredient.name==='올리브유')),'4Ts');
 assert.equal(totalText(tomato.find(r=>r.ingredient.name==='허브')),'1줄기');
 const enoki=rows('-IobWfRmPq0');assert.equal(totalText(enoki.find(r=>r.ingredient.name==='팽이버섯')),'150g');
 const tofu=rows('IMvO7aBct7w');for(const name of ['집된장','된장','청고추','홍고추'])assert.ok(tofu.some(r=>r.ingredient.name===name),name);
 const cabbage=get('k6hII4CZ4gA').ingredients.find(i=>/배추 5-7장/.test(i.note));assert.equal(cabbage.amount,null);
 assert.equal(totalText(rows('k6hII4CZ4gA').find(r=>r.ingredient.name==='숙주')),'2줌');
 const shrimp=get('VV0XnOmCRpM').ingredients.find(i=>/냉동새우/.test(i.note));assert.equal(shrimp.amount,null);assert.match(shrimp.note,/7-8마리/);
 const tofuKimchi=rows('XFEJgyvUQQ4');assert.ok(tofuKimchi.some(r=>r.ingredient.name==='어간장'));assert.ok(!tofuKimchi.some(r=>r.ingredient.name==='액젓'));
});
