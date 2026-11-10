// Only the previously inspected, user-approved candidate IDs may be estimated.
// Unparsed text is held, never silently dropped or assigned an invented amount.
import { readFile, writeFile } from 'node:fs/promises';
import { hash, explicitServing, normalizeName, auditAndMerge } from './import-mfds.mjs';
import { parseWrittenAmount, parsePlainAmount } from './mfds-quantity.mjs';
const read = async p => JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const write = async (p,v) => writeFile(new URL('../'+p,import.meta.url),JSON.stringify(v,null,2)+'\n');
const policy=await read('data/source/mfds-expansion-policy.json');
const snapshot=await read('data/source/mfds-response.json');
if(hash(JSON.stringify(snapshot.COOKRCP01.row))!==policy.approvedSnapshotHash) throw Error('승인 후 원본 목록이 변경되었습니다. 재검토가 필요합니다.');
const supplement=await read('data/source/mfds-supplement.json');
const ingredients=await read('data/ingredients.json'), allRecipes=await read('data/recipes.json');
const allReviews=await read('data/source/mfds-reviews.json');
const batchIds=new Set(allReviews.filter(r=>r.reviewBatch==='2026-11-10-expansion').map(r=>`mfds-cookrcp01-${r.sourceId}`));
const recipes=allRecipes.filter(r=>!batchIds.has(r.id));
const baseRecipes=structuredClone(recipes);
const reviews=allReviews.filter(r=>r.reviewBatch!=='2026-11-10-expansion');
const candidates=new Set(policy.candidateIds);
const bakery=/빵|쿠키|타르트|케이크|케익|스콘|브라우니|머핀|파운드|베이글|깜빠뉴|비스킷|마들렌|와플/;
const pickle=/장아찌|동치미|짱아지|김치|깍두기|피클|절임/;
const norm=s=>s.replace(/\s/g,'');
const additions=[], held=[], proposedNames=new Set();
const kinds={'찌기':'찜','끓이기':'끓이기','굽기':'구이','볶기':'볶음','튀기기':'튀김','기타':'기타'};
const knownNames=new Map(ingredients.flatMap(i=>[i.name,...i.aliases].map(n=>[norm(n),i])));

