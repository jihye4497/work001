import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {validateData} from '../js/ingredients.js';
import {assertNotShortVideo} from './paik-source-policy.mjs';
const batch=process.argv.includes('--batch=remaining')?'remaining':process.argv.includes('--batch=03')?'03':process.argv.includes('--batch=02')?'02':'50';
const {batch50,groupPolicy,intermediateRows,canonicalOverrides={},definitions:extraDefinitions=[],lineOverrides={},prepareText=e=>e.ingredientText}=await import(`./paik-batch-${batch}-policy.mjs`);
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const write=(p,d)=>writeFile(new URL('../'+p,import.meta.url),JSON.stringify(d,null,2)+'\n');
const reviewPath=`data/source/paik-batch-${batch}-review.json`;
const review=await read(reviewPath);
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json'),catalog=await read('data/recipe-categories.json');
const priorIngredientIds=new Set(ingredients.map(i=>i.id));
const key=s=>s.normalize('NFKC').replace(/\s/g,'');
const canonical={
 '달걀':'계란','깐메추리알':'삶은 메추리알','간마늘':'다진 마늘','다진마늘':'다진 마늘','통마늘':'마늘',
 '간생강':'다진 생강','간장':'간장','정수물':'물','정수물약':'물','정수물가득':'물','정수물깎아서':'물',
 '신김치':'김치','배추김치':'김치','찬밥':'밥','재래식된장':'된장','굵은고추가루':'굵은 고춧가루','고운고추가루':'고운 고춧가루',
 '후춧가루':'후추가루','통후추가루':'후추가루','꽃소금':'소금','통깨':'참깨','간깨':'깨소금',
 '미림':'맛술','양조식초':'식초','스틱버터':'버터','참치캔小':'통조림 참치','참치캔':'통조림 참치',
 '다진돼지고기':'다진 돼지고기','소고기(불고기용)':'소고기(불고기용)','소고기슬라이스(목등심)':'우목심',
 '통조림햄':'통조림 햄','체다슬라이스치즈':'슬라이스 체더치즈','모짜렐라치즈':'모차렐라 치즈',
 '채썬양배추':'양배추','대파흰부분':'대파','손질오징어':'오징어','냉동삼겹살':'삼겹살','손질갈치':'갈치',
 '절단불린미역':'불린 미역','고명용김':'김','구운파래김':'파래김','국산콩손두부':'두부',
 '탈피들깨가루':'거피들깨가루','간마늘약':'다진 마늘','파르메산치즈가루':'파르메산 치즈가루',
 '냉동꽃게':'꽃게','빽소시지':'소시지','스파게티면':'스파게티','올리브오일':'올리브유',
 '삶은고구마':'삶은 고구마','자숙연근':'자숙 연근','돼지고기앞다리살(찌개용)':'돼지 앞다리살',
 '시판우동':'우동','냉동유부':'유부','라면사리':'라면','등갈비':'등갈비',
 '물(등갈비초벌용)':'물','물(조림용)':'물','각얼음':'얼음',
 '진라면순한맛':'순한맛 라면','소고기(불고기용)':'소고기 불고기용','삶은고구마':'고구마',
 '시나몬파우더':'계피가루','사각어묵':'어묵','명란젓(고명용)':'명란젓',
 '굵은고춧가루(고명용)':'굵은 고춧가루','큐민가루':'큐민파우더','토마토작은거':'토마토',
 '슈레드눈꽃치즈':'슈레드 눈꽃치즈',...canonicalOverrides
};
const definitions=[
 ['jjajang-instant-noodles','짜장라면','두부·계란·기타',false],
 ['wheat-tteokbokki-rice-cake','밀떡볶이떡','두부·계란·기타',false],
 ['mild-instant-noodles','순한맛 라면','두부·계란·기타',false],
 ['seasoned-chicken-breast','조미닭가슴살','육류·해산물',false],
 ['beef-bulgogi-slices','소고기 불고기용','육류·해산물',false],
 ['caramel-seasoning','카라멜','양념·조미료',true],
 ['beef-dashida','소고기다시다','양념·조미료',true],
 ['cooked-lotus-root','자숙 연근','채소·버섯',false],
 ['yellow-pickled-radish','단무지','두부·계란·기타',false],
 ['water-spinach','공심채','채소·버섯',false],
 ['vietnamese-chili','베트남 고추','양념·조미료',true],
 ['snow-shredded-cheese','슈레드 눈꽃치즈','두부·계란·기타',false],...extraDefinitions
];
for(const [id,name,category,isSeasoning] of definitions){
 const prior=ingredients.find(i=>i.id===id||key(i.name)===key(name));
 if(prior){assert.equal(prior.name,name);continue;}
 ingredients.push({id,name,aliases:[],category,isSeasoning,isQuickPick:false});
}
function fraction(s){
 s=s.replace(/½/g,'1/2').replace(/¼/g,'1/4').replace(/¾/g,'3/4').replace(/약|가득|깎아서/g,'').trim();
 const m=s.match(/^(\d+)\s*(?:과|와|\+)\s*(\d+)\/(\d+)$/);if(m)return +m[1]+ +m[2]/+m[3];
 const f=s.match(/^(\d+)\/(\d+)$/);if(f)return +f[1]/+f[2];
 return /^\d+(?:\.\d+)?$/.test(s)?Number(s):null;
}
function parseLine(line){
 // A parenthesized printed mass/volume, including '약', is authoritative.
 const mass=line.match(/\((?:약\s*|고형물\s*)?([\d,]+(?:\.\d+)?)\s*(kg|g|ml|mL|L)\)/);
 const first=line.search(/[0-9½¼¾]/);assert.ok(first>=0||/약간|적당/.test(line),line);
 let rawName=(first<0?line.split(/약간|적당/)[0]:line.slice(0,first)).trim().replace(/\s*(?:약|가득|깎아서)$/,'').trim();
 rawName=rawName.replace(/\s*(?:약간|적당량|적당히)\s*\(?$/,'').replace(/\s*\($/,'').trim();
 const rawKey=key(rawName);const name=canonical[rawKey]||rawName;
 if(mass)return {name,sourceAmount:Number(mass[1].replace(/,/g,'')),unit:mass[2]};
 const tail=first<0?'':line.slice(first);
 const amount=tail.match(/^([\d.½¼¾/]+(?:\s*(?:과|와|\+)\s*[\d½¼¾/]+)?)\s*(kg|g|ml|mL|L|큰술|작은술|마리|인분|봉지|봉|개|장|컵|모|팩|줄기|줄|공기|꼬집|덩어리|대|알|송이|통|숟가락|캔|단|병|뿌리|줌|톨|조각)/);
 const value=amount?fraction(amount[1]):null;
 if(value!==null)return {name,sourceAmount:value,unit:amount[2]};
 assert.ok(/약간|적당/.test(line),`미해석 수량: ${line}`);
 return {name,sourceAmount:null,unit:null};
}
const missing=new Set(),built=[];
if(batch==='remaining')assert.ok(batch50.length>0,'남은 메뉴 선정 목록이 비어 있어요.');
else assert.equal(batch50.length,50);
assert.equal(new Set(batch50.map(r=>r[0])).size,batch50.length);
for(const [videoId,name,baseServings,cookingType,category,range] of batch50){
 const entry=review.entries.find(e=>e.videoId===videoId);assert.ok(entry?.ingredientText,videoId);
 assertNotShortVideo(videoId,entry.sourceUrl);
 assert.equal(entry.channelId,'UCyn-K7rZLXjGl7VXGweIlcA');
 const hash=createHash('sha256').update(entry.ingredientText).digest('hex');if(entry.ingredientHash)assert.equal(entry.ingredientHash,hash);
 entry.ingredientHash=hash;
 let group='재료';const rows=[];
 for(const raw of prepareText(entry).split(/\r?\n/)){
  const sourceText=raw.trim();if(!sourceText)continue;
  if(/^[*\[]/.test(sourceText)||/^-.*-$/.test(sourceText)||/^-?\s*(?:육수|채소냉국수|간장냉국수)\s*\(/.test(sourceText)||/^(?:약\s*)?\d+(?:[~-]\d+)?\s*(?:인분|개\s*분량)/.test(sourceText)){
   group=sourceText.replace(/^[*\[\-\s]+|[*\]\-\s]+$/g,'').trim();continue;
  }
  const excluded=groupPolicy(videoId,group);
  if(excluded.omit||(intermediateRows.get(videoId)||[]).some(x=>key(x)===key(sourceText))){rows.push({sourceText,group,omitted:true,reason:excluded.reason||'이미 상위 재료로 계산한 중간 조리물의 중복 합산 방지'});continue;}
  const custom=Object.entries(lineOverrides[videoId]||{}).find(([line])=>key(line)===key(sourceText))?.[1];
  for(const parsed of custom?[custom].flat():[parseLine(sourceText)]){
  const ingredient=ingredients.find(i=>key(i.name)===key(parsed.name));
  if(!ingredient){missing.add(parsed.name);continue;}
  rows.push({sourceText,group,ingredientId:ingredient.id,sourceAmount:parsed.sourceAmount,unit:parsed.unit,factor:excluded.scale,amount:parsed.sourceAmount===null?null:parsed.sourceAmount*excluded.scale,reason:[excluded.reason,parsed.reason].filter(Boolean).join(' · ')||null});
  }
 }
 entry.recipeId=`paik-${videoId}`;entry.name=name;entry.baseServings=baseServings;
 entry.servingsRange=range?{min:range[0],max:range[1]}:null;
 const explicit=!!range||entry.servingsStatements.some(t=>new RegExp(`(?<![0-9])${baseServings}\\s*인분`).test(t));
 entry.servingsStatus=explicit?'explicit':'estimated';
 entry.servingsEvidence=range?`원문 ${range[0]}~${range[1]}인분을 그대로 표시. 2026-11-23 사용자 승인에 따라 계산은 상한 ${baseServings}인분 기준.`:explicit?(entry.servingsStatements.some(t=>t.startsWith('원본 영상 제목:'))?`원본 영상 제목 ${baseServings}인분 명시.`:`원본 설명란 ${baseServings}인분 명시.`):`원문 인분 미기재. 원본 전체 재료 양을 ${baseServings}인분으로 편집 추정(2026-11-23 사용자 승인). 주메뉴는 한 끼, 반찬·양념장은 곁들임 분량 기준이며 원작자 명시 인분 아님.`;
 entry.ingredients=rows;
 built.push({entry,cookingType,category});
}
if(missing.size){console.log('검토할 재료 이름:',JSON.stringify([...missing],null,2));process.exitCode=1;}
else{
 for(const {entry:e,cookingType,category} of built){
  const r={id:e.recipeId,name:e.name,baseServings:e.baseServings,servingsStatus:e.servingsStatus,servingsEvidence:e.servingsEvidence,...(e.servingsRange?{servingsRange:e.servingsRange}:{}),cookMinutes:null,cookingType,imagePath:null,sourceName:e.sourceName,sourceUrl:e.sourceUrl,sourceTitle:e.sourceTitle,sourceNote:`백종원의 요리비책 / 영상 ${e.videoId}; 원본 설명란 재료·수량 대조 ${e.checkedOn}. 원문 단위 유지. 부속 조리물은 명시된 사용 비율만 반영. 사진·조리 문장 미사용.`,ingredients:e.ingredients.filter(i=>!i.omitted).map(i=>({ingredientId:i.ingredientId,amount:i.amount,unit:i.unit,note:`원문: ${i.sourceText}${i.reason?' · '+i.reason:''}`}))};
  const prior=recipes.find(x=>x.id===r.id);if(prior)assert.deepEqual(prior,r);else recipes.push(r);
  const c={recipeId:r.id,name:r.name,categories:[category],mealRole:category==='한식 반찬'?'반찬':category==='한식 국·찌개'?'국·찌개':'주메뉴'};
  const old=catalog.entries.find(x=>x.recipeId===r.id);if(old)assert.deepEqual(old,c);else catalog.entries.push(c);
 }
 if(batch==='remaining'){
  const used=new Set(recipes.flatMap(r=>r.ingredients.map(i=>i.ingredientId)));
  for(let n=ingredients.length-1;n>=0;n--)if(!priorIngredientIds.has(ingredients[n].id)&&!used.has(ingredients[n].id))ingredients.splice(n,1);
 }
 validateData(ingredients,recipes);
 if(process.argv.includes('--write')){
  review.held=review.held||review.entries.filter(e=>!built.some(b=>b.entry.videoId===e.videoId)).map(e=>({videoId:e.videoId,sourceTitle:e.sourceTitle||null,reason:e.heldReason||(batch==='remaining'?'검토 후 미선정. 사이트에는 미등록.':'이번 50개에서 미선정. 다음 차수 검토 대상이며 사이트에는 미등록.')}));
  review.entries=built.map(b=>b.entry);
  await write('data/ingredients.json',ingredients);await write('data/recipes.json',recipes);await write('data/recipe-categories.json',catalog);await write(reviewPath,review);
 }
 console.log(`백종원 메뉴 ${batch50.length}개 대조 완료. 전체 ${recipes.length}개. ${process.argv.includes('--write')?'저장 완료':'검증만 실행'}`);
}
