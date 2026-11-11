import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {auditAndMerge,hash,explicitServing} from '../scripts/import-mfds.mjs';
import {applyRecipeCategories} from '../js/recipe-filters.js';
import {aggregate,totalText,copyText} from '../js/shopping-list.js';
import {servingLabel} from '../js/servings.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json');
const source=await read('data/source/mfds-response.json'),supplement=await read('data/source/mfds-supplement.json');
const reviews=await read('data/source/mfds-reviews.json'),report=await read('data/source/mfds-expansion-report-2026-11-11.json');

test('추가 메뉴 전부 원문 해시·단위·구절 검증 및 분류 연결, 기존 453개 ID 보존',async()=>{
  assert.equal(recipes.length,1033);assert.equal(report.added.length,580);
  const originalCatalog=await read('data/recipe-categories.json');
  const enriched=applyRecipeCategories(recipes,originalCatalog);assert.equal(enriched.length,recipes.length);
  const result=auditAndMerge([source,supplement],ingredients,recipes,reviews,'2026-11-11');
  assert.deepEqual(result.recipes,recipes);assert.equal(result.report.added.length,0);
  assert.equal(result.report.unchanged.length,1025);
  assert.equal(result.report.pending.length,133);
  for(const row of source.COOKRCP01.row) {
    const review=reviews.find(r=>r.sourceId===row.RCP_SEQ);
    if(review) assert.equal(review.sourceHash,hash(row.RCP_PARTS_DTLS));
  }
  for(const id of ['squid-stir','potato-stir','mfds-cookrcp01-16','mfds-cookrcp01-17','mfds-cookrcp01-548']) assert.ok(recipes.some(r=>r.id===id));
});

test('소제목 때문에 보류됐던 실제 메뉴 포함, 소제목이 장보기 재료로 들어가지 않음',()=>{
  for(const name of ['새우 두부 계란찜','사과 새우 북엇국','버섯순두부찌개','오징어김치찌개','토마토소고기장조림']) assert.ok(recipes.some(r=>r.name===name),name);
  const recipe=recipes.find(r=>r.name==='새우 두부 계란찜');
  const rows=aggregate(ingredients,recipes,[{recipeId:recipe.id,times:1}],2);
  assert.ok(!rows.some(r=>/^(고명|장식|양념장|재료)$/.test(r.ingredient.name)));
  const spinach=rows.find(r=>r.ingredient.name==='시금치');assert.equal(totalText(spinach),'20g');
});

test('빵가루 생선·어묵 사라다는 포함, 실제 빵·소보로·버터롤·브레드 스틱은 제외',()=>{
  for(const name of ['레몬, 파슬리 빵가루를 입힌 도미','빵 대신 어묵 사라다']) assert.ok(recipes.some(r=>r.name===name));
  for(const name of ['고구마 찰 빵','콩가루 소보로','삼색 버터롤','삼색 브레드 스틱','땅콩 밀푀유 샌드']) assert.ok(!recipes.some(r=>r.name===name));
  assert.equal(report.held.filter(h=>h.reason.includes('제빵')).length,51);
});

test('사용자 확인 1인분과 원문 명시 인분을 구분해 보존하고 화면·복사에서 추정 문구 제거',()=>{
  const confirmed=recipes.filter(r=>r.servingsStatus==='user-confirmed');assert.equal(confirmed.length,965);
  assert.ok(confirmed.every(r=>r.baseServings===1&&r.servingsEvidence.includes('사용자')));
  assert.ok(recipes.every(r=>!servingLabel(r).includes('추정')));
  for(const row of source.COOKRCP01.row) {
    const serving=explicitServing(row.RCP_PARTS_DTLS),recipe=recipes.find(r=>r.id===`mfds-cookrcp01-${row.RCP_SEQ}`);
    if(serving&&recipe) assert.equal(recipe.baseServings,Number(serving[1]||serving[2]));
  }
  const rows=aggregate(ingredients,recipes,[{recipeId:'mfds-cookrcp01-16',times:2}],2);
  assert.doesNotMatch(copyText(rows,[]),/추정/);
  assert.equal(totalText(rows.find(r=>r.ingredient.id==='carrot')),'20g');
});

test('단위 미기재·수량 범위를 임의 g으로 만들지 않으며 승인 누락·단위 변조는 거절',()=>{
  const missing=reviews.find(r=>r.ingredients.some(i=>i.sourceFormat==='missing-unit'));
  assert.ok(missing);assert.ok(missing.ingredients.filter(i=>i.sourceFormat==='missing-unit').every(i=>i.amount===null&&i.unit===null&&i.note.includes('단위 미기재')));
  const changed=structuredClone(reviews);delete changed.find(r=>r.servingsStatus==='user-confirmed').confirmedOn;
  assert.throws(()=>auditAndMerge([source,supplement],ingredients,recipes,changed,'2026-11-11'),/사용자 확인/);
  const altered=structuredClone(reviews);altered.find(r=>r.sourceId==='28').ingredients[0].unit='kg';
  assert.throws(()=>auditAndMerge([source,supplement],ingredients,recipes,altered,'2026-11-11'),/수량·단위/);
  assert.ok(report.held.some(r=>r.sourceId==='3568'));
  assert.ok(report.held.some(r=>r.sourceId==='691'&&r.reason==='재료 없음'));
});
