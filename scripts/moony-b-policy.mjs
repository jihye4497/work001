// Reviewed the second half of the public MoonyKitchen playlist index.
// Menu names come from the original description, rather than promotional titles.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

export const batch50=[
 ['vSPXdchs5vI','만능 간장',40,'소스','그 밖'],
 ['oHCQFYHVPEc','오트밀 쿠키',8,'쿠키','그 밖'],
 ['nlZ-yrWMRoE','파베 초콜릿',6,'디저트','그 밖'],
 ['jKCHQWwB1H0','구름빵',2,'빵','그 밖'],
 ['ujOBiIDASmI','까눌레',8,'디저트','그 밖'],
 ['h21WuV-YLX0','팥죽',4,'죽','한식 주메뉴'],
 ['a5XNbDPJqO8','당근 케이크',6,'케이크','그 밖'],
 ['jr6nFMZQI-E','치즈케이크',8,'케이크','그 밖'],
 ['48UmtSqUdeE','초코 케이크',2,'케이크','그 밖'],
 ['-JPnL34RRSM','밀크티',2,'음료','그 밖'],
 ['5u3v77i7nHU','저탄수 그래놀라',12,'그래놀라','그 밖'],
 ['GEUL59x9bg4','딸기 우유',1,'음료','그 밖'],
 ['JTVSd_jWwic','초코우유',2,'음료','그 밖'],
 ['yobM2-2FB08','꿀잠 밀크티',1,'음료','그 밖'],
 ['AtkGm8jphd0','치즈스콘',8,'스콘','그 밖'],
 ['SWP0xcychyk','치즈케이크',8,'케이크','그 밖'],
 ['NHo36S_25a4','브라우니',10,'케이크','그 밖'],
 ['K5yZt5hf72Q','에그타르트',6,'타르트','그 밖'],
 ['vL2_0ldclWA','모카 프라푸치노',2,'음료','그 밖'],
 ['0y3Juik_1Zk','제누와즈',6,'케이크','그 밖'],
 ['k3NNJkqNl10','무설탕 딸기잼',15,'잼','그 밖']
];
export const canonicalOverrides={
 '달걀':'계란','전란':'계란','달걀흰자':'달걀흰자','흰자':'달걀흰자',
 '달걀노른자':'계란노른자','계란노른자':'계란노른자','노른자':'계란노른자',
 '아몬드가루':'아몬드가루','시나몬파우더':'계피가루','시나몬가루':'계피가루',
 '시나몬스틱':'시나몬스틱','넛맥가루':'넛맥가루','베이킹파우더':'베이킹파우더',
 '말린블루베리':'건블루베리','말린크랜베리':'말린 크랜베리','말린아로니아':'말린 아로니아','코코아가루':'코코아 파우더',
 '오일':'기름','코코넛파우더':'코코넛가루','칡전분':'칡 전분','플랙씨드가루':'플랙시드 가루',
 '플랙시드가루':'플랙시드 가루','따뜻한물':'물','아몬드밀크':'아몬드밀크',
 '생크림':'생크림','라칸토':'라칸토 감미료','바닐라익스트랙':'바닐라 익스트랙'
};
export const definitions=[
 ['moony-sweetener','감미료','양념·조미료',true],
 ['moony-erythritol','에리스리톨','양념·조미료',true],
 ['moony-lakanto-sweetener','라칸토 감미료','양념·조미료',true],
 ['moony-cocoa-powder','코코아 파우더','양념·조미료',true],
 ['moony-unsweetened-cocoa-powder','무가당 코코아 파우더','양념·조미료',true],
 ['moony-chocolate','초콜릿','두부·계란·기타',false],
 ['moony-dark-chocolate','다크 초콜릿','두부·계란·기타',false],
 ['moony-90-percent-chocolate','90% 초콜릿','두부·계란·기타',false],
 ['moony-arrowroot-starch','애로우루트 전분','두부·계란·기타',false],
 ['moony-kudzu-starch','칡 전분','두부·계란·기타',false],
 ['moony-oat-flour','오트 밀가루','두부·계란·기타',false],
 ['moony-oat-fiber','오트파이버','두부·계란·기타',false],
 ['moony-whey-protein','훼이 프로틴','두부·계란·기타',false],
 ['moony-coconut-flour','코코넛가루','두부·계란·기타',false],
 ['moony-coconut-oil','코코넛오일','양념·조미료',true],
 ['moony-flaxseed-meal','플랙시드 가루','두부·계란·기타',false],
 ['moony-tapioca-starch','타피오카 전분','두부·계란·기타',false],
 ['moony-lactose-free-milk','유당제거 우유','두부·계란·기타',false],
 ['moony-xanthan-gum','잔탄검','양념·조미료',true],
 ['moony-baking-soda','베이킹소다','양념·조미료',true],
 ['moony-vanilla-extract','바닐라 익스트랙','양념·조미료',true],
 ['moony-dried-cranberry','말린 크랜베리','두부·계란·기타',false],
 ['moony-dried-aronia','말린 아로니아','두부·계란·기타',false],
 ['moony-rooibos-tea','루이보스티','양념·조미료',true],
 ['moony-black-tea','홍차','양념·조미료',true],
 ['moony-cinnamon-stick','시나몬스틱','양념·조미료',true],
 ['moony-almond-milk','아몬드밀크','두부·계란·기타',false],
 ['moony-cacao-mass','카카오매스','두부·계란·기타',false]
];
export const intermediateRows=new Map();
export const groupPolicy=()=>({scale:1});
const q=(name,sourceAmount,unit,reason)=>({name,sourceAmount,unit,...(reason?{reason}:{})});
const nil=(name,reason)=>q(name,null,null,reason);
const key=s=>s.normalize('NFKC').replace(/\s/g,'');
const fixed={
 'nlZ-yrWMRoE':{
  '알룰로스 (올리고당, 물엿, 설탕 대체가능) 1-2큰술':nil('알룰로스','원문 1-2큰술 범위를 임의 단일값으로 정하지 않음. 대체 재료는 합산하지 않고 알룰로스만 포함'),
  '순두부 (두부, 연두부) 70g':q('순두부',70,'g','원문의 대체 두부 중 순두부 한 가지만 포함')
 },
 'h21WuV-YLX0':{'감미료 또는 설탕':nil('설탕','원문 대체 선택지 중 종류가 명확한 설탕 한 가지만 포함')},
 '5u3v77i7nHU':{'견과류 또는 씨앗 480g':q('견과류',480,'g','원문 대체 선택지 중 견과류 한 가지만 포함. 특정 견과류 종류는 임의 지정하지 않음')},
 'JTVSd_jWwic':{'90% 초콜릿 40g':q('90% 초콜릿',40,'g')},
 'k3NNJkqNl10':{
  '레몬제스트 1/2':nil('레몬껍질','원문 1/2의 단위가 없어 임의 개수·중량으로 환산하지 않음'),
  '레몬즙 1/4':nil('레몬즙','원문 1/4의 단위가 없어 임의 개수·부피로 환산하지 않음')
 }
};
export const lineOverrides={};

