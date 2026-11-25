// User-approved combined main dish + accompaniment review, 2026-11-25.
// This is editorial serving inference, never an author's serving statement.
export const sourceId='blog-91';
export const baseServings=3;
export const servingsBasisLabel='수육';
export const servingsEvidence='2026-11-25 편집 재검토: 원문 통삼겹600g을 주메뉴로 보고 생고기 약200g/인 기준 3인분으로 추정. 원작자 인분 명시 아님. 사용자 승인: 수육은 인분, 무김치는 별도 원문1회 제조량으로 계산. 이전6인분 추정 폐기.';
export const accompanimentNote='수육은 인분으로, 무김치는 원문 제조량(무1개·1.3kg 기준)의 횟수로 각각 조절해요. 무김치가 필요 없으면 0회로 바꿀 수 있어요.';
export const components=[{id:'suyuk',name:'수육',mode:'servings'},{id:'radish-kimchi',name:'무김치',mode:'batch'}];
const row=(sourceText,name,sourceAmount,unit,reason=null)=>({sourceText,name,sourceAmount,unit,reason});
export const groups=[
 {name:'수육 재료',rows:[
  row('큰 양파 : 1개','양파',1,'개','큰 양파 기준'),
  row('통마늘 : 10개','마늘',10,'개'),
  row('된장 : 2숟가락','된장',2,'숟가락'),
  row('통삼겹 : 600g','통삼겹살',600,'g'),
  row('청양고추 : 2개','청양고추',2,'개','재료표에는 없으나 수육 조리 본문2단계에 명시된 재료량 보완')
 ]},
 {name:'무김치 재료',rows:[
  row('무 : 1개','무',1,'개','원문 무1.3kg 기준의1개. 임의 무게환산 아님'),
  row('굵은소금 : 1숟가락','굵은소금',1,'숟가락','절임용. 본문에는 크게1숟가락으로 설명'),
  row('물엿 : 2컵 (종이컵 기준, 약 360ml)','물엿',360,'ml','원문2종이컵에 직접 병기된 약360ml 사용'),
  row('고춧가루 : 5숟가락','고춧가루',5,'숟가락'),
  row('매실청 : 2숟가락','매실청',2,'숟가락'),
  row('미림 (맛술) : 2숟가락','맛술',2,'숟가락'),
  row('멸치액젓 : 2숟가락','멸치액젓',2,'숟가락'),
  row('설탕 : 2숟가락','설탕',2,'숟가락'),
  row('다진마늘 : 크게 2숟가락','다진 마늘',2,'숟가락','크게 계량'),
  row('고추장 : 1숟가락','고추장',1,'숟가락'),
  row('미원 : 1/2숟가락','MSG',0.5,'숟가락'),
  row('다진생강 : 1/2숟가락','다진 생강',0.5,'숟가락'),
  row('대파 : 1대 (흰색 부분만 사용)','대파',1,'대','흰색 부분만 사용'),
  row('참깨 : 2숟가락~3숟가락','참깨',null,null,'원문2~3숟가락 범위를 단일수량으로 임의확정하지 않음')
 ]}
];
export const ingredientText=groups.map(g=>`<${g.name}>\n${g.name==='수육 재료'?'삼겹살600g 기준':'무1.3kg 기준'}\n${g.rows.map(r=>r.sourceText).join('\n')}`).join('\n\n');
export const prepareText=()=>groups.map(g=>`<${g.name}>\n${g.rows.map(r=>r.sourceText).join('\n')}`).join('\n');
export const lineOverrides=Object.fromEntries(groups.flatMap(g=>g.rows.map(({sourceText,...r})=>[sourceText,r])));
// The importer appends the independently recorded body fact once.
lineOverrides['청양고추 : 2개'].reason=null;
