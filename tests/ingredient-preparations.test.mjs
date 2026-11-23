import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchIngredients} from '../js/ingredients.js';
import {browseIngredients} from '../js/ingredient-browse.js';
import {matchIngredient} from '../js/ingredient-matching.js';
import {aggregate,totalText,selectedCopyText,partitionShoppingRows} from '../js/shopping-list.js';
import {createStore,KEYS} from '../js/storage.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const get=name=>ingredients.find(i=>i.name===name);
const byId=new Map(ingredients.map(i=>[i.id,i]));
test('조리 상태 검색·선택·보유 연결은 계란/메추리알/건미역으로 모으고 원본은 보존',()=>{
 const before=JSON.stringify(ingredients);
 for(const [base,forms] of [['계란',['달걀노른자','달걀흰자','삶은 계란','반숙 계란']],['메추리알',['삶은 메추리알']],['건미역',['불린 미역','건조미역']]]) {
  for(const form of forms) {
   assert.equal(matchIngredient(get(base).id,get(form).id,{name:'테스트'},byId),2);
   assert.ok(searchIngredients(ingredients,form).some(i=>i.id===get(base).id));
   assert.ok(!browseIngredients(ingredients,'육·수산').some(i=>i.id===get(form).id));
  }
 }
 assert.equal(matchIngredient(get('미역').id,get('건미역').id,{name:'테스트'},byId),0);
 const values=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:[get('삶은 계란').id,get('계란').id],excludedRecipeIds:[]})]]);
 const store=createStore({getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)});
 store.reconcile(ingredients,[]);assert.deepEqual(store.pantryIngredientIds,[get('계란').id]);
 assert.equal(JSON.stringify(ingredients),before);
});
test('장보기·복사는 노른자/삶은 상태/불린 상태의 무게를 생재료와 합치지 않음',()=>{
 const recipe={id:'preparation',name:'상태별 재료',baseServings:1,ingredients:[['계란',30],['달걀노른자',20],['삶은 계란',50],['건미역',10],['불린 미역',100]].map(([name,amount])=>({ingredientId:get(name).id,amount,unit:'g',note:null}))};
 const before=JSON.stringify(recipe);
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:2}],1);
 assert.equal(rows.length,2);
 const egg=rows.find(r=>r.ingredient.name==='계란'),seaweed=rows.find(r=>r.ingredient.name==='건미역');
 assert.equal(totalText(egg),'계란 60g + 달걀노른자 40g + 삶은 계란 100g');
 assert.equal(totalText(seaweed),'건미역 20g + 불린 미역 200g');
 assert.match(selectedCopyText(rows,[seaweed.ingredient.id]),/불린 미역 200g/);
 assert.equal(partitionShoppingRows(rows,[get('계란').id,get('건미역').id],ingredients)[0].rows.length,0);
 assert.equal(JSON.stringify(recipe),before);
});
