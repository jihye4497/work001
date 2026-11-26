import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {aggregate,totalText,partitionShoppingRows} from '../js/shopping-list.js';
import {searchMenus} from '../js/recommendations.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json'),review=await read('data/source/paik-user-review.json'),coverage=await read('data/source/paik-playlist-coverage.json');
const get=id=>recipes.find(r=>r.id==='paik-'+id);
test('사용자 제공 4개는 출처·확인 방식·명시/추정 인분을 구분하며 보류 해제',()=>{
 assert.equal(review.entries.length,4);
 for(const e of review.entries){
  const r=get(e.videoId);assert.ok(r);assert.equal(r.sourceUrl,e.sourceUrl);
  assert.equal(e.independentSourceFetchVerified,false);
  assert.equal(coverage.entries.find(x=>x.videoId===e.videoId).status,'existing');
  assert.equal(searchMenus(recipes,r.name).some(x=>x.id===r.id),true);
  assert.equal(r.ingredients.length,e.ingredients.length);
 }
 assert.equal(get('4RnCNlE1b6U').servingsStatus,'explicit');
 for(const id of ['bFX5lJgCPBQ','TFcNckg-1bQ']){assert.equal(get(id).servingsStatus,'estimated');assert.equal(get(id).baseServings,2);}
 assert.ok(get('udirCMIxs_c'),'기존 고추장찌개 버전 보존');
});
test('버터간장국수는 면 100g 기준 1인분 추정·식용유 미기재 유지, 지정 2영상 등록 제외',()=>{
 const r=get('Da-yWFw5T3U');assert.equal(r.baseServings,1);assert.equal(r.servingsStatus,'estimated');assert.equal(r.ingredients.length,8);
 const rows=aggregate(ingredients,recipes,[{recipeId:r.id,servings:2}],1);
 assert.equal(totalText(rows.find(x=>x.ingredient.name==='소면')),'200g');
 assert.equal(totalText(rows.find(x=>x.ingredient.name==='버터')),'24g');
 assert.equal(totalText(rows.find(x=>x.ingredient.name==='식용유')),'수량 미기재');
 for(const id of ['qO5p0_6K-bo','01snsHZK6Ns']){assert.equal(get(id),undefined);assert.equal(coverage.entries.find(e=>e.videoId===id).status,'excluded-user');}
});
test('무밥 양념장 전량·물 원문 g·불린 당면·미기재 후추를 그대로 계산',()=>{
 const rows=id=>{const r=get(id);return aggregate(ingredients,recipes,[{recipeId:r.id,servings:r.baseServings}],1);};
 const rice=rows('4RnCNlE1b6U');assert.equal(totalText(rice.find(x=>x.ingredient.name==='참기름')),'21g');assert.equal(totalText(rice.find(x=>x.ingredient.name==='물')),'360g');
 const soup=rows('bFX5lJgCPBQ'),noodles=soup.find(x=>x.ingredient.name==='당면');
 assert.equal(totalText(noodles),'불린 당면 120g');
 assert.ok(noodles.uses.some(u=>u.originalIngredientName==='불린 당면'&&u.amount===120));
 assert.equal(totalText(soup.find(x=>x.ingredient.name==='후추가루')),'수량 미기재');
 assert.ok(!partitionShoppingRows(soup,[],ingredients)[0].rows.some(x=>x.ingredient.name==='물'));
 const stew=rows('TFcNckg-1bQ');assert.equal(totalText(stew.find(x=>x.ingredient.name==='돼지고기 목심')),'210g');assert.equal(totalText(stew.find(x=>x.ingredient.name==='청양고추')),'10g');
});
