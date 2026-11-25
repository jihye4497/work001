// Read-only recipe audit. Writes a separate review report, never runtime data.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const sources=['paik-stews-review.json','paik-user-review.json','paik-batch-50-review.json','paik-batch-02-review.json','paik-batch-03-review.json','paik-batch-remaining-review.json','caden-review.json','eonam-review.json','moony-review.json','mincook-review.json'];
const categories=['manufacturing','pieces','preserved-side','dessert-drink','meal'];
// These are priority buckets, not assertions of correct portions or recipe type.
export function reviewBucket(recipe){
 const n=recipe.name;
 if(recipe.id==='mincook-blog-443')return 'meal'; // Sauce accompanies the pork steak.
 if(/소스|양념장|조림장|육수|스톡|마요네즈|간장$|전간장|초장$|쌈장|달래장|부추장|볶음고추장|육포고추장|생선조림장|버터$|크림치즈$|디핑|페이스트|시럽|양파잼|딸기잼|베이컨 젬|파기름|만능양파|그릭요거트|리코타|카이막|썬드라이토마토|사과조림|수박청/.test(n))return 'manufacturing';
 if(/감동란|삶은 달걀|찰옥수수 삶기|달걀장조림|메추리알.*장조림|굴림만두/.test(n))return 'pieces';
 if(/김치$|깍두기|겉절이|오이소박이|장아찌|피클|새우장|간장게장|석박지|무절임/.test(n))return 'preserved-side';
 if(/케이크|타르트|제누와즈|스콘|쿠키|초콜릿|까눌레|브라우니|그래놀라|티라미수|빙수|화채|주스|쉐이크|막걸리|뱅쇼|브륄레/.test(n))return 'dessert-drink';
 return 'meal';
}
// Proposal metadata only. Runtime Recipes and ShoppingDraft remain unchanged.
export function proposeCalculationBasis(recipe,bucket=reviewBucket(recipe),flags=[]){
 const proposal=(mode,reason)=>({mode,status:'proposal-only',reason,householdScaling:mode==='batch'?false:mode==='servings'?true:null,defaultBatchCount:mode==='batch'?1:null,quantityControl:mode==='batch'?'제조 횟수(정수)':mode==='servings'?'식사 인분':'확인 대기'});
 if(recipe.id==='mincook-blog-91'&&recipe.servingsBasisLabel)return {...proposal('servings','사용자 승인: 수육은 인분, 무김치는 원문1회 제조횟수로 독립 조절.'),status:'applied-main-dish-basis'};
 if(flags.includes('confirmed-scope-mismatch')||flags.includes('multi-dish-scope-check')||/\s&\s|수육,|와인수육과/.test(recipe.name))return proposal('pending','여러 요리의 등록 범위부터 확인해야 하므로 계산 기준 확정 대기.');
 if(recipe.id==='mincook-blog-226')return proposal('pending','베트남식 장조림은 이름만으로 저장 반찬이라고 판단하지 않고 식사 주메뉴 여부 확인.');
 if(bucket==='dessert-drink')return proposal('pending','간식·음료는 완성 개수/한 판/제조량과 식사 인분의 관계를 별도 확인.');
 if(bucket==='manufacturing'||/만능 겉절이양념/.test(recipe.name))return proposal('batch','소스·밑재료 등은 원문 1회 제조량을 담고 식사 인원에 자동 비례하지 않는 후보.');
 if(bucket==='pieces')return proposal('batch','감동란·장조림 등은 완성 개수를 안내하고 원문 전량을 1회분으로 담는 후보.');
 if(/겉절이/.test(recipe.name))return proposal('pending','바로 먹는 반찬과 한 번에 만들어 두는 반찬 중 어느 기준이 자연스러운지 확인.');
 if(bucket==='preserved-side'||/장조림|계란장$|굴오일절임|올리브 토마토 절임/.test(recipe.name))return proposal('batch','김치·장아찌·절임·장조림 등은 원문 1회 제조량으로 담는 저장 반찬 후보.');
 return proposal('servings','일반 요리·바로 먹는 반찬은 식사 인원 기준을 유지하되 현재 추정 인분 자체는 개별 재검토.');
}
const externalChecks={
 'mincook-blog-91':{status:'resolved-main-dish-basis',checkedOn:'2026-11-25',url:'https://chef-choice.tistory.com/91',finding:'원문 재확인 후 누락된 무김치 재료와 본문 청양고추를 보완하여19행 반영. 수육600g은3인분(추정), 무김치는 원문1회 제조량으로 독립 조절. 원작자 인분 명시 아님.',previousFinding:'수육 네 재료만 등록되어 무김치 및 본문 청양고추 누락, 이전6인분 근거 부족.'},
 'mincook-blog-644':{status:'source-ingredients-rechecked',checkedOn:'2026-11-25',url:'https://chef-choice.tistory.com/644',finding:'공식 원문 앞다리살1kg·크림300ml 확인. 6인분은 원문 명시가 아닌 편집 추정. 큰 숫자라는 이유만으로 축소할 근거 없음.'},
 'mincook-blog-480':{status:'source-ingredients-rechecked',checkedOn:'2026-11-25',url:'https://chef-choice.tistory.com/480',finding:'공식 원문 닭안심1kg+목살1kg+무릎연골1kg 확인. 17인분은 원문 명시가 아니지만 원재료3kg 대용량임. 임의4인분 축소 금지.'},
 'mincook-blog-372':{status:'manufacturing-basis-needed',checkedOn:'2026-11-25',url:'https://chef-choice.tistory.com/372',finding:'공식 원문 절인배추20kg 확인. 200인분은 식사인분보다 제조1회분/배추중량 기준 검토 필요.'},
 'mincook-blog-700':{status:'manufacturing-basis-needed',checkedOn:'2026-11-25',url:'https://chef-choice.tistory.com/700',finding:'원문 사골3kg+등뼈2kg 육수 제조와 순댓국/술국이 분리됨. 등록은 육수제조 범위. 17식사인분으로 환산하는 대신 제조량 기준 검토 필요.'},
 'moony-kOS_EGIExvU':{status:'source-access-unverified',checkedOn:'2026-11-25',finding:'이번 웹 직접접근 실패. 보관기록은 두부200g·오일50ml를10회 사용으로 편집 추정. 10식사인분 근거 아님.'},
 'moony-UOWYEGyvVs0':{status:'source-access-unverified',checkedOn:'2026-11-25',finding:'이번 웹 직접접근 실패. 보관기록은 달걀6개를1개씩6회 곁들임으로 추정. 완성개수와 식사인분 구분 필요.'},
 'paik-uAShnbgCLSU':{status:'source-access-unverified',checkedOn:'2026-11-25',finding:'이번 웹 직접접근 실패. 보관기록 양파15kg·오일300ml에100인분을 부여. 원문명시 인분이 아니며 제조량 기준 검토 필요.'}
};
export function buildAudit(recipes,ingredients,categoryEntries,reviewDocuments){
 const byId=new Map(ingredients.map(i=>[i.id,i]));
 const cats=new Map(categoryEntries.map(c=>[c.recipeId,c]));
 const records=new Map();
 for(const {file,document} of reviewDocuments){
  for(const e of document.entries||[]){
   const id=e.recipeId||(file.startsWith('paik-')&&e.videoId?`paik-${e.videoId}`:null);
   if(!id)continue;
   if(!records.has(id))records.set(id,[]);
   records.get(id).push({file,...e});
  }
 }
 // Keep the corrected item in the original audit cohort to retain its review history.
 const selected=recipes.filter(r=>/^(paik|caden|eonam|moony|mincook)-/.test(r.id)&&r.servingsStatus==='estimated'&&(r.baseServings>=4||(r.id==='mincook-blog-91'&&r.servingsBasisLabel)));
 const entries=selected.map(r=>{
  const sourceRecords=records.get(r.id)||[];
  const record=sourceRecords.find(e=>e.ingredientText&&e.baseServings===r.baseServings)||sourceRecords.find(e=>e.ingredientText)||sourceRecords[0];
  const bucket=reviewBucket(r),flags=[];
  if(!record?.ingredientText)flags.push('missing-cached-ingredient-text');
  if(record?.ingredientHash&&record.ingredientHash!==createHash('sha256').update(record.ingredientText||'').digest('hex'))flags.push('cached-text-hash-mismatch');
  if(record?.baseServings&&record.baseServings!==r.baseServings)flags.push('review-runtime-servings-mismatch');
  if(record?.servingsStatements?.length)flags.push('source-serving-statements-need-context-check');
  if(bucket!=='meal')flags.push('meal-serving-basis-not-established');
  const resolvedMain=r.id==='mincook-blog-91'&&Boolean(r.servingsBasisLabel);
  if(/&|＆|,|과 파절이/.test(r.name)&&!resolvedMain)flags.push('multi-dish-scope-check');
  if(r.baseServings>=10)flags.push('large-estimate-review');
  if(/原|원본 전체 재료 양을|원문 전체 제조량을/.test(r.servingsEvidence||''))flags.push('generic-estimate-no-specific-divisor');
  if(externalChecks[r.id]?.status==='scope-mismatch'&&!resolvedMain)flags.push('confirmed-scope-mismatch');
  return {recipeId:r.id,name:r.name,channel:r.sourceName,sourceUrl:r.sourceUrl,currentBaseServings:r.baseServings,currentEvidence:r.servingsEvidence,categories:cats.get(r.id)?.categories||[],bucket,reviewStatus:resolvedMain?'resolved-main-dish-basis':'needs-editorial-decision',resolution:resolvedMain?{checkedOn:'2026-11-25',previousBaseServings:6,baseServings:r.baseServings,servingsBasisLabel:r.servingsBasisLabel,ingredientRows:r.ingredients.length,reason:'무김치와 본문 청양고추 누락 보완, 원작자 인분 아닌 수육 기준 편집추정으로 수정'}:null,calculationBasisProposal:proposeCalculationBasis(r,bucket,flags),suggestedBasis:bucket==='manufacturing'?'원문1회제조량 검토':bucket==='pieces'?'원문완성개수 검토':bucket==='preserved-side'?'제조량/곁들임인분 구분 검토':bucket==='dessert-drink'?'완성개수/제조량/섭취분량 구분 검토':'한끼인분 근거 개별 검토',flags,sourceRecordFiles:sourceRecords.map(e=>e.file),cachedTextHashVerified:record?.ingredientHash?record.ingredientHash===createHash('sha256').update(record.ingredientText||'').digest('hex'):null,cachedServingsStatements:record?.servingsStatements||[],cachedIngredientText:record?.ingredientText||null,registeredIngredients:r.ingredients.map(i=>({...i,name:byId.get(i.ingredientId)?.name})),latestExternalCheck:externalChecks[r.id]||null,proposedBaseServings:null};
 });
 const count=fn=>entries.filter(fn).length;
 const calculationBasisProposals=['batch','servings','pending'].map(mode=>({mode,count:count(e=>e.calculationBasisProposal.mode===mode)}));
 return {schemaVersion:1,checkedOn:'2026-11-25',scope:'유튜브로 지정한 5채널 및 연결 공식블로그의 estimated 4인분이상. 식약처/테팔·1~3인분·원문명시인분 제외. 단 검토 후3인분으로 수정한 수육무김치1개는 최초368개 대상의 이력 보존을 위해 유지.',limitations:'전체 대상의 보관원문/검수메타/등록재료 기계 대조와 편집 우선순위 분류. 전체 원문 신규접속·영상재생·인분확정을 완료했다는 뜻이 아님. proposedBaseServings는 사용자 논의 전 전부 null. 1~3인분은 정확성 확인이 아니라 이번 범위 밖. calculationBasisProposal은 제조횟수/인분 분리 검토안. resolved-main-dish-basis인 수육무김치1건만 실제 적용했고 나머지는 미적용.',summary:{targetCount:entries.length,calculationBasisProposals,withCachedIngredientText:count(e=>Boolean(e.cachedIngredientText)),cachedTextHashVerified:count(e=>e.cachedTextHashVerified===true),freshExternalChecks:count(e=>Boolean(e.latestExternalCheck)),freshExternalSuccess:count(e=>e.latestExternalCheck&&e.latestExternalCheck.status!=='source-access-unverified'),buckets:Object.fromEntries(categories.map(k=>[k,count(e=>e.bucket===k)])),channels:[...new Set(entries.map(e=>e.channel))].map(channel=>({channel,count:count(e=>e.channel===channel)})),flags:[...new Set(entries.flatMap(e=>e.flags))].map(flag=>({flag,count:count(e=>e.flags.includes(flag))}))},entries};
}
export async function audit(){
 const [recipes,ingredients,categories,...documents]=await Promise.all([read('data/recipes.json'),read('data/ingredients.json'),read('data/recipe-categories.json'),...sources.map(f=>read(`data/source/${f}`))]);
 const report=buildAudit(recipes,ingredients,categories.entries,sources.map((file,i)=>({file,document:documents[i]})));
 await writeFile(new URL('data/source/creator-servings-audit.json',root),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report.summary,null,2));
 return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await audit();
