import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {aggregate,totalText} from '../js/shopping-list.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json'),review=await read('data/source/recipe-review-batch-04.json'),source=await read('data/source/mincook-review.json'),queue=await read('data/source/recipe-review-queue.json');
test('마지막14개 검수의 원본·제외사유·등록/확인대기 상태를 보존하고 다음큐에서 반복하지 않음',()=>{
 assert.equal(review.entries.length,14);assert.equal(new Set(review.entries.map(e=>e.sourceUrl)).size,14);
 assert.equal(review.entries.filter(e=>e.action==='exclude').length,9);
 for(const e of review.entries){assert.ok(e.reason);assert.ok(['exclude','registered','awaiting-user'].includes(e.action));if(e.action==='registered')assert.ok(recipes.some(r=>r.id===e.recipeId&&r.sourceUrl===e.sourceUrl));}
 assert.ok(queue.nextBatch.every(e=>!review.entries.some(r=>r.sourceUrl===e.sourceUrl)));
});
test('해장라면의 봉지 구성품은 별도 구매하지 않고 본문 양파 보완을 검수 기록과 구분',()=>{
 const r=recipes.find(r=>r.id==='mincook-blog-114');assert.ok(r);assert.equal(r.baseServings,1);assert.equal(r.servingsStatus,'estimated');
 const rows=aggregate(ingredients,recipes,[{recipeId:r.id,servings:2}],1);
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='라면')),'2봉');
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='양파')),'0.5개');
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='대파')),'2대');
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='물')),'1,000ml');
 assert.ok(!rows.some(r=>/라면스프|건더기스프/.test(r.ingredient.name)));
 const e=source.entries.find(e=>e.sourceId==='blog-114');assert.equal(e.sourceIngredientConflicts[0].tableText,'파 1/4개');assert.equal(e.sourceIngredientConflicts[0].reviewer,'편집 검수');assert.equal(e.includedComponents.length,2);
});
