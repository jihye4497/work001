import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {aggregate,totalText,partitionShoppingRows} from '../js/shopping-list.js';
import {searchMenus} from '../js/recommendations.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const ingredients=await read('data/ingredients.json'),recipes=await read('data/recipes.json'),review=await read('data/source/paik-user-review.json'),coverage=await read('data/source/paik-playlist-coverage.json');
const get=id=>recipes.find(r=>r.id==='paik-'+id);
test('사용자 제공 3개는 출처·확인 방식·명시/추정 인분을 구분하며 보류 해제',()=>{
 assert.equal(review.entries.length,3);
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
test('무밥 양념장 전량·물 원문 g·불린 당면·미기재 후추를 그대로 계산',()=>{
 const rows=id=>{const r=get(id);return aggregate(ingredients,recipes,[{recipeId:r.id,servings:r.baseServings}],1);};
 const rice=rows('4RnCNlE1b6U');assert.equal(totalText(rice.find(x=>x.ingredient.name==='참기름')),'21g');assert.equal(totalText(rice.find(x=>x.ingredient.name==='물')),'360g');
 const soup=rows('bFX5lJgCPBQ');assert.equal(totalText(soup.find(x=>x.ingredient.name==='불린 당면')),'120g');assert.equal(totalText(soup.find(x=>x.ingredient.name==='후추가루')),'수량 미기재');
 assert.ok(!partitionShoppingRows(soup,[],ingredients)[0].rows.some(x=>x.ingredient.name==='물'));
 const stew=rows('TFcNckg-1bQ');assert.equal(totalText(stew.find(x=>x.ingredient.name==='돼지고기 목심')),'210g');assert.equal(totalText(stew.find(x=>x.ingredient.name==='청양고추')),'10g');
});
