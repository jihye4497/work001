import {readFile} from 'node:fs/promises';
const baseline=JSON.parse(await readFile(new URL('../data/source/simplified-review-baseline.json',import.meta.url),'utf8'));
const priorEvidence=new Map(baseline.entries.map(entry=>[entry.sourceUrl,entry.originalReason]));
const followup=JSON.parse(await readFile(new URL('../data/source/recipe-review-batch-01.json',import.meta.url),'utf8'));
const secondFollowup=JSON.parse(await readFile(new URL('../data/source/recipe-review-batch-02.json',import.meta.url),'utf8'));
const thirdFollowup=JSON.parse(await readFile(new URL('../data/source/recipe-review-batch-03.json',import.meta.url),'utf8'));
const fourthFollowup=JSON.parse(await readFile(new URL('../data/source/recipe-review-batch-04.json',import.meta.url),'utf8'));
const followupDecisions=new Map([...followup.entries,...secondFollowup.entries,...thirdFollowup.entries,...fourthFollowup.entries].map(entry=>[entry.sourceUrl,entry]));
// User-approved simplification (2026-11-23), applied only to unregistered pending sources.
// Decisions reflect saved review evidence, not a new fetch or a claim about unseen video content.
export const SIMPLIFIED_REVIEW_POLICY = {
 checkedOn:'2026-11-23',
 scope:'기존 등록 메뉴는 유지. 남은 검토에서 재료량 부족·여러 완성 메뉴 혼재·중간 조리물 사용비율 불명확 항목 제외. 확보한 텍스트에 재료표가 없는 항목은 이번 검토에서 제외하되 영상·댓글·공식 링크 전체에 정보가 없다고 단정하지 않음. 접속 실패만 확인된 항목은 미확인 유지. 약간/적당량인 보조 양념만으로는 제외하지 않음.'
};
export function pendingExclusion(reason='') {
 if(/429|요청 제한|원본 확인 미실행|원본 추가 확인 실패/.test(reason))return null;
 if(/서로 다른 요리|두 완성 요리|여러 후속 요리|여러 요리에|여섯 요리|세 가지|요리별 배분|전골과 냉면|어복쟁반·평양냉면|칼국수와 볶음밥|반죽과 여러 튀김|단팥\/슈크림 두/.test(reason))return 'multiple-dishes';
 if(/재료표 없음|구분된 재료표 없음|검수 가능한 개별 재료표 없음/.test(reason))return 'no-available-ingredient-table';
 if(/전체 재료 수량이 없어|전체 재료 수량 미기재|전체 수량 미기재|주재료 수량 확인 필요|주요 재료량이 없|주재료.*수량이 없|주재료.*누락|염지한 닭.*없어|밥·삼겹살·콩나물 분량이 모두 없어|물·고기·최종 제조분량이 없어|원문 단위가 빠져/.test(reason))return 'insufficient-core-quantities';
 if(/수율|사용.?비율|분해.?비율|배분|분해할 근거|분해 근거|분해.*근거|분해할.*확인|실제 사용량.*관계|소스.*실제 사용 분량|사용량.*없어|사용 분량이 없어|일부 육수 사용|고추파기름·소스 제조량|브라운버터 제조|완성 육수.*관계|국물 전체와 밥|제조와.*사용 분량|부분.?사용|부분 분량|완성 고기 비율|마요소스 비율|사용할 밥의 비율|양념장 제조분.*쓰는 양|전체 반죽 제조량과 한 개 사용량|겉절이·무생채·부추나물과 비빔밥/.test(reason))return 'unclear-prepared-portion';
 if(/별도 완성 요리 아님|개별 레시피 아님|먹방 영상/.test(reason))return 'nonrecipe';
 return null;
}
const explanations={
 'multiple-dishes':'여러 완성 요리가 섞인 자료는 이번 간소화 검토에서 제외',
 'no-available-ingredient-table':'확보한 설명란·검수 텍스트에 재료표가 없어 이번 검토에서 제외. 영상·댓글·공식 연결 페이지 전체의 정보 부재를 뜻하지 않음',
 'insufficient-core-quantities':'현재 확보한 자료의 주재료량·단위가 부족하여 이번 검토에서 제외',
 'unclear-prepared-portion':'중간 조리물·대량 제조분의 실제 사용 비율을 확인하기 어려워 이번 검토에서 제외',
 'nonrecipe':'개별 완성 요리 레시피가 아닌 자료는 이번 검토에서 제외'
};
export function applyPendingReviewPolicy(entries) {
 return entries.map(entry=>{
  if(entry.status!=='pending')return entry;
  const originalReason=entry.originalReason??priorEvidence.get(entry.sourceUrl)??entry.reason??'';
  const decision=followupDecisions.get(entry.sourceUrl);
  if(decision?.action==='exclude')return {...entry,status:'excluded-policy',exclusionCode:decision.exclusionCode,originalReason,reason:decision.reason,checkedOn:followup.checkedOn};
  if(['access-unverified','awaiting-user'].includes(decision?.action))return {...entry,originalReason,reason:decision.reason,reviewState:decision.action,checkedOn:followup.checkedOn};
  const title=entry.sourceTitle??'';
  const clearlyMultiple=/밑반찬\s*4종|네\s*가지 활용법|다섯\s*가지 활용법|밤양갱부터 말차양갱|커스터드 식빵, 카라멜 식빵 팝콘/.test(title);
  const exclusionCode=clearlyMultiple?'multiple-dishes':pendingExclusion(originalReason);
  return exclusionCode?{...entry,status:'excluded-policy',exclusionCode,originalReason,reason:explanations[exclusionCode],checkedOn:SIMPLIFIED_REVIEW_POLICY.checkedOn}:{...entry,reason:originalReason};
 });
}
