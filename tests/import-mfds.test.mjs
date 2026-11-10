import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditAndMerge, download, normalizeName } from '../scripts/import-mfds.mjs';
import { aggregate, totalText, copyText } from '../js/shopping-list.js';
import { validateData } from '../js/ingredients.js';
import { servingLabel } from '../js/servings.js';
import { recommend } from '../js/recommendations.js';
import { defaultDraft } from '../js/storage.js';
import { parseWrittenAmount } from '../scripts/mfds-quantity.mjs';

const load = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const snapshot = await load('../data/source/mfds-page2.json');
const expandedReviews = await load('../data/source/mfds-reviews.json');
const reviews = expandedReviews.filter(r=>!r.reviewBatch);
const fullSnapshot = await load('../data/source/mfds-response.json');
const supplement = await load('../data/source/mfds-supplement.json');
const allIngredients = await load('../data/ingredients.json');
const expandedRecipes = await load('../data/recipes.json');
// Keep the original 33-menu fixtures to verify earlier behavior independently.
const allRecipes = expandedRecipes.filter(r=>!r.id.startsWith('mfds-cookrcp01-') || reviews.some(v=>r.id===`mfds-cookrcp01-${v.sourceId}`));
const oldIngredients = allIngredients.filter(i => !reviews[0].ingredientDefinitions.some(d => d.id === i.id));
const oldRecipes = allRecipes.filter(r => !r.id.startsWith('mfds-cookrcp01-'));
const run = (snapshots = [snapshot], checked = reviews, rs = oldRecipes) => auditAndMerge(snapshots, oldIngredients, rs, checked, '2026-11-10');

test('샘플5건 중 인분·모든 재료가 검수된1건만 반영,4건 보류', () => {
  const result = run();
  assert.equal(result.report.reportedTotal, 1156);
  assert.equal(result.report.collectedUnique, 5);
  assert.equal(result.report.fullCollection, false);
  assert.equal(result.report.added.length, 1);
  assert.equal(result.report.pending.length, 4);
  assert.equal(result.recipes.at(-1).baseServings, 1);
  assert.equal(result.recipes.at(-1).ingredients.length, 9);
  assert.equal(result.recipes.at(-1).imagePath, null);
  assert.deepEqual(result.recipes.slice(0,8), oldRecipes);
});
test('중복 수집과 재실행은 메뉴를 중복 추가하지 않음', () => {
  const result = run([snapshot, snapshot]);
  assert.equal(result.report.duplicateSourceRows, 5);
  assert.equal(result.report.collectedUnique, 5);
  const again = auditAndMerge([snapshot], result.ingredients, result.recipes, reviews, '2026-11-10');
  assert.equal(again.report.added.length, 0);
  assert.equal(again.report.unchanged.length, 1);
  assert.deepEqual(again.recipes, result.recipes);
});
test('메뉴명 표기 차이 중복은 자동으로 별도 추가하지 않음', () => {
  assert.equal(normalizeName('부추 콩가루 찜'), normalizeName('부추콩가루찜'));
  const collision = { ...oldRecipes[0], id: 'other-source', name: '부추콩가루찜' };
  const result = run([snapshot], reviews, [...oldRecipes, collision]);
  assert.equal(result.report.added.length, 0);
  assert.ok(result.report.pending.some(p => p.matches === 'other-source'));
});
test('원문 변경·잘못된 인분·수량 변환·누락된 재료는 거절', () => {
  const mutate = action => { const r = structuredClone(reviews); action(r[0]); return r; };
  assert.throws(() => run([snapshot], mutate(r => { r.sourceHash = 'wrong'; })));
  assert.throws(() => run([snapshot], mutate(r => { r.baseServings = 2; })));
  assert.throws(() => run([snapshot], mutate(r => { r.ingredients[0].amount = 100; })));
  assert.throws(() => run([snapshot], mutate(r => { r.ingredients[0].unit = 'mL'; })));
  assert.throws(() => run([snapshot], mutate(r => { r.ingredients.pop(); })));
});
test('검수한 원문 g과 미기재 수량 유지, 기존 T·t와 합산하지 않음', () => {
  const result = run();
  const rows = aggregate(result.ingredients, result.recipes, [{ recipeId: 'mfds-cookrcp01-29', times: 2 }], 2);
  assert.equal(totalText(rows.find(r => r.ingredient.id === 'joseon-chives')), '200g');
  assert.equal(totalText(rows.find(r => r.ingredient.id === 'sesame-seeds')), '수량 미기재');
  const d = defaultDraft(); d.selectedIngredientIds = ['joseon-chives'];
  assert.equal(recommend(result.ingredients, result.recipes, d)[0].recipe.id, 'mfds-cookrcp01-29');
});
test('sample 다운로드는5건을 전체 수집으로 가장하지 않고 추가 요청하지 않음', async () => {
  let calls = 0;
  const response = await download('sample', async () => { calls++; return { ok: true, json: async () => snapshot }; });
  assert.equal(calls, 1);
  assert.equal(response.COOKRCP01.row.length, 5);
  assert.equal(response.COOKRCP01.total_count, '1156');
  assert.equal('MANUAL01' in response.COOKRCP01.row[0], false);
});
test('전체 다운로드 페이지 병합·반복 페이지 차단·키가 오류에 노출되지 않음', async () => {
  let calls = 0;
  const make = (total, ids) => ({ COOKRCP01: { total_count: String(total), RESULT: { CODE: 'INFO-000' }, row: ids.map(id => ({ RCP_SEQ: id, RCP_NM: id, RCP_PARTS_DTLS: 'test' })) } });
  const result = await download('test-secret', async () => ({ ok: true, json: async () => ++calls === 1 ? make(1001, Array.from({ length:1000 }, (_, i) => String(i))) : make(1001, ['1000']) }));
  assert.equal(result.COOKRCP01.row.length, 1001);
  assert.equal(calls, 2);
  await assert.rejects(download('test-secret', async () => ({ ok: true, json: async () => make(1001,['same']) })), /반복/);
  await assert.rejects(download('test-secret', async () => { throw new Error('test-secret'); }), error => !error.message.includes('test-secret'));
});

