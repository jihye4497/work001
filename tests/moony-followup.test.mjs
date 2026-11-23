import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {aggregate,totalText} from '../js/shopping-list.js';
import {ingredientBrowseGroup} from '../js/ingredient-browse.js';
import {batch50} from '../scripts/moony-followup-policy.mjs';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json'),facts=await read('data/source/moony-followup-source-facts.json'),review=await read('data/source/recipe-review-batch-02.json'),queue=await read('data/source/recipe-review-queue.json');
const get=id=>recipes.find(r=>r.id==='moony-'+id);
test('두 번째20개는 8등록·6검토제외·6접근미확인, 원문 재접속 성공으로 오기하지 않음',()=>{
 assert.equal(review.entries.length,20);assert.equal(new Set(review.entries.map(e=>e.sourceUrl)).size,20);
 for(const [action,count] of [['registered',8],['exclude',6],['access-unverified',6]])assert.equal(review.entries.filter(e=>e.action===action).length,count);
 for(const [id,name] of batch50){const r=get(id);assert.ok(r);assert.equal(r.name,name);assert.equal(r.nameSource,'editorial-ingredients');assert.match(r.sourceNote,/기존 수집 재료표/);assert.match(r.sourceNote,/원문 재접근은 실패/);assert.equal(r.servingsStatus,'estimated');assert.ok(facts.some(e=>e.videoId===id&&e.ingredientText));}
 assert.ok(queue.nextBatch.every(e=>!review.entries.some(r=>r.sourceUrl===e.sourceUrl)));
 assert.ok(recipes.some(r=>r.id==='eonam-y0Nm-jXZYzQ'));
});
test('편집명 추가도 원단위·재료범위·대체선택지를 보존하며 중복 구매하지 않음',()=>{
 const rows=id=>{const r=get(id);return aggregate(ingredients,recipes,[{recipeId:r.id,servings:r.baseServings}],1);};
 const noodles=rows('swPArDu7zak');assert.equal(totalText(noodles.find(r=>r.ingredient.name==='해초국수')),'300g');
 assert.deepEqual(ingredientBrowseGroup(ingredients.find(i=>i.name==='해초국수')),{category:'기타',subcategory:'면·떡'});
 const tortilla=get('k-yRW47mTBA'),tomatoSauce=tortilla.ingredients.find(i=>/토마토 소스/.test(i.note));assert.equal(tomatoSauce.amount,null);assert.match(tomatoSauce.note,/2-3 큰술/);
 const soup=rows('IRnO1_5dXug');assert.equal(totalText(soup.find(r=>r.ingredient.name==='물')),'200ml');assert.ok(!soup.some(r=>r.ingredient.name==='육수'));
 const tomato=rows('fVTnNxSBjxY');assert.equal(totalText(tomato.find(r=>r.ingredient.name==='대파')),'10cm');
 const tofu=rows('2uo450zVAIY');assert.equal(totalText(tofu.find(r=>r.ingredient.name==='순두부')),'1개');
 const olives=get('E__F3vWxExQ').ingredients.find(i=>/블랙올리브/.test(i.note));assert.equal(olives.amount,null);assert.match(olives.note,/10-13개/);
 assert.ok(!rows('IRhpRwIHRbw').some(r=>r.ingredient.name==='소금'));
});
