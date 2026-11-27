import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {BATCH_RECIPE_REVIEWS,COMPOSITE_BATCH_REVIEWS,applyCalculationBasis} from '../js/recipe-calculation-basis.js';
import {applyRecipeDisplayNames} from '../js/recipe-display-names.js';
import {BATCH_SOURCE_ADDITIONS} from '../js/user-confirmed-batch-recipes.js';
import {MEAL_REVIEW_SERVINGS} from '../js/meal-servings-review-decisions.js';
import {SUYUK_SERVINGS_REVIEWS} from '../js/suyuk-servings-review.js';
const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const [audit,recipes]=await Promise.all(['data/source/creator-servings-audit.json','data/recipes.json'].map(read));
const files=[...new Set(audit.entries.flatMap(e=>e.sourceRecordFiles))];
const documents=await Promise.all(files.map(f=>read('data/source/'+f)));
const records=documents.flatMap(d=>d.entries);
const runtime=new Map(applyCalculationBasis(applyRecipeDisplayNames(recipes)).map(r=>[r.id,r]));
const pending={
 'mincook-blog-728':'원문 신규확인: 열무김치 뒤 국수/비빔밥 재료가 혼입. 김치 자체19행만 계산할지 사용자 질문.',
 'mincook-blog-625':'원문 신규확인: 김치버터6행 뒤 활용요리 재료8행 혼입. 버터 자체만 계산할지 사용자 질문.',
 'mincook-blog-623':'2026-11-25 사용자 확인: 양념장+활용반찬4개를 각각 조절하는5구성 승인. 원문 수량은 사용자와 함께 논의 후 적용, 현재 검토안만 준비.',
 'mincook-blog-601':'원문 신규확인: 수박청4행 뒤 에이드/모히또 재료 혼입. 청 자체만 계산할지 사용자 질문.',
 'mincook-blog-598':'원문 신규확인: 썬드라이토마토6행 뒤 파스타/샐러드 재료 혼입. 자체재료만 계산할지 사용자 질문.',
 'mincook-blog-238':'원문 신규확인: 재료표 생크림1L/본문 우유1L 상충. 전기밥솥도 재료로 등록돼 있음. 액체재료 기준 사용자 질문.',
 'mincook-blog-578':'원문 신규확인: 스테이크/소스 혼합·이름 feat. 접두어·다진마늘 재료표0.5/본문1숟가락 상충. 사용자 질문.'
};
const entries=audit.entries.filter(e=>e.calculationBasisProposal.mode==='batch'||e.recipeId==='mincook-blog-578').map(e=>{
 const composite=COMPOSITE_BATCH_REVIEWS[e.recipeId];
 const servingDecision=SUYUK_SERVINGS_REVIEWS[e.recipeId];
 const applied=composite||servingDecision?null:BATCH_RECIPE_REVIEWS[e.recipeId];
 const recipe=recipes.find(r=>r.id===e.recipeId);
 if(applied||composite){
  const record=records.find(r=>r.recipeId===e.recipeId);
  assert.ok(record);
  assert.equal(createHash('sha256').update(record.ingredientText).digest('hex'),record.ingredientHash);
  assert.deepEqual(record.ingredients.filter(i=>!i.omitted).map(i=>[i.ingredientId,i.amount,i.unit]),recipe.ingredients.map(i=>[i.ingredientId,i.amount,i.unit]));
 }
 const steak=e.recipeId==='mincook-blog-578';
 return {recipeId:e.recipeId,name:composite?runtime.get(e.recipeId).name:steak?'스테이크 & 페퍼콘소스':e.name,sourceUrl:e.sourceUrl,status:servingDecision?'applied-serving-correction':applied?'applied-batch':composite?'applied-composite':steak?'confirmed-combined-dish':pending[e.recipeId]?'user-decision-pending':'needs-individual-review',
  reason:applied?.reason||composite?.reason||(steak?'2026-11-25 사용자 확인: 스테이크와 페퍼콘소스 함께 등록. 마늘 재료표0.5숟가락 유지. 소스 단독 제조형 전환하지 않음. 기존 추정인분은 후속 인분감사 대상.':pending[e.recipeId])||'개별 검토 필요',
  ...(composite?{calculationMode:'composite',recheckedSourceUrl:e.sourceUrl,components:runtime.get(e.recipeId).components.map(c=>({...c,ingredientRows:runtime.get(e.recipeId).ingredients.filter(i=>i.componentId===c.id).length})),sourceScopeNote:composite.reason,additionalSourceFacts:runtime.get(e.recipeId).ingredients.filter(i=>i.note?.startsWith('원문 본문 재료:')).map(i=>({...i}))}:{}),
  ...(steak?{calculationMode:'servings',servingsEstimateReviewPending:!MEAL_REVIEW_SERVINGS[e.recipeId],effectiveBaseServings:runtime.get(e.recipeId).baseServings,servingsRecheck:MEAL_REVIEW_SERVINGS[e.recipeId]?.reason}:{}),
  ...(servingDecision?{reason:servingDecision.reason,calculationMode:'servings',effectiveBaseServings:servingDecision.baseServings,sourceReviewFile:'suyuk-servings-review.json'}:{}),
  ...(e.recipeId==='paik-1vfJqpklDSI'?{recheckedSourceUrl:undefined,sourceReviewFile:'paik-apple-composition-review.json',independentSourceFetchVerified:false,sourceAdditionVerification:'2026-11-27 사용자 제공 정보란 재료표로 토스트/프렌치토스트8행 보완. 사과조림30g씩은 제조물 연결로 보존. 원문 재접근 검증으로 표시하지 않음.'}:{}),
  originalBaseServings:recipe.baseServings,sourceQuantitiesUnchanged:!['mincook-blog-167','mincook-blog-578'].includes(e.recipeId),
  ...(e.recipeId==='mincook-blog-167'?{sourceCorrection:'공식본문 콩나물500g1회사용 재확인. 표의중복500g행1개 실행시제거, 보관원문/raw JSON보존.'}:{}),
  ...(BATCH_SOURCE_ADDITIONS[e.recipeId]?{sourceAdditions:BATCH_SOURCE_ADDITIONS[e.recipeId],recheckedSourceUrl:e.sourceUrl,sourceAdditionVerification:'2026-11-25 공식블로그 재접근. 원문에 명시된 재료와 수량만 보완, 줌/개/장/숟가락 단위 유지.'}:{}),
  ...(e.recipeId==='mincook-blog-59'?{parsingCorrection:'2026-11-25 공식 원문 양파 큰 것 기준1개 재확인. 기존 미기재 파싱을 실행시1개로 정정, 원본기록 보존.',recheckedSourceUrl:'https://chef-choice.tistory.com/59'}:{}),
  ...(applied?{calculationMode:'batch',defaultBatchCount:1,householdScaling:false,summary:applied.summary,verification:'이전 수집 원문 재료표 해시 및 검수행과 등록 수량 일치。보관자료 대조와 원문 신규접근을 구분. 단위/수량 미기재는 임의 보충하지 않음.',legacySelection:'선택메뉴와 기존인분은 보존. 제조횟수 미저장시 기존 times 사용(통상1회). 원문 전량으로 계산되므로 이전 인분비례 필요량과 달라짐.'}:{})};
});
const report={schemaVersion:1,checkedOn:'2026-11-25',scope:'최초 제조량형84후보・미정34건・후속 식사형검토에서 사용자 승인한 반찬/제조물의 처리기록. 개별 인분재검토는 creator-meal-servings-review.json 참조.',summary:{target:entries.length,applied:entries.filter(e=>e.status==='applied-batch').length,composite:entries.filter(e=>e.status==='applied-composite').length,confirmedCombinedDish:entries.filter(e=>e.status==='confirmed-combined-dish').length,servingCorrected:entries.filter(e=>e.status==='applied-serving-correction').length,remaining:entries.filter(e=>['needs-individual-review','user-decision-pending'].includes(e.status)).length},entries};
await writeFile(new URL('data/source/creator-batch-review.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
