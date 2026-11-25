import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ingredientBrowseGroup,browseIngredients} from '../js/ingredient-browse.js';
import {ingredientDisplayName} from '../js/ingredient-display-names.js';
import {searchIngredients} from '../js/ingredients.js';
import {matchIngredient} from '../js/ingredient-matching.js';
import {totalText} from '../js/shopping-list.js';
import {aggregate} from '../js/shopping-list.js';
import {applyCalculationBasis} from '../js/recipe-calculation-basis.js';
const read=async p=>JSON.parse(await readFile(new URL('../data/'+p,import.meta.url),'utf8'));
const [ingredients,recipes]=await Promise.all(['ingredients.json','recipes.json'].map(read));
const get=name=>ingredients.find(i=>i.name===name);
test('들깨는 곡물콩으로 분류하고 불린토란줄기는 선택공유·상태별수량 분리',()=>{
 assert.deepEqual(ingredientBrowseGroup(get('들깨')),{category:'농산물',subcategory:'곡물·콩'});
 const byId=new Map(ingredients.map(i=>[i.id,i])),base=get('토란줄기'),form=get('불린 토란줄기');
 assert.deepEqual(searchIngredients(ingredients,form.name).map(i=>i.id),[base.id]);
 assert.ok(!browseIngredients(ingredients,'기타').some(i=>i.id===form.id));
 assert.equal(matchIngredient(get('들깨').id,get('들깨가루').id,{name:'검증'},byId),0);
 const recipe={id:'taro',name:'상태보존',baseServings:1,ingredients:[base,form].map(i=>({ingredientId:i.id,amount:100,unit:'g',note:i.name}))};
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1,times:1}],1);
 assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'토란줄기 100g + 불린 토란줄기 100g');
});
test('원문확인 재료는 탐색분류 교정하며 통단팥은 가공/생면은 종류미지정 유지',()=>{
 for(const [names,category,subcategory] of [
  [['냉동 우삼겹','삶은 막창'],'육·수산','고기'],
  [['새우살','익힌 전복내장'],'육·수산','해산물'],
  [['생멸치'],'육·수산','생선'],
  [['삼계탕 티백','삼계탕 재료팩'],'양념','조미'],
  [['조','흰깨','참깨','통깨'],'농산물','곡물·콩'],
  [['중력분','밀가루중력분'],'기타','가루류'],
  [['크레미','크래비','크래미','햄다진것','통단팥'],'기타','가공식품'],
  [['생면'],'기타','면·떡']
 ])for(const name of names)assert.deepEqual(ingredientBrowseGroup(get(name)),{category,subcategory},name);
 assert.equal(ingredientDisplayName(get('삶은 막창')),'돼지고기(막창)');
 assert.equal(ingredientDisplayName(get('익힌 전복내장')),'전복(내장)');
});
test('합의한 동의어는 대표로 선택되며 수량과 메뉴 원문 제품/조리상태는 보존',()=>{
 for(const [base,forms] of [['크래미',['크레미','크래비']],['중력분',['밀가루중력분']],['참깨',['흰깨']],['햄',['햄다진것']],['삼계탕 재료팩',['삼계탕 티백']],['배추김치',['노브랜드 별미 포기김치']]]){
  for(const form of forms){
   assert.ok(searchIngredients(ingredients,form).some(i=>i.id===get(base).id));
   for(const category of ['농산물','육·수산','기타','양념'])assert.ok(!browseIngredients(ingredients,category).some(i=>i.id===get(form).id));
  }
 }
 const snapshot=JSON.stringify({ingredients,recipes});
 for(const [id,source,base] of [['mincook-blog-227','노브랜드 별미 포기김치','배추김치'],['mfds-cookrcp01-918','햄다진것','햄'],['mincook-blog-153','삶은 막창','삶은 막창'],['mfds-cookrcp01-3248','익힌 전복내장','익힌 전복내장']]){
  const r=recipes.find(r=>r.id===id),item=r.ingredients.find(i=>i.ingredientId===get(source).id);
  const row=aggregate(ingredients,[r],[{recipeId:id,servings:r.baseServings,times:1}],r.baseServings).find(row=>row.ingredient.id===get(base).id);
  assert.ok(row,id);assert.ok(row.uses.some(u=>u.note===item.note&&u.amount===item.amount&&u.originalIngredientName===source));
  if(source==='삶은 막창'||source==='익힌 전복내장')assert.ok(row.detailNote);
 }
 assert.equal(JSON.stringify({ingredients,recipes}),snapshot);
});
test('전기밥솥은 검색/선택/실제메뉴계산에서 제외하고 보관원문은 남김',()=>{
 const item=get('전기밥솥');assert.ok(item);
 assert.deepEqual(searchIngredients(ingredients,'전기밥솥'),[]);
 for(const category of ['농산물','육·수산','기타','양념'])assert.ok(!browseIngredients(ingredients,category).some(i=>i.id===item.id));
 const r=applyCalculationBasis(recipes).find(r=>r.id==='mincook-blog-238');
 assert.ok(!r.ingredients.some(i=>i.ingredientId===item.id));
 assert.ok(recipes.find(original=>original.id===r.id).ingredients.some(i=>i.ingredientId===item.id));
});
