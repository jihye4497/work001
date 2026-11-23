// Offline, reviewed ten-video pilot. No crawling, unit conversion or recipe generation.
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { validateData } from '../js/ingredients.js';
import {assertNotShortVideo} from './paik-source-policy.mjs';
const read = async path => JSON.parse(await readFile(new URL(`../${path}`,import.meta.url),'utf8'));
const write = (path,value) => writeFile(new URL(`../${path}`,import.meta.url),JSON.stringify(value,null,2)+'\n');
const review=await read('data/source/paik-stews-review.json');
const ingredients=await read('data/ingredients.json'), recipes=await read('data/recipes.json'), catalog=await read('data/recipe-categories.json');
// Source order, canonical ingredient names, whole-recipe serving estimate and evidence.
const policy={
 qWbHSOplcvY:['돼지고기 김치찌개',2,'돼지고기 130g·김치 390g·물 540ml의 전체 양을 밥과 함께 먹는 2인분으로 추정.', ['돼지고기 목심','김치','물','청양고추','대파','다진 마늘','굵은 고춧가루','고운 고춧가루','국간장','새우젓']],
 ffuakdFmuh4:['된장찌개',3,'물 750mL·두부 180g·애호박 130g 및 나머지 채소의 전체 양을 3인분으로 추정.', ['된장','물','다진 마늘','국멸치','애호박','양파','느타리버섯','대파','청양고추','홍고추','두부']],
 'nj-DjQFEZb0':['순두부찌개',2,'원본 설명란: 순두부찌개 (2인분).', ['순두부','다진 돼지고기','양파','대파','청양고추','쪽파','물','바지락','다진 마늘','황설탕','고운 고춧가루','참기름','소금','진간장','계란','후추가루']],
 '8uwmFQH614M':['부대찌개',2,'물 540ml·통조림햄 200g·소시지 95g의 전체 양을 2인분으로 추정. 선택 라면사리는 제외.', ['물','통조림 햄','대파','소시지','양파','김치','베이크드빈스','슬라이스 체더치즈','다진 마늘','굵은 고춧가루','고추장','된장','국간장','후추가루','라면','물']],
 udirCMIxs_c:['고추장찌개',2,'물 500ml·돼지고기 150g·감자 180g 및 채소의 전체 양을 2인분으로 추정.', ['참기름','식용유','고추장','굵은 고춧가루','국간장','감자','대패삼겹살','대파','멸치액젓','다진 마늘','느타리버섯','양파','청양고추','후추가루','물']],
 '3-xgRrEX-sQ':['소고기 된장찌개',2,'원본 설명란: 소고기 된장찌개 (2인분).', ['소고기 양지','두부','돼지호박','무','양파','대파','청양고추','홍고추','물','된장','굵은 고춧가루','다진 마늘']],
 'wezbeu4-C2s':['청국장찌개',2,'물 360ml·청국장 125g·김치 100g·두부 90g의 전체 양을 2인분으로 추정.', ['물','청국장','김치','두부','양파','대파','된장','국멸치','청양고추','홍고추','다진 마늘']],
 lDr6lNjUZ8w:['비지찌개',3,'콩비지 400g·물 270g·김치 130g·돼지고기 85g 및 채소의 전체 양을 3인분으로 추정.', ['콩비지','물','김치','다진 돼지고기','양파','대파','새우젓','청양고추','식용유','다진 마늘','국간장','참기름','굵은 고춧가루']],
 gUYeEasWU58:['동태찌개',4,'동태 700g·이리 150g·간 70g·알 180g·물 1.6L의 전체 양을 4인분으로 추정.', ['동태','동태 이리','동태 간','동태알','두부','대파','청양고추','홍고추','무','물','쑥갓','다진 마늘','다진 생강','새우젓','국간장','굵은 고춧가루','고추장','된장']],
 CS2s_N37qjM:['대패삼겹 된장찌개',2,'대패삼겹살 200g·무 200g·물 650g의 전체 양을 밥에 비벼 먹는 2인분으로 추정.', ['대패삼겹살','무','된장','고추장','물','황설탕','다진 마늘','대파','청양고추','홍고추']]
};
const additions=[
 ['baked-beans','베이크드빈스','두부·계란·기타',['베이크드 빈스']],
 ['whole-frozen-pollock','동태','육류·해산물',['냉동 명태']],
 ['pollock-milt','동태 이리','육류·해산물',['동태이리']],
 ['pollock-liver','동태 간','육류·해산물',['동태간']],
 ['pollock-roe','동태알','육류·해산물',['동태 알']]
];
for(const [id,name,category,aliases] of additions){
 const existing=ingredients.find(i=>i.id===id||i.name===name);
 if(existing){assert.equal(existing.name,name);continue;}
 ingredients.push({id,name,aliases,category,isSeasoning:false,isQuickPick:false});
}
for(const entry of review.entries){
 assertNotShortVideo(entry.videoId,entry.sourceUrl);
 const [name,baseServings,servingsEvidence,names]=policy[entry.videoId];
 assert.equal(entry.channelId,'UCyn-K7rZLXjGl7VXGweIlcA');
 const lines=entry.ingredientText.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('*')&&!x.startsWith('['));
 assert.equal(lines.length,names.length,entry.videoId);
 let group='재료',index=0;const parsed=[];
 for(const raw of entry.ingredientText.split(/\r?\n/)){
  const sourceText=raw.trim();if(!sourceText)continue;
  if(sourceText.startsWith('*')||sourceText.startsWith('[')){group=sourceText.replace(/[\[\]*]/g,'').trim();continue;}
  const canonicalName=names[index++];
  const ingredient=ingredients.find(i=>i.name===canonicalName);assert.ok(ingredient,`${sourceText}: ${canonicalName}`);
  // Prefer the explicitly printed mass/volume; never derive it from cups/spoons.
  const printed=sourceText.match(/\((\d+(?:\.\d+)?)(g|ml|mL)\)/)||sourceText.match(/(\d+(?:\.\d+)?)\s*(g|ml|mL|L|팩|개)\s*$/);
  assert.ok(printed||/약간|적당량/.test(sourceText),sourceText);
  parsed.push({ingredientId:ingredient.id,amount:printed?Number(printed[1]):null,unit:printed?printed[2]:null,note:`원문: ${sourceText}${group==='추가재료'?' · 선택 추가 재료':''}`,sourceText,group,optional:group==='추가재료'});
 }
 const explicit=entry.servingsStatements.some(x=>x.includes(`${baseServings}인분`));
 entry.recipeId=`paik-${entry.videoId}`;entry.baseServings=baseServings;entry.servingsStatus=explicit?'explicit':'estimated';entry.servingsEvidence=servingsEvidence;entry.ingredients=parsed;
 const recipe={id:entry.recipeId,name,baseServings,servingsStatus:entry.servingsStatus,servingsEvidence:`${servingsEvidence}${explicit?'':' 서비스 편집 추정(2026-11-23 사용자 승인); 원작자 명시 인분 아님.'}`,cookMinutes:null,cookingType:'찌개',imagePath:null,sourceName:entry.sourceName,sourceUrl:entry.sourceUrl,sourceTitle:entry.sourceTitle,sourceNote:`백종원의 요리비책 / 영상 ${entry.videoId}; 원본 설명란 재료·수량 대조 ${entry.checkedOn}. 원문 병기 중량·부피 우선, 단위 환산 없음. 사진·조리 문장 미사용.`,ingredients:parsed.filter(i=>!i.optional).map(({ingredientId,amount,unit,note})=>({ingredientId,amount,unit,note}))};
 const old=recipes.find(r=>r.id===recipe.id);if(old)assert.deepEqual(old,recipe);else recipes.push(recipe);
 const category={recipeId:recipe.id,name,categories:['한식 국·찌개'],mealRole:'국·찌개'};
 const prior=catalog.entries.find(e=>e.recipeId===recipe.id);if(prior)assert.deepEqual(prior,category);else catalog.entries.push(category);
}
validateData(ingredients,recipes);
if(process.argv.includes('--write')){
 await write('data/ingredients.json',ingredients);await write('data/recipes.json',recipes);await write('data/recipe-categories.json',catalog);await write('data/source/paik-stews-review.json',review);
}
console.log(`백종원 찌개 ${review.entries.length}개 검수 완료; 전체 메뉴 ${recipes.length}개. ${process.argv.includes('--write')?'저장 완료':'--write 없으므로 검증만 실행'}`);
