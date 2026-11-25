import { isIngredientAlias, isCookingWater } from './ingredient-aliases.js';
import {isOfferedIngredient} from './catalog-exclusions.js';
import { preparedIngredientKind } from './prepared-ingredients.js';
import { isPlainSaltVariant } from './ingredient-matching.js';
import { isPreparationVariant } from './ingredient-preparations.js';
import {ingredientBrowseSubgroup} from './ingredient-browse-subgroups.js';
export const BROWSE_CATEGORIES=['농산물','육·수산','기타','양념'];
export const BROWSE_SUBCATEGORIES={
  '농산물':['채소','과일','버섯','곡물·콩'],
  '육·수산':['고기','생선','해산물','알류','해조류'],
  '기타':['유제품','면·떡','가루류','두부·묵','반찬·통조림','간편식·간식'],
  '양념':['장류','소스','기름','조미','고추·후추','허브·시즈닝','기타 향신']
};
// Browsing metadata only. Preserve imported categories, aliases, quantities and IDs.
const EGGS=/계란|달걀|메추리알|날치알|명란|연어알|청어알|생선알|동태알|대구알|수란/;
const SEAWEED=/김$|미역|다시마|파래|매생이|톳|청각|감태|곰피|모자반|해초/;
const DAIRY=/우유|치즈|생크림|요거트|요구르트|연유|사워크림|휘핑크림/;
const FRUIT=/사과|배$|귤|포도|딸기|바나나|복숭아|자두|참외|수박|멜론|메론|망고|키위|파인애플|블루베리|라즈베리|체리|오렌지|레몬|라임|석류|무화과|한라봉|유자|홍시|곶감|단감|아보카도/;
const GRAINS=/쌀|현미|잡곡|찹쌀|멥쌀|보리|귀리|흑미|수수|기장|율무|퀴노아|검은콩|팥|녹두|병아리콩|강낭콩|완두콩|대두|렌틸콩|백태|서리태|견과|아몬드|땅콩|호두|잣|밤$/;
const MEAT=/소고기|소불고기|쇠고기|돼지|삼겹|닭|오리|양고기|한돈|돈육|돈민찌|우민찌|소등심|우목심|갈비|차돌|부챗살|부채살|족발|쇠간|곱창|사태|대패목살|등심얇게썬것|소힘줄|항정살|염통|오돌뼈|오소리감투|소깐양/;
const SEAFOOD=/새우|대하|새뱅이|꽃게|게살|오징어|낙지|주꾸미|쭈꾸미|문어|골뱅이|조개|관자|바지락|홍합|굴$|전복|꼬막|소라|가리비|멍게|해삼|이리|홍게|대게|랍스터|갑오징어|쭈꾸미/;
const PRIORITY={
 '농산물':['양파','대파','감자','당근','마늘','애호박','청양고추','팽이버섯','양배추','오이','무','콩나물','시금치','표고버섯','쌀','사과','배','바나나'],
 '육·수산':['계란','돼지 앞다리살','소고기','닭 가슴살','새우','오징어','삼겹살','고등어','연어','꽃게','국멸치','바지락','김','미역','다시마','메추리알'],
 '기타':['두부','우유','김치','어묵','소면','순두부','연두부','치즈','플레인 요거트','당면','스파게티','떡','밀가루','부침가루','전분','유부'],
 '양념':['소금','설탕','간장','식용유','고춧가루','고추장','된장','참기름','다진 마늘','국간장','식초','맛술','후추가루','굴소스','액젓','올리브유','마요네즈']
};
// Explicitly reviewed browsing corrections; do not change recipe flags or quantities.
const REVIEWED_BROWSE_GROUPS=[
 ['양념','조미','냉면육수|닭육수|사골육수|생선육수|쇠고기육수|시중갈비탕육수팩|시판소고기맛냉면육수|야채국물|야채육수|육수|채소육수|채소국물|해물육수|삼계탕육수|사골곰탕|한우사골곰탕|귤즙|라임즙|레몬즙|배즙|사과즙|오렌지즙|양파즙|마늘즙|생강즙|김치국물|깍두기국물|물김치국물|동치미국물|절임물|파인애플통조림국물|초코시럽|카라멜|홍초|갈치속젓|메밀소바장국'],
 ['양념','소스','겨자|고추냉이|발효겨자|씨겨자|연겨자|홀스레디쉬|라오간마유라조우|다데기'],
 ['기타','가루류','녹차파우더|녹차가루|무가당코코아파우더|코코아파우더|치즈가루|크림스프분말'],
 ['양념','조미','고형카레|골든카레|카레|카레가루|짜장가루|하이라이스가루|떡볶이양념파우더|후리카케'],
 ['양념','향신','오향분말'],
 ['농산물','곡물·콩','백미|안남미|메주콩|노란콩|검정콩|마카다미아|캐슈넛|피스타치오|헤이즐넛|해바라기씨|호박씨|씨앗믹스|은행|깨|오곡'],
 ['농산물','과일','대추|말린아로니아|말린크랜베리'],
 ['육·수산','고기','오겹살|육사시미|한우사골|한우잡뼈|탕수육고기'],
 ['육·수산','생선','순살갈치'],
 ['육·수산','해산물','해물탕용모둠해물'],
 ['기타','유제품','딸기우유|무염치즈|식물성생크림|크림|화이트크림|요플레'],
 ['기타','가루류','강력분|박력분|빵가루|습식빵가루|덧밀가루|멥쌀가루|아몬드가루|옥수수가루|치킨튀김가루|핫케이크가루|핫케이크믹스|현미가루|베이킹소다|베이킹파우더|이스트|인스턴트이스트|효모|한천가루|한천|젤라틴|판젤라틴|잔탄검|레시틴가루|오트파이버'],
 ['기타','면·떡','건두부면|곤약면|두부면|메밀면|면|분모자|수제비|양장피면|에그누들|중화면|카펠리니|카펠리니면|쿠스쿠스|탈리아텔레|페투치네면|실곤약'],
 ['양념','기름','대두유|카놀라유|포도씨유|현미유|화유|라드|마가린'],
 ['양념','장류','노두유|노추|두반장|춘장|볶음춘장|빠금장'],
 ['양념','소스','스리라차|스위트칠리|타바스코|초장|쯔유|3배농축쯔유|참치액|젓갈|황석어젓|케요네즈|홀그레인|홀그레인머스터즈|르네디종홀그레인머스터|바질페스토|양념장|겉절이양념|데미글라스|발사믹크레마|발사믹크림|발사믹글레이즈드|랜치드레싱|올리브유마요네즈|저당케첩|토마토페이스트|토마토페스트'],
 ['양념','조미','다시다|소고기다시다|멸치다시다|조개다시다|천연다시다|천연조미료|치킨스톡|고형치킨스톡|비프스톡|혼다시|코인육수|멸치육수코인|대령숙주육수의비밀코인육수|육수팩|다시팩|MSG|미원|건더기스프|짜파게티분말스프|짜파게티건더기스프|감미료|뉴슈가|라칸토감미료|메이플시럽|아가베시럽|알룰로스|에리스리톨|타가토스|조청|슈가파우더|미림|미향|조미술|소주|맥주|막걸리|복분자주|포도주|브랜디|매실청|오미자청|유자청|생강청|라임청|파인애플청|대추고|흑마늘진액'],
 ['기타','가공식품','딸기잼|땅콩잼|당근주스|라임주스|석류주스|오렌지주스|자몽주수|파인애플주스|포도주스|쌍화탕|인스턴트커피|커피|홍차|루이보스티|민트티백|녹차|토마토홀|코코넛슬라이스']
];
const REVIEWED_BROWSE=new Map(REVIEWED_BROWSE_GROUPS.flatMap(([category,subcategory,names])=>names.split('|').map(name=>[name,{category,subcategory}])));
export function ingredientBrowseGroup(ingredient) {
 const n=ingredient.name.replace(/\s/g,'');
 if(REVIEWED_BROWSE.has(n))return {...REVIEWED_BROWSE.get(n)};
 if(n==='들깨')return {category:'농산물',subcategory:'곡물·콩'};
 if(n==='생면')return {category:'기타',subcategory:'면·떡'};
 if(['냉동우삼겹','삶은막창'].includes(n))return {category:'육·수산',subcategory:'고기'};
 if(['새우살','익힌전복내장'].includes(n))return {category:'육·수산',subcategory:'해산물'};
 if(n==='생멸치')return {category:'육·수산',subcategory:'생선'};
 if(['삼계탕티백','삼계탕재료팩'].includes(n))return {category:'양념',subcategory:'조미'};
 if(['조','참깨','통깨','흰깨','볶은통깨','부순참깨'].includes(n))return {category:'농산물',subcategory:'곡물·콩'};
 if(['중력분','밀가루중력분'].includes(n))return {category:'기타',subcategory:'가루류'};
 if(['크레미','크래비','크래미','햄다진것','노브랜드별미포기김치'].includes(n))return {category:'기타',subcategory:'가공식품'};
 if(['검은깨','검정깨','흑임자','검정깨(볶은것)','볶은흑임자'].includes(n))return {category:'농산물',subcategory:'곡물·콩'};
 if(['라면스프','라면분말스프','라면후레이크스프','라면건더기스프'].includes(n))return {category:'양념',subcategory:'조미'};
 if(['자몽','냉동열대과일믹스'].includes(n))return {category:'농산물',subcategory:'과일'};
 if(['콩','하루불린콩'].includes(n))return {category:'농산물',subcategory:'곡물·콩'};
 if(['미더덕','조갯살','조개살'].includes(n))return {category:'육·수산',subcategory:'해산물'};
 if(['우렁','우렁이','해물','오만둥이','패주'].includes(n))return {category:'육·수산',subcategory:'해산물'};
 if(['대구이리','동태이리','이리'].includes(n))return {category:'육·수산',subcategory:'생선'};
 if(n==='알')return {category:'육·수산',subcategory:'알류'};
 if(['크래미','게살(크래미)','새우튀김','홍새우튀김'].includes(n))return {category:'기타',subcategory:'가공식품'};
 if(['칠게','논우렁','다슬기살'].includes(n))return {category:'육·수산',subcategory:'해산물'};
 if(['간','허파','갈매기살','구운대창','소늑간살','소꼬리','소대창'].includes(n))return {category:'육·수산',subcategory:'고기'};
 if(['가다랑어포','저염살라미'].includes(n))return {category:'기타',subcategory:'가공식품'};
 if(['스팸(마일드)','육포','페퍼로니','편육','통단팥'].includes(n))return {category:'기타',subcategory:'가공식품'};
 if(n==='곁들임채소')return {category:'농산물',subcategory:'채소'};
 if(n==='체리토마토')return {category:'농산물',subcategory:'채소'};
 if(n==='보리새우')return {category:'육·수산',subcategory:'해산물'};
 if(n==='땅콩버터')return {category:'기타',subcategory:'가공식품'};
 if(n==='해초국수')return {category:'기타',subcategory:'면·떡'};
 if(EGGS.test(n)&&!(/마요네즈|소스|가루/.test(n)))return {category:'육·수산',subcategory:'알류'};
 if(/이리/.test(n)&&!(/치즈|요리/.test(n)))return {category:'육·수산',subcategory:'해산물'};
 if(SEAWEED.test(n)&&!(/김치|가루|소스|장국|기름|튀김/.test(n)))return {category:'육·수산',subcategory:'해조류'};
 if(ingredient.isSeasoning) {
  const sub=/식용유|참기름|들기름|올리브유|오일|기름|버터|아보카도유/.test(n)?'기름':/간장|된장|고추장|쌈장|청국장/.test(n)?'장류':/소스|액젓|새우젓|마요네즈|머스터드|케첩|드레싱|장국/.test(n)?'소스':/소금|천일염|설탕|물엿|올리고당|요리당|꿀|스테비아|식초|맛술|청주|정종|와인|요리술/.test(n)?'조미':'향신';
  return {category:'양념',subcategory:sub};
 }
 if(DAIRY.test(n))return {category:'기타',subcategory:'유제품'};
 if(/햄|베이컨|맛살|어묵|소시지|통조림|김치|두부|유부|두유|콩비지|피클|만두|빵|또띠아|토르티야|잼|주스|과즙/.test(n))return {category:'기타',subcategory:'가공식품'};
 if(/가루|전분|녹말/.test(n))return {category:'기타',subcategory:'가루류'};
 if(/소면|중면|당면|라면|우동|파스타|스파게티|국수|쫄면|냉면|마카로니|푸실리|펜네|떡|라이스페이퍼/.test(n))return {category:'기타',subcategory:'면·떡'};
 if(/버섯/.test(n))return {category:'농산물',subcategory:'버섯'};
 if(FRUIT.test(n))return {category:'농산물',subcategory:'과일'};
 if(GRAINS.test(n)&&!(/밥|누룽지|씨리얼/.test(n)))return {category:'농산물',subcategory:'곡물·콩'};
 if(ingredient.category==='육류·해산물')return {category:'육·수산',subcategory:MEAT.test(n)?'고기':SEAFOOD.test(n)?'해산물':'생선'};
 if(ingredient.category==='채소·버섯')return {category:'농산물',subcategory:'채소'};
 return {category:'기타',subcategory:'가공식품'};
}
export function browseCategory(ingredient) {return ingredientBrowseGroup(ingredient).category;}
export function browseIngredients(ingredients,category,subcategory='전체') {
 const order=new Map((PRIORITY[category]||[]).map((name,index)=>[name,index]));
 return ingredients.filter(i=>isOfferedIngredient(i)&&!isCookingWater(i)&&!preparedIngredientKind(i)&&!isIngredientAlias(i)&&!isPreparationVariant(i)&&!isPlainSaltVariant(i)&&i.name!=='소금물').filter(i=>{const g=ingredientBrowseGroup(i);return g.category===category&&(subcategory==='전체'||g.subcategory===subcategory||ingredientBrowseSubgroup(i.name,g.subcategory)===subcategory);})
 .sort((a,b)=>(order.get(a.name)??999)-(order.get(b.name)??999)||a.name.localeCompare(b.name,'ko')||a.id.localeCompare(b.id));
}
export function koreaMonth(date=new Date()) {
  return Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',month:'numeric'}).format(date));
}
const FARM_SOURCE='https://foodnuri.go.kr/portal/bbs/B0000299/view.do?menuNo=300106&nttId=235074';
const FISH_SOURCE='https://info.childcare.go.kr/info_html5/pnis/search/PnisFileDownload.jsp?STCODE=46820000006&flag=DNLL&wkyymm=202511';
// Only months checked against published official material are enabled; no price claim.
export const SEASONAL_RECORDS=[
  {months:[11],names:['배추','무','포도'],source:FARM_SOURCE,sourceName:'농식품정보누리 · 11월 제철 농산물'},
  {months:[11],names:['굴','대구','홍합'],source:FISH_SOURCE,sourceName:'어린이집정보공개포털 · 11월 제철 식재료 안내'},
  {months:[9],names:['고구마','배','표고버섯'],source:'https://m.foodnuri.go.kr/portal/bbs/B0000284/view.do?menuNo=300054&nttId=235010',sourceName:'농식품정보누리 · 9월 제철 농식품'}
];
export function seasonalIngredients(ingredients,month=koreaMonth()) {
  const records=SEASONAL_RECORDS.filter(r=>r.months.includes(month));
  const names=new Set(records.flatMap(r=>r.names));
  return {month,items:ingredients.filter(i=>names.has(i.name)),sources:records.map(r=>({url:r.source,name:r.sourceName}))};
}
