// One-time, reproducible navigation migration. Never change recipe ingredients,
// servings, primary ingredients or recommendation ordering.
import {readFile,writeFile} from 'node:fs/promises';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const [recipes,catalog]=await Promise.all(['data/recipes.json','data/recipe-categories.json'].map(read));
const byId=new Map(recipes.map(r=>[r.id,r]));
function classify(recipe,entry){
 const n=recipe.name.replace(/\s/g,''),role=entry.mealRole;
 const pick=(category,reason)=>({categories:[category],classificationNote:`2026-11-26 음식 형태 기준 초기 재분류: ${reason}. 주재료/추천순위는 변경하지 않음.`});
 const specific={
  '소스·음료':['만능양념장','만능간장양념장','경양식만능소스','미트토마토소스','알리오올리오소스','볶음짬뽕소스','청양고추양념장','청양고추다대기','부추장','소고기고추다짐장','소고기볶음고추장','유부쌈장','만능파기름','돼지사골육수','치킨스톡','마늘버터','다시마버터','양파잼','땅콩마요잼','베이컨젬','트러플페이스트','마요네즈','수제마요네즈','무설탕딸기잼','얼그레이시럽','수제막걸리','막걸리','뱅쇼','밀크티','꿀잠밀크티','딸기우유','초코우유','모카프라푸치노','깻잎모히토','배차와주악','포도청보리수단','미역소스와타르타르'],
  '밥·죽':['밥스틱','비타민이유식','최강록규동','더티라이스','가이바시카츠동','로스트비프동','초간단부타동','하이난치킨라이스','로코모코','잠발라야','유부포케','연어포케'],
  '국·찌개':['미네스트로네','능이백숙','닭백숙','누룽지백숙','얼큰닭한마리','김치나베','돈까스를이용한김치나베','차돌비지짜글이','명란비지짜글이','묵은지짜글이','된장짜글이','고추장감자짜글이','스지오뎅나베','국물닭발','국물제육볶음'],
  '간식':['구운바나나','고구마빠스','원소병','섭산삼','고구마란','코마레티','두부있슈','고구마크로켓','치즈감자크로켓','고구마치즈크로켓','단호박약식','배숙구이','에그머핀','파베초콜릿','까눌레','저탄수그래놀라','브라우니','제누와즈','나나이모바','허니버터브레드','허니브래드','미타라시당고','개성주악','딸기카이막','카이막','오레오아이스박스','타코야끼','세가지곡물콩라미수'],
  '반찬':['코울슬로','당근라페타파스','토마토마리네이드','그릭요거트','리코타치즈','블루베리크림치즈','굴오일절임','간장새우장','순두부계란장','올리브토마토절임']
 };
 for(const [category,names] of Object.entries(specific))if(names.includes(n))return pick(category,'메뉴명별 형태 보완');
 // Accompanying sauce names must not turn a complete dish into a sauce.
 if(/^(만능.*(?:양념|간장|소스)|만능양파볶음|김치버터|썬드라이토마토|수박청)$/.test(n)||/^(?:멸치|채소|닭|사골|고기|해물|다시마)?육수$/.test(n)||/^(?:토마토|크림|로제|데미글라스|미트|고추장|된장|간장|마늘|양파|스테이크|칠리|땅콩|샐러드|타르타르|페퍼콘)?소스$/.test(n)||/^(?:바질|깻잎|시금치|참나물)페스토$/.test(n))return pick('소스·음료','독립 양념장·소스·육수 제조 메뉴');
 if(/푸딩|젤리|양갱|빙수|아이스크림|소르베|셔벗|샤벳|무스|티라미수|판나코타|파나코타|몽블랑|파르페/.test(n))return pick('간식','디저트 형태');
 if(/(?:주스|쥬스|쉐이크|셰이크|스무디|라떼|에이드|모히또|펀치|샹그리아|음료|화채|식혜|수정과|두유|미숫가루|생강차|대추차|유자차|배숙|오미자차)$/.test(n))return pick('소스·음료','음료 형태');
 if(/파스타|스파게티|짜파게티|짜파구리|라면|라멘|라볶이|국수|우동|쫄면|냉면|소면|당면|소바|짜장면|자장면|짬뽕|볶음면|비빔면|쌀면|콩국면|삼계면|누들|팟타이|팟타야|수제비|칼제비|뇨[키끼]|라자[냐니]|푸실리|페투치네|탈리아텔레|카펠리니|펜네|칼국수|잔치면|중화제육면|탄탄면|완탕면|분짜/.test(n))return pick('면요리','면이 중심인 메뉴(국물 여부와 무관)');
 if(/볶음밥|덮밥|비빔밥|김밥|초밥|쌈밥|국밥|주먹밥|솥밥|콩나물밥|영양밥|오므라이스|리[조소][또토]|빠에야|필라프|니고랭|(?:밥|죽|미음)(?:\(.*\))?$/.test(n))return pick('밥·죽','밥·죽 중심 메뉴');
 if(/찌개|전골|국$|탕$|냉국|스프|수프|포타주|차우더|스튜|가스파초|육개장|효종갱|옹심이|떡국|만둣국|만두국/.test(n)||role==='국·찌개')return pick('국·찌개','국물 요리');
 if(/과자|쿠키|비스킷|스콘|케이크|케익|카스[테텔]라|와플|팬케|파이$|타르트|도넛|호떡|경단|화전|다식|정과|약과|증편|설기|송편|인절미|강정$|빼빼로|누룽지과자|칩$|샌드위치|샌드$|토스트|카나페|까나페|버거|핫도그|피자|빵$|크레이프|크레페/.test(n))return pick('간식','간식·빵·디저트 형태');
 if(/장아찌|김치$|깍두기|피클|무침|나물|겉절이|장조림|멸치볶음|진미채|감자채볶음|달걀말이|계란말이|감동란|샐러드|사라다/.test(n)||role==='반찬')return pick('반찬','반찬 형태 또는 기존 반찬 검토기록');
 return pick('메인요리','별도 밥·면·국·반찬·간식·소스에 해당하지 않는 식사의 중심 요리(초기 편집 분류)');
}
const entries=catalog.entries.map(entry=>{
 const recipe=byId.get(entry.recipeId);if(!recipe)throw Error(entry.recipeId);
 const legacy=entry.legacyCategories??entry.categories;
 return {...entry,legacyCategories:legacy,...classify(recipe,entry)};
});
const output={...catalog,schemaVersion:2,note:'2026-11-26 사용자 승인 음식 형태별 대표분류 하나. 기존 국가별 분류는 legacyCategories로 보존. 메뉴명·기존 반찬 기록 기반 초기 편집 분류이며 주재료/수량/추천정렬 변경 없음.',entries};
await writeFile(new URL('../data/recipe-categories.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(entries.reduce((a,e)=>(a[e.categories[0]]=(a[e.categories[0]]||0)+1,a),{}),null,2));
