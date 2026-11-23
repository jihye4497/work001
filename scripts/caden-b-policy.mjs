// Caden source entries 66–131. Only ingredient facts are imported.
import {readFile} from 'node:fs/promises';
export const batch50=[
 ['4wk9YJDn8SE','우삼겹 갈비탕',2,'탕','한식 국·찌개'],
 ['shP5i5OJcj4','고추장 멸치볶음',6,'볶음','한식 반찬'],
 ['bYd79jFE2OA','토마토 김치',6,'김치','한식 반찬'],
 ['FNhCQKrey6Y','대패 삼겹살 감자탕',3,'탕','한식 국·찌개'],
 ['LEaLSNQLCP0','멍게무침',3,'무침','한식 반찬'],
 ['qsQXbox1rI4','김치찜',3,'찜','한식 주메뉴'],
 ['S8HxxFjotJI','봄동 비빔국수',2,'국수','한식 주메뉴'],
 ['f0sjYHhQsPA','만두 순댓국',2,'국','한식 국·찌개'],
 ['hu0DWXWBJcE','국물 닭발',3,'탕','한식 주메뉴'],
 ['HXYsJYuuW2g','꽃게탕',4,'탕','한식 국·찌개'],
 ['XDn85vDO3lY','매콤간장비빔국수',2,'국수','한식 주메뉴'],
 ['klFhbUssB60','차돌 된장찌개',2,'찌개','한식 국·찌개'],
 ['SNimRYX9YaQ','무생채',6,'무침','한식 반찬'],
 ['B0EkWL-67Jg','새콤달콤 물회',2,'물회','한식 주메뉴'],
 ['u3v0zLwySd4','감자조림',4,'조림','한식 반찬'],
 ['DX6ydTY05O4','고기 된장조림',5,'조림','한식 반찬'],
 ['XyKLtcJt-Uw','부대찌개',4,'찌개','한식 국·찌개'],
 ['wq4cXAW4aLI','계란볶음밥',1,'볶음밥','한식 주메뉴'],
 ['MbACBziW55s','황태 콩나물 해장국',3,'국','한식 국·찌개'],
 ['n6e08ay5tUw','고추장찌개',4,'찌개','한식 국·찌개'],
 ['SqgGwXPxfAM','토마토 갈비찜',4,'찜','한식 주메뉴'],
 ['qR5Iq9wDqOE','명란 냉파스타',2,'파스타','퓨전'],
 ['TLtwLZ6M01A','고등어조림',3,'조림','한식 주메뉴'],
 ['PW04hLy9o0w','찜닭',4,'찜','한식 주메뉴'],
 ['9j7Us3rTG7o','동태 알탕',4,'탕','한식 국·찌개'],
 ['F3d9odPcgek','냉제육',8,'수육','한식 주메뉴'],
 ['q85dpwLkDgQ','소불고기',4,'볶음','한식 주메뉴'],
 ['pNtwZuhYQeg','닭볶음탕',4,'탕','한식 국·찌개'],
 ['N31qMmNsKsI','돼지고기 마늘 부추볶음',2,'볶음','한식 주메뉴'],
 ['1sptmEHbDI0','수박화채',4,'화채','그 밖'],
 ['NKhQzu9L4r8','옛날 토스트',2,'토스트','양식'],
 ['3SlGinJp_Kc','옛날 떡볶이',3,'조림','한식 주메뉴'],
 ['xHs-S7qZXyE','황태 콩나물 해장라면',1,'라면','한식 주메뉴'],
 ['lEi-7QVx97Y','돼지고기 안심 장조림',6,'조림','한식 반찬'],
 ['5nYg0y4dfSI','아삭한 가지볶음',3,'볶음','한식 반찬'],
 ['Z0NMTwkZVYM','굴무침',4,'무침','한식 반찬'],
 ['UVsdxo8UjAI','석박지',8,'김치','한식 반찬'],
 ['X3If0w8Lh4A','황태채무침',4,'무침','한식 반찬'],
 ['MTfwI8zOkOQ','잡채',5,'볶음','한식 주메뉴'],
 ['tOhQ1bskyNY','참치 무조림',3,'조림','한식 반찬'],
 ['HqX21YVCd08','당근 라페 타파스',3,'샌드위치','양식'],
 ['j2lb8mStzW0','로제 치즈 계란찜',2,'찜','한식 반찬'],
 ['zs-OdDdvREM','봄동 겉절이',4,'무침','한식 반찬'],
 ['0GeQF6nLnt8','오이볶음',4,'볶음','한식 반찬'],
 ['pD-C8vPzgIE','소고기 메추리알 장조림',5,'조림','한식 반찬'],
 ['Spue6VL44Xg','양배추 김치',8,'김치','한식 반찬'],
 ['QUQo8Js-ttQ','연근조림',4,'조림','한식 반찬']
];
export const canonicalOverrides={};
export const definitions=[
 ['tuna-extract','참치액','양념·조미료',true],
 ['thin-sliced-pork-neck','대패 목살','육류·해산물',false],
 ['boneless-chicken-feet','무뼈 닭발','육류·해산물',false],
 ['generic-noodles','국수','두부·계란·기타',false],
 ['raw-sliced-seafood','회','육류·해산물',false],
 ['minced-pork-belly','다진 삼겹살','육류·해산물',false],
 ['budae-assorted-ham','부대찌개용 모둠 햄','두부·계란·기타',false],
 ['bokbunja-wine','복분자주','양념·조미료',true],
 ['capellini-pasta','카펠리니','두부·계란·기타',false],
 ['low-sodium-pollock-roe','저염 명란','육류·해산물',false],
 ['mackerel-fillet','고등어 필렛','육류·해산물',false],
 ['wide-glass-noodles','넓적 당면','두부·계란·기타',false],
 ['tamari-soy-sauce','타마리간장','양념·조미료',true],
 ['pork-tenderloin','돼지고기 안심','육류·해산물',false],
 ['apple-watermelon','애플수박','채소·버섯',false],
 ['shin-ramyun','신라면','두부·계란·기타',false],
 ['generic-mushrooms','버섯','채소·버섯',false],
 ['dashida-seasoning','다시다','양념·조미료',true],
 ['generic-anchovies','멸치','육류·해산물',false]
];
const aliases={
 '다진마늘':'다진 마늘','다진생강':'다진 생강','고운고춧가루':'고운 고춧가루',
 '참치액젓':'참치액','까나리액젓':'까나리액젓','손질멍게':'멍게살','묵은지김치':'김치',
 '대패삼겹살':'대패삼겹살','손질무뼈닭발':'무뼈 닭발','대파흰부분':'대파',
 '사골곰탕':'사골육수','사골육수':'사골육수','공깃밥':'밥','통깨':'참깨','깨':'참깨',
 '후추':'후추가루','후춧가루':'후추가루','미원':'MSG','청경재':'청경채','진강장':'진간장',
 '청고추':'청고추','멸치액젓':'멸치액젓','올리브오일':'올리브유','엑스트라버진올리브오일':'올리브유',
 '토마토케첩':'케첩','카펠레니파스타면':'카펠리니','파마산치즈가루':'파르메산 치즈가루',
 '필렛고등어':'고등어 필렛','앞다리살':'돼지 앞다리살','소고기불고기감':'소고기 불고기용',
 '돼지고기앞다리살':'돼지 앞다리살','삼겹살다짐육':'다진 삼겹살','갈아만든배음료':'갈아만든 배',
 '잡채용돼지고기':'돼지고기 잡채용','돼지고기안심':'돼지고기 안심',
 '삶은달걀':'삶은 달걀','달걀':'계란','달걀노른자':'계란노른자','모차렐라치즈':'모차렐라 치즈',
 '떡볶이떡':'떡볶이떡','홀그레인머스타드':'홀그레인 머스터드','바게트빵':'바게트',
 '멸치':'멸치','카펠리니':'카펠리니','햄':'햄','치즈':'치즈',
 '설탕':'설탕','미림':'맛술','후춧가루':'후추가루','건홍고추':'건홍고추','신김치':'김치'
};
const key=s=>s.normalize('NFKC').replace(/\s/g,'');
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const existing=new Map(ingredients.map(i=>[key(i.name),i.name]));
for(const [,name] of definitions)existing.set(key(name),name);
function canonical(name){const k=key(name);return aliases[k]??existing.get(k)??name;}
function tokens(entry){
 let text=entry.ingredientText;
 if(entry.videoId==='xHs-S7qZXyE')text=text.split(/\n\s*\n/)[0];
 const result=text.split(/\r?\n/).flatMap(line=>{
  line=line.trim();if(!line||/^※|^\*\*|^\(\*\*/.test(line))return [];
  if(/^\[/.test(line))return [];
  return line.split(/,(?![^()]*\))/).flatMap(part=>part.split(/(?<=\))\.\s*/)).map(p=>p.trim()).filter(Boolean);
 });
 if(entry.videoId==='Z0NMTwkZVYM'){
  let seen=false;return result.filter(raw=>{if(raw!=='매실액(1큰술)')return true;if(seen)return false;seen=true;return true;});
 }
 return result;
}
function quantity(raw){
 const content=raw.slice(raw.indexOf('(')+1).replace(/[()]/g,'').trim();
 if(/\d+(?:\.\d+)?\s*[~～]\s*\d/.test(content))return {sourceAmount:null,unit:null,reason:'원문 수량 범위를 임의 단일값으로 만들지 않음'};
 if(/^1cm|^5cm/.test(content)&&/한\s*토막/.test(content))return {sourceAmount:1,unit:'토막',reason:'두께와 구분하여 원문 한 토막을 사용'};
 const mass=content.match(/(?:약\s*)?(\d+(?:\.\d+)?)\s*(kg|g|ml|mL|L)\b/);
 if(mass)return {sourceAmount:Number(mass[1]),unit:mass[2]};
 const m=content.match(/(\d+(?:\.\d+)?(?:\/\d+)?)\s*(큰술|작은술|스푼|마리|개|대|포기|장|모|캔|팩|통|알|줄기|줄|컵|cc|T|t|꼬집|쪽|조각)/);
 if(m){let n=m[1].includes('/')?m[1].split('/').reduce((a,b)=>Number(a)/Number(b)):Number(m[1]);if(/반/.test(content.slice(m.index+m[0].length)))n+=0.5;return {sourceAmount:n,unit:m[2]};}
 const han=content.match(/한\s*(줌|꼬집|토막)/);if(han)return {sourceAmount:1,unit:han[1]};
 return {sourceAmount:null,unit:null};
}
function parse(raw){
 if(raw==='종이 호일'||raw==='쿠킹호일')return [];
 if(raw==='대파 1대(흰부분)')return {name:'대파',sourceAmount:1,unit:'대'};
 const first=raw.indexOf('(');
 let rawName=first>=0?raw.slice(0,first).trim():raw.replace(/\s*(?:조금|소량|적당량|한\s*줌|\d+(?:\.\d+)?(?:\/\d+)?\s*(?:대|개|포기|장|줄기)(?:\(흰부분\))?).*$/,'').trim();
 if(rawName==='알&이리')return ['동태알','동태 이리'].map(name=>({name,sourceAmount:null,unit:null,reason:'원문 알·이리 두 재료를 수량 미기재로 유지'}));
 if(rawName==='대파 흰 부분')rawName='대파';
 let q=first>=0?quantity(raw):{sourceAmount:null,unit:null};
 if(first<0){const numeric=raw.match(/\s(\d+(?:\.\d+)?)\s*(대|개|포기|장|줄기)/);if(numeric)q={sourceAmount:Number(numeric[1]),unit:numeric[2]};else if(/한\s*줌/.test(raw))q={sourceAmount:1,unit:'줌'};}
 if(raw==='고기 삶은 육수')return {name:'물',sourceAmount:null,unit:null,reason:'고기를 삶아 얻는 중간 육수. 별도 육수 구매로 중복 계산하지 않음'};
 if(raw==='양파(1/2)')return {name:'양파',sourceAmount:null,unit:null,reason:'원문에 양파 수량의 단위가 미기재되어 개로 추정하지 않음'};
 if(raw==='삶은 달걀(메추리알)')return {name:'삶은 달걀',sourceAmount:null,unit:null,reason:'원문 대체 선택지 중 삶은 달걀 사용. 메추리알과 동시에 구매하지 않음'};
 if(rawName==='참치'&&q.unit==='캔')return {name:'통조림 참치',...q,reason:'원문 캔 단위로 명시된 참치를 통조림 참치에 연결'};
 return {name:canonical(rawName),...q};
}
const review=JSON.parse(await readFile(new URL('../data/source/caden-review.json',import.meta.url),'utf8'));
export const lineOverrides=Object.fromEntries(batch50.map(([id])=>{const e=review.entries.find(e=>e.videoId===id);return [id,Object.fromEntries(tokens(e).map(raw=>[raw,id==='Z0NMTwkZVYM'&&raw==='매실액(1큰술)'?{name:'매실액',sourceAmount:1.2,unit:'스푼',reason:'2026-11-23 사용자 영상 직접 확인: 매실액 1.2스푼. 설명란 중복 표기를 그대로 합산하지 않음'}:parse(raw)]))];}));
export const intermediateRows=new Map();
export const groupPolicy=()=>({scale:1});
export function prepareText(e){
 if(e.videoId==='Z0NMTwkZVYM'){
  e.ingredientClarification='2026-11-23 사용자 영상 직접 확인으로 매실액1.2스푼 적용. 원문 설명란의 매실액1큰술 중복2회와 구분하며 두 번 합산하지 않음.';
  e.sourceCorrections=[{ingredient:'매실액',originalText:'매실액(1큰술) 2회 반복',confirmedBy:'사용자 영상 직접 확인',checkedOn:'2026-11-23',amount:1.2,unit:'스푼'}];
 }
 if(e.videoId==='klFhbUssB60')e.ingredientClarification='원문 제목은 차돌 된장 술밥이나 재료표에 밥이 없어, 명시된 된장찌개 재료만 등록하고 메뉴명을 차돌 된장찌개로 표시. 밥을 추정 추가하지 않음.';
 if(e.videoId==='xHs-S7qZXyE')e.ingredientClarification='두 라면 버전 중 원문 첫 번째 정호영 해장라면의 재료만 등록. 별도 삼양라면·달걀·올리브유 버전은 합산하지 않음.';
 if(e.videoId==='N31qMmNsKsI')e.ingredientClarification='원문의 진강장/청경재는 진간장/청경채로 연결한 표기 교정. 원문 재료 토큰은 그대로 보존.';
 return tokens(e).join('\n');
}
export const skips=[
 {videoId:'4vBL3yGOsnU',reason:'불린 쌀3인분 버터냄비밥 제조와 김치볶음밥 세팅 분량이 혼재. 실제 사용할 밥의 비율 확인 필요'},
 {videoId:'0kozFOAut5E',reason:'수집된 재료표에는 무침 양념만 있고 주재료 꽈리고추와 가루가 확인되지 않아 원문 추가 확인 필요'}
];