function fraction(s){
 const f=s.match(/^(\d+)\/(\d+)$/);return f?+f[1]/+f[2]:Number(s);
}
function parse(raw){
 const first=raw.search(/\d/);let name=(first<0?raw:raw.slice(0,first)).trim();
 name=name.replace(/\s*\([^)]*\)\s*$/,'').replace(/\s*(?:약간|취향껏|한\s*꼬집)\s*$/,'').trim();
 name=canonicalOverrides[key(name)]??name;
 if(raw==='소금 한 꼬집')return q('소금',1,'꼬집');
 if(raw==='소금약간')return nil('소금');
 if(/\d+(?:\.\d+)?(?:g|ml)?\s*[~～-]\s*\d/.test(raw))return nil(name,'원문 수량 범위를 임의 단일값으로 정하지 않고 원문 메모로 보존');
 const parenthesizedMass=raw.match(/\((\d+(?:\.\d+)?)\s*(kg|g|ml|mL)\)/);
 if(parenthesizedMass)return q(name,+parenthesizedMass[1],parenthesizedMass[2]);
 const amount=raw.slice(first<0?raw.length:first).match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(Tbsp|tbsp|tsp|ts|kg|ml|mL|cc|g|L|큰술|작은술|조각|컵|개|알|t|T)/);
 if(amount)return q(name,fraction(amount[1]),amount[2]);
 assert.ok(!/\d/.test(raw),`추가 수량 검토 필요: ${raw}`);
 return nil(name);
}
const nameEvidence=Object.fromEntries(batch50.map(([,name])=>[name,name]));
const evidence={
 vSPXdchs5vI:'간장1L·청주300ml·물200ml 등 소스 전체 제조량을 40회 곁들임 분량으로 편집 추정. 원문 전체 사용 인분 미기재.',
 oHCQFYHVPEc:'오트밀70g·아몬드가루100g·호두90g 등 쿠키 전체 반죽을 간식 8인분으로 편집 추정. 원문 제조 개수 미기재.',
 'nlZ-yrWMRoE':'초콜릿200g·순두부70g 전체를 간식6인분으로 편집 추정. 감미료 원문 범위는 수량 미기재로 보존.',
 jKCHQWwB1H0:'달걀흰자2개·전분1큰술 전체를 간식2인분으로 편집 추정.',
 ujOBiIDASmI:'우유500ml·두 전분/가루 각65g 등의 까눌레 전체 반죽을 간식8인분으로 편집 추정. 원문 제조 개수 미기재.',
 'h21WuV-YLX0':'팥300ml·물1000ml 전체를 죽4인분으로 편집 추정. 팥의 원문 부피 단위ml를 유지.',
 a5XNbDPJqO8:'달걀120g·아몬드가루102g·당근77g 등 전체 반죽을 간식6인분으로 편집 추정.',
 'jr6nFMZQI-E':'크림치즈450g·생크림225g·달걀150g 등 전체 케이크를 간식8인분으로 편집 추정.',
 '48UmtSqUdeE':'달걀1개·버터40g과 초콜릿50g 등 전체 케이크·토핑을 간식2인분으로 편집 추정.',
 '-JPnL34RRSM':'우유400ml·물80ml와 홍차15g 전체를 음료2인분으로 편집 추정.',
 '5u3v77i7nHU':'견과류480g·알룰로스70g·코코넛오일35g 전체를 토핑/간식12인분으로 편집 추정.',
 GEUL59x9bg4:'우유160ml·딸기5알 전체를 음료1인분으로 편집 추정.',
 JTVSd_jWwic:'우유320ml·초콜릿40g·알룰로스40ml 전체를 음료2인분으로 편집 추정.',
 'yobM2-2FB08':'우유200ml·물100ml·루이보스티7g 등 전체를 음료1인분으로 편집 추정.',
 AtkGm8jphd0:'아몬드가루225g·치즈140g 등 스콘 전체 반죽을 간식8인분으로 편집 추정. 원문 제조 개수 미기재.',
 SWP0xcychyk:'크림치즈360g·생크림220g과 별도 시트 전체를 케이크8인분으로 편집 추정. 원문 15cm는 틀 지름으로 인분 아님.',
 NHo36S_25a4:'카카오매스240g·버터120g·달걀150g 등 전체 브라우니를 간식10인분으로 편집 추정.',
 K5yZt5hf72Q:'크러스트와 필링 전량을 타르트6인분으로 편집 추정. 원문 달걀노른자1개와3개는 각각 시트·필링 분량으로 모두 포함.',
 vL2_0ldclWA:'아몬드밀크1컵·얼음1컵과 생크림150ml 등 음료·토핑 전체를 음료2인분으로 편집 추정. 원문400ml 표기는 인분 명시가 아님.',
 '0y3Juik_1Zk':'노른자80g·흰자110g·아몬드가루75g 등 케이크 시트 전체를 간식6인분으로 편집 추정. 원문 틀15cm는 인분 아님.',
 k3NNJkqNl10:'딸기300g·라즈베리150g 등 잼 전체 제조량을 곁들임15인분으로 편집 추정. 단위 없는 레몬 분수는 임의 환산하지 않음.'
};
export const servingsOverrides=Object.fromEntries(batch50.map(([id])=>[id,{status:'estimated',evidence:`${evidence[id]} 2026-11-23 사용자 승인에 따른 편집 추정이며 원작자 명시 인분 아님.`}]));

