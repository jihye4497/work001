// Reviewed ingredient facts from the first 87 playlist videos. No cooking prose.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
export const batch50=[
 ['HyHZML6OyDo','기사식당 왕돈가스',3,'튀김','한식 주메뉴'],
 ['BMRUgSrWlVQ','경양식 만능소스',6,'소스','양식'],
 ['MSf9iVH1oro','오징어회무침',3,'무침','한식 주메뉴'],
 ['x9zcO0tldyA','천원 깻잎전',2,'전','한식 반찬'],
 ['E7tCGvcsN2Y','양념돼지갈비',4,'구이','한식 주메뉴'],
 ['jHaWY84BhoQ','가지전',2,'전','한식 반찬'],
 ['Td5XtUNGtEk','전간장',4,'양념장','한식 반찬'],
 ['tjaY3RjR38M','동태전',4,'전','한식 반찬'],
 ['JbN-06OodeI','참간초파스타',2,'파스타','퓨전'],
 ['vmqwAJVehgw','참간초소스 2024',4,'소스','한식 반찬'],
 ['08gB4NmhkQ0','평생갈비찜',6,'찜','한식 주메뉴'],
 ['FcdH-oWBATQ','만원족발',8,'삶기','한식 주메뉴'],
 ['AD_my4EIUfo','쟁반막국수',3,'비빔면','한식 주메뉴'],
 ['1iP__c1t0qM','무침만두',3,'무침','한식 주메뉴'],
 ['HyaQaxPqUNc','어묵제육',2,'볶음','한식 반찬'],
 ['91KSUbId_fE','만원찜닭',4,'찜','한식 주메뉴'],
 ['As8bN8Yr8oQ','두부조림',3,'조림','한식 반찬'],
 ['NlaIu6iSRtw','러브 황태해장국',4,'국','한식 국·찌개'],
 ['Zo-fyaKH1GI','고추장버터등갈비',4,'조림','한식 주메뉴'],
 ['L-9Fz67_bAo','게장양념 비빔냉면',2,'비빔면','한식 주메뉴'],
 ['wTak9YFltc8','어묵볶이',3,'조림','한식 주메뉴'],
 ['oVpC_Fi6FgY','궁중떡볶이',3,'볶음','한식 주메뉴'],
 ['1doS_Q1gM08','평생육개장',5,'국','한식 국·찌개'],
 ['xDCX-xm5ftc','대패삼겹꼬치구이',4,'구이','한식 주메뉴'],
 ['yDAzLQfssz4','두부김치',3,'볶음','한식 주메뉴'],
 ['0p9znJRopAI','볶음김치덮밥',1,'덮밥','한식 주메뉴'],
 ['DO5V72HepS8','만원 닭볶음탕',4,'탕','한식 국·찌개'],
 ['ECF90_seLS0','평생 생선조림장',4,'양념장','한식 반찬'],
 ['0gArpPNraOc','호떡볶이',2,'조림','그 밖'],
 ['au6EZ2Mz1Bk','15분 사골떡국',4,'국','한식 국·찌개'],
 ['lK68IL48o28','만원갈비찜',4,'찜','한식 주메뉴'],
 ['z0El5XIQSxI','차돌볶음파스타',2,'파스타','퓨전'],
 ['y0Nm-jXZYzQ','짜장떡볶이',2,'조림','한식 주메뉴'],
 ['qRa49obXGQE','평생 김치찌개',4,'찌개','한식 국·찌개'],
 ['q7jPrVsTvSo','평생 된장찌개',3,'찌개','한식 국·찌개'],
 ['RLy4fO4fqBA','표고밥',3,'밥','한식 주메뉴'],
 ['wDZS0lf9ciw','물로 하는 계란프라이',2,'달걀프라이','한식 반찬'],
 ['a8C_J9JXvN8','토마토홍합파스탕',4,'파스타','양식'],
 ['reFpxBbaN6c','크레이지 고구마',3,'구이','그 밖'],
 ['moCmXDf5vSI','원팬 등갈비',3,'조림','한식 주메뉴'],
 ['kn9woORbeK8','땅콩마요잼',6,'소스','그 밖'],
 ['9iwaoHo9jV0','감자탕',6,'탕','한식 국·찌개'],
 ['gesnBr3acQ4','순대볶음',3,'볶음','한식 주메뉴'],
 ['q7flYfIP9L4','순대튀김',3,'튀김','한식 주메뉴'],
 ['MMQ3fsbJ-CY','촉촉한 순대',3,'찜','한식 주메뉴'],
 ['cX9PZP3d6_g','어구리라면',1,'라면','한식 주메뉴'],
 ['k1h60IZmINs','꽈리멸치치킨',4,'구이','한식 주메뉴'],
 ['GSJJXoPQulE','연어육회',2,'무침','한식 주메뉴'],
 ['6dofaIP-sho','육포고추장',6,'양념장','한식 반찬'],
 ['Vikj7_ZA2Nk','꽃게라면',2,'라면','한식 주메뉴'],
 ['g5UQH_n4I5I','한단미나리전',3,'전','한식 반찬'],
 ['qAEMsX98tNE','골뱅이소면',3,'무침','한식 주메뉴'],
 ['wN0XpiWukjQ','기본초장',4,'소스','한식 반찬'],
 ['3Cb1Le-NzRc','마늘수육',3,'수육','한식 주메뉴'],
 ['XnEANwySB6w','불양념치킨',4,'구이','한식 주메뉴'],
 ['K1JKk7VtPgw','라볶이',2,'라면','한식 주메뉴'],
 ['KD-LsfX3fSI','계란샌드위치',4,'샌드위치','양식'],
 ['QSoOO8oxKFM','매콤게살볶음밥',1,'볶음밥','한식 주메뉴']
];
export const skips=[
 ['V9eWLOwurMI','오이양파절임 제조 전체 중 절임액4T 사용. 전체 채소/절임액을 메뉴에 모두 사용하는지와 완성수율 확인 필요'],
 ['uhOsXj8HEqg','파스타 모음 영상. 차돌볶음파스타는 같은 재료의 전용 영상 z0El5XIQSxI로 등록하고 중복 생성하지 않음'],
 ['SHODSq3ztlQ','된장찌개 모음 영상. 첫 요리는 같은 재료의 전용 영상 q7jPrVsTvSo로 등록하고 중복 생성하지 않음'],
 ['ITwHSNV7i2I','김치찜 모음의 서로 다른 요리 구획이 섞여 대표 원본·사용 분량 추가 확인 필요'],
 ['UH9xe_sZGQM','이미 조리한 고추장버터등갈비 양념의 사용량/남은 양이 없어 원재료 분해 근거 확인 대기'],
 ['mR4G0w_-9FY','만원 닭볶음탕 재편집 영상. 동일 재료의 전용 영상 DO5V72HepS8로 등록하고 중복 생성하지 않음'],
 ['mNFfjyeLTdY','고등어조림 재료표에 핵심 조림장 사용 분량이 없어 별도 조림장 제조와 연결할 비율 확인 대기'],
 ['3syEGqao6RU','재료표 대신 레시피 링크 안내 문장이 추출됨. 짜장떡볶이 전용 영상 y0Nm-jXZYzQ로 등록'],
 ['Ab7lc6gI4ds','미리 만든 연어육회의 사용량이 없어 덮밥/국수의 원재료 분해 근거 확인 대기'],
 ['JZp1M3Q8WoE','원문 불고깃감 600g의 축종/부위가 명시되지 않아 확인 대기'],
 ['qEsdzT1tQMA','미리 만든 매콤게살볶음밥 사용량이 없어 원재료 분해 근거 확인 대기']
].map(([videoId,reason])=>({videoId,reason,
 ...({'uhOsXj8HEqg':'z0El5XIQSxI','SHODSq3ztlQ':'q7jPrVsTvSo','mR4G0w_-9FY':'DO5V72HepS8'}[videoId]?{status:'excluded-duplicate',duplicateOf:({'uhOsXj8HEqg':'z0El5XIQSxI','SHODSq3ztlQ':'q7jPrVsTvSo','mR4G0w_-9FY':'DO5V72HepS8'})[videoId]}:{}),
}));
export const definitions=[
 ['eonam-pig-hind-trotter','돼지 장족','육류·해산물',false],
 ['eonam-sujeonggwa-drink','수정과 음료','두부·계란·기타',false],
 ['eonam-ssanghwatang-drink','쌍화탕','양념·조미료',true],
 ['eonam-lamb-skewer-seasoning','양꼬치 시즈닝','양념·조미료',true],
 ['eonam-shredded-pizza-cheese','슈레드 피자치즈','두부·계란·기타',false],
 ['eonam-spicy-neoguri','너구리 매운맛 라면','두부·계란·기타',false],
 ['eonam-salmon-fillet','연어 필렛','육류·해산물',false],
 ['eonam-beef-jerky','육포','육류·해산물',false],
 ['eonam-yellow-corvina-jeot','황석어젓','양념·조미료',true],
 ['eonam-jin-ramyun','진라면','두부·계란·기타',false],
 ['eonam-jam','잼','두부·계란·기타',false],
 ['eonam-samgyetang-herb-pack','삼계탕 재료팩','양념·조미료',true],
 ['eonam-jungmyeon','중면','두부·계란·기타',false],
 ['eonam-naengmyeon-noodles','냉면사리','두부·계란·기타',false],
 ['eonam-jjajang-powder','짜장가루','양념·조미료',true],
 ['eonam-cola-drink','콜라','두부·계란·기타',false],
 ['eonam-pork-backbone','돼지등뼈','육류·해산물',false]
];
export const canonicalOverrides={};
const aliases={
 '돼지안심':'돼지고기 안심','시판돈가스소스':'돈가스소스','손질냉동오징어':'오징어',
 '다진마늘':'다진 마늘','다진생강':'다진 생강','양조간장':'간장','통깨':'참깨','깨':'참깨','부순깨':'깨소금',
 '찬물':'물','고춧가루':'고춧가루','굵은소금':'굵은소금','목살':'돼지고기목살','달걀':'계란','파':'대파',
 '배음료':'갈아만든 배','갈아만든배':'갈아만든 배','미림':'맛술','장족':'돼지 장족','시판수정과음료':'수정과 음료',
 '깐생강':'생강','닭볶음탕용닭':'닭','부침용두부':'두부','사각어묵':'어묵','소고기불고기용':'소고기 불고기용',
 '쌀떡볶이떡':'떡볶이떡','부순깨':'깨소금','후추':'후추가루','통마늘':'마늘',
 '돼지고기앞다리살찌개용':'돼지 앞다리살','김치국물':'김치국물','건표고버섯':'건표고버섯',
 '시판토마토소스':'토마토소스','스파게티면':'스파게티','파슬리가루':'파슬리가루','돼지등갈비':'등갈비',
 '슈레드피자치즈':'슈레드 피자치즈','바닐라아이스크림':'바닐라아이스크림','슬라이스체다치즈':'슬라이스 체더치즈',
 '너구리라면매운맛':'너구리 매운맛 라면','잔멸치':'잔멸치','연어필렛':'연어 필렛',
 '껍질붙은통삼겹':'통삼겹살','밀떡':'밀떡볶이떡','게맛살':'게맛살',
 '냉동동태포':'동태포','신김치':'김치','시나몬가루':'계피가루','얼갈이':'얼갈이 배추'
};
const key=s=>s.normalize('NFKC').replace(/\s/g,'');
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const names=new Map(ingredients.map(i=>[key(i.name),i.name]));
for(const [,name] of definitions)names.set(key(name),name);
const canonical=n=>aliases[key(n)]??names.get(key(n))??n;
function split(text){
 let depth=0,start=0;const rows=[];
 for(let n=0;n<text.length;n++){
  if(text[n]==='(')depth++;if(text[n]===')')depth--;
  if((text[n]===','&&depth===0)||text[n]==='\n'){
   const row=text.slice(start,n).trim();if(row)rows.push(row);start=n+1;
  }
 }
 const tail=text.slice(start).trim();if(tail)rows.push(tail);return rows;
}
const nval=s=>s.includes('/')?s.split('/').reduce((a,b)=>Number(a)/Number(b)):Number(s);
function parse(raw){
 const first=raw.search(/\d|半|반\s*컵|반컵|한\s*줌|한\s*공기|한\s*단|두\s*줌|두\s*바퀴/);
 let name=(first<0?raw.split('(')[0]:raw.slice(0,first)).trim().replace(/\s*(?:듬뿍|평평하게|깎아서|약|넉넉히|크게)$/,'').trim();
 name=name.replace(/\s*\($/,'').trim();name=canonical(name);
 if(/[~～]/.test(raw))return {name,sourceAmount:null,unit:null,reason:'원문 수량 범위를 임의 단일값으로 만들지 않고 보존'};
 const printed=raw.match(/\((?:약\s*)?(\d+(?:\.\d+)?)\s*(kg|g|ml|mL|L)\)/);
 if(printed)return {name,sourceAmount:Number(printed[1]),unit:printed[2]};
 const q=raw.slice(first<0?raw.length:first).match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(큰술|작은술|밥숟가락|스푼|kg|ml|mL|g|L|T|t|마리|개|대|장|컵|모|캔|팩|봉지|봉|포기|쪽|공기|통|줌|단|꼬집|바퀴|번|뿌리|인분|근)/);
 if(q)return {name,sourceAmount:nval(q[1]),unit:q[2]};
 const han=raw.slice(first<0?raw.length:first).match(/^(한|두)\s*(줌|공기|단|바퀴)/);
 if(han)return {name,sourceAmount:han[1]==='한'?1:2,unit:han[2]};
 if(first>=0&&/^(?:반\s*컵|반컵)/.test(raw.slice(first)))return {name,sourceAmount:0.5,unit:'컵'};
 assert.ok(first<0,`수량 추가 검토: ${raw}`);
 return {name,sourceAmount:null,unit:null};
}
const special={
 '찬물 1컵+2T':[{name:'물',sourceAmount:1,unit:'컵'},{name:'물',sourceAmount:2,unit:'T'}],
 '소금 3꼬집 식용유':[{name:'소금',sourceAmount:3,unit:'꼬집'},{name:'식용유',sourceAmount:null,unit:null}],
 '시판 수정과 음료 2캔(238ml*2)':{name:'수정과 음료',sourceAmount:2,unit:'캔',reason:'원문238ml용량2캔을 보존하고 한 캔의 중량으로 오인하지 않음'},
 '물 800ml+100ml':[{name:'물',sourceAmount:800,unit:'ml'},{name:'물',sourceAmount:100,unit:'ml'}],
 '골뱅이 140g 2캔':{name:'골뱅이',sourceAmount:2,unit:'캔',reason:'140g 용량의 2캔을 원문 단위로 보존'},
 '마늘 한 줌(약 11~12개)':{name:'마늘',sourceAmount:1,unit:'줌',reason:'원문 개수 범위를 단일값으로 만들지 않고 병기된 한 줌 사용'},
 '부침가루 한 컵(듬뿍 6T)':{name:'부침가루',sourceAmount:1,unit:'컵',reason:'원문 한 컵 사용. 병기된 듬뿍6T와 중복 합산하지 않음'},
 '소면 (500원 동전크기 양)':{name:'소면',sourceAmount:null,unit:null,reason:'원문 크기 비유는 수량 단위로 환산하지 않음'},
 '연겨자 도토리 크기만큼':{name:'연겨자',sourceAmount:null,unit:null},
 '풋고추 (매운맛을 원하면 청양고추)':{name:'풋고추',sourceAmount:null,unit:null,reason:'원문 대체 재료 중 풋고추 선택. 청양고추를 함께 추가하지 않음'},
 '식용유 두 바퀴':{name:'식용유',sourceAmount:2,unit:'바퀴'},
 '슈레드 피자치즈 두 줌':{name:'슈레드 피자치즈',sourceAmount:2,unit:'줌'},
 '마늘 한 공기':{name:'마늘',sourceAmount:1,unit:'공기'}
};
const equipment=new Set(['나무꼬치','산적꼬치','두께감 있는 스탠 냄비']);
function tokens(e){
 let text=e.ingredientText;
 text=text.split(/\r?\n/).filter(line=>!/^\s*※/.test(line)).join('\n');
 if(e.videoId==='kn9woORbeK8')text=text.split(/\n\s*\n/)[0];
 return split(text).flatMap(raw=>{
  if(/^※/.test(raw)||raw.startsWith('(냉동 군만두')||raw==='식용유)'||/^\(고춧가루/.test(raw)||raw==='청양고추 1개)')return [];
  raw=raw.replace(/^\[[^\]]+\]\s*/,'').trim();if(!raw)return [];
  if(equipment.has(raw))return [];
  if(raw==='무절임 채수 2T'||raw==='오이양파절임액 4T')return [];
  return [raw];
 });
}
export const lineOverrides={};
export const intermediateRows=new Map();
export const groupPolicy=()=>({scale:1});
export const servingsOverrides={};
export function prepareText(e){
 if(e.videoId==='kn9woORbeK8')e.ingredientClarification='땅콩마요잼 제조 레시피만 등록. 잼 사용량이 없는 별도 샌드위치 세팅은 중복 합산하지 않음.';
 if(e.videoId==='MSf9iVH1oro'||e.videoId==='V9eWLOwurMI')e.ingredientClarification='무/오이양파 절임에 쓰인 원재료를 모두 반영하고 그 절임에서 나오는 채수·절임액을 별도 구매 재료로 중복 합산하지 않음.';
 const rows=tokens(e);lineOverrides[e.videoId]=Object.fromEntries(rows.map(raw=>[raw,special[raw]??parse(raw)]));
 if(e.servingsStatements?.some(s=>/인분/.test(s))&&e.videoId!=='L-9Fz67_bAo')servingsOverrides[e.videoId]={status:'estimated',evidence:'재료의 면 인분 표기는 참고로만 사용하고 요리 전체 양을 메뉴별로 편집 추정(2026-11-23 사용자 승인). 원작자의 요리 전체 인분 명시는 아님.'};
 return rows.join('\n');
}
const source=JSON.parse(await readFile(new URL('../data/source/eonam-review.json',import.meta.url),'utf8'));
for(const e of source.entries.filter(e=>batch50.some(r=>r[0]===e.videoId)))prepareText(e);
