// Frozen 250-item creator cohort. No names/weights are used to mutate recipes automatically.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {MEAL_REVIEW_BATCHES,MEAL_REVIEW_SERVINGS,MEAL_REVIEW_RETAINED} from '../js/meal-servings-review-decisions.js';
import {applyCalculationBasis} from '../js/recipe-calculation-basis.js';
import {applyRecipeDisplayNames} from '../js/recipe-display-names.js';
import {SUYUK_SERVINGS_REVIEWS} from '../js/suyuk-servings-review.js';
const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const [audit,baseline,raw]=await Promise.all(['data/source/creator-servings-audit.json','data/source/creator-meal-servings-baseline.json','data/recipes.json'].map(read));
const runtime=new Map(applyCalculationBasis(applyRecipeDisplayNames(raw)).map(r=>[r.id,r]));
const issues={
 'mincook-blog-122':{kind:'mixed-basis',reason:'전체 밥2공기와 속재료1줄 기준이 섞임. 햄 중복, 유부 표4장/본문5장. 본문 소스4인분용은 완성요리 명시인분이 아님. 사용자도 본문에 완성줄수가 없음을 확인. 공식 글 HTML/공개색인에서 연결유튜브주소 미확인. 영상 완성줄수·유부량 확인 전 기존계산 유지.',fresh:true},
 'mincook-blog-469':{kind:'mixed-basis',reason:'소고기800g 제조량과 밥2공기가 같은4인분으로 계산됨. 로스트비프 전체와 덮밥2그릇 사용량 관계 확인 필요.',fresh:true},
 'mincook-blog-550':{kind:'serving-proposal',proposed:3,reason:'원문 계란밥3개·밥750g·달걀6개. 완성개수와 식사인분을 구분하고 사용자에게3인분(추정) 제안.',fresh:true},
 'mincook-blog-734':{kind:'serving-proposal',proposed:4,reason:'순두부700g·삼겹살300g·달걀2개·국물360ml.6인분보다4인분(추정) 제안.',fresh:true},
 'mincook-blog-609':{kind:'serving-proposal',proposed:4,reason:'순두부700g·굴350g·바지락100g·물300ml. 기존6인분보다4인분(추정) 제안.',fresh:true},
 'mincook-blog-510':{kind:'serving-proposal',proposed:4,reason:'순두부800g·소고기300g·쫄면150g·물500ml. 기존6인분은 소량 분할이므로4인분(추정) 후보. 사용자 미확정.'},
 'mincook-blog-441':{kind:'serving-proposal',proposed:4,reason:'순두부700g·차돌200g·물180ml. 기존5인분보다4인분(추정) 후보. 사용자 미확정.'},
 'mincook-blog-249':{kind:'serving-proposal',proposed:4,reason:'통닭다리1kg은 뼈포함인데6인분으로 추정.4인분(추정) 후보. 사용자 미확정.'},
 'mincook-blog-481':{kind:'yield-unknown',reason:'고기3.5kg만으로19인분 추정. 투입물5L는 완성국물량이 아니므로 고기양과 국물양의 인분기준 충돌 가능. 최종국물량 확인 전 유지.'},
 'mincook-blog-58':{kind:'yield-unknown',reason:'돼지앞다리1개는 중량/완성가식량 미기재.6인분의 수치근거 부족, 확인 대상으로 유지.'},
 'mincook-blog-101':{kind:'portion-context',reason:'원문 당면300g(약15인분)은 당면 포장기준인지 완성잡채 반찬인분인지 구분 필요. 현재6인분을 원작자 명시인분으로 바꾸지 않음.'},
 'paik-wyCV_de0CDY':{kind:'yield-unknown',reason:'고기1.2kg으로 약5개 만드는 큰 떡갈비.1개=1인분인지 나눠먹는 반찬인지 불확실.5인분은 보존하고 제조기준 확인 필요.'},
 'moony-h21WuV-YLX0':{kind:'yield-unknown',reason:'팥300ml·물1L. 삶기전 부피와 완성죽양은 다르고 한끼/간식 크기 차이 큼.4인분 유지하되 확인 필요.'},
 'caden-Z0NMTwkZVYM':{kind:'quantity-unknown',reason:'굴무침 주재료 굴 수량 미기재. 사용자 승인 반찬1회제조로 전환하되 굴 구매량은 여전히 미기재.'}
};
const keepNotes={
 'paik-kzYgtXDcGQ4':'닭1마리 국물에 밥4공기 병기. 네그릇 제공 맥락이 있어4인분 유지.',
 'paik-YISYMu2Txp4':'라면5봉이므로5그릇 추정과 일치.5인분 유지.',
 'mincook-blog-50':'김밥5줄·밥5인분이 서로 부합. 완성요리 명시인분으로 재분류하지 않고5인분 추정 유지.',
 'mincook-blog-480':'닭안심/목살/연골 각1kg, 총3kg 대량 반죽.17인분은 약176g/인 반죽으로 대용량에 부합하므로4인분으로 축소하지 않음.',
 'mincook-blog-442':'양지3kg을17인분으로 나누면 원재료 약176g/인. 삶은후 수율 미기재이지만 큰 숫자만으로 오류라 단정하지 않고 유지.',
 'mincook-blog-440':'닭다리살2kg 업소용 제조.11인분은 원재료 약182g/인이고 튀김옷 추가됨. 대용량 추정 유지.',
 'mincook-blog-471':'다짐육1.8kg 대량 볶음.10인분은180g/인. 대용량 식사용 고기기준으로 유지.',
 'mincook-blog-653':'왕갈비5kg·양지600g·미역60g의 큰냄비 국. 뼈를 고려해도 대용량이므로17인분을 일괄4인분으로 줄이지 않음.',
 'mincook-blog-781':'쌀450g에 차돌500g·관자300g.4인분 추정 유지. 고기와 쌀 인분을 각각 더하지 않음.',
 'mincook-blog-776':'쌀450g에 갈비살1kg.4인분 추정 유지. 함께먹는 고기와 쌀 인분을 각각 더하지 않음.',
 'mincook-blog-273':'쌀450g의5인분은90g/인 생쌀. 고기양 미기재 보존,5인분을 명백한 오류로 보지 않음.',
 'mincook-blog-214':'생쌀450g·삼겹300g·김치300g.5인분은 생쌀90g/인, 반찬 포함 식사로 유지.',
 'mincook-blog-545':'밥800g·김밥샌드4개.4인분 추정 유지. 완성개수만을 원작자 명시인분으로 재분류하지 않음.',
 'mincook-blog-524':'미트파이4개이고1개분 시트/치즈는 기존검수에서4배 반영.4인분 추정 유지.',
 'mincook-blog-727':'닭2kg과 닭2마리2kg은 앞선 사용자 확인으로 같은 총량1회만 반영.6인분 추정 유지.',
 'mincook-blog-75':'낙지800g에4인분은200g/인. 채소400g기준 표를 전체800g과 같다고 임의변경하지 않고 현 인분 유지.'
};
const entries=baseline.recipeIds.map(id=>{
 const e=audit.entries.find(e=>e.recipeId===id),r=runtime.get(id);
 assert.ok(e&&r,id);assert.ok(/^(paik|caden|eonam|moony|mincook)-/.test(id));
 assert.ok(e.currentBaseServings>=4&&raw.find(r=>r.id===id).servingsStatus==='estimated',id);
 const batch=SUYUK_SERVINGS_REVIEWS[id]?null:MEAL_REVIEW_BATCHES[id],changed=SUYUK_SERVINGS_REVIEWS[id]||MEAL_REVIEW_SERVINGS[id],issue=issues[id];
 const retained=MEAL_REVIEW_RETAINED[id];
 const pending=Boolean(issue&&!batch&&!changed&&!retained);
 const status=batch?'applied-batch':changed?'applied-serving-correction':pending?'needs-user-confirmation':'reviewed-retain-estimate';
 return {recipeId:id,name:r.name,sourceUrl:e.sourceUrl,currentBaseServings:e.currentBaseServings,currentEvidence:e.currentEvidence,
  reviewStatus:status,status,calculationMode:r.calculationMode||'servings',effectiveBaseServings:r.baseServings,
  cachedIngredientTableAvailable:Boolean(e.cachedIngredientText),cachedTextHashVerified:e.cachedTextHashVerified,
  sourceTableSha256:createHash('sha256').update(e.cachedIngredientText).digest('hex'),
  registeredIngredientFacts:e.registeredIngredients.map(i=>({name:i.name,amount:i.amount,unit:i.unit,note:i.note})),
  reviewReason:batch?.reason||changed?.reason||retained||issue?.reason||keepNotes[id]||'보관원문 재료표와 등록범위를 대조. 주재료·국물·밥/면의 양과 곁들임을 함께 검토했으며 현재 추정인분을 반드시 바꿔야 할 명확한 근거가 없어 유지. 완성량/실제 식사량 확인을 뜻하지 않음.',
  proposedBaseServings:changed?.baseServings||issue?.proposed||null,
  ...(issue?{additionalConcern:{...issue,servingDecisionResolved:!pending}}:{}),
  freshSourceCheck:issue?.fresh||['mincook-blog-578','mincook-blog-611','mincook-blog-669','mincook-blog-489','mincook-blog-534','mincook-blog-627','mincook-blog-330','mincook-blog-379','mincook-blog-167','mincook-blog-715'].includes(id),
  ...(id==='mincook-blog-167'?{sourceCorrection:'공식 본문은 콩나물500g을1회 사용. 중복500g행1개를 실행시 제거; 보관원문/raw JSON 보존.'}:{}),
  ...(id==='mincook-blog-578'?{sourceCorrection:'본문 스테이크1kg을 수량미기재에서 보완. 원문0.5/본문1 마늘은 사용자 확인0.5 유지.'}:{}),
  ...(id==='mincook-blog-122'?{sourceCorrection:MEAL_REVIEW_RETAINED[id],effectiveIngredientFacts:r.ingredients.map(i=>({...i}))}:{})
 };
});
const count=s=>entries.filter(e=>e.reviewStatus===s).length;
const report={schemaVersion:2,checkedOn:'2026-11-25',scope:'유튜브 지정5채널·연결공식블로그의 기존추정4인분이상 식사형250개. 식약처/테팔·원문명시인분·1~3인분·앞서완료제조형 제외.',
 completed:'250개 보관원문 재료표·등록범위·인분 추정의 적절성을 편집 검토. 의심건 공식블로그 신규접속 및 사용자 확인 별도 기록.',
 limitations:'유지 결정은 실제 조리/완성수율 검증 또는 정확한 인분 보증이 아님. 전체250개 원문 신규접속/영상시청은 하지 않음. 미확정건은 기존 계산 유지.',
 summary:{targetCount:entries.length,reviewedCount:entries.length,retainedEstimateCount:count('reviewed-retain-estimate'),appliedBatchCount:count('applied-batch'),changedServingNumbers:count('applied-serving-correction'),remainingCount:count('needs-user-confirmation')},entries};
await writeFile(new URL('data/source/creator-meal-servings-review.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
