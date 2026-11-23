// Third review batch: source facts retained; editorial names approved by the user.
export const batch50=[
 ['r-BA0P8uOkc','양파 토마토 요리',4,'요리','그 밖'],
 ['-IobWfRmPq0','팽이버섯 달걀 요리',2,'요리','한식 반찬'],
 ['nvojrMwWzwg','김치 숙주 두부 요리',2,'요리','한식 주메뉴'],
 ['yULmVNGhZb4','가지 달걀전',2,'전','한식 반찬'],
 ['VV0XnOmCRpM','새우 채소 요리',2,'요리','그 밖'],
 ['hm4yLs-sxoU','굴 쑥갓 국물 요리',2,'요리','한식 국·찌개'],
 ['IMvO7aBct7w','두부 된장 요리',2,'요리','한식 주메뉴'],
 ['k6hII4CZ4gA','소고기 배추 채소 요리',2,'요리','한식 주메뉴'],
 ['XFEJgyvUQQ4','두부 김치 요리',2,'요리','한식 주메뉴']
];
export const definitions=[['moony-unspecified-herb','허브','양념·조미료',true]];
const facts={
 'r-BA0P8uOkc':[['토마토 300g','토마토',300,'g'],['양파 100g','양파',100,'g'],['마늘 10g','마늘',10,'g'],['올리브오일 4Ts','올리브유',4,'Ts'],['식초 1Ts','식초',1,'Ts'],['소금','소금',null,null],['후추','후추가루',null,null],['허브 한 줄기','허브',1,'줄기','원문 허브 종류 미기재. 바질·로즈마리 등으로 임의 확정하지 않음']],
 '-IobWfRmPq0':[['팽이버섯 1봉 (150g)','팽이버섯',150,'g'],['달걀 2개','계란',2,'개'],['소금','소금',null,null],['대파','대파',null,null]],
 nvojrMwWzwg:[['두부 300g','두부',300,'g'],['김치 100g','김치',100,'g'],['숙주나물 50g','숙주',50,'g'],['오트밀가루 2Tbsp','오트 밀가루',2,'Tbsp'],['달걀 2개','계란',2,'개']],
 yULmVNGhZb4:[['달걀 3개 (보통크기)','계란',3,'개'],['가지 1개','가지',1,'개'],['쪽파 1줄','쪽파',1,'줄']],
 VV0XnOmCRpM:[['미니 파프리카 3개','미니파프리카',3,'개'],['양배추 손바닥 사이즈 2장','양배추',2,'장'],['아스파라거스 3개','아스파라거스',3,'개'],['냉동새우  7-8마리','냉동 새우',null,null,'원문7~8마리 범위를 단일값으로 만들지 않음'],['레몬 1/2개','레몬',0.5,'개'],['소금','소금',null,null],['올리브오일','올리브유',null,null]],
 'hm4yLs-sxoU':[['무 150g','무',150,'g'],['대파 2줄기','대파',2,'줄기'],['버섯 100g','버섯',100,'g','원문 버섯 종류 미기재. 특정 품종으로 치환하지 않음'],['육수 400ml','육수',400,'ml'],['굴 200g','굴',200,'g'],['쑥갓 80g','쑥갓',80,'g'],['어간장 1Tbsp','어간장',1,'Tbsp'],['고춧가루 1Tbsp','고춧가루',1,'Tbsp']],
 IMvO7aBct7w:[['두부 1모','두부',1,'모'],['집된장 1큰술','집된장',1,'큰술'],['시판된장 1큰술','된장',1,'큰술','원문 시판된장. 집된장과 사용 내역을 구분'],['고춧가루 1큰술','고춧가루',1,'큰술'],['양파 1/2개','양파',0.5,'개'],['표고버섯 2개','표고버섯',2,'개'],['대파 1줄기','대파',1,'줄기'],['청,홍고추 각 1개','청고추',1,'개','청고추·홍고추 각각1개로 반영']],
 k6hII4CZ4gA:[['소고기 150g','소고기',150,'g'],['배추 5-7장','배추',null,null,'원문5~7장 범위를 단일값으로 만들지 않음'],['숙주나물 2줌','숙주',2,'줌'],['대파 2줄기','대파',2,'줄기'],['버섯 80g','버섯',80,'g'],['청경채 2줄기','청경채',2,'줄기'],['참치액','참치액',null,null],['간장 2T','간장',2,'T'],['알룰로스 또는 올리고당 1.5T','알룰로스',1.5,'T','원문 대체재 중 알룰로스 한 가지만 포함'],['식초 1.5T','식초',1.5,'T'],['크러쉬드 레드페퍼','레드크러쉬드 페퍼',null,null],['연겨자','연겨자',null,null]],
 XFEJgyvUQQ4:[['두부 300g','두부',300,'g'],['김치 150g','김치',150,'g'],['들기름 1큰술','들기름',1,'큰술'],['마늘 1/2큰술','마늘',0.5,'큰술'],['고춧가루 1/2큰술','고춧가루',0.5,'큰술'],['어간장 또는 액젓 1큰술','어간장',1,'큰술','원문 대체재 중 어간장 한 가지만 포함']]
};
export const lineOverrides=Object.fromEntries(Object.entries(facts).map(([id,rows])=>[id,Object.fromEntries(rows.map(([text,name,sourceAmount,unit,reason])=>[text,{name,sourceAmount,unit,...(reason?{reason}:{})}]))]));
lineOverrides.IMvO7aBct7w['청,홍고추 각 1개']=[{name:'청고추',sourceAmount:1,unit:'개',reason:'원문 청·홍고추 각1개'},{name:'홍고추',sourceAmount:1,unit:'개',reason:'원문 청·홍고추 각1개'}];
const bases={'r-BA0P8uOkc':'토마토300g·양파100g·올리브오일4Ts의 곁들임 전량','-IobWfRmPq0':'팽이버섯150g·달걀2개',nvojrMwWzwg:'두부300g·김치100g·숙주50g·달걀2개',yULmVNGhZb4:'가지1개·달걀3개',VV0XnOmCRpM:'미니파프리카3개·양배추2장·아스파라거스3개·냉동새우7~8마리','hm4yLs-sxoU':'굴200g·무150g·육수400ml',IMvO7aBct7w:'두부1모·양파1/2개·표고버섯2개',k6hII4CZ4gA:'소고기150g·숙주2줌·버섯80g·배추5~7장',XFEJgyvUQQ4:'두부300g·김치150g'};
export const servingsOverrides=Object.fromEntries(batch50.map(([id,,n])=>[id,{status:'estimated',evidence:`원문 전체 인분 미기재. ${bases[id]}을 ${n}인분으로 편집 추정(2026-11-23 사용자 승인). 원작자 명시 인분 아님.`}]));
export function prepareText(entry){
 entry.nameSource='editorial-ingredients';entry.editorialName=batch50.find(row=>row[0]===entry.videoId)[1];entry.descriptionMenuName=null;
 entry.nameSourceText=entry.ingredientText;entry.nameSourceEvidence='2026-11-23 사용자 승인 재료 기반 편집명. 가지전은 원본 제목에 전이 명시되며 다른 메뉴에는 미확인 조리법을 추가하지 않음.';
 for(const [text] of facts[entry.videoId])if(!entry.ingredientText.includes(text))throw Error('원문 사실과 불일치: '+text);
 return entry.ingredientText;
}
