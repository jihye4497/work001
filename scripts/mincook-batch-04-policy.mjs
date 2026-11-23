export const batch50=[['blog-114','해장라면',1,'라면','한식 주메뉴']];
export const sourceFacts={
 'blog-114':[
 ['라면(신라면 사용) 1봉 기준','라면',1,'봉','원문 봉지라면 전량. 라면스프·건더기스프는 구성품이므로 별도 구매 중복 제외'],
 ['식용유 : 2숟가락','식용유',2,'숟가락'],['대파 : 1대','대파',1,'대'],['황태채 : 한 줌','황태채',1,'줌'],['고춧가루 : 2숟가락','고춧가루',2,'숟가락'],['굴소스 : 1숟가락','굴소스',1,'숟가락'],['물 500ml','물',500,'ml'],['양파 1/4개','양파',0.25,'개','원문 재료표 파1/4개와 본문 양파1/4개 충돌. 본문 재료 사실에 따라 양파로 편집 보완하며 원표기는 검수 기록에 보존'],['콩나물 한 줌','콩나물',1,'줌'],['청양고추 1개','청양고추',1,'개'],['부추 조금','부추',null,null],['계란 1개','계란',1,'개'],['순후추 조금','후추가루',null,null]
 ]
};
export const lineOverrides=Object.fromEntries(Object.entries(sourceFacts).map(([id,rows])=>[id,Object.fromEntries(rows.map(([text,name,sourceAmount,unit,reason])=>[text,{name,sourceAmount,unit,...(reason?{reason}:{})}]))]));
export const servingsOverrides={'blog-114':{status:'estimated',evidence:'원문 라면1봉 기준·달걀1개·물500ml의 전체 요리를1인분으로 편집 추정(2026-11-23 사용자 승인). 1봉이라는 재료 단위를 원작자 명시 인분으로 오인하지 않음.'}};
export function prepareText(entry){
 entry.nameSource='official-blog';entry.nameSourceText=batch50.find(row=>row[0]===entry.sourceId)[1];
 for(const [text] of sourceFacts[entry.sourceId])if(!entry.ingredientText.includes(text))throw Error('원문 사실과 불일치: '+text);
 return sourceFacts[entry.sourceId].map(row=>row[0]).join('\n');
}
