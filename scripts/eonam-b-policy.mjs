// Reviewed source rows 87–173. Keep each original ingredient phrase in the record.
import {readFile} from 'node:fs/promises';
export const batch50=[
 ['M0DiTBRAGV0','스햄순두부찌개',2,'찌개','한식 국·찌개'],
 ['X_DXKtfTB9s','컵라면 김치전',2,'전','한식 반찬'],
 ['NWuYo7sYHlo','꿀새우피자',2,'피자','퓨전'],
 ['sT5KsSpq8w4','오징어볶음',3,'볶음','한식 주메뉴'],
 ['kdhAx2GrZcQ','갈비치킨',4,'구이','한식 주메뉴'],
 ['FBIPDn0C3uw','휴게소 버터감자',3,'구이','한식 반찬'],
 ['5GdYq4SEkjI','대패육전',4,'전','한식 반찬'],
 ['2zlotzZ7Ep0','냄비 바비큐',3,'구이','한식 주메뉴'],
 ['BpmI7lnWztk','수란 김치죽',2,'죽','한식 주메뉴',[1,2]]
];
export const canonicalOverrides={};
export const definitions=[
 ['eonam-omori-kimchi-stew-cup-noodles','오모리 김치찌개 컵라면','두부·계란·기타',false],
 ['eonam-frozen-whole-shrimp','냉동 새우','육류·해산물',false],
 ['eonam-shredded-pizza-cheese','슈레드 피자치즈','두부·계란·기타',false],
 ['eonam-skin-on-pork-belly','껍질 붙은 통삼겹','육류·해산물',false]
];
export const intermediateRows=new Map();
export const groupPolicy=()=>({scale:1});
export const servingsOverrides={};
const q=(name,sourceAmount,unit,reason)=>({name,sourceAmount,unit,...(reason?{reason}:{})});
const nil=(name,reason)=>q(name,null,null,reason);
export const lineOverrides={
 M0DiTBRAGV0:{
  '스팸 1캔(200g)':q('통조림 햄',200,'g'),
  '순두부 1개':q('순두부',1,'개'),
  '대파 1대':q('대파',1,'대'),
  '청양고추 2개':q('청양고추',2,'개'),
  '애호박 1/3개':q('애호박',1/3,'개'),
  '양파 1/2개':q('양파',0.5,'개'),
  '달걀 2개':q('계란',2,'개'),
  '다진 마늘 1T':q('다진 마늘',1,'T'),
  '고춧가루 3T':q('고춧가루',3,'T'),
  '간장 3T':q('간장',3,'T'),
  '굴소스 2T':q('굴소스',2,'T'),
  '설탕 0.5T':q('설탕',0.5,'T'),
  '통후추 20바퀴(1t)':q('통후추',20,'바퀴','원문 20바퀴 단위를 사용하고 병기된 1t는 원문 메모로 보존. 임의 환산하지 않음'),
  '물 300ml':q('물',300,'ml'),
  '식용유 3바퀴':q('식용유',3,'바퀴')
 },
 X_DXKtfTB9s:{
  '오모리 김치찌개 컵라면 1개':q('오모리 김치찌개 컵라면',1,'개'),
  '대파 1/2대':q('대파',0.5,'대'),
  '달걀 1개':q('계란',1,'개'),
  '밀가루 듬뿍 1T':q('밀가루',1,'T'),
  '뜨거운 물':nil('물'),
  '식용유':nil('식용유')
 },
 NWuYo7sYHlo:{
  '또띠아 1장':q('또띠아',1,'장'),
  '냉동새우 6마리':q('냉동 새우',6,'마리'),
  '버터 40g':q('버터',40,'g'),
  '마늘':nil('마늘'),
  '방울토마토 5개':q('방울토마토',5,'개'),
  '슈레드 피자치즈':nil('슈레드 피자치즈'),
  '고운 소금 2꼬집':q('소금',2,'꼬집'),
  '후추':nil('후추가루'),
  '꿀':nil('꿀')
 },
 sT5KsSpq8w4:{
  '오징어 한 마리 반':q('오징어',1.5,'마리','원문이 명시한 큰 오징어 한 마리 반 사용. 작은 오징어 두 마리는 대체 선택지로만 보존'),
  '대파 1대':q('대파',1,'대'),
  '양파 1개':q('양파',1,'개'),
  '마늘 10알':q('마늘',10,'알'),
  '청양고추 3개':q('청양고추',3,'개'),
  '고춧가루 3T':q('고춧가루',3,'T'),
  '설탕 3T':q('설탕',3,'T'),
  '간장 4T':q('간장',4,'T'),
  '고추장 듬뿍 1T':q('고추장',1,'T'),
  '식용유 4바퀴':q('식용유',4,'바퀴'),
  '참기름':nil('참기름'),
  '통깨':nil('참깨')
 },
 kdhAx2GrZcQ:{
  '닭볶음탕용 닭 10호(1kg)':q('닭',1,'kg'),
  '대파 2대':q('대파',2,'대'),
  '마늘 한줌':q('마늘',1,'줌'),
  '소금 세 꼬집':q('소금',3,'꼬집'),
  '생강 한톨':q('생강',1,'톨'),
  '설탕 1T':q('설탕',1,'T'),
  '간장 3T':q('간장',3,'T'),
  '굴소스 듬뿍 1T':q('굴소스',1,'T'),
  '물엿 6T':q('물엿',6,'T'),
  '통깨':nil('참깨')
 },
 FBIPDn0C3uw:{
  '감자 5~6개':nil('감자','원문 5~6개 범위를 임의 단일 수량으로 만들지 않고 원문 메모에 보존'),
  '물 1컵(200ml)':q('물',200,'ml'),
  '버터 40g':q('버터',40,'g'),
  '소금 1t':q('소금',1,'t'),
  '설탕':nil('설탕')
 },
 '5GdYq4SEkjI':{
  '냉동 대패삼겹살 400g':q('대패삼겹살',400,'g'),
  '달걀 7개':q('계란',7,'개'),
  '부침가루 한컵(200g)':q('부침가루',200,'g'),
  '참기름 1T':q('참기름',1,'T'),
  '소금 ⅓T':q('소금',1/3,'T'),
  '식용유':nil('식용유')
 },
 '2zlotzZ7Ep0':{
  '두께감 있는 스탠 냄비':[],
  '껍질 붙은 통삼겹 1근(600g)':q('껍질 붙은 통삼겹',600,'g'),
  '마늘 한 공기':q('마늘',1,'공기'),
  '식용유':nil('식용유'),
  '소금':nil('소금'),
  '깨 2T':q('참깨',2,'T'),
  '꿀 3T':q('꿀',3,'T')
 },
 BpmI7lnWztk:{
  '시판용 맛김치 100g':q('김치',100,'g'),
  '김칫국물 약간':nil('김치국물'),
  '즉석밥 1개':q('즉석밥',1,'개'),
  '참기름 2T':q('참기름',2,'T'),
  '참치액젓 2T':q('참치액',2,'T'),
  '물 800mL':q('물',800,'mL'),
  '설탕 1t':q('설탕',1,'t'),
  '달걀 3알':q('계란',3,'알'),
  '김가루':nil('김가루'),
  '통깨':nil('참깨'),
  '참기름 1바퀴':q('참기름',1,'바퀴'),
  '고춧가루 약간':nil('고춧가루')
 }
};
function tokens(e){
 return e.ingredientText.split(/\r?\n/).flatMap(line=>{
  line=line.trim();if(!line||line.startsWith('※'))return [];
  return line.split(/,(?![^()]*\))/).map(s=>s.trim()).filter(Boolean);
 });
}
export function prepareText(e){
 if(e.videoId==='sT5KsSpq8w4')e.ingredientClarification='큰 오징어1.5마리와 작은 오징어2마리는 같은 요리의 대체 선택지이며 큰 오징어 기준을 반영. 두 수량을 합산하지 않음.';
 if(e.videoId==='2zlotzZ7Ep0')e.ingredientClarification='스탠 냄비는 조리도구이므로 구매 식재료에서 제외. 원문 통삼겹의 껍질 있는 상태와 명시된600g 보존.';
 return tokens(e).join('\n');
}
const reviewed=new Set(batch50.map(r=>r[0]));
const source=JSON.parse(await readFile(new URL('../data/source/eonam-review.json',import.meta.url),'utf8'));
const videoIndex=JSON.parse(await readFile(new URL('../data/source/eonam-video-index.json',import.meta.url),'utf8'));
const sourceMap=new Map([...source.entries,...(source.held??[])].map(e=>[e.videoId,e]));
export const skips=videoIndex.entries.slice(87,174).filter(e=>!reviewed.has(e.videoId)).map(e=>({videoId:e.videoId,reason:e.videoId==='7G4bVVSVyDc'?'스햄떡볶이 영상인데 설명란 재료표가 스햄순두부찌개와 동일하고 떡이 누락됨. 설명란 오기/잘못된 연결 원본 확인 필요':sourceMap.get(e.videoId)?.heldReason??sourceMap.get(e.videoId)?.reason??'원본 재료·분량 추가 확인 필요'}));