function parse(row) {
  const raw=row.RCP_PARTS_DTLS, serving=explicitServing(raw), labels=[];
  let body=serving ? raw.slice(serving[0].length) : raw;
  // Source formatting and named ingredient sections are recorded as exact spans.
  body=body.replace(/[가-힣][가-힣 \t·-]*[:：]/gu,m=>{labels.push(m);return '\n';});
  body=body.replace(/<\/?strong>|<br\s*\/?\s*>|[•●]|\[[^\]\n]*\]/giu,m=>{labels.push(m);return '\n';});
  body=body.replace(/^(\s*재료\s+)|^(\s*(?:주재료|양념|부재료)\s*)$/gmu,m=>{labels.push(m);return ' ';});
  const lines=body.split('\n');
  body=lines.map(line=>{
    const sections={'85':['케일 샐러드','오미자 드레싱'],'18':['버섯볶음','두유 소스','곁들임'],'39':['냉스프','고명'],'3769':['소바육수 재료']};
    if(line.trim() && !/\d|[½⅓⅔¼¾⅛]/u.test(line) && (norm(line)===norm(row.RCP_NM) || sections[row.RCP_SEQ]?.includes(line.trim()))) {labels.push(line.trim());return '';}
    return line;
  }).join('\n');
  let depth=0, start=0; const chunks=[];
  for(let i=0;i<=body.length;i++) {
    if(body[i]==='(') depth++;
    if(body[i]===')') depth--;
    if(depth<0) throw Error('괄호 불일치');
    const nextIngredient=depth===0 && body[i]===' ' && /(?:\d(?:mg|g|ml|mL)|약간|적당량|\))$/.test(body.slice(start,i)) && /^\s+[가-힣]/u.test(body.slice(i));
    if(i===body.length || (depth===0 && /[,\n]/.test(body[i])) || nextIngredient) {
      const chunk=body.slice(start,i).trim(); if(chunk) chunks.push(chunk); start=i+1;
    }
  }
  if(depth) throw Error('괄호 불일치');
  const items=[], definitions=[];
  for(let text of chunks) {
    text=text.replace(/^[\s*\-<>\[\]]+|[\s*\-<>\[\].]+$/gu,m=>{if(m.trim()) labels.push(m.trim());return '';});
    if(!text) continue;
    const heading=text.match(/^(?:저염간장양념|허브오일드레싱|복분자소스|쇠고기 양념장|조림양념|유자드레싱|밥 밑간|톳 무침양념|참치밑간|사과드레싱|토마토소스|닭고기 삶는 재료|비빔소스|고기 밑간|완두콩드레싱|피시볼반죽|새알심|보리된장|배사과소스|홍초물|레몬소스|양념장|양념|소스[123]?|육수|달래무침|해초 밑간|주먹밥|두부강된장)\s+/u);
    if(heading && /^[가-힣]/u.test(text.slice(heading[0].length))) {labels.push(heading[0]);text=text.slice(heading[0].length);}
    let name, parsed, format, m;
    if((m=text.match(/^(.+?)\s*(약간|소량|적당량)$/u))) {
      name=m[1].trim();parsed={amount:null,unit:null};format='qualitative';
    } else if((m=text.match(/^(.+?)\s*(\d+\/\d+|\d+(?:\.\d+)?)\s*(mg|kg|g|ml|mL|L|㎖|개|장|대|마리|모|쪽|컵|알|T|t)(?:\s*\([^()]*\))?$/u))) {
      name=m[1].trim(); parsed=parsePlainAmount(text.slice(name.length).trim());format='plain';
    } else if((m=text.match(/^([^()]+?)\s*\(([^]*)\)$/u))) {
      name=m[1].trim(); const quantity=m[2].trim();
      // Nested annotations are accepted only after an unambiguous primary amount.
      const q=quantity.match(/^(\d+(?:\.\d+)?)(g|mg|ml|mL|개|장)(?:\([^()]*\))$/u);
      try {parsed=q ? {amount:Number(q[1]),unit:q[2]} : parseWrittenAmount(quantity);}
      catch {parsed={amount:null,unit:null};format='unresolved';}
    } else if(knownNames.has(norm(text)) || categoryFor(text)) {name=text;parsed={amount:null,unit:null};format='unquantified';}
    else throw Error('재료·수량 구분 확인: '+text);
    if(!/^[가-힣a-zA-Z][가-힣a-zA-Z\s·()-]*$/u.test(name) && !categoryFor(name)) throw Error('복합 재료명 확인: '+name);
    if(/약간|적당량|소량/u.test(name)) throw Error('재료 경계 확인: '+name);
    const known=knownNames.get(norm(name));
    const id=known?.id || `mfds-ingredient-${hash(name).slice(0,12)}`;
    if(!known) {
      proposedNames.add(name);
      const category=categoryFor(name) || (process.argv.includes('--names')?'두부·계란·기타':null);
      if(!category) throw Error('재료 분류 검수 필요: '+name);
      const definition={id,name,aliases:[],category,isSeasoning:category==='양념·조미료',isQuickPick:false};
      if(!definitions.some(d=>d.id===id)) definitions.push(definition);
    }
    items.push({ingredientId:id,sourceName:name,sourceText:text,...(format?{sourceFormat:format}:{}),...parsed,note:`${format==='unresolved'?'원문 수량 범위·복합 표기 확인 필요; ':''}원문 재료: ${text}`});
  }
  if(!items.length) throw Error('재료 없음');
  return {sourceId:row.RCP_SEQ,sourceHash:hash(raw),reviewedOn:policy.approvedOn,reviewBatch:'2026-11-10-expansion',
    baseServings:serving?Number(serving[1]||serving[2]):1,
    servingEvidence:serving?.[0]??null,
    ...(!serving?{servingsStatus:'estimated',assumptionApprovedOn:policy.approvedOn,servingsEvidence:`원문 인분 미표기. 전체 목록 사전 검토 후보 ${row.RCP_SEQ}; ${items.slice(0,4).map(i=>i.sourceText).join(' · ')} 등 전체 재료량을 대조해 1인분으로 추정. 개인별 식사량 차이가 있으며 소스는 별도 인분 계산 없이 원문량 유지. ${row.RCP_SEQ==='353'?'우유 180mg은 사용자 요청으로 원문 그대로 유지.':''}`} : {}),
    cookingType:kinds[row.RCP_WAY2],sectionLabels:labels,ingredientDefinitions:definitions,ingredients:items};
}

