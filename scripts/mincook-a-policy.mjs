// Review of official-blog index entries 0–390. Ingredient quantities retain source units.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {canonicalIngredientName} from '../js/ingredient-aliases.js';

const read=async p=>JSON.parse(await readFile(p,'utf8'));
const source=await read(process.env.MINCOOK_A_REVIEW_FILE??new URL('../data/source/mincook-review.json',import.meta.url));
const index=await read(new URL('../data/source/mincook-blog-index.json',import.meta.url));
const ingredients=await read(new URL('../data/ingredients.json',import.meta.url));
const key=s=>s.normalize('NFKC').replace(/\s/g,'');
const existing=new Map(ingredients.map(i=>[key(i.name),i.name]));
const aliases={
 '달걀':'계란','댤걀':'계란','달걀지단':'달걀지단','계란지단':'달걀지단','지단':'달걀지단',
 '삶은계란':'삶은 달걀','계란노른자':'계란노른자','노른자':'계란노른자','계란흰자':'달걀흰자',
 '계란후라이':'계란 프라이','계란프라이':'계란 프라이','달걀후라이':'계란 프라이',
 '다진마늘':'다진 마늘','간마늘':'다진 마늘','통마늘':'마늘','편마늘':'마늘','마늘편':'마늘',
 '다진생강':'다진 생강','통생강':'생강','다진대파':'대파','대파흰부분':'대파','다진쪽파':'쪽파',
 '파':'대파','대파흰부분만':'대파','채썬양파':'양파','무채':'무','채썬무':'무',
 '고추가루':'고춧가루','고운고추가루':'고운 고춧가루','굵은고추가루':'굵은 고춧가루',
 '후추':'후추가루','순후추':'후추가루','통후추가루':'후추가루','순후추가루':'후추가루',
 '꽃소금':'소금','굵은소금':'굵은소금','빻은참깨':'깨소금','통깨':'참깨','깨':'참깨',
 '미원':'MSG','소고기다시다':'소고기다시다','양조간장':'양조간장','노추':'노두유',
 '미림':'맛술','미향':'맛술','맛술미림':'맛술','생수':'물','정수물':'물',
 '우스타소스':'우스터소스','돈까스소스':'돈가스소스','돈가스소스':'돈가스소스',
 '데리야끼소스':'데리야키소스','데리야키소스':'데리야키소스','데리야끼':'데리야키소스',
 '토마토스파게티소스':'토마토소스','토마토파스타소스':'토마토소스','토마토홀':'통조림 홀토마토',
 '홀토마토':'통조림 홀토마토','스파게티소스':'토마토소스','스위트콘':'캔 옥수수',
 '옥수수콘':'캔 옥수수','올리브오일':'올리브유','오일':'식용유','기름':'식용유',
 '파르미지아노레지아노치즈':'파르메산 치즈','파르미지아노레지아노':'파르메산 치즈',
 '파마산치즈':'파르메산 치즈','모짜렐라치즈':'모차렐라 치즈','모차렐라치즈':'모차렐라 치즈',
 '체다치즈':'체더치즈','슬라이스치즈':'슬라이스 치즈','비엔나소세지':'비엔나소시지',
 '소세지':'소시지','프랑크소세지':'프랑크 소시지','베이컨잼':'베이컨 잼',
 '돼지목살':'돼지고기목살','목살':'돼지고기목살','통목살':'돼지고기목살','앞다리살':'돼지 앞다리살',
 '돼지앞다리살':'돼지 앞다리살','돼지고기앞다리살':'돼지 앞다리살','돼지등뼈':'돼지등뼈',
 '등뼈':'돼지등뼈','닭다릿살':'닭다리살','닭정육':'닭 정육','닭도리탕용닭':'토막 낸 닭',
 '불고기용소고기':'소고기 불고기용','소불고기':'소고기 불고기용','소고기민찌':'소고기 다짐육',
 '돼지고기민찌':'다진 돼지고기','돼지고기다짐육':'다진 돼지고기','돼지고기다진것':'다진 돼지고기',
 '다진소고기':'소고기 다짐육','양지':'소고기 양지','소양지':'소고기 양지','씻은쌀':'쌀',
 '씻은묵은지':'묵은지','묵은김치':'묵은지','신김치':'김치','깐메추리알':'삶은 메추리알',
 '무뼈닭다리살':'닭다리살','파스타면':'파스타면','칼국수':'칼국수면','칼국수면':'칼국수면',
 '우동사리':'우동면','면수':'면수','냉면육수':'냉면 육수','사골곰탕':'사골곰탕',
 '시판용사골곰탕':'사골곰탕','사골곰탕육수':'사골곰탕','코인육수':'코인육수',
 '양송이':'양송이버섯','브로컬리':'브로콜리','샐러리':'셀러리','깻순':'깻잎순',
 '파슬리':'파슬리','파슬리가루':'파슬리가루','말린파슬리':'파슬리말린것',
 '페퍼론치노':'페페론치노','페퍼론치노':'페페론치노','크러쉬드페퍼':'레드크러쉬드 페퍼',
 '크러쉬드레드페퍼':'레드크러쉬드 페퍼','홀그레인머스타드':'홀그레인 머스터드',
 '홀그레인머스터드':'홀그레인 머스터드','머스타드':'머스터드','케찹':'케첩','토마토케찹':'케첩',
 '고추냉이':'고추냉이','와사비':'고추냉이','해물믹스':'해물','해물모듬':'해물','모듬해물':'해물',
 '모듬버섯':'버섯','모둠버섯':'버섯','명란':'명란젓','초장':'초고추장',
 '샤브샤브용소고기':'샤부샤부용 소고기','샤브용소고기':'샤부샤부용 소고기',
 '소고기불고기용':'소고기 불고기용','멸치액':'멸치액젓','청고추':'풋고추','실당면':'실당면',
 '다진부추':'부추','다진미나리':'미나리','대파흰색부분':'대파','대파초록색부분':'대파',
 '갈비살원육':'갈비살','리테일갈비살':'갈비살','본갈비살':'갈비살','왕갈비':'소갈비',
 '갈은통후추':'후추가루','말린대추':'건대추','채썬오이':'오이','오뚜기메밀소바장국':'가다랑어장국',
 '모짜렐라':'모차렐라 치즈','애플사이다식초':'사과식초','오향분':'오향분말',
 '항정살원육':'항정살','사골국물':'사골육수','사골국':'사골육수','절단낙지':'낙지',
 '멸치다시다':'멸치 다시다','바게트빵':'바게트','한번초벌된소곱창':'초벌소곱창',
 '김칫국물':'김치국물','해감한바지락':'바지락','스팸':'통조림 햄','치킨튀김가루':'치킨 튀김가루',
 '오뎅':'어묵','허니머스타드':'허니머스터드소스','생우삼겹':'우삼겹','새우회':'새우',
 '새송이':'새송이버섯','바질럽':'건바질','오레가노럽':'오레가노마른것','오레가노럽드':'오레가노마른것',
 '손질멸치':'멸치','다진오징어':'오징어','똥집':'닭근위','자른김치':'김치','참치액젓':'참치액',
 '표고':'표고버섯','느타리':'느타리버섯','그라노파다노치즈':'그라나파다노 치즈','올리즈오일':'올리브유',
 '탈피들깨가루':'거피들깨가루','저당케찹':'저당 케첩','스시라차소스':'스리라차 소스',
 '다진할라피뇨피클':'할라피뇨 피클','다진묵은지':'묵은지','허브솔트':'허브소금',
 '삶은고사리':'불린 고사리','돼지안심':'돼지고기 안심','오리로스':'오리고기','멸치다시팩':'다시팩',
 '돼지비계':'돼지 지방','소힘줄':'소힘줄','스지':'소힘줄','모듬어묵':'어묵','간돼지고기':'다진 돼지고기',
 '녹인버터':'버터','냉동꽃게':'꽃게','찜용콩나물':'콩나물','미나리줄기':'미나리','미나리이파리':'미나리',
 '미지근한물':'물','시나몬가루':'계피가루','손질된낙지':'낙지','닭안심':'닭안심살',
 '스테이크용소고기':'소고기','큐민가루':'큐민파우더','큐민':'커민','단무':'단무지',
 '생대패삼겹살':'대패삼겹살','칼국수사리':'칼국수면','면두부':'두부면',
 '뒷다리살':'돼지 뒷다리살','닭윙':'닭날개','노드유':'노두유','냉동오징어':'오징어',
 '냉동해물믹스':'해물','수육용돼지고기':'돼지고기','삼계탕팩':'삼계탕 재료팩',
 '이탈리안파슬리':'파슬리','우둔살':'쇠고기(우둔)','청양':'청양고추','유크림100%버터':'버터',
 '소고기목심':'우목심','청양고춧가루':'청양고춧가루','베이킹소다':'베이킹소다',
 '다진김치':'김치','라면사리':'라면','갈은감자':'감자','채썬깻잎':'깻잎','신김치':'김치',
 '멸치다시마육수팩':'다시팩','멸치다시다팩':'다시팩','멸치다시팩':'다시팩','국거리용소고기':'소고기',
 '고기삶은육수':'고기 삶은 육수','모듬버섯':'버섯','구운두부':'두부','일반고춧가루':'고춧가루',
 '얼린두부':'얼린 두부','멸치칼국수':'멸치칼국수 라면','바베큐소스':'바비큐소스',
 '김밥용햄':'햄','백태콩':'노란콩','백태':'노란콩','미나리줄기':'미나리','돼지앞발':'돼지 장족',
 '돼지사골':'돼지 사골','도리토스':'도리토스','닭장각':'통닭다리','돼지목뼈':'돼지 목뼈',
 '불린토란대':'불린 토란줄기','멸치칼국수분말스프':'라면스프','멸치칼국수라면스프':'라면스프',
 '멸치칼국수건더기스프':'건더기 스프','멸치칼국수면':'라면','사리곰탕라면':'사리곰탕 라면',
 '바질럽드':'건바질','마라샹궈소스':'마라소스','하이디라오마라소스':'마라소스','시판용마라소스':'마라소스',
 '냉동우동면':'우동면','냉동중화면':'중화면','냉동소면':'소면','바스클래식프랑크소세지':'프랑크 소시지',
 '콘킹소세지':'소시지','햄버거빵':'햄버거 빵','버거빵':'햄버거 빵','핫케이크가루':'핫케이크 가루',
 '녹인초콜릿':'초콜릿','삼겹살혹은오겹살':'삼겹살','청양홍고추':'청홍고추','면':'국수',
 '오리슬라이스':'오리고기','수박흰부분':'수박 속껍질',
 '오뚜기메밀소바장국':'메밀소바 장국','시판용김치':'김치','불닭볶음면':'불닭볶음면',
 '페스츄리생지':'페이스트리 생지','페스트리생지':'페이스트리 생지'
};
export const canonicalOverrides={};
const newNames=new Map();
const newDefinition=(name)=>{
 const seasoning=/소스|양념|시즈닝|가루|스톡|액젓|육수|간장|다시다|식초|오일|기름|된장|페이스트|미원|MSG|조미료|머스터드|마늘쫑?분|시럽|잼$/.test(name);
 const category=seasoning?'양념·조미료':/고기|소꼬리|갈비|가오리|새우|가리비|조개|양지|곱창|목뼈|칠게|홍합|어란|명란|닭|우지|베이컨|삼겹|오리|문어|내장|소간|생선|사태|허파|염통|오소리|돼지|대창|장어|우럭|살$/.test(name)?'육류·해산물':/채소|고사리|상추|궁채|우거지|버섯|방풍|미역|파래|콩나물|고추|쑥갓|부추|양파|감자|근대|콩$/.test(name)?'채소·버섯':'두부·계란·기타';
 return ['mincook-ingredient-'+createHash('sha256').update(key(name)).digest('hex').slice(0,12),name,category,seasoning];
};
function canonical(raw){
 let name=raw.trim().replace(/\s+/g,' ');
 name=aliases[key(name)]??name;
 const approved=canonicalIngredientName({name});if(approved&&existing.has(key(approved)))name=approved;
 if(existing.has(key(name)))return existing.get(key(name));
 if(!name||name.length>30||/[\d:：<>\[\]=*+().?!,]/.test(name)||(!['불닭볶음면'].includes(name)&&/넣|볶|썰|끓|해주세요|준비|만들|기준|취향|필요|생략|각각|일단|반응형|원하는|원하면|가능|재료|완성|입니다|합니다/.test(name)))throw Error('재료명 추가 확인: '+raw);
 if(!newNames.has(key(name)))newNames.set(key(name),newDefinition(name));
 return name;
}
const units='Tbsp|tbsp|Tsp|tsp|숟가락|밥숟가락|큰술|작은술|스푼|kg|g|ml|mL|L|리터|cc|T|t|컵|마리|인분|공기|봉지|묶음|포기|꼬집|덩이|덩어리|조각|줄기|봉|팩|개|장|모|대|알|통|줄|쪽|뿌리|줌|캔|단|근|병|판';
const numPattern='(?:\\d+\\s*(?:과|와|\\+)\\s*\\d+\\/\\d+|(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?(?:\\/\\d+)?)';
const amountRE=new RegExp('('+numPattern+')\\s*('+units+')');
const f=s=>{const mixed=s.match(/^(\d+)\s*(?:과|와|\+)\s*(\d+)\/(\d+)$/);return mixed?+mixed[1]+ +mixed[2]/+mixed[3]:s.includes('/')?s.split('/').map(Number).reduce((a,b)=>a/b):Number(s.replace(/,/g,''));};
const q=(name,sourceAmount,unit,reason)=>({name,sourceAmount,unit,...(reason?{reason}:{})});
const specificRows={
 'blog-781':{'차돌박이 : 500g + 소금 : 2g':[q('차돌박이',500,'g'),q('소금',2,'g')],'가리비 관자 : 300g + 소금 : 2g':[q('관자',300,'g'),q('소금',2,'g')]},
 'blog-758':{'(처음) 물 1.5L > (졸아들 때) 물 1L':q('물',2.5,'L','원문 처음1.5L와 추가1L를 같은 단위로 합산')},
 'blog-769':{'(물 180ml)':q('물',180,'ml')},
 'blog-761':{'계란물 (계란 : 3개)':q('계란',3,'개','계란물 원문에 직접 적힌 계란3개로 반영')},
 'blog-449':{'다시마버터 : 100g (일반 버터를 사용할 시 70g)':q('버터',70,'g','원문이 명시한 대체 버터70g 한 가지만 포함')},
 'blog-740':{'멸치와 다시마':[q('멸치',null,null,'원문 수량 미기재'),q('다시마',null,null,'원문 수량 미기재')]},
 'blog-647':{'미원 : 2 큰 숟가락':q('MSG',2,'큰 숟가락')},
 'blog-646':{'갈치속젓 : 1큰 숟가락':q('갈치속젓',1,'큰 숟가락')},
 'blog-570':{'참깨 : 3숟 가락':q('참깨',3,'숟 가락')},
 'blog-656':{'올리즈오일 : 50ml':q('올리브유',50,'ml','원문 올리즈오일을 올리브유의 표기 오타로 편집 해석하고 원문 구절은 보존')},
 'blog-650':{'스시라차 소스 : 3숟가락':q('스리라차 소스',3,'숟가락','원문 스시라차와 본문 스리라차를 같은 소스의 표기 차이로 해석')},
 'blog-648':{'추후 1L 추가':q('물',1,'L','원문의 물2L 뒤 추가1L 표기 및 본문 물1L 추가 사실에 따라 반영')}
};
function parse(line,id){
 if(specificRows[id]?.[line])return specificRows[id][line];
 let raw=line.trim().replace(/^[•·-]\s*/,'');
 let match=raw.match(/^([^:：]+)\s*[:：]\s*(.*)$/);
 let name,tail;
 if(match){name=match[1].trim();tail=match[2].trim();}
 else{
  const m=amountRE.exec(raw);
  if(m){name=raw.slice(0,m.index).trim();tail=raw.slice(m.index).trim();}
  else{
   const word=!existing.has(key(raw))&&raw.match(new RegExp('^(.+?)\\s*(한|반|두|세)\\s*('+units+')$'));
   if(word){name=word[1];tail=word[2]+word[3];}
   const m2=!word&&raw.match(/^(.*?)\s*(\d+(?:\.\d+)?(?:\/\d+)?)\s*(?:약간|적당량)?$/);
   if(!word){name=m2?m2[1].trim():raw.replace(/\s*(?:약간|적당량|넉넉히|조금|취향껏)$/,'').trim();tail=m2?m2[2]:'';}
  }
 }
 const countedName=name.match(new RegExp('^(.+?)\\s*(한|반|두|세)\\s*('+units+')$'));
 if(countedName&&!existing.has(key(name))){name=countedName[1].trim();if(!tail)tail=countedName[2]+countedName[3];}
 name=name.replace(/\s*\([^)]*\)\s*/g,' ').trim();
 if(/\s+(?:또는|혹은)\s+|\s+or\s+/i.test(name))name=name.split(/\s+(?:또는|혹은)\s+|\s+or\s+/i)[0].trim();
 if(name.includes('/')&&!existing.has(key(name)))throw Error('대체/복합 재료 종류 확인: '+line);
 name=canonical(name);
 const mass=tail.match(/\((?:약\s*|고형물\s*)?([\d,]+(?:\.\d+)?)\s*(kg|g|ml|mL|L|cc)\)/);
 if(mass)return q(name,f(mass[1]),mass[2]);
 if(new RegExp(numPattern+'\\s*(?:'+units+')?\\s*[~～-]\\s*'+numPattern).test(tail))return q(name,null,null,'원문 수량 범위를 임의 단일값으로 정하지 않음');
 const m=amountRE.exec(tail);
 if(m){
  let amount=f(m[1]);
  const multiply=tail.slice(m.index+m[0].length).match(/^\s*(?:[xX*×])\s*(\d+(?:\.\d+)?)/);if(multiply)amount*=+multiply[1];
  return q(name,amount,m[2],multiply?'원문 곱수 표기를 같은 단위로 계산':undefined);
 }
 const word=tail.match(new RegExp('^(한|반|두|세)\\s*('+units+')'));if(word)return q(name,{한:1,반:0.5,두:2,세:3}[word[1]],word[2]);
 return q(name,null,null,/\d/.test(tail)?'원문 숫자의 단위가 없어 임의 환산하지 않음':undefined);
}

