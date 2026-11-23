// User-approved ingredient-based editorial names; no unseen cooking method inferred.
export const batch50=[
 ['swPArDu7zak','해초 콩국수',2,'국수','한식 주메뉴'],
 ['k-yRW47mTBA','치즈 달걀 또띠아',2,'요리','그 밖'],
 ['2uo450zVAIY','간장 순두부 달걀 요리',2,'요리','한식 주메뉴'],
 ['9V5Mo_OaSBg','참치액 순두부 달걀 요리',2,'요리','한식 주메뉴'],
 ['fVTnNxSBjxY','토마토 달걀 요리',1,'요리','한식 주메뉴'],
 ['IRnO1_5dXug','순두부 달걀 국물 요리',2,'요리','한식 국·찌개'],
 ['IRhpRwIHRbw','부추 달걀 요리',2,'요리','한식 반찬'],
 ['E__F3vWxExQ','올리브 토마토 절임',4,'절임','그 밖']
];
export const definitions=[['moony-seaweed-noodles','해초국수','두부·계란·기타',false]];
const facts={
 swPArDu7zak:[['해초국수 300g','해초국수',300,'g'],['콩국물 500ml','콩국물',500,'ml'],['오이 약간','오이',null,null],['방울 토마토 1개','방울토마토',1,'개']],
 'k-yRW47mTBA':[['또띠아 2장','또띠아',2,'장'],['치즈 80g','치즈',80,'g'],['토마토 소스 2-3 큰술','토마토소스',null,null,'원문 재료 수량 범위2~3큰술 유지. 임의 단일량으로 계산하지 않음'],['달걀 3개','계란',3,'개']],
 '2uo450zVAIY':[['순두부 1개','순두부',1,'개'],['달걀 2개','계란',2,'개'],['양파 1/4개','양파',0.25,'개'],['대파 1줄기','대파',1,'줄기'],['간장 1큰술','간장',1,'큰술'],['알룰로스 1큰술','알룰로스',1,'큰술'],['청주 1큰술','청주',1,'큰술'],['참치액 1큰술','참치액',1,'큰술']],
 '9V5Mo_OaSBg':[['순두부 1개','순두부',1,'개'],['달걀 1개','계란',1,'개'],['참치액 1/2큰술','참치액',0.5,'큰술'],['파 약간','대파',null,null]],
 fVTnNxSBjxY:[['토마토 1개','토마토',1,'개'],['달걀 1개','계란',1,'개'],['대파 10cm','대파',10,'cm'],['마늘','마늘',null,null],['오일','식용유',null,null],['소금','소금',null,null],['후추','후추가루',null,null]],
 IRnO1_5dXug:[['순두부 350g','순두부',350,'g'],['댤걀 2개','계란',2,'개','원문 댤걀 표기는 달걀로 해석, 원문 구절 보존'],['대파 1줄기','대파',1,'줄기'],['육수 또는 물 200ml','물',200,'ml','원문 대체 선택지 중 물만 반영하여 육수와 중복 구매하지 않음'],['참기름','참기름',null,null],['참치액','참치액',null,null]],
 IRhpRwIHRbw:[['달걀 3개','계란',3,'개'],['부추 30g','부추',30,'g'],['굴소스 1큰술 (소금 대체가능)','굴소스',1,'큰술','원문 기본 굴소스만 포함하고 소금 대체는 중복 합산하지 않음']],
 E__F3vWxExQ:[['큰 토마토 2개','토마토',2,'개'],['양파 중간크기 1/4개','양파',0.25,'개'],['블랙올리브 10-13개','블랙올리브',null,null,'원문 재료 수량 범위10~13개 유지. 임의 단일량으로 계산하지 않음'],['올리브오일 80ml','올리브유',80,'ml'],['식초 30ml','식초',30,'ml'],['알룰로스 (또는 올리고당) 20ml','알룰로스',20,'ml','원문 기본 알룰로스만 반영하고 올리고당 대체는 중복 합산하지 않음'],['소금 약간','소금',null,null]]
};
const bases={swPArDu7zak:'해초국수300g·콩국물500ml', 'k-yRW47mTBA':'또띠아2장·달걀3개·치즈80g','2uo450zVAIY':'순두부1개·달걀2개','9V5Mo_OaSBg':'순두부1개·달걀1개',fVTnNxSBjxY:'토마토1개·달걀1개',IRnO1_5dXug:'순두부350g·달걀2개',IRhpRwIHRbw:'달걀3개·부추30g',E__F3vWxExQ:'큰 토마토2개·올리브오일80ml의 곁들임 절임 전량'};
export const servingsOverrides=Object.fromEntries(batch50.map(([id,,n])=>[id,{status:'estimated',evidence:`원문 전체 인분 미기재. ${bases[id]}을 ${n}인분으로 편집 추정(2026-11-23 사용자 승인). 원작자 명시 인분 아님.`}]));
export const lineOverrides=Object.fromEntries(Object.entries(facts).map(([id,rows])=>[id,Object.fromEntries(rows.map(([text,name,sourceAmount,unit,reason])=>[text,{name,sourceAmount,unit,...(reason?{reason}:{})}]))]));
export function prepareText(entry){
 const name=batch50.find(row=>row[0]===entry.videoId)?.[1];if(!name)throw Error('미선정 후속 메뉴');
 entry.nameSource='editorial-ingredients';entry.editorialName=name;entry.descriptionMenuName=null;
 entry.nameSourceText=entry.ingredientText;entry.nameSourceEvidence='2026-11-23 사용자 승인으로 확인된 재료를 바탕으로 붙인 설명용 이름. 확인하지 않은 볶음·찜 조리법은 추가하지 않음.';
 for(const [text] of facts[entry.videoId])if(!entry.ingredientText.includes(text))throw Error('원문 사실과 불일치: '+text);
 return entry.ingredientText;
}
