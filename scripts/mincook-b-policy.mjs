// Reviewed ingredient facts from the older half of the author's public blog.
// The source text is retained literally; normalization affects ingredient identity only.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalIngredientName} from '../js/ingredient-aliases.js';

const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const index=await read('data/source/mincook-blog-index.json');
const review=await read('data/source/mincook-review.json');
const ingredients=await read('data/ingredients.json');
const compact=s=>String(s).normalize('NFKC').replace(/\s/g,'');
const originals=new Map(ingredients.map(row=>[compact(row.name),row]));
const aliases=new Map(ingredients.flatMap(row=>row.aliases.map(alias=>[compact(alias),row.name])));
const mine=new Set(index.entries.slice(391,782).map(row=>row.sourceId??'blog-'+row.url.split('/').at(-1)));
const sourceRows=new Map([...review.entries,...(review.held??[])].map(row=>[row.sourceId,row]));

export const batch50=[];
export const canonicalOverrides={};
export const definitions=[];
export const lineOverrides={};
export const intermediateRows=new Map();
export const groupPolicy=()=>({scale:1});
export const servingsOverrides={};
export const skips=[];
const meta=new Map();
const definitionRows=new Map();
intermediateRows.set('blog-18',['양지 삶은 물 : 1L']);
intermediateRows.set('blog-6',['콩나물 채수 : 6국자']);
intermediateRows.set('blog-45',['곱창 기름 : 1국자']);
intermediateRows.set('blog-374',['닭육수 : 5숟가락']);
intermediateRows.set('blog-330',['육수 : 100ml']);
intermediateRows.set('blog-312',['홍합 육수 : 1L']);
intermediateRows.set('blog-210',['닭 육수 : 5숟가락']);

const spelling={
 '댤걀':'계란','달걀':'계란','계란흰자':'달걀흰자','노른자':'계란노른자','흰자':'달걀흰자',
 '간마늘':'다진 마늘','마늘다진것':'다진 마늘','마늘다진거':'다진 마늘','통마늘':'마늘',
 '다진마늘':'다진 마늘','다진대파':'대파','다진파':'대파','양파다진것':'양파','다진양파':'양파',
 '파':'대파','홍고추':'홍고추','청양고추':'청양고추','청고추':'풋고추','청양고추다진것':'청양고추',
 '굵은고추가루':'굵은 고춧가루','고운고추가루':'고운 고춧가루','고추가루':'고춧가루',
 '후춧가루':'후추가루','후추':'후추가루','후추가루':'후추가루','통깨':'참깨',
 '소세지':'소시지','비엔나소세지':'비엔나소시지','파마산치즈':'파르메산 치즈',
 '모짜렐라치즈':'모차렐라 치즈','모짜렐라':'모차렐라 치즈','모차렐라':'모차렐라 치즈',
 '파마산가루':'파르메산 치즈가루','파마산치즈가루':'파르메산 치즈가루',
 '슈레드모짜렐라치즈':'슈레드 모차렐라치즈','체다치즈':'체더치즈','체다슬라이스치즈':'슬라이스 체더치즈',
 '스팸':'통조림 햄','참치캔':'통조림 참치','캔참치':'통조림 참치','고추참치캔':'고추참치',
 '굴소스':'굴소스','올리브오일':'올리브유','카놀라유':'카놀라유','식용유':'식용유',
 '당면사리':'당면','칼국수':'칼국수면','스파게티면':'스파게티','생우동면':'우동면',
 '돼지고기앞다리살':'돼지 앞다리살','돼지고기(앞다리살)':'돼지 앞다리살','돼지고기(전지)':'돼지 앞다리살',
 '돼지앞다리살':'돼지 앞다리살','돼지고기(삼겹살)':'삼겹살','돼지고기삼겹살':'삼겹살',
 '돼지고기(목살)':'돼지고기목살','닭다리살':'닭다릿살','닭가슴살':'닭 가슴살',
 '다진돼지고기':'다진 돼지고기','간돼지고기':'다진 돼지고기','돼지고기다짐육':'다진 돼지고기',
 '다진소고기':'다진 소고기','간소고기':'다진 소고기','소고기다짐육':'소고기 다짐육',
 '소고기(양지)':'소고기 양지','쇠고기':'소고기','쇠고기양지':'소고기 양지',
 '소고기다시다':'소고기다시다','쇠고기다시다':'소고기다시다','다시마육수':'다시마 육수',
 '진간장':'진간장','양조식초':'식초','설탕':'설탕','꽃소금':'소금','물':'물',
 '생수':'생수','정수물':'물','뜨거운물':'물','찬물':'물','끓는물':'물','따뜻한물':'물',
 '배추김치':'김치','신김치':'김치','묵은김치':'김치','묵은지':'김치',
 '새송이':'새송이버섯','양송이':'양송이버섯','팽이':'팽이버섯','애호박':'애호박',
 '청경채':'청경채','감자전분':'감자전분','전분':'전분가루','전분가루':'전분가루',
 '쌈무':'쌈무','김밥용김':'김','김밥김':'김','김밥용단무지':'단무지',
 '들깻가루':'들깨가루','들깨가루':'들깨가루','아몬드파우더':'아몬드가루',
 '베트남고추':'베트남고추','페퍼론치노':'페페론치노','맛소금':'맛소금',
 '녹인버터':'버터','따뜻한생크림':'생크림','마늘파우더':'마늘가루','시나몬가루':'계피가루',
 '미지근한물':'물','순후추':'후추가루','라면사리':'라면','사각어묵':'어묵','목살':'돼지고기목살',
 '앞다리살':'돼지 앞다리살','뒷다리살':'돼지 뒷다리살','양지':'소고기 양지','등뼈':'돼지등뼈',
 '아롱사태':'소고기(정강이살)','불고기용소고기':'소고기 불고기용','샤브샤브용소고기':'샤부샤부용 소고기',
 '닭볶음탕용닭':'토막 낸 닭','닭다리정육':'닭다릿살','통삼겹살':'삼겹살','생삼겹살':'삼겹살',
 '분홍소세지':'분홍 소시지','홀그레인머스타드':'홀그레인 머스터드','머스타드소스':'머스터드소스',
 '토마토스파게티소스':'토마토소스','토마토파스타소스':'토마토소스','마른대추':'건대추',
 '파다노치즈':'그라나파다노 치즈','돈까스소스':'돈가스소스','명란':'명란젓','데리야끼':'데리야끼소스',
 '후리가케':'후리카케','후리카게':'후리카케','우동사리':'우동면','피쉬소스':'피시소스',
 '매추리알':'메추리알','씨리얼':'시리얼','식용우':'식용유','오징어젓갈':'오징어젓',
 '꽁치캔':'꽁치통조림','꽁치통조리':'꽁치통조림','튀김유':'식용유','큰양파':'양파',
 '다진단무지':'단무지','생강슬라이스':'생강','고운청양고추가루':'고운 고춧가루',
 '물종이컵':'물','공깃밥':'밥','공기밥':'밥','햇반':'밥','파르미지아노레지아노':'파르미지아노 치즈',
 '참치통조림':'통조림 참치','냉면육수':'냉면육수','미트토마토스파게티소스':'미트 토마토소스',
 '토마토스파게티소스':'토마토소스','물종이컵':'물','생칼국수면':'칼국수면',
 '시판순두부':'순두부','시판고추기름':'고추기름','시판용된장':'된장','시판된장':'된장',
 '시판허브솔트':'허브솔트','소고기국거리':'국거리용 소고기','소불고기용소고기':'소고기 불고기용',
 '불고기용앞다리살':'돼지 앞다리살','돼지고기불고기용앞다리살':'돼지 앞다리살',
 '곤이(이리)':'곤이','해물믹스':'해물','매운고춧가루':'고춧가루','납작당면':'넓적 당면'
 ,'삼계탕팩':'삼계탕 재료팩','삼계탕약재':'삼계탕 재료팩','깻순':'깻잎순','우엉채':'우엉',
 '데리야끼소스':'데리야키소스','카스테라':'카스텔라','갈아만든배음료':'갈아만든 배',
 '바게트빵':'바게트','다진표고버섯':'표고버섯','떡볶이용떡':'떡볶이떡',
 '시판초고추장':'초고추장','슬라이스체다치즈':'슬라이스 체더치즈','순살닭다리살':'닭다릿살',
 '시판사골육수':'사골육수','시판용사골육수':'사골육수','시판사골곰탕육수':'사골육수',
 '시판마라소스':'마라소스','굴소슷':'굴소스','포도부':'포두부','초콜렛':'초콜릿',
 '코코아가루':'코코아 파우더','코코아분말':'코코아 파우더','키위드레싱':'키위드레싱',
 '얇은파스타면(카펠리니면)':'카펠리니면','식용유를':'식용유','또띠야':'또띠아',
 '팬에버터':'버터','런천미트':'통조림 햄','(고운)고춧가루':'고운 고춧가루',
 '다진김치':'김치','손질낙지':'낙지','생물오징어':'오징어','생물고등어':'고등어',
 '냉장소갈비':'소갈비','돼지등갈비':'등갈비','다진새우살':'새우살','다진베트남고추':'베트남고추',
 '시판사골육수팩':'사골육수','계란후라이':'계란프라이','바베큐소스':'바비큐소스','통항정살':'항정살'
 ,'김밥용우엉':'우엉조림','장조림통조림':'통조림 장조림','말린대추':'건대추',
 '통조림파인애플':'파인애플통조림','돼지비계':'돼지 지방'
};

