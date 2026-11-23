// Reviewed first half of Kitchen Caden's non-Shorts playlist entries.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {canonicalOverrides as earlier} from './paik-batch-03-policy.mjs';
export const batch50=[
 ['iExAnB9aQXE','유니 짜파게티',2,'볶음면','중식'],
 ['VOLdYvZKGYk','최강록 규동',2,'덮밥','일식'],
 ['fSO1BUWp0lY','초간단 스키야키',2,'전골','일식'],
 ['rdoc9zmVtoc','닭다리살 데리야끼 덮밥',2,'덮밥','일식'],
 ['l5ctHOjWzg0','마제소바',1,'비빔면','일식'],
 ['plab1xyfpEM','고등어 된장조림',2,'조림','일식'],
 ['Nf64M49MMYk','우삼겹 카레우동',2,'카레','일식'],
 ['I3YuOVazd_s','시금치 베이컨볶음',3,'볶음','한식 반찬'],
 ['y795m5QpTFA','감바스 짜파게티',2,'볶음면','퓨전'],
 ['ktUEcwWfPzU','김풍 초장 파스타',2,'파스타','퓨전'],
 ['VrPIBsIcR9s','감자 그라탕',3,'구이','양식'],
 ['IPswH1Tsnao','북엇국 떡볶이',3,'볶음','한식 주메뉴'],
 ['iEHYa_ou9PU','샘킴 굴튀김',2,'튀김','양식'],
 ['WAqxAXaxBCE','전복 미역 수프',2,'수프','양식'],
 ['plHNkSHmC18','베이컨 감자 사라다',3,'샐러드','양식'],
 ['D_jIsgBZCuU','자몽 브륄레',5,'디저트','그 밖'],
 ['zoqdukpn6IE','아보카도 샐러드',3,'샐러드','양식'],
 ['2BvBrecFJS0','코울슬로',6,'샐러드','양식'],
 ['F2T4KiR4lx0','태국식 차돌 파스타',1,'파스타','퓨전'],
 ['saSDyohI1-0','무피클',10,'절임','한식 반찬'],
 ['PyCFeiM3ikk','양파 스테이크',2,'구이','양식'],
 ['zMItNsN6Us8','카라멜 호두',3,'디저트','그 밖'],
 ['akpdWkIZyjs','만능 디핑소스',8,'소스','그 밖'],
 ['rnj5L0xTYEU','돼지고기 안심스테이크',2,'구이','양식'],
 ['Ww-OGnxjd90','클램 차우더 수프',2,'수프','양식'],
 ['JrVU7kEIQdQ','원팬 콘 참치 파스타',1,'파스타','양식'],
 ['e6Hsqu8066Y','크림라구파스타',3,'파스타','양식'],
 ['0-ildAcj2VY','매콤 장어덮밥',2,'덮밥','일식'],
 ['81q67YRfOlM','초간단 돼지국밥',2,'국밥','한식 주메뉴'],
 ['q_KRs717Fq4','흑돼지 김치찌개',4,'찌개','한식 국·찌개'],
 ['6Ljb9ZqAmF8','무생채',8,'무침','한식 반찬'],
 ['4K3h-Eky_00','콩나물 어묵볶음',3,'볶음','한식 반찬'],
 ['kcqgfT3NSAY','LA갈비',4,'구이','한식 주메뉴'],
 ['mw7pftQHqlQ','두부조림',3,'조림','한식 반찬'],
 ['WV91-NxNNDI','애호박 국밥',3,'국밥','한식 주메뉴'],
 ['GpIMVmW20u0','꽈리고추 멸치볶음',4,'볶음','한식 반찬'],
 ['GmXFPKsjSe0','대패삼겹 파무침',3,'무침','한식 주메뉴'],
 ['Z_rxxc3UhNo','소문의 닭다리',2,'찜','한식 주메뉴'],
 ['H-En9xJUR7k','깻잎김치',20,'김치','한식 반찬'],
 ['zcwL1zWIwpU','갈치조림',3,'조림','한식 주메뉴'],
 ['hpYjmlYzX84','초간단 카레라면',1,'라면','한식 주메뉴'],
 ['WvTZwyZX2Wo','진미채 오징어짬뽕',2,'라면','한식 주메뉴'],
 ['V3TA8wtp-YQ','명란 오이무침',3,'무침','한식 반찬']
];
const byId=new Set(batch50.map(r=>r[0]));
export const canonicalOverrides={...earlier,
 '짜파게티':'짜장라면','다진삼겹살':'다진 삼겹살','면수':'물','달걀노른자':'계란노른자',
 '고명용파':'대파','샤부용소고기':'샤부샤부용 소고기','채썬우엉':'우엉',
 '일본식미소된장':'미소된장','우동사리':'우동','샐러리':'셀러리','홀그레인머스타트':'홀그레인머스터드',
 '플레인요거트':'플레인 요거트','오이피클':'오이피클','파마산치즈':'파르메산 치즈',
 '모차렐라피자치즈':'모차렐라 치즈','파마산치즈가루':'파르메산 치즈가루',
 '분말카레':'카레 가루','올리브오일':'올리브유','양조간장':'간장','미원':'MSG','명란':'명란젓',
 '앞다리살':'돼지 앞다리살','간편북엇국':'간편 북엇국','대패목살':'대패 목살',
 '다진김치':'김치','한우사골곰탕':'한우 사골곰탕','계란':'계란','흑돼지':'흑돼지',
 '돼지고기안심':'돼지고기 안심','샐러드용채소':'그린 샐러드','레토르트미역국':'레토르트 미역국',
 '오뚜기크림스프분말':'크림스프 분말','트러플오일':'트러플 오일',
 '타바스코':'타비스코 소스','초장':'초고추장','엔젤헤어파스타':'엔젤헤어 파스타',
 '손질된새우':'새우','라임주스or레몬주스':'레몬즙','맥주or탄산수':'탄산수',
 '라임(또는레몬)즙':'레몬즙','케첩or토마토소스':'토마토소스','파':'대파','통깨':'참깨',
 '통마늘':'마늘','시치미':'시치미','오뚜기3일숙성카레클래식':'고형 카레',
 '오뚜기3일숙성카레하모니순한맛':'고형 카레','오동통라면':'오동통 라면','딸리아딸레':'탈리아텔레',
 '고르곤졸라치즈':'고르곤졸라 치즈','피클링스파이스':'피클링스파이스','민트티백':'민트 티백',
 '알타리무':'알타리무','샐러드드레싱':'샐러드드레싱','고수':'고수','쌀국수장국':'쌀국수 장국',
 '튀김부스러기':'튀김 부스러기','닭다리':'닭다리','불린당면':'불린 당면','다시다':'다시다',
 '다진소고기':'다진 쇠고기','쯔유':'쯔유','옥수수콘':'캔 옥수수',
 '달걀':'계란','앙파':'양파','돼지고기앞다리살':'돼지 앞다리살','당근등채소':'당근'
};
export const definitions=[
 ['caden-minced-pork-belly','다진 삼겹살','육류·해산물',false],
 ['caden-shabu-beef','샤부샤부용 소고기','육류·해산물',false],
 ['caden-shichimi','시치미','양념·조미료',true],
 ['caden-fried-batter-bits','튀김 부스러기','두부·계란·기타',false],
 ['caden-angel-hair-pasta','엔젤헤어 파스타','두부·계란·기타',false],
 ['caden-pork-neck-slices','대패 목살','육류·해산물',false],
 ['caden-instant-pollock-soup','간편 북엇국','두부·계란·기타',false],
 ['caden-retort-seaweed-soup','레토르트 미역국','두부·계란·기타',false],
 ['caden-gorgonzola-cheese','고르곤졸라 치즈','두부·계란·기타',false],
 ['caden-pork-tenderloin','돼지고기 안심','육류·해산물',false],
 ['caden-cream-soup-powder','크림스프 분말','양념·조미료',true],
 ['caden-tuna-retort-gomtang','한우 사골곰탕','두부·계란·기타',false],
 ['caden-black-pork','흑돼지','육류·해산물',false],
 ['caden-mint-tea-bag','민트 티백','양념·조미료',true],
 ['caden-tteglie','탈리아텔레','두부·계란·기타',false],
 ['caden-spaghettini','스파게티니','두부·계란·기타',false],
 ['caden-noodle-stock','쌀국수 장국','양념·조미료',true],
 ['caden-odongtong-ramen','오동통 라면','두부·계란·기타',false],
 ['caden-dashida-generic','다시다','양념·조미료',true],
 ['caden-chuka-noodles','중화면','두부·계란·기타',false],
 ['caden-truffle-oil','트러플 오일','양념·조미료',true],
 ['caden-young-radish','알타리무','채소·버섯',false],
 ['caden-tsuyu','쯔유','양념·조미료',true],
 ['caden-freshwater-eel','민물장어','육류·해산물',false],
 ['caden-tuna-extract','참치액','양념·조미료',true],
 ['caden-anchovy-generic','멸치','육류·해산물',false]
];
export const intermediateRows=new Map();
export function groupPolicy(){return {scale:1};}
export const skips=[
 ['jtdxQXfSYDo','치킨 가라아게: 재료표에 닭 주재료가 누락되어 원본 확인 대기'],
 ['fvPA1g-nWkM','연어 스테이크: 재료표에 연어 주재료가 누락되어 원본 확인 대기'],
 ['lZPcQCj08tQ','떡국: 브라운버터 제조 250g과 실제 사용량의 관계 확인 대기'],
 ['xgYAgpqQNSg','제육볶음: 대량 양념장 제조분과 실제 고기600g에 쓰는 양 확인 대기'],
 ['lRyt_KQckiE','묵사발: 냉면육수2팩이 주재료/양념에 반복되어 중복인지 확인 대기'],
 ['q_QLRth9JvE','목살 스테이크: 목살 축종과 대량 데리야끼 소스의 실제 사용 분량 확인 대기'],
 ['qcWefHMMwpI','불고기: 원문 불고기1kg의 축종/형태 확인 대기']
].map(([videoId,reason])=>({videoId,reason}));