test('전체 원본1156건 검사·중복 후보·재료정보 누락 보류', () => {
  const result = auditAndMerge([fullSnapshot], allIngredients, allRecipes, reviews, '2026-11-10');
  assert.equal(result.report.collectedUnique, 1156);
  assert.equal(result.report.fullCollection, true);
  assert.equal(result.report.duplicateSourceRows, 0);
  assert.equal(result.report.duplicateMenuCandidates.length, 14);
  assert.equal(result.report.pending.filter(p => p.reason === '원본 재료정보 없음').length, 3);
  assert.equal(result.report.unchanged.length, 23);
  assert.equal(result.report.totalSiteRecipes, 33);
  assert.ok(result.report.coverage.find(i => i.ingredientId === 'onion').recipeCount >= 8);
  const d = defaultDraft(); d.selectedIngredientIds = ['onion'];
  assert.ok(recommend(allIngredients, allRecipes, d).length >= 8);
});
test('명시 인분은 유지하고 승인된 두 메뉴만 1인분 추정으로 분류', () => {
  const result = auditAndMerge([fullSnapshot, supplement], allIngredients, allRecipes, reviews, '2026-11-10');
  assert.equal(result.report.fullCollection, true);
  assert.equal(result.report.collectedUnique, 1158);
  assert.equal(result.report.supplementalRows, 2);
  assert.equal(result.report.servingClassification.explicitReviewed, 23);
  assert.equal(result.report.servingClassification.estimated.length, 2);
  assert.equal(result.report.servingClassification.pending, 1133);
  const estimated = result.recipes.filter(r => r.servingsStatus === 'estimated');
  assert.deepEqual(estimated.map(r=>r.id).sort(), ['mfds-cookrcp01-16','mfds-cookrcp01-17']);
  assert.ok(estimated.every(r=>r.baseServings===1 && servingLabel(r)==='1인분 기준(추정)' && r.servingsEvidence));
  assert.equal(servingLabel(result.recipes.find(r=>r.id==='mfds-cookrcp01-29')), '1인분 기준');
});
test('추정 승인이 없거나 명시된 인분을 추정으로 덮어쓰면 거절', () => {
  const changed = structuredClone(reviews);
  delete changed.find(r=>r.sourceId==='17').assumptionApprovedOn;
  assert.throws(()=>auditAndMerge([supplement],allIngredients,allRecipes,changed,'2026-11-10'));
  const overwritten = structuredClone(reviews);
  Object.assign(overwritten.find(r=>r.sourceId==='29'),{servingsStatus:'estimated',servingsEvidence:'test',assumptionApprovedOn:'2026-11-10'});
  assert.throws(()=>run([snapshot], overwritten));
  const badRecipe = {...allRecipes.find(r=>r.id==='mfds-cookrcp01-17'), servingsEvidence:''};
  assert.throws(()=>validateData(allIngredients,[badRecipe]));
});
test('추정 인분은 인원·횟수 계산과 합산·복사에 표시하고 미기재 물은 유지', () => {
  const selections=[{recipeId:'mfds-cookrcp01-16',times:2},{recipeId:'potato-stir',times:1}];
  const rows=aggregate(allIngredients,allRecipes,selections,2);
  const carrot=rows.find(r=>r.ingredient.id==='carrot');
  assert.equal(totalText(carrot),'35g');
  assert.equal(carrot.estimated,true);
  assert.ok(carrot.uses.some(u=>u.servingLabel==='1인분 기준(추정)'));
  assert.equal(totalText(rows.find(r=>r.ingredient.id==='water')),'수량 미기재');
  assert.match(copyText(rows,[]),/당근: 35g \(인분 추정 포함\)/);
  assert.match(copyText(rows,[]),/물: 수량 미기재 \(인분 추정 포함\)/);
  const confirmed=aggregate(allIngredients,allRecipes,[{recipeId:'potato-stir',times:1}],2);
  assert.doesNotMatch(copyText(confirmed,[]),/추정/);
});
test('분수 숫자만 해석하고 원문 Ts·ts·컵·마리 단위 유지', () => {
  assert.deepEqual(parseWrittenAmount('1½컵'), { amount: 1.5, unit: '컵' });
  assert.deepEqual(parseWrittenAmount('⅓줌=30g'), { amount: 30, unit: 'g' });
  assert.deepEqual(parseWrittenAmount('5×5cm, 2장'), { amount: 2, unit: '장' });
  assert.deepEqual(parseWrittenAmount('0.3Ts'), { amount: .3, unit: 'Ts' });
  assert.deepEqual(parseWrittenAmount('2조각'), { amount: 2, unit: '조각' });
  assert.deepEqual(parseWrittenAmount('약간'), { amount: null, unit: null });
  assert.throws(() => parseWrittenAmount('6~7쪽'));
  assert.throws(() => parseWrittenAmount('노랑, 빨강 각 1개'));
  assert.throws(() => parseWrittenAmount('개'));
});