function fail(reason){throw new Error(reason);}
function resolveName(raw){
 let name=raw.trim().replace(/^[•·▷▶-]+\s*/,'').replace(/\s*\([^)]*(?:선택|옵션|생략|취향|고명|데코)[^)]*\)\s*$/,'').trim();
 if(/[()]/.test(name)){
  const base=name.split('(')[0].trim();
  if(base&&originals.has(compact(spelling[compact(base)]??base)))name=spelling[compact(base)]??base;
 }
 for(let n=0;n<5;n++){
  const next=spelling[compact(name)];if(!next||next===name)break;name=next;
 }
 const exact=originals.get(compact(name));if(exact)return exact.name;
 const alias=aliases.get(compact(name));if(alias)return alias;
 const reviewed=canonicalIngredientName({name});if(reviewed&&originals.has(compact(reviewed)))return originals.get(compact(reviewed)).name;
 // Parenthetical size or preparation notes do not create a second purchasable product.
 const noPrep=name.replace(/\s*\((?:다진[^)]*|잘게[^)]*|채[^)]*|굵게[^)]*|얇게[^)]*|작은[^)]*|큰[^)]*|껍질[^)]*)\)/g,'').trim();
 if(noPrep!==name)return resolveName(noPrep);
 if(/[\[\]{}()]|https?:|넣[는어고]|해주세요|준비|만드는|필요|대체|가능|썰어|볶[는아고]|끓[는여이]|튀[긴겨기]|식용유를|기준|사진에는|마지막으로/.test(name)||!name||name.length>28)fail('재료명과 설명 구획 추가 확인: '+raw);
 if(/(?:조리도구|칼|필러|팬|냄비|꼬치|용기|가위|면포|비닐|종이호일|믹서기|집게|온도계|마대|키친타[올월])/.test(name)&&!/칼국수|양파가루|파프리카|마늘|칼집/.test(name))fail('조리도구·소모품 표기 제외 확인: '+raw);
 if(/(?:만능|완성된|남은|직접만든|만든양념|만든소스|위의|앞의|초벌한|양념장만|육수만)/.test(compact(name))||/^(?:소스|양념장|양념|튀김옷|고명)$/.test(name))fail('준비 조리물 원재료와 사용 비율 확인: '+raw);
 if(!/^[가-힣A-Za-z0-9%()· /+-]+$/.test(name))fail('재료명 표기 추가 확인: '+raw);
 if(!definitionRows.has(compact(name))){
  const isSeasoning=/(?:간장|소스|가루|분말|후추|소금|설탕|액젓|식초|시럽|올리고당|조청|물엿|고추장|된장|쌈장|다시다|스톡|육수|조미료|기름|오일|식용유|참기름|들기름|유$|미원|카레|커민|파슬리|바질|오레가노|혼다시|후리카케|노추|화유|라드|산초|허브솔트|케요네즈|양념|드레싱|초장|피시소스|라오간마)/.test(name)&&!/(?:쌀가루|밀가루|메밀가루|전분|콩가루|미숫가루|아몬드가루|빵가루|옥수수가루)/.test(name);
  const category=isSeasoning?'양념·조미료':/(?:돼지|소고기|쇠고기|닭|오리|양고기|갈비|고등어|갈치|참치|새우|오징어|문어|낙지|멸치|북어|황태|홍합|조개|바지락|연어|굴|가리비|관자|명란|생선|동태|대구|미더덕|게살|꽃게|크래미|맛살|날치알|건미역|미역|다시마|톳|선지|대창|곱창|스지|목전지|항정|등심|안심|햄|페퍼로니|허파|오소리감투|염통|육회|우니|멍게|오만둥이|곤이|오돌뼈|갈매기살|늑간살|구이용 고기|스테이크용 고기|국거리용 고기|^간$)/.test(name)?'육류·해산물':/(?:양파|대파|고추|배추|상추|무$|오이|감자|고구마|호박|당근|가지|부추|시금치|파프리카|브로콜리|버섯|토마토|레몬|사과|배$|미나리|숙주|콩나물|샐러리|셀러리|마늘|생강|채소|야채|시래기|김치|깻잎|토란)/.test(name)?'채소·버섯':'두부·계란·기타';
  const id='mincook-ingredient-'+createHash('sha256').update(compact(name)).digest('hex').slice(0,12);
  definitionRows.set(compact(name),[id,name,category,isSeasoning]);
 }
 return name;
}