// Exact names are reviewed below; unknown names remain pending rather than guessed.
const groups={
  '채소·버섯':new Set('애느타리버섯|치커리|호박|컬리플라워|민들레 잎|호박잎|산마|홍고추|콩나물|두릅|건곤드레|우엉|백일송이버섯|배|오이고추|도라지|배추|빨간 파프리카|얼갈이 배추|건조미역줄기|건 표고버섯|양송이|쌈채|머윗대|다진 실파|비름나물|머위대|수박 속껍질|취나물|쑥|무청시래기 불린 것|부추|홍피망|양배추|오렌지|마|토란|무|연근|완두콩|통마늘|건미역|통배추|락교|쌈추|참나물|그린빈스|알감자|감태|김|표고버섯마른것|꽈리고추|열무|양파다진것|멜론|당근다진것|파채|목이버섯|건목이버섯|죽순|건취나물|단호박작은것|키위|적양배추|할라피뇨|감귤|상추|청고추다진것|그린비타민|비트|적양파|참마|치자|포항초|참취|돼지호박|봄동|청고추|파인애플|생강|래디쉬|청피망|브로컬리|수삼|톳나물|알비트|만가닥버섯|고구마순|고사리|매생이|통도라지|고추|불린 곤드레나물|황금팽이버섯'.split('|')),
  '육류·해산물':new Set('국물용 멸치|대구살|오리고기|통삼겹살|다진 소고기|삼치|통오징어|닭고기|연어|주꾸미|대하|전복|소등심|홍합|황태|닭가슴살|바지락|문어|오징어 몸통|꼬막|다진소고기|돼지고기 목심|병어|소불고기|조개살|베이컨|갈치|고등어|낙지|돼지고기 등심|조기|다진 쇠고기 등심|돼지고기사태|닭다리살|꽃게|새뱅이|우목심|양고기|코다리|가자미살|게살|차돌박이|부챗살|명태포|쇠고기 등심|등갈비|쇠고기등심|돼지등심|돈민찌|돼지고기 삼겹살|도미|굴|골뱅이|금태|꽁치|멸치중간것|훈재연어|갑오징어|백새우|연어 필레|돼지고기목살|돼지목살다진것|돈등심|손질된 고등어|쇠고기사태|돼지고기다진것|돼지고기살코기|도미살|돼지갈비|바지락살|흰살 생선|쇠고기안심|쇠고기다진것|쇠고기갈은것|진미채|가츠오부시'.split('|')),
  '두부·계란·기타':new Set('다진 땅콩|귀리밥|또띠아|스파게티|연두부|바나나|실곤약|땅콩가루|흑임자|현미|검은콩두유|유기농 아기치즈|옥수수알|청포묵|호두|미숫가루|우리밀가루|캐슈넛|시판 크루통|누들 떡볶이 떡|메밀면|탈리아텔레|쌈두부|양장피 면|백미|밀가루|묵은지|요구르트|삶은 스파게티|연두부큰것|콩비지|떡볶이떡|좁쌀|불린 쌀|유부|펜넬파스타|찰어묵|까망베르치즈|찹쌀|오트밀|메밀가루|옥수수전분|옥수수|달걀물|치즈슬라이스|통아몬드|물전분|잡곡|현미찹쌀|두부작은것|에벤탈치즈|생모짜렐라치즈|당면|검은깨|콩|녹말가루|대두|계란노른자|퀴노아|캔참치|병아리콩|포두부'.split('|')),
  '양념·조미료':new Set('올리브오일|요리술|울금가루|통깨|커리 소스|발사믹크림|들깨가루|머스터드|토마토소스|버터|굴소스|해선장|새우가루|함초가루'.split('|'))
};
function categoryFor(name) {return Object.entries(groups).find(([,names])=>names.has(name))?.[0];}
for(const [category,names] of Object.entries({
 '채소·버섯':'실파다진것|청·홍고추다진것|양파채친것|통조림 홀토마토|미나리잎장식|피망채친것|2가지색 미니파프리카',
 '육류·해산물':'닭고기가슴살|통조림 참치',
 '두부·계란·기타':'젖은 찹쌀가루|해조국수|현미밥|얼음',
 '양념·조미료':'소금물|바질페스토|가람마살라|로즈마리마른것|데미글라스|오레가노가루|디존 머스타드|그린커리|현미식초|코리앤더파우더|강황|우스터소스|3배 식초|2배 양조식초|커민파우더|코리앤더가루|케이엔페퍼|레드크러쉬드 페퍼'
})) for(const name of names.split('|')) groups[category].add(name);
for(const [category,names] of Object.entries({
 '채소·버섯':'표고버섯 기둥|양송이버섯 밑동|송송 썬 붉은 고추|피망|찐 감자|마른미역|샐러리 채친것|오렌지(껍질)|레몬(껍질)|표고버섯(마른것)|풋고추|복분자|얇게 썬 생강|베이비채소|구기자|알토란|깐생강|양파작게자른것|당근 채친것|인삼|깐연근|깻잎순|대파채친것|천도복숭아|보라로즈케일|흰로즈케일|그린 샐러드|민트|자두',
 '육류·해산물':'삶은 닭가슴살|다진 건새우|낙지다리|닭고기(가슴살)|한돈(사태)|쇠고기(우둔)|돼지고기(불고기용)|소고기(양지)|돼지고기(삼겹살)|우육(분쇄육)|앞다리살 돈육(보쌈용)|돼지갈비(바비큐용)|소고기(다짐육)|게살(크래미)|슬라이스연어|새우(대하)|돼지고기(전지)|돈육(분쇄육)|흰살생선|닭봉|블랙타이거새우',
 '두부·계란·기타':'리코타 치즈|검은 깨|검정콩(서리태)|삶은 완두콩|보리|흰깨|현미(불린것)|크래미|도토리묵|잡곡밥|해바라기씨',
 '양념·조미료':'매실청|파프리카가루|홀그레인 머스터드|통후추부순것|계피가루|굵은소금|타임마른것|소금(데치는용)|소금(쓴맛 제거용)|생강즙|저염소금|조청|파인애플청|다시마물|바질럽드|정향|골뱅이 국물|레드와인식초|바질가루|오미자물|요리당|청국장가루|타바스코'
})) for(const name of names.split('|')) groups[category].add(name);
for(const [category,names] of Object.entries({
 '채소·버섯':'빨강 파프리카|홍파프리카|황파프리카|청파프리카|민들레 잎|파슬리|레디쉬|돈나물|어린잎|붉은 고추|아욱|로즈마리|새싹채소|수박껍질|케일|비타민|말린 토마토|무순|톳|생김|김밥용 김|굵게 다진 사과|건조미역|해초|함초|대파뿌리|미역|미니새송이|마른고추|샐러리|말린 매생이|오레가노|마른 미역|송송 썬 청양고추|마른 표고버섯|달래|딸기|어린싹|만송이버섯|라임|노란 파프리카|더덕|밤|곶감|노란색 파프리카|수박|적채|양파 껍질|돌나물|말린 청양고추|홍시|건대추|그린치커리|라디치오|적파프리카|건다시마|주황파프리카|파래김|조선무|깐양파|두절콩나물|깐대파|베트남 건고추|편 마늘|적근대|시래기|완숙 토마토|붉은 파프리카|딜|무우|청홍고추|불린 미역|로즈메리|백목이버섯|홍토마토|타임|홍고추마른것|파슬리다진것|파다진것|마늘 다진것|청고추 다진것|홍고추 다진것|청 홍고추다진것|흰목이버섯|당귀잎|배추잎|샐러리잎|백만송이버섯|실파|홍고추다진것|미역마른것|쌈다시마|아보카도작은것|건고추|청피망다진것|토마토콩카세|브로컬리다진것|바질다진것|홍피망다진것|샐러리다진것|양파채썬것|당근채썬것|차이브|무청시래기|불린 현미|레드어니언|무청|순무|식용꽃|워터크레스|근대|앤다이브|셀러리|죽순통조림|호부추|캔 토마토|시레기|세발나물|단감|골파|애플민트|참느타리버섯|건무화과|라즈베리|물파래|다진 생강|마늘다진것|생강다진것|레몬껍질',
 '육류·해산물':'닭 가슴살|닭고기살|육수 닭뼈|얇게 썬 쇠고기|저염베이컨|동태포|황태포|참치|다진 쇠고기|바지락살|게맛살|조개|소라|아귀|우삼겹|명태|가쓰오부시|가쯔오부시|쇠고기 양지|소고기 양지|족발|닭안심살|가자미|북어채|우민찌|쭈꾸미|패주|물오징어|조갯살|게살냉동|돼지고기갈은것|햄다진것|참치살|슬라이스 햄|찐 어묵|잔새우살다진것|새우다진것|혼다랑어가쓰오부시|새우살다진것|훈제오리가슴살|잔멸치|등심얇게썬것|닭뼈|건멸치|다시멸치|가다랑어포',
 '두부·계란·기타':'강낭콩|건포도|만두피|대추|빵가루|치즈|멥쌀|콩고기|리코타치즈|플레인 요구르트|라면|요거트|연유|날치알|크림치즈|달걀지단|가래떡|두유|달걀흰자|모짜렐라치즈|메추리알|사워크림|녹말물|검은콩|검은콩두부|콩가루|굵은 면발 라면|볶은현미|건조체리|저지방우유|땅콩|완두콩알|호상요구르트|노란콩|혼합견과류|불린쌀|푸실리|새우살|우동|쌈무|마카다미아|깨|어묵|시판 누룽지|모차렐라 치즈|묵말랭이|불린 찹쌀|스파게티면|크레미|콩국물|익힌 전복내장|홍새우 튀김|감자튀김|부침두부|잣가루|떡|파인애플통조림|생면|올리브|곤약|피넷버터|파르메산 치즈가루|땅콩버터|깐밤|춘권피|블랙올리브|캔 옥수수|슬라이스 치즈|으깬 두부|은행|불린 곤약쌀|쌀국수가는것|수수|율무|쌀가루|삶은 달걀 노른자|슬라이스아몬드|칼국수면|호박씨|서리태|감자녹말가루|도토리가루|건블루베리|팥|무가당 휘핑크림|검정깨|검정콩|곤약면|볶은 호두|볶은 아몬드 슬라이스|녹말|불린 현미|통깨',
 '양념·조미료':'발사믹크레마|유자청|발사믹식초|발사믹소스|국간장|쌈장|매실액|정종|이태리시즈닝|레드와인|흑설탕|들기름|와사비|겨자가루|청주|마늘기름|함초소금|저염진간장|가다랑어장국|어간장|고추냉이|와인|쇠고기육수|저염국간장|카놀라유|겨자분말|다시마 육수|오렌지주스|홍초|볶은소금|액젓|케첩|라임주스|까나리액젓|깨소금|연겨자|사과식초|배즙|토마토케첩|현미유|일본된장|레몬소금|소주|겨자|맛소금|다시마국물|감식초|굵은 고춧가루|생강즙|콩기름|거피들깨가루|포도씨유|전분가루|칠리소스|일식된장 미소|진간장|대두유|흑마늘진액|무염버터|깐들깨가루|젓갈|떡볶이양념파우더|다진 레몬청 과육|미향|매실엑기스|미림|토마토 페이스트|다시팩|양념장|토마토 홀|겉절이 양념|쌀뜨물|핑크 페퍼|식물성 생크림|백후추|잘게 다진 새우젓|볶음 소스|파마산치즈|머스타드|알룰로스|겨잣가루|포도주|사과주스|와사미|육수|포도주스|마늘가루|키엔페퍼|양파가루|흰후춧가루|오레가노마른것|타임 마른것|바질마른것|황설탕|머스터드 씨드|코리앤더 씨드|양파즙|매운고춧가루|케이퍼|다시물|볶은통깨|타비스코 소스|고추가루|매운 고춧가루|조미술|마늘즙|파인애플 통조림 국물|두반장|스리라차|멸치액젓|고추냉이 갠것|올리브유엑스트라버전|생강가루|땅콩기름|닭육수|튀김기름|닭 육수|식물성기름|레몬주스|멸치 육수|레몬주수|생선육수|귤 즙|레몬쥬스|홀그레인|건타임|야채육수|당근주스|대추고|사이다|사과쥬스|월계수잎마른것|카엔페퍼|로즈마리다진것|파마산치즈가루|파인애플주스|물미지근한것|포도식초|로즈마리마다진것|저나트륨소금|매실농축액|오레가노 다진것|큐민파우더|파슬리말린것|카엔패퍼|무염 버터|케찹|표고버섯가루|저염소금|미소된장|노두유|저염버터'
})) for(const name of names.split('|')) groups[category].add(name);
for(const row of snapshot.COOKRCP01.row) {
  if(reviews.some(r=>r.sourceId===row.RCP_SEQ)) continue;
  if(row.RCP_SEQ==='3568') {held.push({sourceId:row.RCP_SEQ,name:row.RCP_NM,reason:'메뉴명 참깨가지말이밥과 원문 닭고기·스파게티 재료 불일치; 3571과 재료 목록 동일'});continue;}
  const serving=explicitServing(row.RCP_PARTS_DTLS);
  if(bakery.test(row.RCP_NM)) {held.push({sourceId:row.RCP_SEQ,name:row.RCP_NM,reason:'사용자 요청: 제빵·제과 제외'});continue;}
  if(!serving && !candidates.has(row.RCP_SEQ)) {
    if(pickle.test(row.RCP_NM)) held.push({sourceId:row.RCP_SEQ,name:row.RCP_NM,reason:'절임·반찬: 명시 인분 없음; 향후 분류·분량 검토',sourceCategory:row.RCP_PAT2});
    continue;
  }
  try {
    const review=parse(row);
    // Verify all original spans, amounts, IDs and duplicate names before accepting.
    const result=auditAndMerge([{COOKRCP01:{...snapshot.COOKRCP01,row:[row]}}],ingredients,recipes,[review],policy.approvedOn);
    if(!result.report.added.length) throw Error('기존 메뉴명 중복');
    for(const d of review.ingredientDefinitions) if(!ingredients.some(i=>i.id===d.id)) {ingredients.push(d);knownNames.set(norm(d.name),d);}
    reviews.push(review); additions.push({sourceId:row.RCP_SEQ,name:row.RCP_NM,status:serving?'explicit':'estimated',baseServings:review.baseServings,sourceCategory:row.RCP_PAT2});
    recipes.push(result.recipes.at(-1));
  } catch(e) {held.push({sourceId:row.RCP_SEQ,name:row.RCP_NM,reason:e.message,rawIngredients:row.RCP_PARTS_DTLS});}
}
console.log(JSON.stringify({additions:additions.length,held:held.length,...(process.argv.includes('--names')?{newNames:[...proposedNames]}:{}),reasons:held.filter(x=>x.rawIngredients).map(x=>({id:x.sourceId,reason:x.reason}))}));
if(process.argv.includes('--write') && !process.argv.includes('--names')) {
  const result=auditAndMerge([snapshot,supplement],await read('data/ingredients.json'),baseRecipes,reviews,policy.approvedOn);
  if(allRecipes.some(r=>!result.recipes.some(next=>next.id===r.id))) throw Error('기존 메뉴가 검수에서 제외되었습니다. 저장 전에 확인하세요.');
  await write('data/source/mfds-reviews.json',reviews);
  await write('data/ingredients.json',result.ingredients);
  await write('data/recipes.json',result.recipes);
  await write('data/source/mfds-import-report.json',result.report);
  await write('data/source/mfds-expansion-report.json',{reviewedOn:policy.approvedOn,policy:policy.policy,added:additions,held});
}
