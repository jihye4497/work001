// Third fifty-video batch: ingredient facts remain separate from editorial decisions.
import {canonicalOverrides as earlier} from './paik-batch-02-policy.mjs';
export const batch50=[
 ['6e-IbuuD6ZU','1분 라볶이',1,'라면','한식 주메뉴'],
 ['4SEy2py0W_w','골뱅이 파채무침',3,'무침','한식 주메뉴'],
 ['M8RXmDJ3W-s','돼지고기뭇국',4,'국','한식 국·찌개'],
 ['R0xWJ4c8wR4','닭칼국수',2,'국수','한식 주메뉴'],
 ['kzYgtXDcGQ4','닭곰탕',4,'탕','한식 국·찌개'],
 ['zfMHTfJ3Ih0','우유 카레',3,'카레','한식 주메뉴'],
 ['bZWlQXGywRc','고추장 파프리카무침',4,'무침','한식 반찬'],
 ['xexAbSUQzSw','미역냉국',4,'냉국','한식 국·찌개'],
 ['47OIcvpqxlo','김치전',3,'전','한식 반찬'],
 ['eZzBMCZYEfc','돼지고기 모둠찜',2,'찜','한식 주메뉴'],
 ['eeiqjyYgPew','닭볶음탕',4,'탕','한식 국·찌개'],
 ['Eino3yP-Wk0','두부조림',2,'조림','한식 반찬'],
 ['iWWQBoS3SL4','고추장 비빔국수',2,'국수','한식 주메뉴'],
 ['nFCahVPrnD0','강된장',3,'조림','한식 반찬'],
 ['zS_o6psOt9g','콘치즈',3,'구이','양식'],
 ['du9q1BldDHU','닭고기 덮밥',1,'덮밥','일식'],
 ['FN02e4DYvpA','열무된장볶음덮밥',2,'덮밥','한식 주메뉴'],
 ['1smKGJS_9p0','만두 달걀말이',3,'말이','한식 반찬'],
 ['T7YJviWhquo','달걀말이',3,'말이','한식 반찬'],
 ['jBdQ65yHB_U','감바스 알 아히요',2,'볶음','양식'],
 ['kj2ZupQ7fts','햄마요 김치덮밥',1,'덮밥','한식 주메뉴'],
 ['AlK2Gl6kHZI','크리미 오므라이스',1,'볶음밥','양식'],
 ['aXJgN_JjYDg','고구마맛탕',4,'튀김','한식 반찬'],
 ['6AmBDFIJRE8','백순대볶음',3,'볶음','한식 주메뉴'],
 ['XKohdaL45K8','깍두기볶음밥',1,'볶음밥','한식 주메뉴'],
 ['4WEhZLQ37Fk','새둥지전',3,'전','한식 반찬'],
 ['lH360TWUjSU','파개장',4,'국','한식 국·찌개'],
 ['j7s9VRsrm9o','대파 제육볶음',2,'볶음','한식 주메뉴'],
 ['iNh_bXmYfgw','소시지케첩볶음',3,'볶음','한식 반찬'],
 ['b0VqL4-dSPM','멕시칸샐러드',4,'샐러드','양식'],
 ['pTvMsM2v1tg','토마토 달걀볶음',2,'볶음','중식'],
 ['JV5pUbCiy1s','시금치 베이컨볶음',3,'볶음','한식 반찬'],
 ['8l9H8FlhiOo','홍합와인탕',2,'탕','양식'],
 ['wfm951HEpGU','부추전',3,'전','한식 반찬'],
 ['XU5Jv4e7DKw','태국식 시금치 고기덮밥',1,'덮밥','그 밖'],
 ['eIo2BaE6LxI','김치볶음밥',1,'볶음밥','한식 주메뉴'],
 ['xsTFsunt6-8','소고기미역국',4,'국','한식 국·찌개'],
 ['RVfSeUZ8XkY','김치찜',6,'찜','한식 주메뉴'],
 ['4TnaTTg1R_Q','바지락볶음',2,'볶음','한식 주메뉴'],
 ['IasQ3XURCTI','닭근위볶음',2,'볶음','한식 주메뉴'],
 ['xecKUiZBCtM','진미채볶음',6,'볶음','한식 반찬'],
 ['zRg4nxIv3j8','볶음우동',1,'국수','일식'],
 ['G2kylWhMw5s','김치수제비',4,'수제비','한식 주메뉴'],
 ['kfGi3rTct8c','찜닭',4,'찜','한식 주메뉴'],
 ['JmiW-dD1RqM','고사리나물',4,'나물','한식 반찬'],
 ['At-u3lwsFtk','떡만둣국',4,'국','한식 국·찌개'],
 ['2vrJR3ZpRf0','도라지나물',4,'나물','한식 반찬'],
 ['37-BCf85bHk','LA갈비',4,'구이','한식 주메뉴'],
 ['tD8ApzPsDx8','시금치나물',4,'나물','한식 반찬'],
 ['fEYJSPSGaLI','중화제육면',1,'국수','중식']
];
export function groupPolicy(id,group){
 if(id==='iWWQBoS3SL4'&&group==='양념장')return {scale:1,reason:'2026-11-23 사용자 확인으로 양념장 제조 전량 포함. 실제 사용량은 취향에 따라 달라질 수 있음'};
 const alternative=(id==='bZWlQXGywRc'&&group==='된장파프리카무침')||
  (id==='zS_o6psOt9g'&&group==='에어프라이어 버전')||
  (id==='8l9H8FlhiOo'&&group==='홍합탕')||
  (id==='4TnaTTg1R_Q'&&['막걸리 응용 버전','청하 응용 버전'].includes(group));
 return alternative?{omit:true,reason:'대체 조리법은 중복 합산하지 않음. 메뉴명에 해당하는 한 버전만 등록'}:{scale:1};
}
export const intermediateRows=new Map([
 ['kzYgtXDcGQ4',['삶은 닭 1마리']],
 ['iWWQBoS3SL4',['양념장 적당량']],
 ['kfGi3rTct8c',['찜닭소스 전량']]
]);
export function prepareText(entry){
 if(entry.videoId==='iWWQBoS3SL4')entry.ingredientClarification='2026-11-23 사용자 확인: 2인분에 양념장 제조 재료 전량을 포함. 실제 사용량은 취향에 따라 달라질 수 있음.';
 if(entry.videoId==='At-u3lwsFtk')entry.ingredientClarification='2026-11-23 사용자 확인: 국용 달걀 2개와 지단용 달걀 2개를 모두 포함(총 4개).';
 if(entry.videoId==='fEYJSPSGaLI'&&!entry.servingsStatements.includes('원본 영상 제목: 중화제육면 1인분 만들기'))entry.servingsStatements.push('원본 영상 제목: 중화제육면 1인분 만들기');
 // Parenthesized serving header is metadata, not an ingredient.
 return entry.ingredientText.replace(/^\(3인분\)\s*/,'');
}
export const canonicalOverrides={...earlier,
 '순한맛라면':'순한맛 라면','파채':'대파','돼지고기후지':'돼지 뒷다리살',
 '토막닭':'닭','토막닭고기':'닭','돼지고기후지슬라이스':'돼지 뒷다리살',
 '노랑파프리카':'노란 파프리카','빨강파프리카':'빨간 파프리카',
 '환만식초':'식초','파슬리가루':'파슬리 가루',
 '케찹':'케첩','후추':'후추가루','불린당면':'불린 당면','새송이':'새송이버섯',
 '튀김용식용유':'식용유','식용유(달걀용)':'식용유','소불고기용':'소고기 불고기용',
 '쌈채소':'쌈채소','양송이':'양송이버섯','꽃소금(절임용)':'소금',
 '식용유(스크램블용)':'식용유','식용유(파기름용)':'식용유','완숙토마토':'토마토',
 '자른미역':'건미역','소고기(양지)':'소고기 양지','돼지고기전지':'돼지 앞다리살',
 '사천고추':'사천고추','오징어채':'진미채','돼지고기(등심)':'돼지 등심',
 '불린고사리':'불린 고사리','갈은깨':'깨소금','소양지':'소고기 양지',
 '만두':'냉동만두','꽃소금(소금물용)':'소금','물(소금물용)':'물',
 '조선간장국간장':'국간장','캬라멜':'카라멜','간돼지고기(후지)':'다진 돼지고기',
 '손질한국멸치':'국멸치','통조림옥수수':'캔 옥수수','옥수수통조림':'캔 옥수수'
};
export const definitions=[
 ['smoked-anchovy-powder','훈연멸치가루','양념·조미료',true],
 ['seafood-meat-gyoza','해물육교자','두부·계란·기타',false],
 ['vinegared-gochujang','초고추장','양념·조미료',true],
 ['kkakdugi','깍두기','두부·계란·기타',false],
 ['kimchi-juice','김치국물','양념·조미료',true],
 ['ssam-vegetables','쌈채소','채소·버섯',false],
 ['vienna-sausages','비엔나소시지','두부·계란·기타',false],
 ['instant-rice','즉석밥','두부·계란·기타',false],
 ['sichuan-dried-chili','사천고추','양념·조미료',true],
 ['chicken-gizzard','닭근위','육류·해산물',false],
 ['anchovy-powder','멸치가루','양념·조미료',true],
 ['soaked-bracken','불린 고사리','채소·버섯',false],
 ['la-beef-short-ribs','LA갈비','육류·해산물',false]
];
export const lineOverrides={
 R0xWJ4c8wR4:{'토막 닭(9호) 1/3마리':{name:'닭',sourceAmount:1/3,unit:'마리'}},
 kzYgtXDcGQ4:{'닭(9호) 1마리':{name:'닭',sourceAmount:1,unit:'마리'}},
 kfGi3rTct8c:{'토막닭(12호) 1마리':{name:'닭',sourceAmount:1,unit:'마리'}},
 xexAbSUQzSw:{'불린 미역 1과1/2컵(135g) = 건 미역(13g)':{name:'건미역',sourceAmount:13,unit:'g',reason:'원문에 직접 명시된 불리기 전 건미역 13g 사용. 불린 중량을 임의 환산하지 않음'}},
 jBdQ65yHB_U:{
  '칵테일새우 大 사이즈(26/30) 10마리(100g)':{name:'칵테일새우',sourceAmount:100,unit:'g'},
  '바게트 or 식빵 적당량':{name:'바게트',sourceAmount:null,unit:null,reason:'원문 대체 선택지 중 바게트로 등록. 식빵과 동시 구매로 합산하지 않음'}
 },
 AlK2Gl6kHZI:{'후추':{name:'후추가루',sourceAmount:null,unit:null}}
};