export function prepareText(e){
 const row=batch50.find(r=>r[0]===e.videoId);assert.ok(row);
 e.descriptionMenuName=row[1];e.nameSourceText=nameEvidence[row[1]];
 let text=e.ingredientText;
 if(e.videoId==='SWP0xcychyk')text=text.slice(text.indexOf('[시트]'));
 if(e.videoId==='-JPnL34RRSM')text=text.split(/\n---/)[0];
 if(e.videoId==='5u3v77i7nHU')text=text.split(/\n\s*생과육 코코넛오일 구매처/)[0];
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);lineOverrides[e.videoId]={};
 for(const raw of lines){
  if(/^[*\[]/.test(raw))continue;
  lineOverrides[e.videoId][raw]=fixed[e.videoId]?.[raw]??parse(raw);
 }
 if(e.videoId==='nlZ-yrWMRoE'||e.videoId==='h21WuV-YLX0'||e.videoId==='5u3v77i7nHU')e.ingredientClarification='원문의 대체 선택지는 한 가지로 정하여 중복 구매를 방지. 범위·단위 미기재 수량은 원문 그대로 별도 메모에 보존.';
 return lines.join('\n');
}
const selected=new Set(batch50.map(r=>r[0]));
const source=JSON.parse(await readFile(new URL('../data/source/moony-review.json',import.meta.url),'utf8'));
const index=JSON.parse(await readFile(new URL('../data/source/moony-video-index.json',import.meta.url),'utf8'));
const sourceMap=new Map([...source.entries,...(source.held??[])].map(e=>[e.videoId,e]));
const reasons={
 bQe69C5quO8:'재료표는 있지만 정보란의 현재 음료 고유 메뉴명과 찻잎 종류가 확인되지 않아 보류. 추천 링크의 다른 메뉴명은 사용하지 않음.',
 ojg8StDFjz0:'재료표는 있지만 정보란의 현재 음료 고유 메뉴명과 티 종류가 확인되지 않아 보류. 제목으로 메뉴명을 만들지 않음.',
 jceEj6Jpt24:'티라미수의 레이디핑거는 별도 영상 레시피만 연결되고 현재 케이크에 쓰는 실제 사용량이 없어 원재료 분해/구매량 확인 대기.',
 S6sTJ6uCatc:'식빵 8회분이 명시됐지만 아몬드가루150·차전자피가루30·골드플렉시드밀50의 원문 단위가 빠져 주재료 구매량 확인 대기.'
};
const nonrecipes=new Set(['fsfGBQk36Z8','L82tF4ei-A4','LYBt0CBPOog','8yAAznAotfU','4E8-80jS3qc','u3VY5UYhrII','nmj4IZSLsoI','9YJdTdHTB18']);
export const skips=index.entries.slice(146,293).filter(e=>!selected.has(e.videoId)).map(e=>({videoId:e.videoId,...(nonrecipes.has(e.videoId)?{status:'excluded-nonrecipe'}:{}),reason:nonrecipes.has(e.videoId)?'정보란을 확인한 조리도구·영양 정보·식재료 손질/보관 또는 커피 추출 방법 안내 영상. 분량 있는 완성 메뉴 재료표가 아니므로 제외.':reasons[e.videoId]??sourceMap.get(e.videoId)?.heldReason??sourceMap.get(e.videoId)?.reason??'원본 정보란 메뉴명·재료·분량 추가 확인 필요'}));