const units='밥숟가락|티스푼|테이블스푼|숟가락|큰술|작은술|스푼|Tbsp|tbsp|Tsp|tsp|Ts|ts|kg|g|ml|mL|cc|L|리터|마리|인분|봉지|봉|개|장|컵|모|팩|줄기|줄|공기|꼬집|덩어리|대|알|송이|통|캔|단|병|뿌리|줌|톨|조각|포기|쪽|근|바퀴|국자|잎|T|t';
const numeric='(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?(?:\\s*과?\\s*\\d+\\/\\d+)?|\\d+\\/\\d+|½|¼|¾)';
const amountRe=new RegExp('^('+numeric+')\\s*('+units+')(?=\\s|$|[(),~～+-])');
function number(raw){
 const s=raw.replace(/,/g,'').trim().replace(/½/g,'1/2').replace(/¼/g,'1/4').replace(/¾/g,'3/4');
 const mixed=s.match(/^(\d+)\s*(?:과\s*)?(\d+)\/(\d+)$/);if(mixed)return +mixed[1]+ +mixed[2]/+mixed[3];
 const f=s.match(/^(\d+)\/(\d+)$/);return f?+f[1]/+f[2]:Number(s);
}
function parsed(name,sourceAmount,unit,reason){return {name:resolveName(name),sourceAmount,unit,...(reason?{reason}:{})};}
function parseLine(sourceText){
 let raw=sourceText.trim();
 if(/^La\s*:\s*갈비\s*3kg$/i.test(raw))return parsed('LA갈비',3,'kg','원문 La : 갈비 3kg 표기의 부위명을 연결하고 원문 kg 단위를 보존');
 if(/^골뱅이\s*300g\s*:\s*2캔$/.test(raw))return parsed('골뱅이',2,'캔','원문 300g 포장 표기는 메모로 보존하며 수량 2캔 단위를 그대로 사용');
 if(/^베트남\s*:\s*고추\s*6개$/.test(raw))return parsed('베트남고추',6,'개','원문에서 나뉜 베트남 : 고추 표기의 재료명을 연결');
 let name,tail;
 if(/[:：;；]/.test(raw)){
  const at=raw.search(/[:：;；]/);name=raw.slice(0,at).trim();tail=raw.slice(at+1).trim();
 }else{
  const at=raw.search(/\s+(?=(?:약\s*)?[0-9½¼¾]|(?:조금|적당|약간|넉넉|취향|(?:한|두|세)\s*(?:꼬집|줌|톨|공기|숟가락|큰술|작은술|컵|개|장|대|봉|팩|마리|단|모|통)|반\s*개))/);
  if(at>=0){name=raw.slice(0,at).trim();tail=raw.slice(at).trim();}
  else{
   const attached=raw.match(/^(.+?)(\d+(?:\.\d+)?(?:\/\d+)?\s*(?:kg|g|ml|mL|큰술|작은술|숟가락|개|장|모|컵|마리|대|공기|팩|봉|줄|알|통|단|쪽|바퀴|T|t).*)$/);
   if(attached){name=attached[1];tail=attached[2];}else{name=raw;tail='';}
  }
 }
 name=name.replace(/\s*(?:약|중간크기|큰 것|작은 것|큰거|작은거)$/,'').replace(/["']+$/,'').trim();
 name=name.replace(/\s*\((?:또는|or)\s*[^)]*\)\s*$/,'').trim();
 if(/\s+각$/.test(name)){name=name.replace(/\s+각$/,'').trim();tail='각 '+tail;}
 if(!name||name==='재료'||name==='양념')fail('재료명 추가 확인: '+sourceText);
 if(/(?:또는|or|\/)/.test(name)&&!originals.has(compact(name))){
  const first=name.split(/\s*(?:또는|\bor\b|\/)\s*/i)[0];
  if(!first||/[0-9]/.test(first))fail('대체 재료 구획 확인: '+sourceText);
  name=first;return {...parseLine(name+' : '+tail),reason:'원문 대체 선택지 중 첫 번째 재료만 선택하여 중복 구매 방지'};
 }
 // Explicitly combined ingredients retain both names, without inventing the allocation.
 if(/[,·]/.test(name)&&!/[()]/.test(name)){
  const parts=name.split(/[,·]/).map(x=>x.trim()).filter(Boolean);
  if(parts.length>1&&/^각\s*/.test(tail))return parts.map(part=>parseLine(part+' : '+tail.replace(/^각\s*/,''))).flat();
  if(parts.length>1)return parts.map(part=>parsed(part,null,null,'원문 여러 재료의 합계 분량으로 개별 배분 미기재'));
 }
 tail=tail.replace(/^(?:약|총|종이컵|크게|가득|듬뿍)\s*/,'').trim();
 if(/이상|이하|최소|최대|이내/.test(tail))return parsed(name,null,null,'원문 수량 경계만 명시되어 단일값으로 확정하지 않음');
 if(new RegExp('(?:'+numeric+')\\s*(?:'+units+')?\\s*[~～]\\s*(?:'+numeric+')').test(tail)||/\d\s*-\s*\d/.test(tail))return parsed(name,null,null,'원문 수량 범위를 임의 단일값으로 정하지 않음');
 if(/\s+(?:or|또는)\s+/i.test(tail)){
  const first=tail.split(/\s+(?:or|또는)\s+/i)[0];return {...parseLine(name+' : '+first),reason:'원문 대체 선택지 중 첫 번째 재료만 선택하여 중복 구매 방지'};
 }
 let depth=0,start=0;const plus=[];
 for(let n=0;n<tail.length;n++){
  if(tail[n]==='(')depth++;if(tail[n]===')')depth--;
  if(tail[n]==='+'&&depth===0){plus.push(tail.slice(start,n).trim());start=n+1;}
 }
 plus.push(tail.slice(start).trim());
 if(plus.length>1)return plus.map(part=>/^(?:α|알파|추가|적당량?)$/.test(part)?parsed(name,null,null,'원문의 추가 분량은 수량 미기재'): {...parseLine(name+' : '+part),reason:'원문 더하기로 구분된 각 분량을 모두 반영'}).flat();
 if(!/\d/.test(tail.split('(')[0])&&/\([^()]*\+[^()]*\)/.test(tail)){
  const inside=tail.match(/\(([^()]*)\)/)?.[1];
  if(inside&&inside.split('+').every(part=>amountRe.test(part.trim())))return inside.split('+').map(part=>({...parseLine(name+' : '+part.trim()),reason:'원문 괄호에 명시된 두 분량을 모두 반영'})).flat();
 }
 const explicitMass=!/없다면|없으면|경우|대체|대신|원하면|취향/.test(tail)?tail.match(/\([^)]*?(?:약\s*)?(\d+(?:,\d{3})*(?:\.\d+)?)\s*(kg|g|ml|mL|cc|L)\)/):null;
 if(explicitMass)return parsed(name,Number(explicitMass[1].replace(/,/g,'')),explicitMass[2],'원문에 직접 병기된 중량·부피 사용');
 const trailingMass=tail.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(kg|g|ml|mL|cc|L)(?:\s|$)/);
 if(trailingMass)return parsed(name,+trailingMass[1],trailingMass[2]);
 const match=tail.match(amountRe);
 if(match){
  const amount=number(match[1]);if(!(Number.isFinite(amount)&&amount>0))fail('수량 검토: '+sourceText);
  const rest=tail.slice(match[0].length).trim();
  if(rest&&/\d+\s*(?:kg|g|ml|mL|숟가락|큰술|작은술|개|장|컵)/.test(rest)&&!/^\([^)]*\)$/.test(rest))fail('복합 수량 사용 구획 검토: '+sourceText);
  return parsed(name,amount,match[2]);
 }
 if(/^한\s*꼬집/.test(tail))return parsed(name,1,'꼬집');
 if(/^한\s*줌/.test(tail))return parsed(name,1,'줌');
 if(/^한\s*톨/.test(tail))return parsed(name,1,'톨');
 if(/^한\s*공기/.test(tail))return parsed(name,1,'공기');
 if(/^두\s*공기/.test(tail))return parsed(name,2,'공기');
 if(/^두\s*줌/.test(tail))return parsed(name,2,'줌');
 const koreanCount=tail.match(/^(한|두|세)\s*(숟가락|큰술|작은술|컵|개|장|톨|대|봉|팩|마리|단|줌|모|통)/);
 if(koreanCount)return parsed(name,{한:1,두:2,세:3}[koreanCount[1]],koreanCount[2]);
 if(/^반\s*개/.test(tail))return parsed(name,0.5,'개');
 if(/\d/.test(tail))return parsed(name,null,null,'원문 수량의 단위·표기 불명확. 임의 환산하지 않음');
 return parsed(name,null,null);
}