const cutBefore={
 'blog-778':'[돼지고기 감자조림 비빔밥]','blog-777':'[깍두기 볶음밥]','blog-773':'[김치 크림 파스타]',
 'blog-771':'[볶음밥]','blog-770':'[절인 오이]','blog-768':'[명란 새우장 초밥]','blog-763':'[장조림 버터 덮밥]',
 'blog-762':'[부추장 활용 레시피]','blog-761':'[카레소스]','blog-760':'[새우장 덮밥]','blog-758':'[찹쌀누룽지죽]',
 'blog-755':'[오징어 내장 파스타]','blog-754':'[볶음밥]','blog-753':'[닭칼국수]','blog-752':'[새우장 덮밥]',
 'blog-746':'[두부볶음 덮밥]','blog-744':'[토스트]',
 'blog-735':null,'blog-733':'[볶음밥]','blog-718':'[비빔국수 소스]',
 'blog-715':'[삶은 양지, 양지 육수]','blog-708':'[매콤 새우크림파스타]','blog-707':'[볶음밥]',
 'blog-700':'[순댓국]','blog-696':'[동파육덮밥]','blog-681':'[무생채 볶음밥]',
 'blog-668':'[소고기 국수]','blog-722':'[갈치속젓 양념장]','blog-672':'[마늘 계란 볶음밥]',
 'blog-656':'[트러플 크림 파스타]','blog-705':'[겉절이]'
};
const menuOverrides={
 'blog-793':'한입 파김치','blog-792':'막김치','blog-785':'배추 한 포기 겉절이',
 'blog-715':'사골국','blog-700':'돼지사골육수','blog-718':'들기름 막국수','blog-681':'무생채',
 'blog-722':'청양고추채 장아찌','blog-409':'간장게장','blog-672':'알리오올리오 소스',
 'blog-656':'트러플 페이스트'
};
const holdReasons={
 'blog-772':'제조한 샤브샤브죽 밀키트 전체 중110g 사용의 원재료 배분 비율 확인 필요.',
 'blog-768':'명란 소스 재료표에 다진마늘1숟가락이 두 번 반복되어 원문 중복 여부 확인 필요.',
 'blog-775':'뼈 육수 제조 전체와 완성 육수2L 사용의 관계 추가 확인 필요.',
 'blog-756':'명란 삼겹살의 주요 재료량이 없고 완성 솥밥 사용량도 없어 분량 확인 필요.',
 'blog-745':'고추파기름·소스 제조량과 국수 사용량·배분 관계 추가 확인 필요.',
 'blog-444':'고추장버터 제조량250g 중 솥밥 사용량이 없어 원재료 배분 비율 확인 필요.',
 'blog-751':'홍합 제조량과 일부 육수 사용·우유150nl 원문 표기의 분량 추가 확인 필요.',
 'blog-731':'대량 차돌탕 육수 제조와 한 그릇에 쓰는 부분 분량 확인 필요.',
 'blog-770':'수육 전골과 냉면에 나누는 아롱사태·육수 사용 분량 확인 필요.',
 'blog-704':'돼지갈비와 앞다리살 합계2kg의 각 재료 배분량 확인 필요.',
 'blog-692':'염지한 닭의 원문 중량·개수가 재료표에 없어 전체 요리 분량 확인 필요.',
 'blog-685':'준비한 봄동겉절이·무생채·부추나물과 비빔밥 사용 분량 확인 필요.',
 'blog-674':'두태기름 제조500g 중250ml 사용의 비율이 명시되지 않아 원재료 배분 확인 필요.',
 'blog-632':'동파닭 재료표에 주재료 닭이 누락되고 직접 제조 소스의 사용 비율 확인 필요.',
 'blog-725':'어복쟁반·평양냉면의 고기 및 육수 배분 비율 확인 필요.',
 'blog-622':'대량 돼지국밥·뼈해장국의 원재료와 육수 분량 배분 확인 필요.',
 'blog-608':'썬드라이토마토 페이스트 제조와 여러 후속 요리의 사용 비율 확인 필요.',
 'blog-604':'두바이초콜릿 아이스크림과 직접 제조 면 재료 구획의 사용 비율 확인 필요.',
 'blog-630':'쉬림프박스·갈릭새우파스타 두 완성 요리의 새우·소스 분량 배분 확인 필요.',
 'blog-634':'묵은지참치말이 재료표에서 쌈용 묵은지·데리야키소스가 빠져 주재료 총량 확인 필요.',
 'blog-679':'김밥샌드의 주재료 밥·삼겹살·콩나물 분량이 모두 없어 전체 양 확인 필요.',
 'blog-575':'푸틴 주재료 러셋감자의 수량이 없어 소스량만으로 인분 확정하지 않음.',
 'blog-626':'소꼬리와 잡뼈 합계 중량의 각 재료 배분량 확인 필요.',
 'blog-613':'재료표 미림0.5숟가락과 본문 미원0.5숟가락이 서로 다른 재료로 충돌하여 원문 추가 확인 필요.',
 'blog-636':'재료표 물100g과 본문 물150ml가 달라 임의 단위·수량 변경 없이 원문 추가 확인 필요.',
 'blog-532':'햄까스의 주재료 햄·빵가루·계란 등 수량이 없고 후속 곁들임 사용 분량 확인 필요.',
 'blog-686':'우동다시 전체 제조와 추가 물·설탕 및 완성 우동의 사용 분량 확인 필요.',
 'blog-701':'스테이크용 고기500g의 축종이 재료표·본문 모두 명시되지 않아 원재료 추가 확인 필요.',
 'blog-572':'스테이크용 고기1kg의 축종이 재료표·본문 모두 명시되지 않아 원재료 추가 확인 필요.',
 'blog-512':'다짐육350g의 축종이 재료표·본문 모두 명시되지 않아 원재료 추가 확인 필요.',
 'blog-453':'등심300g의 축종이 재료표·본문 모두 명시되지 않아 원재료 추가 확인 필요.',
 'blog-421':'다진 돼지고기 반죽을 여러 요리에 나누는 사용 분량 확인 필요.',
 'blog-402':'뒥셀 제조 전체와 후속 요리에 쓰는 사용량이 섞여 대표 메뉴 분량 확인 필요.',
 'blog-398':'동그랑땡 반죽과 여러 튀김 대안 재료가 함께 있어 대표 분량 확인 필요.'
};
const intermediate=new Set(['양념','양념장','명란 소스','해동한 새우','밑간한 새우','풀드포크','명란 새우장','데친 가오리','해동한 가오리','콩물','참깨 소스','구운 닭다리살','고추파기름','미소 소스','부타니라타마 소스','채수','오삼불고기','양배추 계란물']);
const omitRows={
 'blog-784':['육수 : 200ml'],'blog-707':['육수 : 200ml'],
 'blog-675':['육수 : 50ml'],'blog-668':['고기 삶은 육수 : 50ml'],
 'blog-526':['닭육수 : 300ml','닭육수 : 50ml','닭육수 : 2숟가락','닭지방'],
 'blog-714':['차돌박이 육수 : 2숟가락'],
 'blog-678':['콩나물 채수 : 500ml'], 'blog-664':['다진 오징어','육수','콩나물'],
 'blog-637':['면수 : 150ml'],'blog-702':['면수'],'blog-740':['밑간한 삼겹살'],
 'blog-465':['라면스프 : 1개'],
 'blog-657':['가리비찜 국물 : 500ml'],
 'blog-648':['육수 : 400ml','들깨초장 양념장']
};
const nonRows=/^(?:반응형|재료|양념|소스|믹서기|조리도구|김밥용 풀|볶은 채소|기본 양념|토핑|고명|조리|솥밥|불린 쌀|채소 손질)\s*[:：]?$/;
const sectionRE=/^(?:\[[^\]]+\]|<[^>]+>|\([^)]*믹서[^)]*\)|[가-힣 ]+(?:조리|양념장|손질|밑간|소스)\s*:)$/;
const rowsFor=e=>{
 let text=e.ingredientText??'';
 if(cutBefore[e.sourceId]&&text.includes(cutBefore[e.sourceId]))text=text.split(cutBefore[e.sourceId])[0];
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).filter(raw=>!nonRows.test(raw)&&(!sectionRE.test(raw)||raw.startsWith('['))&&!/^\*?\s*\(?\d+\s*(?:[~～-]\s*\d+\s*)?인분.*기준/.test(raw)&&!/^\(?\d+\s*인분.*기준/.test(raw)&&!/^재료\s*\(/.test(raw)&&!(e.sourceId!=='blog-524'&&/^\(파이틀/.test(raw))&&!/^\((?:파이 |김밥 |물 같은 식감|조리도구)/.test(raw)&&!/^\*|^Q\.|^(?:위 두 재료는|동영상 서비스|완성된)/.test(raw));
 if(e.sourceId==='blog-465')return lines.filter(line=>line!=='라면 2개 기준');
 if(e.sourceId==='blog-727')return lines.filter(line=>line!=='닭 (2마리) : 2kg');
 if(e.sourceId==='blog-648')return lines.map(line=>line==='[추후 1L 추가]'?'추후 1L 추가':line);
 if(e.sourceId==='blog-638')return lines.filter(line=>!['알배추','쪽파','무생채'].includes(line));
 if(e.sourceId==='blog-705'){let found=false;return lines.filter(line=>{if(line!=='바지락 : 1kg')return true;if(found)return false;found=true;return true;});}
 return lines;
};
function menuName(e){
 let name=(menuOverrides[e.sourceId]||e.menuNameCandidate||e.sourceTitle||'').trim().replace(/^[<《「\[\s]+|[>》」\]\s]+$/g,'').replace(/\s*(?:레시피|썸네일)\s*$/,'').trim();
 name=name.replace(/^(?:밥솥으로 만드는|에어프라이어로 만드는)\s*/,'');
 if(/\([^)]*\)/.test(name))name=name.replace(/\s*\([^)]*\)\s*/g,' ').trim();
 if(/^[<《]/.test(name))name=name.slice(1).trim();
 if(/만드는|방법|만들기|합니다|하세요|해보|쉽게|끓이는|먹는|보다|이렇게|그냥|제대로|맛있는|업그레이드|활용한/.test(name)||name.length>35){
  const t=e.sourceTitle||'';
  const bracket=[...t.matchAll(/\(([^()]{2,30})\)/g)].map(m=>m[1]).find(s=>s.includes('레시피'));
  if(bracket)name=bracket.replace(/레시피/g,'').trim();else throw Error('구체 메뉴명 추가 확인 필요: '+name);
 }
 if(!name||name.length<2||!/^[가-힣A-Za-z0-9 ·.%-]+$/.test(name))throw Error('메뉴명 추가 확인 필요: '+name);
 const evidence=[e.menuNameCandidate,e.sourceTitle,e.ingredientText].find(s=>s&&key(s).includes(key(name)));if(!evidence)throw Error('메뉴명 원문 근거 없음: '+name);
 return {name,evidence:name};
}
function classify(name){
 if(/파스타|스테이크|샌드위치|햄버거|버거|피자|리조또|잠발라야|미트로프|로코모코|그라탕|파니니|라자냐|라따뚜이|뇨끼|고르곤졸라|케사디아|퀘사디아|파히타|부르기뇽|코코뱅|웰링턴/.test(name))return ['양식',/파스타/.test(name)?'파스타':/스테이크/.test(name)?'스테이크':'요리'];
 if(/짬뽕|짜장|중화|마파|동파육|유린|깐풍|몽골리안|탕수|차오미엔|차오미엔|차오미엔|어향|라즈지|멘보샤|중식|홍콩|마라샹궈/.test(name))return ['중식',/면|짬뽕|짜장/.test(name)?'면':'볶음'];
 if(/규동|부타동|우동|야끼|카츠|가츠|돈까스|스키야키|나베|돈부리|아부라소바|소바|가라아게|카라아게|나스덴카쿠|부타니라타마/.test(name))return ['일식',/동$|덮밥/.test(name)?'덮밥':'요리'];
 if(/소스|양념장|버터$|잼$|젬$|부추장$|육수$|페이스트|시럽|수박청|토마토$/.test(name))return ['그 밖','소스'];
 if(/주스|화채|아이스크림|크레페|케이크|파이|초콜렛|초콜릿|푸틴/.test(name))return ['그 밖','간식'];
 if(/국수|국밥|솥밥|볶음밥|덮밥|비빔밥|죽$|김밥|밥$|칼국수|라면|수제비/.test(name))return ['한식 주메뉴',/밥/.test(name)?'밥':/죽$/.test(name)?'죽':'면'];
 if(/국$|탕$|찌개|전골/.test(name))return ['한식 국·찌개',/찌개/.test(name)?'찌개':/탕$/.test(name)?'탕':'국'];
 if(/김치|장아찌|나물|무침|생채|소박이|볶음$|조림$|겉절이|부침|전$|장조림|새우장|게장/.test(name))return ['한식 반찬',/김치|소박이/.test(name)?'김치':/무침|생채/.test(name)?'무침':/조림/.test(name)?'조림':/전$/.test(name)?'전':'반찬'];
 return ['한식 주메뉴',/찜/.test(name)?'찜':/구이/.test(name)?'구이':'요리'];
}
function portion(e,name,parsed,category){
 // Once reviewed, retain that decision when the shared ingredient catalog grows.
 if(Number.isFinite(e.baseServings)&&e.baseServings>0&&e.servingsEvidence&&['explicit','estimated'].includes(e.servingsStatus)){
  return {n:e.baseServings,status:e.servingsStatus,evidence:e.servingsEvidence,...(e.servingsRange?{range:[e.servingsRange.min,e.servingsRange.max]}:{})};
 }
 if(e.sourceId==='blog-524')return {n:4,status:'estimated',evidence:'원문 파이4개 분량의 속재료와 1호파이1개 기준 시트 재료를4배 반영한 전량을4인분으로 편집 추정. 원작자의 전체인분 명시 아님(2026-11-23 사용자 승인).'};
 const selectedText=rowsFor(e).join('\n');
 const mainText=(e.ingredientText??'').split(/\n/).slice(0,3).join('\n');
 const explicit=mainText.match(/(?:^|\s|\()([1-9]\d?)\s*(?:[~～-]\s*([1-9]\d?))?\s*인분\s*(?:기준|\))/);
 if(explicit){const n=+(explicit[2]??explicit[1]);return {n,range:explicit[2]?[+explicit[1],+explicit[2]]:null,status:'explicit',evidence:`공식 블로그 원문 ${explicit[0].trim()} 명시. 범위는 그대로 표시하고 계산은 상한 사용.`};}
 const flat=parsed.flat().filter(r=>r.sourceAmount!==null);
 const mass=r=>r.unit==='kg'?r.sourceAmount*1000:r.unit==='g'?r.sourceAmount:0;
 const volume=r=>r.unit==='L'||r.unit==='리터'?r.sourceAmount*1000:r.unit==='ml'||r.unit==='mL'?r.sourceAmount:0;
 const pick=(re)=>flat.filter(r=>re.test(r.name)&&mass(r)>0).reduce((sum,r)=>sum+mass(r),0);
 const rice=pick(/^(?:쌀|씻은쌀|안남미|찹쌀)$/),cooked=pick(/^(?:밥|현미밥|쌀밥|즉석밥)$/);
 const noodles=pick(/파스타|스파게티|소면|메밀면|페투치네|칼국수|중화면|우동/);
 const noodlePacks=flat.filter(r=>/라면|볶음면|컵누들|우동|국수/.test(r.name)&&!/스프/.test(r.name)&&['개','봉','봉지','인분','컵'].includes(r.unit));
 const protein=pick(/고기|삼겹|갈비|목살|앞다리|소꼬리|양지|사태|닭|오리|오징어|새우|낙지|쭈꾸미|주꾸미|굴$|해물|홍합|꼬막|백합|꽃게|관자|가리비|아귀|동태|칠게|소시지|베이컨|두부|항정살|장어|돼지|족발|장족|차돌/);
 const wholeChicken=pick(/^(?:닭|토막 낸 닭|통닭다리|닭날개|닭봉|닭다리)$/);
 const wholeSeafood=pick(/^(?:홍합|백합|꼬막|꽃게|홍가리비|가리비|동태|아귀|가오리 날개|칠게)$/);
 const bones=pick(/등뼈|목뼈|소꼬리|돼지갈비|소갈비|사골|잡뼈/);
 const vegetables=flat.filter(r=>/양파|무$|배추|쪽파|깻잎|오이|부추|콩나물|가지|버섯|감자|양배추|고추|수박 속껍질/.test(r.name)).reduce((sum,r)=>sum+mass(r),0);
 let n;
 if(/김치|장아찌|겉절이/.test(name)&&category==='한식 반찬')n=Math.max(2,Math.ceil(vegetables/100));
 else if(category==='그 밖'&&/주스|화채|아이스크림|크레페|케이크|파이|초콜렛|초콜릿/.test(name)){
  const foodMass=flat.filter(r=>!['물','식용유','설탕','소금','얼음'].includes(r.name)).reduce((sum,r)=>sum+mass(r),0);
  n=Math.max(2,Math.round(foodMass/(/주스|화채/.test(name)?250:120)));
 }else if(category==='그 밖'&&/육수/.test(name)&&bones)n=Math.max(2,Math.round(bones/300));
 else if(category==='그 밖'){
  const dominant=Math.max(0,...flat.map(r=>Math.max(mass(r),volume(r))));n=Math.max(2,Math.ceil(dominant/40));
 }else if(noodlePacks.length)n=Math.max(1,Math.round(noodlePacks.reduce((sum,r)=>sum+r.sourceAmount,0)));
 else if(rice||cooked||noodles)n=Math.max(1,Math.round(Math.max(rice/120,cooked/200,noodles/(/칼국수|중화면|우동/.test(name)?200:100))));
 else if(bones)n=Math.max(2,Math.round(bones/300));
 else if(protein)n=Math.max(1,Math.round((protein-wholeChicken-wholeSeafood)/180+wholeChicken/330+wholeSeafood/300));
 else if(pick(/노란콩|병아리콩|팥/))n=Math.max(1,Math.round(pick(/노란콩|병아리콩|팥/)/80));
 else if(vegetables)n=Math.max(2,Math.round(vegetables/180));
 else{
  const count=flat.find(r=>/계란|닭|라면|소시지|새우|유부|두부|꽃게|갈비|장어|컵누들/.test(r.name)&&['개','알','모','봉','봉지','마리','컵','인분'].includes(r.unit));
  if(count)n=Math.max(1,Math.round(count.sourceAmount/(count.name==='계란'?2:1)));
  else throw Error('전체 요리 기준 인분 근거 추가 확인 필요');
 }
 n=Math.min(60,n);
 const basis=[...noodlePacks,...flat.filter(r=>mass(r)>0||volume(r)>0)].slice(0,5).map(r=>`${r.name}${r.sourceAmount}${r.unit}`).join('·')||flat.slice(0,4).map(r=>`${r.name}${r.sourceAmount}${r.unit}`).join('·');
 return {n,status:'estimated',evidence:`공식 블로그 원문 ${basis} 등 선택한 요리 전체 재료량을 ${n}인분으로 편집 추정. ${wholeChicken||wholeSeafood?'뼈·껍질 포함 주재료를 순살과 구별하여 추정. ':''}${category==='한식 반찬'||category==='그 밖'?'곁들임·나누어 먹는 분량':'한 끼 식사 분량'} 기준이며 원작자 명시 인분 아님(2026-11-23 사용자 승인).`};
}

export const batch50=[];
export const definitions=[];
export const lineOverrides={};
export const servingsOverrides={};
export const intermediateRows=new Map();
export const groupPolicy=(id,group)=>id==='blog-524'&&group==='파이틀 1호 1개 기준'?{scale:4,reason:'원문 속재료는파이4개분량, 시트는1호파이1개분량이므로4개전체에맞춰4배 반영'}:{scale:1};
export const skips=[];
const selected=new Map();
export const auditProblems=[];
const mine=new Set(index.entries.slice(0,391).map(e=>e.sourceId??'blog-'+e.url.split('/').at(-1)));
for(const e of source.entries.filter(e=>mine.has(e.sourceId))){
 try{
  if(!e.ingredientText)throw Error(e.heldReason||'원문 재료표 추가 확인 필요');
  if(holdReasons[e.sourceId])throw Error(holdReasons[e.sourceId]);
  const menu=menuName(e),[category,type]=classify(menu.name),lines=rowsFor(e),parsed=[],overrides={},omitted=[];
  const labels=new Set([...e.ingredientText.matchAll(/^\[([^\]]+)\]/gm)].map(m=>m[1]));
  for(const line of lines){
   if(line.startsWith('[')||line.startsWith('(파이틀'))continue;
   if(intermediate.has(line)||(labels.has(line)&&!specificRows[e.sourceId]?.[line])||(omitRows[e.sourceId]??[]).includes(line)){omitted.push(line);continue;}
   if(/조리도구|필러|감자칼|믹서기/.test(line))continue;
   const p=parse(line,e.sourceId);if([p].flat().some(r=>r.sourceAmount!==null&&(!Number.isFinite(r.sourceAmount)||r.sourceAmount<=0)))throw Error('양수 수량 확인: '+line);parsed.push(p);overrides[line]=p;
  }
  if(!parsed.length||parsed.flat().every(r=>r.sourceAmount===null))throw Error('전체 재료 수량 미기재로 인분·장보기량 확인 필요');
  const servings=portion(e,menu.name,parsed,category);
  batch50.push([e.sourceId,menu.name,servings.n,type,category,...(servings.range?[servings.range]:[])]);
  lineOverrides[e.sourceId]=overrides;intermediateRows.set(e.sourceId,omitted);
  servingsOverrides[e.sourceId]={status:servings.status,evidence:servings.evidence};
  selected.set(e.sourceId,{menu,lines,omitted,cut:cutBefore[e.sourceId]});
 }catch(error){const reason=error.message;skips.push({sourceId:e.sourceId,reason});auditProblems.push({sourceId:e.sourceId,reason});}
}
const used=new Set(Object.values(lineOverrides).flatMap(map=>Object.values(map).flat().map(p=>key(p.name))));
for(const [k,definition] of newNames)if(used.has(k))definitions.push(definition);
export function prepareText(e){
 const decision=selected.get(e.sourceId);if(!decision)throw Error('검수 선정 메뉴가 아닙니다: '+e.sourceId);
 e.nameSource='official-blog';e.nameSourceText=decision.menu.evidence;
 if(decision.cut)e.ingredientClarification=`원본의 후속 활용 요리 구획 ${decision.cut}는 별도 요리로 합산하지 않음.`;
 if(decision.omitted.length)e.ingredientClarification=[e.ingredientClarification,'제조 원재료가 이미 포함된 중간 조리물은 중복 구매로 합산하지 않음.'].filter(Boolean).join(' ');
 if(e.sourceId==='blog-705')e.ingredientClarification=[e.ingredientClarification,'같은 바지락1kg의 해감·본조리 재표시는 원재료1kg만 한 번 반영.'].filter(Boolean).join(' ');
 if(e.sourceId==='blog-465')e.ingredientClarification=[e.ingredientClarification,'원문 표제의 라면2개에 동봉된 스프1개를 사용하는 것이므로 스프를 별도 구매로 중복 합산하지 않음.'].filter(Boolean).join(' ');
 if(e.sourceId==='blog-638')e.ingredientClarification='겉절이 양념장 제조 전량만 등록. 소분한 양념장을 사용하는 별도 활용 예시의 알배추·쪽파·무생채는 이번 양념장 구매 재료로 합산하지 않음.';
 if(e.sourceId==='blog-727'){
  e.ingredientClarification='2026-11-23 사용자 확인: 닭은 1kg짜리2마리 총2kg. 재료표의 두 닭2kg 표기는 같은 분량을 반복한 것이므로 닭2kg을 한 번만 합산.';
  e.sourceCorrections=[{ingredient:'닭',originalText:'닭 : 2kg / 닭 (2마리) : 2kg',sourceTexts:['닭 : 2kg','닭 (2마리) : 2kg'],reviewer:'사용자',confirmedBy:'사용자 확인',checkedOn:'2026-11-23',amount:2,unit:'kg',reason:'1kg짜리2마리 총2kg이며 두 행이 같은 수량을 나타낸다고 사용자 확인. 중복 합산하지 않음.'}];
 }
 return decision.lines.map(line=>e.sourceId==='blog-524'&&line==='(파이틀 1호 1개 기준)'?'[파이틀 1호 1개 기준]':line).join('\n');
}
