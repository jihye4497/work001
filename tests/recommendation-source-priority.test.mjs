import test from 'node:test';
import assert from 'node:assert/strict';
import {recommend,searchMenus,MODES} from '../js/recommendations.js';
const ingredients=['감자','양파','당근'].map((name,n)=>({id:String(n),name,aliases:[],category:'채소·버섯',isSeasoning:false}));
const recipe=(id,name,ids,source={})=>({id,name,baseServings:1,ingredients:ids.map(ingredientId=>({ingredientId,amount:10,unit:'g',note:null})),...source});
const publicSource={sourceNote:'식품의약품안전처 COOKRCP01 / RCP_SEQ=1'};
const creatorSource={sourceName:'요리 채널',sourceUrl:'https://www.youtube.com/watch?v=abcdefghijk'};
const recipes=[recipe('public-best','감자 요리',['0'],publicSource),recipe('creator-more','채소 요리',['0','1','2'],creatorSource),recipe('creator-less','감자 양파 요리',['0','1'],creatorSource),recipe('public-more','채소 국',['0','1'],{sourceName:'식품의약품안전처'})];
const draft=mode=>({selectedIngredientIds:['0'],activeInterestIds:['0'],selectedRecipes:[],selectedFoodCategories:[],activeRecommendationMode:mode});
test('두 추천 방식 모두 식약처를 뒤에 배치하고 출처 내부의 재료 기준은 유지',()=>{
 for(const mode of MODES){
  const ids=recommend(ingredients,recipes,draft(mode)).map(r=>r.recipe.id);
  assert.deepEqual(ids,['creator-less','creator-more','public-best','public-more']);
 }
});
test('식약처만 조건을 만족하면 그대로 추천하며 선택·제외·음식 종류 조건도 유지',()=>{
 const base=draft(MODES[0]);
 assert.deepEqual(recommend(ingredients,recipes.slice(0,1),base).map(r=>r.recipe.id),['public-best']);
 const filtered={...base,selectedRecipes:[{recipeId:'creator-less',times:1}]};
 assert.deepEqual(recommend(ingredients,recipes,filtered,['creator-more']).map(r=>r.recipe.id),['public-best','public-more']);
 const categorized=recipes.map(r=>({...r,foodCategories:r.id.startsWith('public')?['한식 반찬']:['양식']}));
 assert.deepEqual(recommend(ingredients,categorized,{...base,selectedFoodCategories:['한식 반찬']}).map(r=>r.recipe.id),['public-best','public-more']);
});
test('전체 메뉴 이름 검색은 출처 우선순위를 적용하지 않고 이름순 유지',()=>{
 assert.deepEqual(searchMenus(recipes,'감자').map(r=>r.id),['creator-less','public-best']);
});
