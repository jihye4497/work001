import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {INGREDIENT_ALIAS_GROUPS} from '../js/ingredient-aliases.js';
import {representativeIngredient,matchIngredient} from '../js/ingredient-matching.js';
import {searchIngredients} from '../js/ingredients.js';
import {ingredientBrowseGroup,browseIngredients} from '../js/ingredient-browse.js';
import {aggregate,partitionShoppingRows,totalText} from '../js/shopping-list.js';
import {createStore,KEYS,defaultDraft} from '../js/storage.js';
import {syncMenuIngredients} from '../js/menu-ingredients.js';
import {recommend} from '../js/recommendations.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const byId=new Map(ingredients.map(i=>[i.id,i]));const get=name=>ingredients.find(i=>i.name===name);
const recipe=item=>({id:'alias-fixture',name:'양파 생강 로즈마리 볶음',baseServings:1,ingredients:[{ingredientId:item.id,amount:10,unit:'g',note:null}]});
test('승인된 모든 표기는 등록된 대표 재료로 연결하고 목록·검색에서 중복 제거',()=>{
 const before=JSON.stringify(ingredients);
 for(const group of INGREDIENT_ALIAS_GROUPS){
  const target=get(group.name);assert.ok(target,group.name);
  for(const alias of group.aliases){const source=get(alias);assert.ok(source,alias);assert.equal(representativeIngredient(source,byId).id,target.id,alias);assert.equal(matchIngredient(source.id,target.id,recipe(source),byId),2);assert.ok(searchIngredients(ingredients,alias).some(i=>i.id===target.id));for(const category of ['농산물','육·수산','기타','양념'])assert.equal(browseIngredients(ingredients,category).some(i=>i.id===source.id),false);}
 }
 assert.equal(JSON.stringify(ingredients),before);
});
test('생강가루·즙·청, 치즈가루·치즈, 생허브·건허브는 자동 대체하지 않음',()=>{
 for(const [a,b] of [['생강','생강가루'],['생강','생강즙'],['생강','생강청'],['바질','건바질'],['바질','바질페스토'],['로즈마리','건로즈마리'],['파르메산 치즈','파르메산 치즈가루'],['파프리카','파프리카가루'],['양파','적양파']])assert.equal(matchIngredient(get(a).id,get(b).id,recipe(get(a)),byId),0,`${a}/${b}`);
});
test('자동 관심·보유·추천·합산은 대표 재료로 연결하며 단위·원문 손질 메모 유지',()=>{
 const source=get('다진 양파'),target=get('양파');const r=recipe(source);
 const draft={...defaultDraft(),selectedIngredientIds:[source.id],manualIngredientIds:[source.id],activeInterestIds:[source.id],selectedRecipes:[{recipeId:r.id,times:1}]};
 syncMenuIngredients(draft,ingredients,[r]);assert.deepEqual(draft.selectedIngredientIds,[target.id]);assert.deepEqual(draft.manualIngredientIds,[target.id]);
 assert.equal(recommend(ingredients,[r],{...draft,selectedRecipes:[]}).length,1);
 const rows=aggregate(ingredients,[r],draft.selectedRecipes,1);assert.equal(rows[0].ingredient.id,target.id);assert.equal(totalText(rows[0]),'10g');assert.equal(rows[0].uses[0].originalIngredientName,'다진 양파');assert.equal(partitionShoppingRows(rows,[source.id],ingredients)[1].rows.length,1);
 const map=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:[source.id,target.id],excludedRecipeIds:[]})]]);const store=createStore({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});store.reconcile(ingredients,[r]);assert.deepEqual(store.pantryIngredientIds,[target.id]);
 const rosemary=get('로즈마리마다진것');const herb=recipe(rosemary);const hd={...defaultDraft(),selectedIngredientIds:[get('로즈마리').id],activeInterestIds:[get('로즈마리').id]};assert.equal(recommend(ingredients,[herb],hd).length,1);
});


test('추가 승인 재료 분류·조리용 물 제외와 불린 상태 분리는 원문 수량을 보존',()=>{
 assert.deepEqual(ingredientBrowseGroup(get('보리새우')),{category:'육·수산',subcategory:'해산물'});
 assert.deepEqual(ingredientBrowseGroup(get('땅콩버터')),{category:'기타',subcategory:'가공식품'});
 for(const [a,b] of [['호두','볶은 호두'],['들깨가루','거피들깨가루'],['된장','미소된장'],['레몬','레몬껍질'],['레몬즙','레몬껍질'],['건미역','불린 미역']])assert.equal(matchIngredient(get(a).id,get(b).id,recipe(get(a)),byId),0);
 const water=get('건표고버섯 불릴 물');const r=recipe(water);
 const rows=aggregate(ingredients,[r],[{recipeId:r.id,times:1}],1);
 assert.equal(totalText(rows[0]),'10g');assert.equal(rows[0].uses[0].originalIngredientName,water.name);
 assert.equal(partitionShoppingRows(rows,[],ingredients)[0].rows.length,0);
 assert.equal(searchIngredients(ingredients,water.name).length,0);
 assert.equal(browseIngredients(ingredients,'양념').some(i=>i.id===water.id),false);
});
