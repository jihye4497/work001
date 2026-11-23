import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyPendingReviewPolicy,pendingExclusion} from '../scripts/pending-review-policy.mjs';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
test('접속 실패·보조양념 약간·인분 추정은 제외하지 않고 복잡한 미등록 자료만 분류',()=>{
 for(const reason of ['원본 추가 확인 실패: HTTP Error 429: Too Many Requests','YouTube 요청 제한으로 원본 확인 미실행','후추 약간, 식용유 적당량','전체 요리 기준 인분 근거 추가 확인 필요'])assert.equal(pendingExclusion(reason),null);
 assert.equal(pendingExclusion('전체 재료 수량 미기재로 인분·장보기량 확인 필요'),'insufficient-core-quantities');
 assert.equal(pendingExclusion('쉬림프박스·갈릭새우파스타 두 완성 요리의 분량 배분 확인 필요'),'multiple-dishes');
 assert.equal(pendingExclusion('만능양파 45g을 원재료로 분해할 완성 수율 확인 대기'),'unclear-prepared-portion');
 const registered={status:'registered',reason:'전체 재료 수량 미기재'};
 assert.equal(applyPendingReviewPolicy([registered])[0],registered);
 const pending={status:'pending',reason:'전체 재료 수량 미기재',sourceUrl:'https://example.test/1'};
 const result=applyPendingReviewPolicy([pending]);assert.equal(pending.status,'pending');assert.equal(result[0].originalReason,pending.reason);assert.deepEqual(applyPendingReviewPolicy(result),result);
});
test('전체545개 보류 근거·원본 링크 보존, 등록 레시피 제외 없음, 큐 합계와 다음20개 일치',async()=>{
 const baseline=await read('data/source/simplified-review-baseline.json'),queue=await read('data/source/recipe-review-queue.json'),recipes=await read('data/recipes.json');
 assert.equal(baseline.entries.length,545);
 const completed=baseline.entries.filter(e=>recipes.some(r=>r.sourceUrl===e.sourceUrl));
 assert.equal(queue.totals.pending+queue.totals.excludedByPolicy+completed.length,baseline.entries.length);
 assert.equal(queue.entries.length,queue.totals.pending);
 assert.equal(queue.nextBatch.length,Math.min(queue.batchSize,queue.entries.filter(e=>!['source-access-unverified','awaiting-user'].includes(e.reviewType)).length));
 assert.ok(queue.nextBatch.every(e=>e.reviewType!=='source-access-unverified'));
 const recipeUrls=new Set(recipes.map(r=>r.sourceUrl));
 for(const channel of ['paik-playlist','caden','eonam','moony','mincook']){
  const coverage=await read(`data/source/${channel}-coverage.json`);
  for(const original of baseline.entries.filter(e=>e.channel===channel)){
   const entry=coverage.entries.find(e=>e.sourceUrl===original.sourceUrl);assert.ok(entry);
   assert.ok(['pending','excluded-policy','registered'].includes(entry.status));
   if(entry.status==='registered'){assert.ok(recipeUrls.has(entry.sourceUrl));continue;}
   assert.equal(entry.originalReason??entry.reason,original.originalReason);
   if(entry.status==='excluded-policy'){assert.ok(entry.exclusionCode);assert.ok(!recipeUrls.has(entry.sourceUrl));}
  }
 }
});
test('첫20개 후속 검토는 핵심 재료량 누락11개·접근미확인8개·사용자확인등록1개로 구분',async()=>{
 const review=await read('data/source/recipe-review-batch-01.json');
 assert.equal(review.entries.length,20);assert.equal(new Set(review.entries.map(e=>e.sourceUrl)).size,20);
 assert.equal(review.entries.filter(e=>e.action==='exclude').length,11);
 assert.equal(review.entries.filter(e=>e.action==='access-unverified').length,8);
 assert.equal(review.entries.filter(e=>e.action==='registered').length,1);
 for(const entry of review.entries){
  if(entry.action==='registered')continue;
  const result=applyPendingReviewPolicy([{status:'pending',sourceUrl:entry.sourceUrl,reason:'원래 확인 필요'}])[0];
  assert.equal(result.reason,entry.reason);
  assert.equal(result.status,entry.action==='exclude'?'excluded-policy':'pending');
 }
 const queue=await read('data/source/recipe-review-queue.json');
 assert.ok(queue.nextBatch.every(e=>!review.entries.some(r=>r.sourceUrl===e.sourceUrl)));
});
