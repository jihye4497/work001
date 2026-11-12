import { isIngredientAlias } from './ingredient-aliases.js';
import { isPlainSaltVariant } from './ingredient-matching.js';
export const BROWSE_CATEGORIES=['농산물','육·수산','기타','양념'];
export const BROWSE_SUBCATEGORIES={
  '농산물':['채소','과일','버섯','곡물·콩'],
  '육·수산':['고기','생선','해산물','알류','해조류'],
  '기타':['유제품','면·떡','가루류','가공식품'],
  '양념':['장류','소스','기름','조미','향신']
};
// Browsing metadata only. Preserve imported categories, aliases, quantities and IDs.
const EGGS=/계란|달걀|메추리알|날치알|명란|연어알|청어알|생선알|동태알|대구알|수란/;
const SEAWEED=/김$|미역|다시마|파래|매생이|톳|청각|감태|곰피|모자반|해초/;
const DAIRY=/우유|치즈|생크림|요거트|요구르트|연유|사워크림|휘핑크림/;
const FRUIT=/사과|배$|귤|포도|딸기|바나나|복숭아|자두|참외|수박|멜론|메론|망고|키위|파인애플|블루베리|라즈베리|체리|오렌지|레몬|라임|석류|무화과|한라봉|유자|홍시|곶감|단감|아보카도/;
const GRAINS=/쌀|현미|잡곡|찹쌀|멥쌀|보리|귀리|흑미|수수|기장|율무|퀴노아|검은콩|팥|녹두|병아리콩|강낭콩|완두콩|대두|렌틸콩|백태|서리태|견과|아몬드|땅콩|호두|잣|밤$/;
const MEAT=/소고기|쇠고기|돼지|삼겹|닭|오리|양고기|한돈|돈육|돈민찌|우민찌|소등심|우목심|갈비|차돌|부챗살|족발|쇠간|곱창|사태/;
const SEAFOOD=/새우|대하|새뱅이|꽃게|게살|오징어|낙지|주꾸미|쭈꾸미|문어|조개|관자|바지락|홍합|굴$|전복|꼬막|소라|가리비|멍게|해삼|이리|홍게|대게|랍스터|갑오징어|쭈꾸미/;
const PRIORITY={
 '농산물':['양파','대파','감자','당근','마늘','애호박','청양고추','팽이버섯','양배추','오이','무','콩나물','시금치','표고버섯','쌀','사과','배','바나나'],
 '육·수산':['계란','돼지 앞다리살','소고기','닭 가슴살','새우','오징어','삼겹살','고등어','연어','꽃게','국멸치','바지락','김','미역','다시마','메추리알'],
 '기타':['두부','우유','김치','어묵','소면','순두부','연두부','치즈','플레인 요거트','당면','스파게티','떡','밀가루','부침가루','전분','유부'],
 '양념':['소금','설탕','간장','식용유','고춧가루','고추장','된장','참기름','다진 마늘','국간장','식초','맛술','후추가루','굴소스','액젓','올리브유','마요네즈']
};
export function ingredientBrowseGroup(ingredient) {
 const n=ingredient.name.replace(/\s/g,'');
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
 return ingredients.filter(i=>!isIngredientAlias(i)&&!isPlainSaltVariant(i)&&i.name!=='소금물').filter(i=>{const g=ingredientBrowseGroup(i);return g.category===category&&(subcategory==='전체'||g.subcategory===subcategory);})
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