test('확장 데이터는 전체 원문 재검증·재실행 시 기존 메뉴를 변경하거나 중복 추가하지 않음',()=>{
  const result=auditAndMerge([fullSnapshot,supplement],allIngredients,expandedRecipes,expandedReviews,'2026-11-10');
  assert.equal(result.report.added.length,0);
  assert.deepEqual(result.recipes,expandedRecipes);
  assert.equal(result.report.explicitServingRows,62);
  assert.ok(expandedRecipes.length>400);
  assert.ok(!expandedRecipes.some(r=>/쿠키|타르트|케이크|베이글|깜빠뉴/.test(r.name)));
  assert.ok(result.report.pending.some(r=>r.sourceId==='3568'));
  const dumpling=expandedReviews.find(r=>r.sourceId==='548');
  assert.ok(dumpling.ingredients.some(i=>i.sourceText==='정종(5g)' && i.amount===5));
  assert.ok(dumpling.ingredients.some(i=>i.sourceText==='양배추(10g)' && i.amount===10));
  assert.ok(dumpling.ingredients.every(i=>! /\)\s+[가-힣]/u.test(i.sourceText)));
  for(const ingredientId of ['onion','enoki','squid','potato','egg']) {
    const draft=defaultDraft();draft.selectedIngredientIds=[ingredientId];
    assert.ok(recommend(allIngredients,expandedRecipes,draft).length>=8);
  }
});

test('명시 인분과 180mg을 보존하고 인원·횟수에 따라 같은 단위로만 계산',()=>{
  const risotto=expandedRecipes.find(r=>r.id==='mfds-cookrcp01-353');
  const milkId=allIngredients.find(i=>i.name==='우유').id;
  assert.equal(risotto.servingsStatus,'estimated');
  assert.equal(risotto.ingredients.find(i=>i.ingredientId===milkId).amount,180);
  assert.equal(risotto.ingredients.find(i=>i.ingredientId===milkId).unit,'mg');
  const rows=aggregate(allIngredients,expandedRecipes,[{recipeId:risotto.id,times:2}],2);
  assert.equal(totalText(rows.find(r=>r.ingredient.id===milkId)),'720mg');
  const four=expandedRecipes.find(r=>r.id==='mfds-cookrcp01-3295');
  assert.equal(servingLabel(four),'4인분 기준');
  const row=aggregate(allIngredients,expandedRecipes,[{recipeId:four.id,times:1}],1);
  const surimi=row.find(r=>r.ingredient.name==='맛살');
  assert.equal(totalText(surimi),'33.75g');
});

test('확장 수량 변조·범위의 임의 숫자화·명시 인분의 추정 변경을 거절',()=>{
  const change=action=>{const rs=structuredClone(expandedReviews);action(rs);return rs;};
  const runExpanded=rs=>auditAndMerge([fullSnapshot,supplement],allIngredients,expandedRecipes,rs,'2026-11-10');
  const milkId=allIngredients.find(i=>i.name==='우유').id;
  assert.throws(()=>runExpanded(change(rs=>rs.find(r=>r.sourceId==='353').ingredients.find(i=>i.ingredientId===milkId).unit='ml')),/수량·단위/);
  const unresolved=expandedReviews.find(r=>r.ingredients.some(i=>i.sourceFormat==='unresolved'));
  assert.ok(unresolved);
  assert.throws(()=>runExpanded(change(rs=>rs.find(r=>r.sourceId===unresolved.sourceId).ingredients.find(i=>i.sourceFormat==='unresolved').amount=1)));
  const plainExplicit=expandedReviews.find(r=>r.servingEvidence?.startsWith('2인분'));
  assert.ok(plainExplicit);
  assert.throws(()=>runExpanded(change(rs=>Object.assign(rs.find(r=>r.sourceId===plainExplicit.sourceId),{servingsStatus:'estimated',baseServings:1,servingsEvidence:'test',assumptionApprovedOn:'2026-11-10'}))));
});
