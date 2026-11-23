import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {validateData} from '../js/ingredients.js';
import {assertNotShortVideo} from './paik-source-policy.mjs';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const write=(path,data)=>writeFile(new URL('../'+path,import.meta.url),JSON.stringify(data,null,2)+'\n');
// Facts supplied by the user from the linked videos; no independent source fetch claimed.
const entries=[
 {videoId:'bFX5lJgCPBQ',name:'당면만둣국',baseServings:2,servingsStatus:'estimated',cookingType:'국',category:'한식 국·찌개',
  servingsEvidence:'원문 인분 미기재. 만두 175g·불린 당면 120g·물 500ml·달걀 1개의 전체 양을 밥과 곁들이는 2인분으로 편집 추정. 원작자 명시 인분 아님.',
  rows:[
   ['물',500,'ml','정수물 500ml'],['냉동만두',175,'g','냉동 만두 5개 (175g)'],['불린 당면',120,'g','불린 당면 2컵 (120g)'],
   ['대파',35,'g','대파 1/3대 (35g)'],['양파',60,'g','양파 1/4개 (60g)'],['청양고추',10,'g','청양고추 1개 (10g)'],['계란',1,'개','달걀 1개'],
   ['조미김',2,'g','조미김가루 적당량 (2g)'],['다진 마늘',20,'g','간마늘 1큰술 (20g)'],['고추장',20,'g','고추장 1큰술 (20g)'],
   ['고운 고춧가루',6,'g','고운고춧가루 1큰술 (6g)'],['액젓',20,'g','액젓 2큰술 (20g)'],['소고기다시다',4,'g','소고기다시다 1/3큰술 (4g)'],
   ['후추가루',null,null,'후춧가루 약간'],['식용유',14,'g','식용유 2큰술 (14g)']
  ]},
 {videoId:'4RnCNlE1b6U',name:'냄비 무밥',baseServings:3,servingsStatus:'explicit',cookingType:'밥',category:'한식 주메뉴',
  servingsEvidence:'사용자가 전달한 원문 [냄비 무밥] 3인분 기준 명시. 양념장 전량 포함.',
  rows:[
   ['무',330,'g','무 약 1/4개 (330g)'],['쌀',320,'g','쌀 2컵 (320g)'],['물',360,'g','정수물 2컵 (360g)'],['소고기 다짐육',100,'g','간소고기 1컵 (100g)'],
   ['표고버섯',40,'g','표고버섯 2개 (40g)'],['참기름',14,'g','참기름 2큰술 (14g)'],
   ['대파',50,'g','대파 ½대 (50g)','양념장'],['청양고추',10,'g','청양고추 1개 (10g)','양념장'],['다진 마늘',10,'g','간마늘 ½큰술 (10g)','양념장'],
   ['진간장',50,'g','진간장 5큰술 (50g)','양념장'],['굵은 고춧가루',8,'g','굵은고춧가루 1큰술 (8g)','양념장'],['참기름',7,'g','참기름 1큰술 (7g)','양념장'],['참깨',5,'g','통깨 1큰술 (5g)','양념장']
  ]},
 {videoId:'TFcNckg-1bQ',name:'고추장찌개',baseServings:2,servingsStatus:'estimated',cookingType:'찌개',category:'한식 국·찌개',
  servingsEvidence:'원문 인분 미기재. 돼지고기 목살 210g·두부 150g·애호박 160g·물 500ml의 전체 양을 밥과 먹는 2인분으로 편집 추정. 원작자 명시 인분 아님.',
  rows:[
   ['물',500,'ml','정수물 500ml'],['돼지고기 목심',210,'g','돼지고기목살 1+½컵 (210g)'],['두부',150,'g','두부 ½모 (150g)'],['애호박',160,'g','애호박 ½개 (160g)'],
   ['양파',120,'g','양파 ½개 (120g)'],['대파',50,'g','대파 ½대 (50g)'],['청양고추',10,'g','청양고추 2개 (10g)'],['식용유',14,'g','식용유 2큰술 (14g)'],
   ['고추장',30,'g','고추장 1+1/2큰술 (30g)','양념재료'],['새우젓',30,'g','새우젓 1+1/2큰술 (30g)','양념재료'],['고운 고춧가루',6,'g','고운 고춧가루 1큰술 (6g)','양념재료'],
   ['굵은 고춧가루',4,'g','굵은 고춧가루 ½큰술 (4g)','양념재료'],['국간장',10,'g','국간장 1큰술(10g)','양념재료'],['다진 마늘',20,'g','간마늘 1큰술 (20g)','양념재료'],['후추가루',null,null,'후춧가루 약간','양념재료']
  ]},
 {videoId:'Da-yWFw5T3U',name:'초간단 버터간장국수',baseServings:1,servingsStatus:'estimated',cookingType:'국수',category:'한식 주메뉴',
  servingsEvidence:'전체 인분 별도 명시 없음. 소면 1인분(100g)·달걀 1개를 사용한 전체 요리를 1인분으로 편집 추정. 소면의 인분 표기를 전체 요리 명시 인분으로 오인하지 않음.',
  rows:[
   ['소면',100,'g','소면 1인분 (100g)'],['대파',40,'g','대파 약 1/2대 (40g)'],['버터',12,'g','버터 1큰술 (12g)'],
   ['진간장',20,'g','진간장 2큰술 (20g)'],['설탕',6,'g','설탕 1/2큰술 (6g)'],['계란',1,'개','달걀 1개'],
   ['조미김',2,'g','조미김가루 약간 (2g)'],['식용유',null,null,'식용유 적당량']
  ]}
];
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json'),catalog=await read('data/recipe-categories.json');
const coverage=await read('data/source/paik-playlist-coverage.json');
const excluded=new Set((await read('data/source/paik-user-exclusions.json')).entries.map(e=>e.videoId));
const reviewed=[];
for(const entry of entries){
 assert.ok(!excluded.has(entry.videoId),'사용자 지정 제외 영상은 등록하지 않음');
 assertNotShortVideo(entry.videoId);
 const source=coverage.entries.find(e=>e.videoId===entry.videoId);assert.ok(source);
 const items=entry.rows.map(([name,amount,unit,sourceText,group='재료'])=>{
  const ingredient=ingredients.find(i=>i.name===name);assert.ok(ingredient,name);
  return {ingredientId:ingredient.id,amount,unit,sourceText,group};
 });
 const recipe={id:'paik-'+entry.videoId,name:entry.name,baseServings:entry.baseServings,servingsStatus:entry.servingsStatus,servingsEvidence:entry.servingsEvidence,cookMinutes:null,cookingType:entry.cookingType,imagePath:null,sourceName:'백종원의 요리비책',sourceUrl:source.sourceUrl,sourceTitle:source.sourceTitle,
  sourceNote:'사용자 제공 원문 재료표 대조 2026-11-23. 영상 원문 직접 재접근은 미확인. 병기 중량·부피 우선, 단위 환산 없음. 양념장 전량 포함. 사진·조리 문장 미사용.',
  ingredients:items.map(i=>({ingredientId:i.ingredientId,amount:i.amount,unit:i.unit,note:`원문: ${i.sourceText}${i.group==='재료'?'':` · ${i.group}`}`}))};
 const old=recipes.find(r=>r.id===recipe.id);if(old)assert.deepEqual(old,recipe);else recipes.push(recipe);
 const category={recipeId:recipe.id,name:recipe.name,categories:[entry.category],mealRole:entry.category==='한식 국·찌개'?'국·찌개':'주메뉴'};
 const prior=catalog.entries.find(c=>c.recipeId===recipe.id);if(prior)assert.deepEqual(prior,category);else catalog.entries.push(category);
 reviewed.push({videoId:entry.videoId,recipeId:recipe.id,name:entry.name,sourceUrl:source.sourceUrl,sourceTitle:source.sourceTitle,checkedOn:'2026-11-23',verificationMethod:'user-provided-source-transcription',independentSourceFetchVerified:false,baseServings:entry.baseServings,servingsStatus:entry.servingsStatus,servingsEvidence:entry.servingsEvidence,ingredientHash:createHash('sha256').update(JSON.stringify(entry.rows)).digest('hex'),ingredients:items});
}
validateData(ingredients,recipes);
if(process.argv.includes('--write')){
 await write('data/recipes.json',recipes);await write('data/recipe-categories.json',catalog);
 await write('data/source/paik-user-review.json',{schemaVersion:1,note:'사용자 전달 재료 사실 검수. 원문 영상 독립 재접근을 완료했다는 의미가 아님. 기존 레시피·원문 수량 불변.',entries:reviewed});
}
console.log(JSON.stringify({reviewed:reviewed.length,total:recipes.length,write:process.argv.includes('--write')}));
