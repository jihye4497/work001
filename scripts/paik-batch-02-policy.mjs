// Second fifty-menu batch. Original ingredient text and editorial decisions stay separate.
export const batch50=[
 ['XtFqi5J2KqI','새우젓 파스타',1,'파스타','양식'],
 ['JxWbJX-UNwY','돼지 뒷다리살 스테이크',2,'구이','한식 주메뉴'],
 ['fVKaR66n9B4','사골북엇국',4,'국','한식 국·찌개',[3,4]],
 ['3gQwydGHIG8','소고기 감자조림',4,'조림','한식 반찬'],
 ['FdL13qXf4MA','닭개장',3,'국','한식 국·찌개'],
 ['JzyYs3lV2Gs','두부 콩국수',1,'국수','한식 주메뉴'],
 ['oUvPWwmvoPM','순대볶음',2,'볶음','한식 주메뉴'],
 ['C_PYoYG1fWY','깻잎무침',4,'무침','한식 반찬'],
 ['1hZU9_OLcDU','셀러리 돼지고기볶음',2,'볶음','한식 주메뉴'],
 ['1Lc70M38LTk','돼지고기 토마토스튜',3,'스튜','양식'],
 ['RH73tQvg33g','들깨칼국수',1,'국수','한식 주메뉴'],
 ['MCYhvB4q4r4','소고기칼국수',1,'국수','한식 주메뉴'],
 ['kMksKRBOpiA','치즈순대',2,'찜','한식 주메뉴'],
 ['EUdt9GjWj5c','간장 멸치볶음',4,'볶음','한식 반찬'],
 ['FbApByZGCXg','쫄면',1,'국수','한식 주메뉴'],
 ['IgTaHfnAbic','진미채전',3,'전','한식 반찬'],
 ['M_G9MGGQdbs','콩나물찜',3,'찜','한식 주메뉴'],
 ['4LoyQQq2pgA','땅콩버터 비빔면',2,'국수','한식 주메뉴'],
 ['6hLnQ5c03L8','뒷다리살 감자탕',3,'탕','한식 국·찌개'],
 ['4QwUVgVoMSE','알리오올리오 떡볶이',1,'볶음','한식 주메뉴'],
 ['LTVxirHWvh8','뒷다리살 카레',5,'카레','한식 주메뉴'],
 ['mjLPNh11_xs','튜나멜트 토스트',1,'샌드위치','양식'],
 ['qVtqpAfJNb4','어묵듬뿍라면',1,'라면','한식 주메뉴'],
 ['gJDxWPoMHgo','팟타이',1,'국수','그 밖'],
 ['X8VEvBHHOjQ','몬테크리스토 샌드위치',1,'샌드위치','양식'],
 ['_m_HiEJukX4','파채무침',4,'무침','한식 반찬'],
 ['mo8ogr40m4o','어묵감자볶음',4,'볶음','한식 반찬'],
 ['rqbhm9hpvp8','치즈라면전',2,'전','한식 주메뉴'],
 ['Bt0PPGfItZw','궁중떡볶이',2,'볶음','한식 주메뉴'],
 ['SBKRrJRCFu8','갈비탕',4,'탕','한식 국·찌개'],
 ['JBgLd7TqB7U','김치만두',3,'만두','한식 주메뉴'],
 ['2T7BfP1sx9g','돼지불백',3,'볶음','한식 주메뉴',[2,3]],
 ['wM9hbmwCpdc','크림떡볶이',2,'조림','한식 주메뉴'],
 ['12e93a8T2nU','대파전',3,'전','한식 반찬'],
 ['kD9Qg139l9g','홍콩식 굴전',2,'전','중식'],
 ['ohihzV6Z85k','K-알리오올리오',1,'파스타','양식'],
 ['7cCAlN06WPc','찹스테이크',2,'볶음','양식'],
 ['wPxuQdfYErk','고기쌈장',6,'양념장','한식 반찬'],
 ['iO0xX0AyS8M','꽈리고추 닭볶음',3,'볶음','한식 주메뉴'],
 ['_TGhAtAqrLk','만두전골',3,'전골','한식 국·찌개'],
 ['Om6W3JBfmFU','대패 두루치기',3,'볶음','한식 주메뉴'],
 ['0CL9U_Se8Gs','오징어볶음',2,'볶음','한식 주메뉴'],
 ['N82hJpl5cMM','감자전',2,'전','한식 반찬'],
 ['nVzwOOJLt24','소불고기',4,'볶음','한식 주메뉴'],
 ['v32NjYn5pSc','소갈비찜',4,'찜','한식 주메뉴'],
 ['_qnLV46GSr4','동그랑땡',4,'전','한식 반찬'],
 ['f0hg6R84f78','마늘볶음밥',2,'볶음밥','한식 주메뉴'],
 ['jN_inaLf9Zo','육개장',4,'국','한식 국·찌개'],
 ['0bnFoRQebq0','베이컨 크림파스타',1,'파스타','양식'],
 ['iGhOobaQHso','콩나물불고기',4,'볶음','한식 주메뉴']
];
export function groupPolicy(videoId,group){
 if(videoId==='XtFqi5J2KqI'&&group.startsWith('새우젓 페스토'))return {scale:1/5,reason:'원문에 명시된 페스토 5인분 중 한 접시 분량만 반영. 조리 전후 중량을 같다고 가정하지 않음'};
 if(videoId==='EUdt9GjWj5c'&&group==='고추장버전')return {omit:true,reason:'이번에는 간장 버전만 등록. 대체 양념을 중복 합산하지 않음'};
 if(videoId==='4LoyQQq2pgA'&&group==='1그릇 세팅')return {scale:2,reason:'원문 전체 소스가 2인분이므로 1그릇 재료를 2그릇 분량으로 반영'};
 if(videoId==='LTVxirHWvh8'&&group==='1인분세팅')return {scale:5,reason:'원문 5인분 카레에 맞춰 1인분 세팅의 밥을 5인분 반영'};
 if(videoId==='mjLPNh11_xs'&&group.startsWith('튜나샐러드'))return {scale:1/2,reason:'토스트 1개에 사용하는 샐러드 1/2양만 반영'};
 return {scale:1};
}
export const intermediateRows=new Map([
 ['XtFqi5J2KqI',['새우젓 페스토 2큰술(20g)']],
 ['JxWbJX-UNwY',['밑간 한 돼지고기 전량']],
 ['JzyYs3lV2Gs',['콩물 전량']],
 ['oUvPWwmvoPM',['양념장 전량']],
 ['FbApByZGCXg',['양념장 전량']],
 ['4LoyQQq2pgA',['소스 1/2양(120g)']],
 ['LTVxirHWvh8',['뒷다리살카레 적당량']],
 ['mjLPNh11_xs',['튜나샐러드 1/2양']],
 ['ohihzV6Z85k',['삶은 파스타면 전량']],
 ['0bnFoRQebq0',['삶은스파게티면 전량']],
 ['iGhOobaQHso',['양념장 전량']]
]);
export function prepareText(entry){
 const markers={
  '7cCAlN06WPc':'---------------------------------------',
  Om6W3JBfmFU:'*볶음밥',
  '0CL9U_Se8Gs':'*덮밥용 재료'
 };
 const marker=markers[entry.videoId];
 if(entry.videoId==='7cCAlN06WPc')entry.ingredientClarification='원문 재료표는 안심으로만 표기. 2026-11-23 사용자 의견과 일반적인 찹스테이크 구성을 근거로 소고기 안심에 연결한 편집 해석이며 원문에 축종이 명시되었다는 뜻은 아님.';
 if(marker){const pos=entry.ingredientText.indexOf(marker);if(pos>=0){entry.omittedSections=[{sourceText:entry.ingredientText.slice(pos),reason:'별도 요리 또는 대체 조리법. 선택한 기본 메뉴와 중복 합산하지 않음'}];return entry.ingredientText.slice(0,pos);}}
 return entry.ingredientText;
}
export const canonicalOverrides={
 '돼지고기뒷다리살':'돼지 뒷다리살','돼지고기뒷다리살(불고기용)':'돼지 뒷다리살','돼지고기뒷다리살(카레용)':'돼지 뒷다리살',
 '돼지고기후지(슬라이스)':'돼지 뒷다리살','통후춧가루':'후추가루','사골국물':'사골육수','오이채':'오이',
 '셀러리(大)':'셀러리','중멸치':'멸치중간것','물(쫄면삶을물)':'물','양배추채':'양배추','상추채':'상추','당근채':'당근',
 '슬라이스체다치즈':'슬라이스 체더치즈','얇은사각어묵':'어묵','체다치즈슬라이스':'슬라이스 체더치즈','봉어묵':'어묵',
 '간돼지고기':'다진 돼지고기','땅콩분태':'다진 땅콩','껍질있는들깨가루':'들깻가루','갈아만든배':'갈아만든 배',
 '생굴':'굴','페퍼론치노':'페페론치노','우스터':'우스터소스','통마늘(작은것)':'마늘',
 '소갈비데침용물':'물','간돼지고기지방':'돼지 지방','안심':'쇠고기안심','면수':'물'
};
export const definitions=[
 ['mala-sauce','마라소스','양념·조미료',true],
 ['pork-hind-leg','돼지 뒷다리살','육류·해산물',false],
 ['sundae','순대','두부·계란·기타',false],
 ['tomato-juice','토마토 주스','두부·계란·기타',false],
 ['boiled-bean-sprouts','삶은 콩나물','채소·버섯',false],
 ['msg-seasoning','MSG','양념·조미료',true],
 ['pickled-chicken-radish','치킨무','두부·계란·기타',false],
 ['beef-short-ribs','소갈비','육류·해산물',false],
 ['pear-soft-drink','갈아만든 배','두부·계란·기타',false],
 ['frozen-dumplings','냉동만두','두부·계란·기타',false],
 ['pork-fat','돼지 지방','육류·해산물',false]
];
export const lineOverrides={
 gJDxWPoMHgo:{'쌀국수 불리기 전 60g → 불린 후 1과 1/2컵(120g)':{name:'쌀국수',sourceAmount:60,unit:'g',reason:'원문이 명시한 불리기 전 60g을 구매 기준으로 사용. 불린 중량으로 역환산하지 않음'}},
 iO0xX0AyS8M:{'토막 닭(9호) 1팩 (약900~930g)':{name:'닭',sourceAmount:1,unit:'팩',reason:'원문 중량 범위를 임의 단일값으로 만들지 않고 명시된 9호 닭 1팩 사용'}},
 _TGhAtAqrLk:{'냉동만두 1봉지(10개입/350g)':{name:'냉동만두',sourceAmount:350,unit:'g',reason:'원문이 명시한 한 봉지의 350g 사용'}},
 '6hLnQ5c03L8':{
  '진간장 : 물 : 식초 : 황설탕 = 1 : 1 : 0.3 : 0.3':['진간장','물','식초','황설탕'].map(name=>({name,sourceAmount:null,unit:null,reason:'원문에 비율만 명시되어 실제 필요량은 미기재'})),
  '연겨자 개인 취향에 맞게':{name:'연겨자',sourceAmount:null,unit:null}
 },
 kD9Qg139l9g:{'스리라차 소스':{name:'스리라차 소스',sourceAmount:null,unit:null}}
};
