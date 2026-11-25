import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchIngredients} from '../js/ingredients.js';
import {browseIngredients} from '../js/ingredient-browse.js';
import {matchIngredient} from '../js/ingredient-matching.js';
import {aggregate,totalText,selectedCopyText,partitionShoppingRows} from '../js/shopping-list.js';
import {createStore,KEYS} from '../js/storage.js';
import {ingredientDisplayName} from '../js/ingredient-display-names.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const get=name=>ingredients.find(i=>i.name===name);
const byId=new Map(ingredients.map(i=>[i.id,i]));
test('사진확인 떡사리는 떡볶이떡으로 통합하고 원문3메뉴 수량/미기재/단위 보존',async()=>{
 const base=get('떡볶이떡'),alias=get('떡사리');
 assert.deepEqual(searchIngredients(ingredients,'떡사리').map(i=>i.id),[base.id]);
 assert.equal(ingredientDisplayName(alias),'떡볶이떡');
 assert.ok(!browseIngredients(ingredients,'기타','면·떡').some(i=>i.id===alias.id));
 const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const ids=['mincook-blog-156','mincook-blog-104','mincook-blog-29'];
 const snapshot=JSON.stringify(recipes);
 for(const id of ids){
  const r=recipes.find(r=>r.id===id),item=r.ingredients.find(i=>i.ingredientId===alias.id);
  assert.ok(item,id);
  const row=aggregate(ingredients,[r],[{recipeId:id,servings:r.baseServings,times:1}],r.baseServings).find(row=>row.ingredient.id===base.id);
  assert.ok(row,id);const use=row.uses.find(u=>u.note===item.note);
  assert.equal(use.amount,item.amount);assert.equal(use.unit,item.unit);
 }
 const recipe={id:'merged-rice-cakes',name:'합산',baseServings:1,ingredients:[{ingredientId:base.id,amount:50,unit:'g',note:null},{ingredientId:alias.id,amount:100,unit:'g',note:'원문: 떡사리'}]};
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1,times:1}],1);
 assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'150g');
 const values=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:[alias.id,base.id],excludedRecipeIds:[]})]]);
 const store=createStore({getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)});
 store.reconcile(ingredients,recipes);assert.deepEqual(store.pantryIngredientIds,[base.id]);
 assert.equal(JSON.stringify(recipes),snapshot);
});
test('불린 라이스페이퍼는 대표선택/보유로 연결하고 불린 상태의 무게는 분리',()=>{
 const base=get('라이스페이퍼'),form=get('불린 라이스페이퍼');
 assert.deepEqual(searchIngredients(ingredients,form.name).map(i=>i.id),[base.id]);
 assert.equal(matchIngredient(base.id,form.id,{name:'테스트'},byId),2);
 assert.ok(!browseIngredients(ingredients,'기타','면·떡').some(i=>i.id===form.id));
 const recipe={id:'paper',name:'원문 상태',baseServings:1,ingredients:[base,form].map(i=>({ingredientId:i.id,amount:10,unit:'g',note:`원문: ${i.name}`}))};
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:2}],2);
 assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'라이스페이퍼 20g + 불린 라이스페이퍼 20g');
 const values=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:[form.id],excludedRecipeIds:[]})]]);
 const store=createStore({getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)});
 store.reconcile(ingredients,[]);assert.deepEqual(store.pantryIngredientIds,[base.id]);
});
test('병아리콩 불림은 선택만 통합하고 건당면은 당면과 같은 건조재료로 합산',()=>{
 const before=JSON.stringify(ingredients);
 for(const [base,form] of [['병아리콩','불린 병아리콩'],['당면','건당면']]){
  assert.deepEqual(searchIngredients(ingredients,form).map(i=>i.id),[get(base).id]);
  assert.equal(matchIngredient(get(base).id,get(form).id,{name:'테스트'},byId),2);
  for(const category of ['농산물','육·수산','기타','양념'])assert.ok(!browseIngredients(ingredients,category).some(i=>i.id===get(form).id));
  const values=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:[get(form).id,get(base).id],excludedRecipeIds:[]})]]);
  const store=createStore({getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)});
  store.reconcile(ingredients,[]);assert.deepEqual(store.pantryIngredientIds,[get(base).id]);
 }
 const recipe={id:'chickpea-noodles',name:'상태 보존',baseServings:1,ingredients:[['병아리콩',50],['불린 병아리콩',100],['당면',20],['건당면',30]].map(([name,amount])=>({ingredientId:get(name).id,amount,unit:'g',note:`원문: ${name}`}))};
 const snapshot=JSON.stringify(recipe),rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:2}],2);
 assert.equal(rows.length,2);
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='병아리콩')),'병아리콩 100g + 불린 병아리콩 200g');
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='당면')),'100g');
 assert.ok(rows.flatMap(r=>r.uses).some(u=>u.note==='원문: 건당면'));
 assert.equal(JSON.stringify(recipe),snapshot);assert.equal(JSON.stringify(ingredients),before);
});
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

