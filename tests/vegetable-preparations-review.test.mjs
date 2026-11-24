import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {representativeIngredient} from '../js/ingredient-matching.js';
import {browseIngredients} from '../js/ingredient-browse.js';
import {searchIngredients} from '../js/ingredients.js';
import {aggregate,totalText} from '../js/shopping-list.js';
import {createStore,KEYS} from '../js/storage.js';
import {syncMenuIngredients} from '../js/menu-ingredients.js';

const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
const byId=new Map(ingredients.map(i=>[i.id,i]));
const get=name=>{const i=ingredients.find(i=>i.name===name);assert.ok(i,name);return i;};
const mappings={
 '마늘다진것':'다진 마늘','편 마늘':'마늘','납작 썬 마늘':'마늘','단호박작은것':'단호박',
 '다진 토마토':'토마토','토마토콩카세':'토마토','다진 애호박':'애호박','주재료 애호박':'애호박',
 '다진 청양고추':'청양고추','송송 썬 청양고추':'청양고추','다진 풋고추':'풋고추','어슷 썬 풋고추':'풋고추',
 '다진 청고추':'청고추','청고추 다진것':'청고추','다진 홍고추':'홍고추','간 홍고추':'홍고추',
 '홍고추 다진것':'홍고추','다진 붉은 고추':'홍고추','송송 썬 붉은 고추':'홍고추','청·홍고추다진것':'청홍고추',
 '다진 청피망':'청피망','청피망다진것':'청피망','다진 홍피망':'홍피망','홍피망다진것':'홍피망',
 '다진 파프리카(노랑)':'노랑 파프리카','샐러리다진것':'셀러리','깐연근':'연근',
 '실파송송썬것':'실파','다진 당근':'당근','당근다진것':'당근','다진 땅콩':'땅콩','다진 견과류':'견과류','다진 잣':'잣',
 '간 양파':'양파','간 마늘':'다진 마늘','데친 미나리':'미나리','찐 감자':'감자','찐 고구마':'고구마',
 '자숙 연근':'연근','데친 우거지':'우거지','데친 토란대':'토란줄기','삶은 토란대':'토란줄기','데친 토란줄기':'토란줄기',
 '불린 고사리':'고사리','불린 무말랭이':'무말랭이','불린 함초':'건함초','불린 목이버섯':'목이버섯','두절콩나물':'콩나물',
 '데친 꼬막살':'꼬막','자숙꼬막':'꼬막','다진 오이피클':'오이피클'
};

test('채소 전반과 지정 견과·꼬막의 손질 선택은 원재료로 연결하고 검색/목록 중복 제거',()=>{
 const listed=new Set(['농산물','육·수산','기타','양념'].flatMap(c=>browseIngredients(ingredients,c)).map(i=>i.id));
 for(const [form,base] of Object.entries(mappings)){
  assert.equal(representativeIngredient(get(form),byId).id,get(base).id,form);
  assert.ok(searchIngredients(ingredients,form).some(i=>i.id===get(base).id),form);
  assert.ok(!listed.has(get(form).id),form);
  assert.ok(listed.has(get(base).id),base);
 }
});

test('다진·간·데친 원문을 유지하고 생재료와 조리 상태 무게를 합산하지 않음',()=>{
 const before=JSON.stringify(ingredients);
 const forms=['양파','다진 양파','간 양파','미나리','데친 미나리','꼬막','데친 꼬막살'];
 const recipe={id:'review-preparations',name:'손질 상태 검증',baseServings:1,ingredients:forms.map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:null}))};
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1}],1);
 assert.equal(rows.length,3);
 const onion=rows.find(r=>r.ingredient.id==='onion');
 assert.equal(onion.preparations.get('양파').totals.get('g'),20);
 assert.equal(onion.preparations.get('간 양파').totals.get('g'),10);
 for(const [base,form] of [['미나리','데친 미나리'],['꼬막','데친 꼬막살']]){
  const row=rows.find(r=>r.ingredient.id===get(base).id);
  assert.equal(row.preparations.get(base).totals.get('g'),10);
  assert.equal(row.preparations.get(form).totals.get('g'),10);
  assert.ok(totalText(row).includes(form));
 }
 assert.deepEqual(rows.flatMap(r=>r.uses).map(u=>u.originalIngredientName).sort(),forms.sort());
 assert.equal(JSON.stringify(ingredients),before);
});

test('등록 채소 전체의 다진·간·썬·깐·크기·데친·삶은 표기를 빠짐없이 검토',()=>{
 const labels=ingredients.filter(i=>i.category==='채소·버섯'&&/^(다진|간\s|데친|삶은|찐|자숙|깐)|다진것|채썬것|송송썬것|작게자른것|작은것/.test(i.name));
 assert.ok(labels.length>40);
 for(const ingredient of labels)assert.notEqual(representativeIngredient(ingredient,byId).id,ingredient.id,ingredient.name);
});

test('다진마늘과 생마늘·색상·건조/절임/가루 제품은 구분',()=>{
 assert.notEqual(representativeIngredient(get('다진 마늘'),byId).id,get('마늘').id);
 for(const [a,b] of [['건 표고버섯','표고버섯'],['오이피클','오이'],['단호박가루','단호박'],['미니 단호박','단호박'],['청피망','홍피망']]){
  assert.notEqual(representativeIngredient(get(a),byId).id,representativeIngredient(get(b),byId).id);
 }
});

test('예전 손질 재료 선택·보유 ID는 대표로 복원하고 기존 메뉴 인분 유지',()=>{
 const selection={recipeId:recipes[0].id,servings:3,times:1};
 const saved=new Map([
  [KEYS.preferences,JSON.stringify({schemaVersion:1,excludedRecipeIds:[],pantryIngredientIds:[get('데친 미나리').id,get('마늘다진것').id]})],
  [KEYS.draft,JSON.stringify({schemaVersion:1,selectedIngredientIds:[get('다진 당근').id],manualIngredientIds:[get('다진 당근').id],activeInterestIds:[get('다진 당근').id],selectedRecipes:[selection],activeRecommendationMode:'관심 재료 활용',checkedIngredientIds:[]})]
 ]);
 const store=createStore({getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)});
 store.reconcile(ingredients,recipes);
 syncMenuIngredients(store.draft,ingredients,recipes,store.pantryIngredientIds);
 assert.ok(store.pantryIngredientIds.includes(get('미나리').id));
 assert.ok(store.pantryIngredientIds.includes(get('다진 마늘').id));
 assert.ok(store.draft.selectedIngredientIds.includes(get('당근').id));
 assert.deepEqual(store.draft.selectedRecipes,[selection]);
});
