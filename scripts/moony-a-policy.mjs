// Reviewed Korean description ingredient facts, playlist index entries 0–145.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const key=s=>s.normalize('NFKC').replace(/\s/g,'');
const source=JSON.parse(await readFile(new URL('../data/source/moony-review.json',import.meta.url),'utf8'));
const index=JSON.parse(await readFile(new URL('../data/source/moony-video-index.json',import.meta.url),'utf8'));
const mine=new Set(index.entries.slice(0,146).map(e=>e.videoId));
// Each name is a literal dish name from the description or its Korean hashtags.
// Servings are an editorial estimate of the complete printed ingredient batch.
const selected=[
 ['kLF6onKMarI','비건라떼',2,'음료','그 밖','비건라떼','아몬드밀크400ml와 에스프레소2샷 전체를 작은 음료2잔으로 편집 추정'],
 ['cBBhf7BJdZI','두부부침',4,'부침','한식 반찬','두부부침','두부2모와 양념 전량을 반찬4인분으로 편집 추정'],
 ['c4F13wILnVk','부추전',2,'전','한식 반찬','부추전','부추150g·양파반개·전분5큰술 전체를 곁들임2인분으로 편집 추정'],
 ['ALeW6Kk6M0c','토마토마리네이드',3,'절임','양식','토마토마리네이드','토마토3개 전체를 곁들임3인분으로 편집 추정'],
 ['lCLcQ0XS0bs','냉국수',3,'냉국수','한식 주메뉴','냉국수','오이2개·물700ml·모둠해초10g 전체를3인분으로 편집 추정'],
 ['oj6Lc4wN3hE','어묵탕',4,'탕','한식 국·찌개','어묵탕','무300g·곤약우동200g·어묵수량범위와 양념 전량을 국4인분으로 편집 추정'],
 ['i1MPmpdHD7E','양배추 오믈렛',2,'오믈렛','양식','양배추 오믈렛','양배추150g·채소130g·모차렐라70g·토마토소스100g 전체를2인분으로 편집 추정'],
 ['GLV1Fvudd5g','두부 토스트',2,'토스트','양식','두부 토스트','두부300g·달걀3개·채소와 치즈 전체를2인분으로 편집 추정'],
 ['17soKpUuF7M','토스트',3,'토스트','양식','토스트','양배추200g·감자100g·달걀3개·치즈와 햄 전체를3인분으로 편집 추정'],
 ['gFY4j4Gz5WY','에그도그',2,'핫도그','양식','에그도그','소시지2개·계란4개·치즈60g 전체를2인분으로 편집 추정'],
 ['Hhm5-fjVBX0','에그 머핀',3,'머핀','양식','에그 머핀','소시지6개·달걀200g·채소200g·치즈90g 전체를3인분으로 편집 추정'],
 ['Opv3xVnGc-E','양배추 토스트',3,'토스트','양식','양배추 토스트','양배추300g·달걀4개·채소100g 등 전체를3인분으로 편집 추정. 또띠아15cm/22cm는 크기로만 보존'],
 ['4c--v3SP1Ks','수플레 오믈렛',2,'오믈렛','양식','수플레 오믈렛','달걀3개 전체를 가벼운 아침식사2인분으로 편집 추정'],
 ['NOXVJuK2gJ4','순두부그라탕',2,'그라탕','양식','순두부그라탕','순두부1개·토마토퓨레300g·채소와 치즈 전체를2인분으로 편집 추정'],
 ['Gja3ptBJY5E','순두부 찌개',2,'찌개','한식 국·찌개','순두부 찌개','순두부1개·토마토1개·대파1줄기와 양념 전체를2인분으로 편집 추정'],
 ['vspl-Oy5bsk','라따뚜이',4,'스튜','양식','라따뚜이','채소700g과 양념 전체를 곁들임4인분으로 편집 추정'],
 ['WSSLsGbwcJM','라따뚜이',6,'스튜','양식','라따뚜이','주채소900g·소스채소600g 전체를 곁들임6인분으로 편집 추정'],
 ['jcA41b4cRaQ','소시지 토마토 스튜',4,'스튜','양식','소시지 토마토 스튜','토마토퓨레400ml·채소육수300ml·소시지와 채소 전체를4인분으로 편집 추정'],
 ['r28sPfPSoTQ','만능 토마토 소스',8,'소스','양식','만능 토마토 소스','토마토퓨레680g·토마토200g·양파등 전체를8회 곁들임용으로 편집 추정. 완성수율을 중량으로 확정하지 않음'],
 ['51-DdRHLi2Y','달걀 만두',2,'전','한식 반찬','달걀 만두','달걀3개·팽이버섯반통·채소 전체를 곁들임2인분으로 편집 추정'],
 ['mqtcHm32dLM','두부전',3,'전','한식 반찬','두부전','두부300g·달걀2개·팽이버섯1묶음과 채소 전체를 반찬3인분으로 편집 추정'],
 ['ve_DKp6i5B0','배추전',2,'전','한식 반찬','배추전','배추200g·달걀3개·양파반개와 대파 전체를 반찬2인분으로 편집 추정'],
 ['dWz94HFqDU8','파전',3,'전','한식 반찬','파전','대파100g·해물200g·달걀2개·오트밀가루3큰술 전체를 곁들임3인분으로 편집 추정'],
 ['relI8nAKNKw','양배추 패티',4,'부침','양식','양배추 패티','양배추500g·양파250g·달걀2개·가루2Tbsp 전체를4인분으로 편집 추정'],
 ['wdm5E8_il2A','오믈렛',2,'오믈렛','양식','오믈렛','달걀3개·채소60g·우유2Tbsp 전체를2인분으로 편집 추정'],
 ['TRryXWRHKU0','미나리새우전',2,'전','한식 반찬','미나리새우전','미나리100g·양파100g·건새우30g·달걀2개 전체를 곁들임2인분으로 편집 추정'],
 ['kIu2F4AgFJc','피자',2,'피자','양식','피자','팽이버섯100g·양파50g·달걀2개·베이컨50g·치즈100g 전체를2인분으로 편집 추정'],
 ['ZqbvulD7rPw','야채전',3,'전','한식 반찬','야채전','양배추200g·당근30g·대파30g·달걀4개 전체를 곁들임3인분으로 편집 추정'],
 ['B0WgKrLbjV8','꼬마김밥',3,'김밥','한식 주메뉴','꼬마김밥','김6장·달걀5개·당근1개·시금치200g 전체를3인분으로 편집 추정'],
 ['_9TGwKsUMwM','연어포케',2,'포케','양식','연어포케','연어150g·아보카도1개·채소와 양념 전량을2인분으로 편집 추정'],
 ['XHdi7XvSs0w','뚝배기 불고기',2,'불고기','한식 주메뉴','뚝배기 불고기','소고기300g·양파1개·버섯과 양념 전체를2인분으로 편집 추정'],
 ['p9gcTUAmqsE','미네스트로네',4,'수프','양식','미네스트로네','병아리콩200g·토마토퓨레400g·당근150g·셀러리100g등 전체를4인분으로 편집 추정'],
 ['sUfxGut9xE8','미역국',8,'국','한식 국·찌개','미역국','물3리터·소고기400g·미역25g 전체를 국8인분으로 편집 추정'],
 ['FBcTIeEJw7Q','순두부 찌개',2,'찌개','한식 국·찌개','순두부 찌개','순두부350g·달걀수량범위·채소와 양념 전체를2인분으로 편집 추정'],
 ['zPvtnhwkw-E','고추장찌개',4,'찌개','한식 국·찌개','고추장찌개','돼지고기150g·채소680g과 양념 전량을4인분으로 편집 추정'],
 ['EdQsyo8eu50','그릭요거트',10,'요거트','그 밖','그릭요거트','우유2.1L 전체 제조량을10회 섭취용으로 편집 추정. 유청분리 후 완성중량은 임의 확정하지 않음'],
 ['Z-saV8gletU','리코타 치즈',10,'치즈','그 밖','리코타 치즈','우유1500ml·생크림500ml 전체 제조량을10회 곁들임용으로 편집 추정. 완성중량은 임의 확정하지 않음'],
 ['kOS_EGIExvU','마요네즈',10,'소스','그 밖','마요네즈','두부200g·오일50ml 전체 제조량을10회 곁들임용으로 편집 추정'],
 ['D0IchYBpyGM','마요네즈',10,'소스','그 밖','마요네즈','달걀1개·오일200ml 전체 제조량을10회 곁들임용으로 편집 추정'],
 ['UOWYEGyvVs0','감동란',6,'삶기','한식 반찬','감동란','달걀6개 전체를1개씩6회 곁들임용으로 편집 추정']
];
export const batch50=selected.map(r=>r.slice(0,5));
const selections=new Map(selected.map(r=>[r[0],r]));
export const servingsOverrides=Object.fromEntries(selected.map(r=>[r[0],{status:'estimated',evidence:`${r[6]}(2026-11-23 사용자 승인). 원작자 명시 인분 아님.`}]));
const originalIngredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const aliases={
 '달걀':'계란','댤걀':'계란','오일':'식용유','기름':'식용유','올리브오일':'올리브유','고추가루':'고춧가루',
 '감자전분':'감자전분','붉은고추':'홍고추','청양고추':'청양고추','청고추':'풋고추','대파흰부분':'대파',
 '다진대파':'대파','다진파':'대파','파':'대파','올리고당':'올리고당','후추':'후추가루',
 '양송이':'양송이버섯','모짜렐라치즈':'모차렐라 치즈','모차렐라치즈':'모차렐라 치즈',
 '체더치즈':'체더치즈','체다치즈':'체더치즈','슬라이스치즈':'슬라이스치즈',
 '오뎅':'어묵','다시마':'다시마','콩국물':'콩국물','방울토마토':'방울토마토',
 '소금':'소금','오트밀가루':'오트 밀가루','샐러리':'셀러리','쥬키니호박':'쥬키니호박',
 '월계수잎':'월계수잎','토마토퓨레':'토마토 퓌레','토마토페이스트':'토마토 페이스트',
 '토마토소스':'토마토소스','크러쉬드레드페퍼':'레드크러쉬드 페퍼','파프리카파우더':'파프리카가루',
 '차전자피가루':'차전자피 가루','카사바가루':'카사바 가루','어간장':'어간장','건새우':'건새우',
 '통깨':'참깨','밥':'밥','다진마늘':'다진 마늘','다진생강':'다진 생강','와사비':'고추냉이',
 '아보카도오일':'아보카도유','자색양배추':'적양배추','묵은지':'김치','양파(샬롯)':'샬롯','김밥용단무지':'단무지',
 '레드파프리카':'파프리카','파르메산치즈':'파르메산 치즈','생참기름':'생참기름',
 '애플사이다비네거':'사과식초','디종머스터드':'디종머스터드','초콜릿':'초콜릿'
};
export const canonicalOverrides={};
export const definitions=[
 ['moony-black-soybean-powder','검은콩가루','두부·계란·기타',false],
 ['moony-black-sesame-powder','흑임자가루','두부·계란·기타',false],
 ['moony-almond-milk','아몬드밀크','두부·계란·기타',false],
 ['moony-espresso','에스프레소','두부·계란·기타',false],
 ['moony-raw-sesame-oil','생참기름','양념·조미료',true],
 ['moony-assorted-seaweed','모둠 해초','육류·해산물',false],
 ['moony-konjac-udon','곤약우동','두부·계란·기타',false],
 ['moony-oat-flour','오트 밀가루','두부·계란·기타',false],
 ['moony-cassava-flour','카사바 가루','두부·계란·기타',false],
 ['moony-psyllium-husk-powder','차전자피 가루','두부·계란·기타',false],
 ['moony-mixed-seafood','해물','육류·해산물',false],
 ['moony-probiotic-culture','유산균','두부·계란·기타',false],
 ['moony-sweetener','감미료','양념·조미료',true],
 ['moony-tomato-puree','토마토 퓌레','두부·계란·기타',false],
 ['moony-shallot','샬롯','채소·버섯',false],
 ['moony-broccoli-stalk','브로콜리 줄기','채소·버섯',false],
 ['moony-cabbage-core','양배추 심지','채소·버섯',false]
];
const names=new Map([...originalIngredients.map(i=>[key(i.name),i.name]),...definitions.map(r=>[key(r[1]),r[1]])]);
const canonical=n=>{
 const wanted=aliases[key(n)]??n;
 return names.get(key(wanted))??wanted;
};
function numeric(n){const f=n.match(/^(\d+)\/(\d+)$/);return f?+f[1]/+f[2]:+n;}
const custom={
 '알룰로스 또는 올리고당 1큰술':{name:'알룰로스',sourceAmount:1,unit:'큰술',reason:'원문 대체재 중 알룰로스 한 가지만 선택'},
 '알룰로스(또는 올리고당) 2Tbsp':{name:'알룰로스',sourceAmount:2,unit:'Tbsp',reason:'원문 대체재 중 알룰로스 한 가지만 선택'},
 '알룰로스 (또는 올리고당) 20ml':{name:'알룰로스',sourceAmount:20,unit:'ml',reason:'원문 대체재 중 알룰로스 한 가지만 선택'},
 '모차렐라치즈 60g':{name:'모차렐라 치즈',sourceAmount:60,unit:'g'},
 '목우촌 BT21 비엔나소시지 6개':{name:'비엔나소시지',sourceAmount:6,unit:'개',reason:'원문 상품명 중 식재료 종류만 표준화'},
 '치즈 (모차렐라, 슬라이스)':{name:'모차렐라 치즈',sourceAmount:null,unit:null,reason:'원문 치즈 종류 중 모차렐라 한 가지만 선택. 수량 미기재'},
 '또띠아 15cm 22cm':{name:'또띠아',sourceAmount:null,unit:null,reason:'15cm와22cm는 지름 표기이며 장수로 오인하지 않음'},
 '감미료 또는 설탕 1/2 Tbsp':{name:'설탕',sourceAmount:0.5,unit:'Tbsp',reason:'원문 대체재 중 성분이 명확한 설탕 한 가지만 선택'},
 '옥수수전분 또는 칡전분 1/2Tbsp (생략가능)':{name:'옥수수전분',sourceAmount:0.5,unit:'Tbsp',reason:'원문 대체재 중 옥수수전분 한 가지만 선택. 생략 가능한 재료임'},
 '다시마 손바닥 보다 크게':{name:'다시마',sourceAmount:null,unit:null,reason:'손바닥보다 크게는 크기 설명이며 수량을 임의 생성하지 않음'},
 '청, 홍고추 각 1개':[{name:'풋고추',sourceAmount:1,unit:'개'},{name:'홍고추',sourceAmount:1,unit:'개'}],
 '청고추 홍고추 각 1개':[{name:'풋고추',sourceAmount:1,unit:'개'},{name:'홍고추',sourceAmount:1,unit:'개'}],
 '청고추 홍고추 30g':[{name:'풋고추',sourceAmount:null,unit:null,reason:'원문 청고추와 홍고추 합계30g이나 개별 배분 미기재'},{name:'홍고추',sourceAmount:null,unit:null,reason:'원문 청고추와 홍고추 합계30g이나 개별 배분 미기재'}],
 '파프리카 50g (적색, 노란색, 녹색 각각)':{name:'파프리카',sourceAmount:150,unit:'g',reason:'원문 적색·노란색·녹색 각각50g을 같은 재료ID·같은단위로 합산'},
 '치즈 80g':{name:'치즈',sourceAmount:80,unit:'g'},
 '양파(샬롯) 20g':{name:'샬롯',sourceAmount:20,unit:'g',reason:'원문이 샬롯으로 명시한 양파 종류 보존'},
 '오일 200ml (MCT, 아보카도오일, 올리브오일)':{name:'올리브유',sourceAmount:200,unit:'ml',reason:'원문 선택 오일 중 올리브오일 한 가지만 반영'},
 '소금 2g (2~3꼬집)':{name:'소금',sourceAmount:2,unit:'g',reason:'원문 병기 중량2g 사용. 꼬집 범위를 단일값으로 만들지 않음'},
 '(간장 30ml + 감미료 15g)':[{name:'간장',sourceAmount:30,unit:'ml',reason:'원문 만능간장3T 옆에 직접 명시된 구성량 반영'},{name:'감미료',sourceAmount:15,unit:'g',reason:'원문 만능간장3T 옆에 직접 명시된 구성량 반영'}]
};
function parse(raw){
 if(custom[raw])return custom[raw];
 let name=raw.split(/\s+(?=\d|약간|적당|한\s*줄기)/)[0];
 if(/^[^\d]+\d/.test(name))name=raw.slice(0,raw.search(/\d/)).trim();
 let q=raw.slice(name.length).trim();
 name=name.replace(/\s*(?:중간크기|큰 것|큰|약간)$/,'').trim();
 name=name.replace(/\s*\((?:생략가능|취향|선택사항)\)$/,'').trim();
 name=canonical(name);
 const printed=raw.match(/\((\d+(?:\.\d+)?)\s*(kg|g|ml|mL|L)\)/);
 if(printed)return {name,sourceAmount:+printed[1],unit:printed[2]};
 // A trailing direct mass, e.g. "두부 1모 300g", is also printed, never an invented conversion.
 const mass=q.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(kg|g|ml|mL|L|리터)(?:\s|$)/);
 if(mass)return {name,sourceAmount:+mass[1],unit:mass[2]};
 if(/[~～]|\d\s*-\s*\d/.test(q))return {name,sourceAmount:null,unit:null,reason:'원문 재료 수량 범위를 임의 단일값으로 만들지 않음'};
 const num=q.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(Tbsp|Tsp|tbsp|tsp|Ts|ts|T|t|kg|g|ml|mL|L|리터|큰술|작은술|꼬집|마리|모|통|개|줄기|줄|대|장|컵|알|샷|묶음|잎|쪽|봉|팩)/);
 if(num)return {name,sourceAmount:numeric(num[1]),unit:num[2]};
 if(/^한\s*줄기/.test(q))return {name,sourceAmount:1,unit:'줄기'};
 assert.ok(!/\d/.test(q),`수량 해석 확인: ${raw}`);
 return {name,sourceAmount:null,unit:null};
}
function split(text){
 let depth=0,start=0;const rows=[];
 for(let n=0;n<text.length;n++){
  if(text[n]==='(')depth++;if(text[n]===')')depth--;
  // "청, 홍고추 각 1개" is one literal token with a reviewed two-row override.
  if(text[n]==='\n'||(text[n]===','&&depth===0&&!/^청\s*$/.test(text.slice(start,n).trim()))){
   const raw=text.slice(start,n).trim();if(raw)rows.push(raw);start=n+1;
  }
 }
 const tail=text.slice(start).trim();if(tail)rows.push(tail);return rows;
}
export const intermediateRows=new Map();
export const groupPolicy=()=>({scale:1});
export const lineOverrides={};
const sectionLabels=new Set(['소스','양념','김밥용 풀','재료B']);
const ignoredLines=new Set(['👇🏻에그 머핀','🍳추천하는 달걀 레시피']);
export function prepareText(e){
 const sel=selections.get(e.videoId);assert.ok(sel,e.videoId);
 e.descriptionMenuName=sel[1];e.nameSourceText=sel[5];
 let text=e.ingredientText;
 if(e.videoId==='_9TGwKsUMwM'){
  text=text.split('Ingredients A')[0];
  e.ingredientClarification='한국어 원문 첫 A/B 재료표만 반영. 반복 번역·별도 대량 만능간장 제조표 제외. 만능간장3T는 옆에 직접 적힌 간장30ml+감미료15g으로 분해하여 중간조리물을 중복 구매하지 않음.';
 }
 const rows=split(text).filter(raw=>!sectionLabels.has(raw)&&!ignoredLines.has(raw)&&raw!=='만능 간장 3T');
 lineOverrides[e.videoId]=Object.fromEntries(rows.map(raw=>[raw,parse(raw)]));
 if(e.videoId==='D0IchYBpyGM')e.ingredientClarification='원문은 디종 머스터드를 지정하며 홀그레인 머스터드를 제외함.';
 if(e.videoId==='Opv3xVnGc-E')e.ingredientClarification='또띠아 원문15cm·22cm는 크기 정보이며 수량 미기재로 유지. 원문의 치즈 대안 중 모차렐라만 선택.';
 return rows.join('\n');
}
const customSkips={
 'swPArDu7zak':'정보란은 다이어트 국수로만 지칭하여 구체 메뉴명 확인 대기. 해초국수·콩국물 원문 양은 확인됨.',
 'k-yRW47mTBA':'정보란에 또띠아·달걀 재료만 소개되어 구체 메뉴명 확인 대기.',
 '2uo450zVAIY':'정보란에 순두부 요리로만 소개되어 구체 메뉴명 확인 대기.',
 '9V5Mo_OaSBg':'정보란에 순두부·계란 요리로만 소개되어 구체 메뉴명 확인 대기.',
 'IRnO1_5dXug':'정보란에 순두부·계란 아침식사로만 소개되어 구체 메뉴명 확인 대기.',
 'fVTnNxSBjxY':'정보란에 토마토·달걀 아침식사로만 소개되어 구체 메뉴명 확인 대기.',
 'IRhpRwIHRbw':'정보란에 달걀로 만드는 아침으로만 소개되어 구체 메뉴명 확인 대기.',
 'IyHNPBfo6-o':'직접 만든 만능 토마토소스100g 사용. 제조 전체의 완성수율·사용 비율이 없어 원재료로 분해할 근거 확인 대기.',
 '4v-qOeMo9Ek':'김치찜·폭립 공통 재료의 요리별 배분과 전체 사용 분량 확인 대기.',
 'BxvkW4FD0C4':'멸치15개·다시마·물1000ml로 직접 만드는 육수의 완성수율과 실제1000ml 사용의 관계 확인 대기.',
 '77onIuMZiq4':'한글/영문 양파량 차이와 직접 만든 저탄수고추장150g의 원재료 분해·완성수율 확인 대기.',
 'LPxOcAJUgvM':'집에 있는 야채400g만 표기되어 정확한 식재료 종류 확인 대기.',
 'oABH69vAtQM':'사골 제조 원재료 일부 수량은 있으나 물·고기·최종 제조분량이 없어 계산 기준 확인 대기.'
};
export const skips=source.entries.filter(e=>mine.has(e.videoId)&&e.ingredientText&&!selections.has(e.videoId)).map(e=>({videoId:e.videoId,reason:customSkips[e.videoId]??(!/\d/.test(e.ingredientText)?'원문 재료명만 있고 전체 재료 수량이 없어 기준 인분 추정·장보기 계산량 확인 대기.':'정보란의 구체 메뉴명 또는 전체 사용 분량·재료 종류 추가 확인 대기.')}));
for(const e of source.entries.filter(e=>selections.has(e.videoId)))prepareText(e);