test('추가 레시피의 견과 손질·볶음과 불린 곤약은 선택을 통합하되 상태별 수량 보존',()=>{
 for(const [base,forms] of [['호두',['다진 호두','깐호두','구운 호두','볶은 호두']],['아몬드',['통아몬드','슬라이스아몬드','아몬드 플레이크','볶은 아몬드 슬라이스']],['곤약미',['불린 곤약쌀']]]) {
  for(const form of forms) {
   assert.equal(matchIngredient(get(base).id,get(form).id,{name:'테스트'},byId),2);
   assert.ok(searchIngredients(ingredients,form).some(i=>i.id===get(base).id));
   for(const category of ['농산물','육·수산','기타','양념'])assert.ok(!browseIngredients(ingredients,category).some(i=>i.id===get(form).id));
  }
 }
 const recipe={id:'nuts',name:'상태 수량',baseServings:1,ingredients:[['호두',10],['볶은 호두',20],['곤약미',30],['불린 곤약쌀',60]].map(([name,amount])=>({ingredientId:get(name).id,amount,unit:'g',note:null}))};
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1}],1);
 assert.equal(rows.length,2);
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='호두')),'호두 10g + 볶은 호두 20g');
 assert.equal(totalText(rows.find(r=>r.ingredient.name==='곤약미')),'곤약미 30g + 불린 곤약쌀 60g');
 for(const [a,b] of [['아몬드','아몬드가루'],['아몬드','아몬드밀크'],['저염 명란','명란젓'],['식초','2배 양조식초'],['2배 양조식초','3배 식초'],['깍두기','깍두기 국물'],['키위소스','키위드레싱'],['다시마','다시마 육수'],['다시마 육수','육수']])assert.equal(matchIngredient(get(a).id,get(b).id,{name:'테스트'},byId),0,`${a}/${b}`);
});

test('삶은 닭가슴살은 가슴살 선택으로 찾되 생고기 무게와 합산하지 않음',()=>{
 assert.ok(searchIngredients(ingredients,'삶은 닭가슴살').some(i=>i.id===get('닭 가슴살').id));
 const recipe={id:'breast',name:'닭가슴살',baseServings:1,ingredients:[['닭고기가슴살',100],['닭고기(가슴살)',50],['삶은 닭가슴살',80]].map(([name,amount])=>({ingredientId:get(name).id,amount,unit:'g',note:null}))};
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1}],1);
 assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'닭고기(가슴살) 150g + 닭고기(가슴살·삶은 것) 80g');
});

test('추가 삶기·데치기 상태는 대표로 검색하되 원문 상태 수량을 보존',()=>{
 for(const [base,forms] of [['감자',['삶은 감자']],['검은콩',['삶은 검은콩']],['완두콩',['삶은 완두콩']],['콩나물',['삶은 콩나물']],['옥수수',['삶은 옥수수']],['스파게티',['삶은 스파게티']],['메밀면',['삶은 메밀면']],['시래기',['삶은 시래기','데친 시래기','시래기불린것']],['돼지곱창',['삶은 돼지곱창']],['무뼈 닭발',['삶은 무뼈닭발']]]) {
  for(const form of forms){
   assert.equal(matchIngredient(get(base).id,get(form).id,{name:'테스트'},byId),2);
   assert.deepEqual(searchIngredients(ingredients,form).map(i=>i.id),[get(base).id]);
   const recipe={id:'cooked',name:'원문 상태',baseServings:1,ingredients:[base,form].map(name=>({ingredientId:get(name).id,amount:100,unit:'g',note:`원문: ${name} 100g`}))};
   const before=JSON.stringify(recipe),rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:2}],1);
   assert.equal(rows.length,1);assert.equal(totalText(rows[0]),`${ingredientDisplayName(base)} 200g + ${ingredientDisplayName(form)} 200g`);assert.equal(JSON.stringify(recipe),before);
  }
 }
});

test('건표고·불린 표고, 사과즙·주스, 오미자청·액기스는 대표 선택과 상태별 수량을 분리',()=>{
 for(const [base,forms] of [['건 표고버섯',['마른 표고버섯','불린 표고버섯']],['사과즙',['사과주스','사과쥬스']],['오미자청',['오미자액','오미자 액기스']]]){
  for(const form of forms)assert.ok(searchIngredients(ingredients,form).some(i=>i.id===get(base).id));
  const recipe={id:'forms',name:'원문 보존',baseServings:1,ingredients:[base,...forms].map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:null}))};
  const before=JSON.stringify(recipe),rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1}],1);
  assert.equal(rows.length,1);assert.equal(rows[0].ingredient.id,get(base).id);assert.equal(JSON.stringify(recipe),before);
  if(base==='건 표고버섯')assert.equal(totalText(rows[0]),'건표고버섯 20g + 불린 표고버섯 10g');
  if(base==='사과즙')assert.equal(totalText(rows[0]),'사과즙 10g + 사과주스 20g');
  if(base==='오미자청')assert.equal(totalText(rows[0]),'오미자청 10g + 오미자액 10g + 오미자 액기스 10g');
 }
});