// Preserve each literal ingredient token while splitting only commas outside parentheses.
function splitTokens(text){
 let depth=0,start=0;const result=[];
 for(let n=0;n<text.length;n++){
  if(text[n]==='(')depth++;
  if(text[n]===')')depth--;
  if((text[n]===','&&depth===0)||text[n]==='\n'){
   const token=text.slice(start,n).trim();if(token)result.push(token);start=n+1;
  }
 }
 const tail=text.slice(start).trim();if(tail)result.push(tail);
 return result;
}
const key=s=>s.normalize('NFKC').replace(/\s/g,'');
function numeric(s){
 const f=s.match(/^(\d+)\/(\d+)$/);return f?Number(f[1])/Number(f[2]):Number(s);
}
function parseFact(raw){
 if(raw==='파스타면 110g(스파게티니 11호)')return {name:'스파게티니',sourceAmount:110,unit:'g'};
 const firstParen=raw.indexOf('(');
 let name=firstParen>=0?raw.slice(0,firstParen).trim():raw.split(/\s+(?=\d|한\s*줌|소량|약간|적당|조금|취향|넉넉히)/)[0].trim();
 let quantity=firstParen>=0?raw.slice(firstParen+1,raw.lastIndexOf(')')):raw.slice(name.length).trim();
 if(firstParen>=0)name=name.replace(/\s+\d+(?:\.\d+)?(?:\/\d+)?\s*(?:kg|g|ml|mL|cc|큰술|작은술|조각|컵)\s*$/,'');
 if(raw==='라임(또는 레몬)즙'){name='라임(또는 레몬)즙';quantity='';}
 if(raw.startsWith('옥수수(1개) -')){name='옥수수';quantity='1개';}
 if(raw.startsWith('기타 가니쉬'))return [];
 if(name==='발사믹 그레이즈')return ['발사믹식초','꿀'].map(n=>({name:n,sourceAmount:null,unit:null,reason:'원문이 발사믹 식초+꿀로 명시한 재료만 포함; 실제 양 미기재'}));
 name=canonicalOverrides[key(name)]??name;
 const reason=/or|또는/.test(raw)?'원문 대체 재료 중 한 가지만 등록하여 중복 구매하지 않음':undefined;
 if(/[~～]/.test(quantity))return {name,sourceAmount:null,unit:null,reason:'원문 재료 수량 범위를 임의 단일값으로 정하지 않고 보존'};
 const mass=quantity.match(/(?:^|[\s/])([\d]+(?:\.\d+)?)\s*(kg|g|ml|mL|cc)(?:\b|(?=\s|[–—\-]))/);
 if(mass)return {name,sourceAmount:Number(mass[1]),unit:mass[2],reason};
 const q=quantity.match(/(?:약\s*|넉넉히\s*|가득\s*|큰 거\s*)?(\d+(?:\.\d+)?(?:\/\d+)?)\s*(큰술|작은술|스푼|T|t|대|개|마리|팩|장|컵|캔|알|줄기|줄|조각|단|꼬집|인분|모|봉지|봉|통|포기|국자)/);
 if(name==='참치'&&/캔/.test(quantity))name='통조림 참치';
 if(q)return {name,sourceAmount:numeric(q[1]),unit:q[2],reason};
 if(/반\s*줌/.test(quantity))return {name,sourceAmount:0.5,unit:'줌',reason};
 if(/한\s*줌/.test(quantity))return {name,sourceAmount:1,unit:'줌',reason};
 assert.ok(!/[0-9]/.test(quantity),`추가 수량 해석 필요: ${raw}`);
 return {name,sourceAmount:null,unit:null,reason};
}
export const lineOverrides={};
export function prepareText(e){
 let text=e.ingredientText;
 if(e.videoId==='Nf64M49MMYk'){
  const parts=text.split(/\n\s*\n/);e.omittedSections=[{sourceText:parts[0],reason:'해산물 카레는 별도 요리. 우삼겹 카레우동 버전만 등록'}];text=parts[1];
 }
 if(e.videoId==='I3YuOVazd_s'){
  const parts=text.split(/\n\s*\n/);e.omittedSections=[{sourceText:parts[0],reason:'버터밥은 별도 요리'},{sourceText:parts.slice(2).join('\n\n'),reason:'돈지루는 별도 요리'}];text=parts[1];
 }
 text=text.split('\n\n🎵Music provided by')[0];
 if(e.videoId==='hpYjmlYzX84'){
  const after=text.includes('※ 재료')?text.slice(text.lastIndexOf('※ 재료')+4).trim():text.trim();
  text=[...new Set(after.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean))].join('\n');
 }
 const tokens=splitTokens(text).filter(t=>!t.startsWith('※')&&!t.startsWith('🎵')&&!t.startsWith('▶'));
 const prepared=[];lineOverrides[e.videoId]={};
 for(let raw of tokens){
  if(raw.startsWith('- '))raw=raw.slice(2);
  if(raw==='샐러드드레싱'){
   // The following source ingredients are the dressing's own composition.
   e.ingredientClarification='아보카도 샐러드의 샐러드드레싱은 아래 크림치즈·과즙·오일 등으로 제조하는 중간 조리물로 구분해 중복 구매하지 않음.';
   continue;
  }
  prepared.push(raw);lineOverrides[e.videoId][raw]=parseFact(raw);
 }
 return prepared.join('\n');
}
// Populate overrides before the combined policy copies this module's exports.
const source=JSON.parse(await readFile(new URL('../data/source/caden-review.json',import.meta.url),'utf8'));
for(const e of source.entries.filter(e=>byId.has(e.videoId)))prepareText(e);