function linesOf(e){
 let text=e.ingredientText;
 if(e.sourceId==='blog-6')text=text.split('[계란찜]')[0];
 if(e.sourceId==='blog-100')text=text.split('<양념소스 재료>')[0];
 if(e.sourceId==='blog-29')text=text.split('[볶음밥]')[0];
 let noodleCount=0;
 return text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{
  if(/^\(양파\s*[:：]/.test(line)&&/\)$/.test(line))return line.slice(1,-1);
  if(line.startsWith('사진에는 없지만 굴소스'))return line.match(/굴소스\s*한\s*숟가락/)?.[0]??line;
  if(line==='부족한 간은 소금으로')return '소금';
  return line;
 }).filter(line=>{
  if(e.sourceId==='blog-27'&&/^칼국수면[:：]?2인분$/.test(compact(line))&&++noodleCount>1)return false;
  if(/^반응형$|^조리\s*도구\s*[:：]|^\(?조리도구|^필러|^※|^cf\.|^재료\s*\(|^재료$|^\(계[량랑]|^\(믹서|^\* 블로그/.test(line))return false;
  if(/기준/.test(line)&&!/^.*?[:：;；]/.test(line))return false;
  if(/^\(?(?:약\s*)?\d+(?:\.\d+)?\s*인분\s*\)?$/.test(line))return false;
  if(/^\(?\s*\d+(?:\.\d+)?\s*(?:인분)?\s*(?:[~～-]\s*\d+(?:\.\d+)?\s*)?인분\s*\)?$/.test(line))return false;
  if(/(?:재료|데코|레시피)\s*\)?$/.test(line)&&!/[0-9]/.test(line))return false;
  if(/^(?:\(?조리|삶을 때 재료|그 외|소스 재료|양념장 재료|청양고추 양념장 재료|곱창 밑간 재료|매운 양념 막창 재료|채소|종이호일|쿠킹호일|지퍼백|나무 꼬치|전자저울 등 계량용 저울|체|오븐|전동 휘핑기|김발|믹싱볼 등)\s*(?:[:：].*)?$/.test(line))return false;
  if(/^\([^)]*(?:대체|가능|사용|경우|상관)[^)]*\)$/.test(line))return false;
  if(/^[*※].*(?:대체|설명|안내|참고)/.test(line))return false;
  if(e.sourceId==='blog-74'&&/모짜렐라 블럭치즈/.test(line))return false;
  if(e.sourceId==='blog-363'&&line==='라이스페이퍼')return false;
  return true;
 });
}
function nameOf(e){
 let name=(e.menuNameCandidate??'').trim().replace(/&nbsp;/g,' ').replace(/^[<\[【\s]+|[>\]】\s]+$/g,'').replace(/\s*(?:업그레이드\s*)?레시피\s*$/,'').replace(/\s*썸네일$/,'').trim();
 if(!name||name.length>50||/[.!?]|습니다|해보|소개|만들|재생|동영상|반응형/.test(name))fail('원본의 구체 메뉴명 추가 확인');
 return name;
}
function classification(name){
 if(/(?:양념장|파기름|소스|치킨스톡|육수|막걸리)/.test(name))return ['그 밖',/기름/.test(name)?'기름':/스톡|육수/.test(name)?'육수':'소스'];
 if(/(?:경양식|파스타|스파게티|스테이크|그라탕|리소토|리조또|샌드위치|토스트|피자|햄버거|라자냐|라따뚜이|스튜|수프|오믈렛|프렌치|감바스|또띠아)/.test(name))return ['양식',name.match(/파스타|스파게티|스테이크|그라탕|리소토|리조또|샌드위치|토스트|피자|햄버거|스튜|수프|오믈렛|감바스/)?.[0]??'요리'];
 if(/(?:마파|짜장|짬뽕|탕수|깐풍|라조|유산슬|고추잡채|동파육|마라|양장피|멘보샤|훠궈)/.test(name))return ['중식',name.match(/볶음|탕|면/)?.[0]??'요리'];
 if(/(?:일본식|일식|돈까스|돈가스|규동|우동|가츠|카츠|오야코|스키야키|야키|라멘|오코노미|소바|유부초밥|초밥|가라아게)/.test(name))return ['일식',/면|우동|소바|라멘/.test(name)?'면':/동$|덮밥/.test(name)?'덮밥':'요리'];
 if(/(?:빙수|샤베트|모찌|그래놀라|카이막|크림치즈|쿠키|케이크|케익|스콘|빵|파이|타르트|푸딩|잼|라떼|우유|음료|커피|초콜릿|아이스크림|과자|도넛)/.test(name))return ['그 밖','간식'];
 if(/(?:찌개|탕|전골|국$|국\s|곰국|해장국)/.test(name)&&!/탕수|국수|식혜/.test(name))return ['한식 국·찌개',/찌개/.test(name)?'찌개':/전골/.test(name)?'전골':/탕/.test(name)?'탕':'국'];
 if(/(?:무침|나물|장아찌|겉절이|김치$|볶음반찬|조림|계란말이|달걀말이|계란찜|달걀찜|전$|부침)/.test(name)&&!/김치찜|감자탕/.test(name))return ['한식 반찬',name.match(/무침|나물|장아찌|겉절이|김치|조림|볶음|찜|전|부침/)?.[0]??'반찬'];
 return ['한식 주메뉴',name.match(/볶음밥|덮밥|볶음|구이|찜|밥|국수|면|수육|튀김|떡볶이|김밥/)?.[0]??'요리'];
}
function portion(e,name,rows,category){
 // Reviewed servings belong to the source record, not the current catalog spelling.
 if(Number.isFinite(e.baseServings)&&e.baseServings>0&&e.servingsEvidence&&['explicit','estimated'].includes(e.servingsStatus)){
  return {n:e.baseServings,status:e.servingsStatus,evidence:e.servingsEvidence,...(e.servingsRange?{range:[e.servingsRange.min,e.servingsRange.max]}:{})};
 }
 if(e.sourceId==='blog-27')return {n:2,status:'explicit',whole:'2인분',evidence:'공식 블로그 본문의 면 총 2인분과 1인당 닭 반 마리 사용을 대조한 요리 전체 2인분. 재료표의 같은 칼국수면 2인분 반복은 1회 반영.'};
 const whole=e.ingredientText.split(/\n/).map(x=>x.trim().replace(/^재료\s*/,'' )).find(line=>/^\(?(?:약\s*)?\d+(?:\.\d+)?\s*(?:인분)?\s*(?:[~～-]\s*\d+(?:\.\d+)?\s*)?인분\s*(?:기준|분량)?\s*(?:\/[^\n]*)?\)?$/.test(line));
 if(whole){
  const range=whole.match(/(\d+(?:\.\d+)?)\s*(?:인분)?\s*[~～-]\s*(\d+(?:\.\d+)?)\s*인분/);if(range)return {n:+range[2],range:[+range[1],+range[2]],status:'explicit',whole,evidence:'원문 전체 '+whole+'을 표시하고 계산은 상한 인분 기준.'};
  const n=+whole.match(/\d+(?:\.\d+)?/)[0];return {n,status:'explicit',whole,evidence:'공식 블로그 원문 전체 '+whole+' 명시.'};
 }
 const quantified=rows.flatMap(row=>row.parsed).filter(row=>row.sourceAmount!==null);
 const grams=row=>row.unit==='g'?row.sourceAmount:row.unit==='kg'?row.sourceAmount*1000:0;
 const named=pattern=>quantified.filter(row=>pattern.test(row.name));
 const estimated=(n,basis)=>({n:Math.max(1,n),status:'estimated',evidence:`원문 전체 인분 미기재. ${basis} 등 원문 전체 제조량을 ${Math.max(1,n)}인분으로 편집 추정(2026-11-23 사용자 승인). 주메뉴는 한 끼, 반찬·소스는 곁들임 분량이며 원작자 명시 인분 아님.`});
 const tweaks={
  'blog-372':[200,'절인 배추 20kg과 양념 전량을 소량씩 곁들이는 대용량 김치 제조량'],
  'blog-281':[8,'순두부 400g·크림치즈300g·레이디핑거16개 등 두 박스 전량'],
  'blog-250':[8,'바스크 치즈케이크의 크림치즈·생크림·달걀 등 원문 반죽 전량'],
  'blog-363':[4,'건당면150g·돼지고기100g과 채소 전량을 반찬으로 곁들이는 잡채'],
  'blog-358':[40,'식용유1L·대파300g·마늘50g 등 파기름 전량을 소량씩 쓰는 곁들임 제조량']
  ,'blog-238':[10,'생크림1L·딸기우유800ml의 전체 카이막 제조량. 완성 수율·완성 중량은 임의 확정하지 않음'],
  'blog-211':[10,'우유2L 등 블루베리 크림치즈 전체 제조량. 완성 수율·완성 중량은 임의 확정하지 않음'],
  'blog-207':[10,'우유1L·생크림1L의 기본 카이막 제조량. 별도 마늘바게트는 포함하지 않음'],
  'blog-168':[8,'매실액3·간장2·액젓2·다진대파5숟가락 등 나물용 양념장 제조 전량을 곁들임으로 사용'],
  'blog-173':[2,'메론한통·메로나2개·우유180ml 등 빙수 전량'],
  'blog-158':[1,'식빵2장·치즈1장과 흑설탕·버터 등 토스트 전량']
 };
 if(tweaks[e.sourceId])return estimated(...tweaks[e.sourceId]);
 if(/케이크|케익|쿠키|타르트|약과|과자|스콘|푸딩/.test(name)){
  const solid=quantified.filter(row=>grams(row)>0&&!originals.get(compact(row.name))?.isSeasoning&&!definitionRows.get(compact(row.name))?.[3]);
  const dairy=named(/우유|생크림|휘핑크림/).filter(row=>['ml','mL','L'].includes(row.unit));
  const count=Math.max(1,Math.round(solid.reduce((sum,row)=>sum+grams(row),0)/100),Math.round(dairy.reduce((sum,row)=>sum+row.sourceAmount*(row.unit==='L'?1000:1),0)/100));
  if(solid.length||dairy.length)return estimated(count,[...solid,...dairy].slice(0,4).map(row=>row.name+row.sourceAmount+row.unit).join('·'));
 }
 if(/떡볶이|떡국|국수|면|파스타|스파게티|김밥|볶음밥|덮밥|비빔밥|솥밥|죽/.test(name)){
  const carbs=named(/밥|쌀|소면|중화면|칼국수|우동|파스타|스파게티|냉면|쫄면|쌀국수|당면|떡/).filter(row=>!/소스|육수|가루|스프/.test(row.name)&&(grams(row)>0||['인분','공기','컵','봉','팩'].includes(row.unit)));
  if(carbs.length){
   const total=carbs.reduce((sum,row)=>sum+(grams(row)>0?grams(row)/(/쌀|소면|파스타|스파게티|건당면/.test(row.name)?100:200):row.sourceAmount*(row.unit==='컵'&&row.name==='쌀'?2:1)),0);
   return estimated(Math.max(1,Math.round(total)),carbs.map(row=>row.name+row.sourceAmount+row.unit).join('·'));
  }
 }
 let anchor=named(/(?:소고기|쇠고기|돼지|삼겹|목살|앞다리살|뒷다리살|갈비|양지|차돌|우삼겹|닭|오리|오징어|문어|낙지|연어|고등어|갈치|새우|홍합|바지락|대구|동태|명태)/).filter(row=>grams(row)>0&&!/육수|소스|스톡|양념/.test(row.name));
 let n,basis;
 if(anchor.length){
  const portions=anchor.reduce((sum,row)=>sum+grams(row)/(/^(?:닭|통닭|닭봉|닭날개|토막 낸 닭|닭볶음탕용 닭|닭볶음용 닭|오리)$/.test(row.name)?300:/등뼈|뼈있는|냉장 소갈비|^소갈비$|갈비탕용 소갈비|돼지갈비|돼지 등갈비|등갈비|LA갈비/.test(row.name)?350:/홍합|바지락|조개|가리비/.test(row.name)?400:category==='한식 반찬'?100:180),0);
  n=Math.max(1,Math.round(portions));basis=anchor.map(row=>row.name+row.sourceAmount+row.unit).join('·');
 }else{
  anchor=named(/밥|쌀|소면|중화면|칼국수|우동|파스타|스파게티|냉면|쫄면|쌀국수|떡/).filter(row=>grams(row)>0||['인분','공기','봉','팩'].includes(row.unit));
  if(anchor.length){
   const first=anchor[0];basis=first.name+first.sourceAmount+first.unit;
   n=['인분','공기','봉','팩'].includes(first.unit)?Math.ceil(first.sourceAmount):Math.max(1,Math.round(grams(first)/(/쌀|소면|파스타|스파게티/.test(first.name)?100:200)));
  }else{
   anchor=named(/두부/).filter(row=>grams(row)>0||['모','팩','봉'].includes(row.unit));
   if(anchor.length){const first=anchor[0];basis=first.name+first.sourceAmount+first.unit;n=['모','팩','봉'].includes(first.unit)?Math.ceil(first.sourceAmount*2):Math.max(1,Math.round(grams(first)/150));}
   else{
    anchor=named(/계란|달걀/).filter(row=>['개','알'].includes(row.unit));
    if(anchor.length){const total=anchor.reduce((sum,row)=>sum+row.sourceAmount,0);basis=anchor.map(row=>row.name+row.sourceAmount+row.unit).join('·');n=Math.max(1,Math.ceil(total/2));}
     else{
     anchor=named(/닭|오리|갈치|고등어|오징어|문어|낙지|전복|새우/).filter(row=>['마리','개'].includes(row.unit));
     if(anchor.length){const first=anchor[0];basis=first.name+first.sourceAmount+first.unit;n=Math.max(1,Math.round(first.sourceAmount*(/닭|오리/.test(first.name)?4:/새우|전복/.test(first.name)?1/5:2)));}
     else{
      anchor=named(/돼지|소고기|삼겹|목살|앞다리|갈비|양지|차돌|우삼겹/).filter(row=>['근','개','덩어리','팩'].includes(row.unit));
      if(anchor.length){const first=anchor[0];basis=first.name+first.sourceAmount+first.unit;n=Math.ceil(first.sourceAmount*(first.unit==='근'?4:/앞다리|장족/.test(first.name)?6:2));}
      else{
       anchor=quantified.filter(row=>grams(row)>0&&!originals.get(compact(row.name))?.isSeasoning&&!definitionRows.get(compact(row.name))?.[3]);
       if(anchor.length){const total=anchor.reduce((sum,row)=>sum+grams(row),0);basis=anchor.slice(0,4).map(row=>row.name+row.sourceAmount+row.unit).join('·');n=Math.max(1,Math.round(total/(category==='한식 반찬'?100:250)));}
       else{
        anchor=named(/밥|쌀|면|떡/).filter(row=>['컵','인분','공기','봉','팩','개'].includes(row.unit));
        if(anchor.length){const first=anchor[0];basis=first.name+first.sourceAmount+first.unit;n=Math.max(1,Math.ceil(first.sourceAmount*(first.unit==='컵'&&first.name==='쌀'?2:first.unit==='개'?1/5:1)));}
        else{
         anchor=named(/감자|고구마|오이|호박|양파|양배추|배추|상추|가지|토마토|콩나물|버섯|깻잎|딸기|사과/).filter(row=>['개','통','포기','봉','팩','장','줌','단'].includes(row.unit));
         if(anchor.length){const first=anchor[0];basis=first.name+first.sourceAmount+first.unit;n=Math.max(1,Math.ceil(first.sourceAmount*(['통','포기','단'].includes(first.unit)?6:['장'].includes(first.unit)?1/5:1)));}
         else fail('전체 인분 추정에 사용할 주재료 수량 확인 필요');
        }
       }
      }
     }
    }
   }
  }
 }
 n=Math.max(1,n);
 return {n,status:'estimated',evidence:`원문 전체 인분 미기재. ${basis} 등 원문 전체 제조량을 ${n}인분으로 편집 추정(2026-11-23 사용자 승인). 주메뉴는 한 끼, 반찬은 곁들임 분량이며 원작자 명시 인분 아님.`};
}

const overrides={
 'blog-2':{name:'고깃집 된장찌개'},'blog-3':{name:'고추장찌개'},'blog-4':{name:'이삭토스트'},
 'blog-5':{name:'7분 김치찌개'},'blog-6':{name:'국물닭발'},'blog-7':{name:'두부조림'},
 'blog-8':{name:'콩나물 불고기'},'blog-9':{name:'로제 찜닭'},'blog-10':{name:'삼겹살 김치찜'},
 'blog-11':{name:'중화비빔밥'},'blog-12':{name:'김치찌개'},'blog-13':{name:'지코바 치킨'},
 'blog-14':{name:'장칼국수'},'blog-15':{name:'청국장찌개'},'blog-16':{name:'닭볶음탕'},
 'blog-17':{name:'부대찌개'},'blog-18':{name:'육개장'},'blog-19':{name:'짜글이찌개'},
 'blog-20':{name:'닭떡볶이'},'blog-21':{name:'크림진짬뽕'},'blog-22':{name:'감자탕'},
 'blog-47':{name:'한방 수육'},'blog-53':{name:'계란 폭탄 토스트'},
 'blog-130':{name:'통삼겹 간장조림'},'blog-208':{name:'전자레인지 카레'},
 'blog-365':{name:'육전냉면'},'blog-363':{name:'잡채'},'blog-100':{name:'간장치킨'},'blog-207':{name:'카이막'}
};
const explicitHolds={
 'blog-15':'원문 전체 인분이 1~1.5인분 범위로 명시되어 현재 범위 표시·계산 규칙 추가 확인 대기.',
 'blog-347':'원문 4인분 소스 제조량 중 200ml 사용하며 완성 수율·사용 비율 미기재. 베이컨/우삼겹 토핑 대안 확인 대기.',
 'blog-284':'삶은 닭·닭껍질 베이스·닭 육수 1.5L의 부분 사용 관계와 완성 수율 확인 대기. 원재료와 중간 조리물 중복 구매 방지.',
 'blog-306':'홍가리비 전량으로 만드는 여섯 요리 중 대표 버전·양념별 사용 분량 확인 대기.',
 'blog-369':'한 원문에 스팸 요리 세 가지가 있으며 추출된 첫 재료표만으로 대표 요리 전체 양 확인 불가.',
 'blog-155':'닭꼬치와 닭다리살 대안에 사용하는 닭·데리야끼소스 분량이 미기재되어 원재료 사용 비율 확인 대기.',
 'blog-220':'공통 찐빵 반죽과 단팥/슈크림 두 대안의 배분·사용 분량 확인 대기.',
 'blog-135':'8~10인분 꼬막무침 제조량 중 비빔밥 밥 두 공기에 쓰는 실제 양 미기재. 부분 사용량 확인 대기.',
 'blog-133':'2~3인분 등뼈 육수와 별도 1인분 면·토핑 구획의 사용 비율 및 사골팩 1:1 분량 확인 대기.',
 'blog-322':'주재료 닭의 수량과 원문 양 가루의 정확한 재료명 확인 대기.',
 'blog-340':'차돌양지 원육 설명과 재료표 앞다리살의 축종·부위 대응 및 곰탕/국수 분량 확인 대기.',
 'blog-324':'재료표 물엿 1숟가락과 본문 참기름 1숟가락의 재료가 달라 원본 확인 대기.',
 'blog-89':'1.5인분 면과 3~4인분 양념장의 실제 사용 비율 및 완성 수율 확인 대기.',
 'blog-147':'테이크아웃 신전떡볶이 국물 1인분의 원재료·수량 분해 근거가 없어 재활용 재료 사용량 확인 대기.',
 'blog-261':'불고기용 고기의 축종이 원문에 명시되지 않아 소고기·돼지고기로 임의 확정하지 않고 확인 대기.',
 'blog-295':'원문 국거리용 고기의 축종이 명시되지 않아 소고기·돼지고기로 임의 확정하지 않고 확인 대기.',
 'blog-294':'원문 구이용 고기의 축종이 명시되지 않아 소고기·돼지고기로 임의 확정하지 않고 확인 대기.',
 'blog-293':'원문 스테이크용 고기의 축종과 사용량이 명시되지 않아 추가 확인 대기.',
 'blog-243':'원문 등심의 축종이 재료표·본문에 명시되지 않아 소고기·돼지고기로 임의 확정하지 않고 확인 대기.',
 'blog-246':'재료표 맛술 3숟가락과 본문 물엿 3숟가락이 서로 달라 원문 재료 확인 대기.',
 'blog-114':'재료표 파 1/4개와 본문 양파 1/4개의 표기가 달라 원문 재료 확인 대기.',
 'blog-187':'완성된 무생채를 별도 메뉴에 사용하는 양·원재료 분해 비율 확인 대기.',
 'blog-90':'남은 탕수육의 제조 재료·실제 사용 분량 확인 대기.',
 'blog-24':'칼국수와 볶음밥에 남은 국물·여러 조리물의 원재료 분해 비율 확인 대기.'
};
for(const indexed of index.entries.slice(391,782)){
 const sourceId=indexed.sourceId??'blog-'+indexed.url.split('/').at(-1);const e=sourceRows.get(sourceId);
 if(!e?.ingredientText){skips.push({sourceId,reason:e?.heldReason??e?.reason??'공식 원문 재료표 추가 확인 필요'});continue;}
 try{
  if(explicitHolds[sourceId])fail(explicitHolds[sourceId]);
  const name=overrides[sourceId]?.name??nameOf(e),lines=linesOf(e);
  const rows=[];
  for(const sourceText of lines){
   if(/^\[|^<|^재료\s*[ABC]$|^양념\s*장?$|^소스$|^고명$|^육수$/.test(sourceText))continue;
   if((intermediateRows.get(sourceId)??[]).some(line=>compact(line)===compact(sourceText))){rows.push({sourceText,parsed:[]});continue;}
   const parsed=parseLine(sourceText);rows.push({sourceText,parsed:[parsed].flat()});
  }
  if(!rows.length||!rows.some(row=>row.parsed.some(p=>p.sourceAmount!==null)))fail('전체 수량 미기재로 인분·구매량 확인 필요');
  const [category,cookingType]=classification(name),servings=portion(e,name,rows,category);
  batch50.push([sourceId,name,servings.n,cookingType,category,...(servings.range?[servings.range]:[])]);
  servingsOverrides[sourceId]={status:servings.status,evidence:servings.evidence};
  lineOverrides[sourceId]=Object.fromEntries(rows.map(row=>[row.sourceText,row.parsed.length===1?row.parsed[0]:row.parsed]));
  meta.set(sourceId,{name,lines:rows.map(row=>row.sourceText),whole:servings.whole});
 }catch(error){skips.push({sourceId,reason:error.message});}
}
const used=new Set(Object.values(lineOverrides).flatMap(rows=>Object.values(rows).flat().map(row=>compact(row.name))));
definitions.push(...[...definitionRows.values()].filter(row=>used.has(compact(row[1]))));
export function prepareText(e){
 const row=meta.get(e.sourceId);if(!row)fail('선정하지 않은 원본: '+e.sourceId);
 e.nameSource='official-blog';e.nameSourceText=row.name;
 const explanations={
  'blog-6':'기본 국물닭발만 반영하고 별도 계란찜 구획은 제외. 원재료 콩나물에서 생기는 채수는 중간 조리물로 중복 구매 제외.',
  'blog-18':'양지 500g와 삶는 물 2L는 원문 전량 유지. 그 과정에서 생기는 양지 삶은 물 1L는 중간 조리물로 중복 구매 제외. 식용유는 기본 1숟가락만 포함하며 지방이 없을 때 100ml 대안은 별도 합산하지 않음.',
  'blog-45':'곱창 500g를 굽고 나온 기름은 파생 재료이므로 중복 구매 제외.',
  'blog-374':'닭수육 원재료 전량은 유지하고 그 과정에서 생기는 닭육수 5숟가락만 중간 조리물로 중복 구매 제외.',
  'blog-330':'돼지꼬리 2kg 전량은 유지하고 삶는 과정에서 생기는 육수 100ml는 중간 조리물로 중복 구매 제외.',
  'blog-312':'홍합 1kg 원재료 전량은 유지하고 해당 홍합에서 생기는 홍합 육수 1L는 중간 조리물로 중복 구매 제외.',
  'blog-210':'닭 1kg 원재료 전량은 유지하고 해당 닭에서 생기는 닭 육수 5숟가락은 중간 조리물로 중복 구매 제외.',
  'blog-27':'본문 총 면 2인분과 1인당 닭 반 마리를 대조하여 전체 2인분으로 기록. 재료표에서 반복된 칼국수면 2인분은 같은 분량으로 1회만 반영.',
  'blog-363':'기본 잡채만 반영하고 남은 잡채를 활용하는 후속 만두의 라이스페이퍼는 제외.',
  'blog-100':'공통 닭·튀김옷과 간장소스만 반영. 대체 양념치킨 소스는 합산하지 않음.',
  'blog-74':'기본 일본식 돈까스만 반영. 대체 치즈 돈까스 버전의 모차렐라 블록치즈는 제외.',
  'blog-86':'원문 토치 대신 화유를 사용하는 대안을 선택하여 화유를 수량 미기재로 포함.'
  ,'blog-50':'원문 조리 정보에서 김밥용 우엉조림을 명시하여 준비품 우엉조림으로 연결. 생우엉으로 바꾸지 않음.',
  'blog-207':'기본 카이막의 전체 제조 재료만 반영하고 후속 마늘바게트는 별도 요리로 제외.'
 };
 if(explanations[e.sourceId]&&!e.ingredientClarification?.includes(explanations[e.sourceId]))e.ingredientClarification=[e.ingredientClarification,explanations[e.sourceId]].filter(Boolean).join(' ');
 if(e.sourceId==='blog-27')e.sourceCorrections=[{sourceText:'칼국수면 : 2인분',reason:'본문의 총 면 2인분과 1인당 닭 반 마리 명시를 대조하여 재료표 중복 행은 1회 반영',checkedOn:'2026-11-23',checkedBy:'공식 블로그 원문 대조'}];
 if(row.whole&&!e.servingsStatements.some(text=>text===row.whole))e.servingsStatements.push(row.whole);
 return row.lines.join('\n');
}
