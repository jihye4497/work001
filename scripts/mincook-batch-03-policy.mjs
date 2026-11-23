// User resolved meat identity and conflicting pasta quantities on 2026-11-23.
export const batch50=[['blog-701','스테이크 솥밥',3,'솥밥','한식 주메뉴'],['blog-636','전자레인지 크림 파스타',2,'파스타','양식'],['blog-572','레스토랑 스테이크',4,'스테이크','양식']];
export const definitions=[['mincook-garnish-vegetables','곁들임 채소','채소·버섯',false]];
export const sourceFacts={
 'blog-701':[
 ['스테이크용 고기 : 500g','부채살',500,'g','원문 스테이크용 고기. 사용자가 블로그에서 부채살 확인(2026-11-23); 원문 재료표의 축종·부위 명시와 구분'],
 ['쌀 : 300g','쌀',300,'g'],['물 : 360ml','물',360,'ml'],['건다시마 : 1g','다시마',1,'g'],['쯔유 : 4숟가락','쯔유',4,'숟가락'],['마늘 : 50g','마늘',50,'g'],['표고버섯 : 50g','표고버섯',50,'g'],['느타리버섯 : 50g','느타리버섯',50,'g'],['식용유 : 1숟가락','식용유',1,'숟가락'],['버터 : 20g','버터',20,'g'],['쪽파 : 100g','쪽파',100,'g'],['계란 : 3개','계란',3,'개'],['소금','소금',null,null,'공식 본문의 추가 재료 사실. 조리 문장은 복제하지 않음'],['참깨','참깨',null,null,'공식 본문의 추가 재료 사실. 조리 문장은 복제하지 않음']
 ],
 'blog-636':[
 ['파스타 : 150g','파스타',150,'g'],['양파 : 90g','양파',90,'g'],['청양고추 : 5g','청양고추',5,'g'],['베이컨 : 70g','베이컨',70,'g'],
 ['우유 200ml','우유',200,'ml','원문 재료표200g과 본문200ml 충돌. 사용자 지시로 본문200ml 반영(2026-11-23)'],
 ['생크림 200ml','생크림',200,'ml','원문 재료표200g과 본문200ml 충돌. 사용자 지시로 본문200ml 반영(2026-11-23)'],
 ['물 150ml','물',150,'ml','원문 재료표100g과 본문150ml 충돌. 사용자 지시로 본문150ml 반영(2026-11-23)'],
 ['치킨스톡 : 1숟가락','치킨스톡',1,'숟가락'],['다진마늘 : 0.5숟가락','다진 마늘',0.5,'숟가락'],['파슬리','파슬리',null,null],['후추 0.1숟가락','후추가루',0.1,'숟가락','공식 본문에 직접 명시된 추가 재료량. 조리 문장은 복제하지 않음']
 ],
 'blog-572':[
 ['스테이크용 고기 : 1kg','부채살',1,'kg','원문 스테이크용 고기. 사용자가 블로그에서 부채살 확인(2026-11-23); 원문 재료표의 축종·부위 명시와 구분'],
 ['소금','소금',null,null],['후추','후추가루',null,null],['스테이크 시즈닝','스테이크 시즈닝',null,null],['올리브유','올리브유',null,null],
 ['참나물 : 100g','참나물',100,'g'],['올리브오일 : 100ml','올리브유',100,'ml'],['양파 : 60g','양파',60,'g'],['꿀 : 50ml','꿀',50,'ml'],['레몬즙 : 50ml','레몬즙',50,'ml'],['다진마늘 : 2숟가락','다진 마늘',2,'숟가락'],['맛소금 : 0.5숟가락','맛소금',0.5,'숟가락'],['후추 : 0.2숟가락','후추가루',0.2,'숟가락'],['크러쉬드페퍼 : 1숟가락 (청양고추로 대체 가능)','레드크러쉬드 페퍼',1,'숟가락','원문 기본 재료만 반영하고 청양고추 대체는 중복 합산하지 않음'],['구운 야채들','곁들임 채소',null,null,'원문 본문의 곁들임 채소. 종류·분량 미기재를 유지하고 특정 채소로 추정하지 않음']
 ]
};
export const lineOverrides=Object.fromEntries(Object.entries(sourceFacts).map(([id,rows])=>[id,Object.fromEntries(rows.map(([text,name,sourceAmount,unit,reason])=>[text,{name,sourceAmount,unit,...(reason?{reason}:{})}]))]));
const basis={'blog-701':'쌀300g·고기500g·계란3개의 솥밥 전체를3인분','blog-636':'파스타150g·베이컨70g·우유/생크림 각200ml의 전체를2인분','blog-572':'고기1kg·참나물100g 등의 전체를4인분'};
export const servingsOverrides=Object.fromEntries(batch50.map(([id])=>[id,{status:'estimated',evidence:`원문 인분 미기재. ${basis[id]}으로 편집 추정(2026-11-23 사용자 승인). 원작자 명시 인분 아님.`}]));
export function prepareText(entry){
 entry.nameSource='official-blog';entry.nameSourceText=batch50.find(row=>row[0]===entry.sourceId)[1];
 const rows=sourceFacts[entry.sourceId];for(const [text] of rows)if(!entry.ingredientText.includes(text))throw Error('원문 사실과 불일치: '+text);
 return rows.map(row=>row[0]).join('\n');
}
