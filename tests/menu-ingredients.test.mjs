import test from 'node:test';
import assert from 'node:assert/strict';
import { syncMenuIngredients } from '../js/menu-ingredients.js';
import { defaultDraft, createStore, validDraft } from '../js/storage.js';
import { aggregate } from '../js/shopping-list.js';
const ingredients = [
  {id:'pork',name:'돼지 앞다리살',isSeasoning:false,category:'육류·해산물'},
  {id:'kimchi',name:'김치',isSeasoning:false,category:'두부·계란·기타'},
  {id:'onion',name:'양파',isSeasoning:false,category:'채소·버섯'},
  {id:'salt',name:'소금',isSeasoning:true,category:'양념·조미료'}
];
const make = (id,ids) => ({id,name:id,baseServings:1,ingredients:ids.map(ingredientId=>({ingredientId,amount:10,unit:'g',note:null}))});
const recipes=[make('stew',['pork','kimchi','onion','salt']),make('stir',['pork','onion'])];
test('추가·공유 메뉴 삭제·전체 삭제 시 자동 재료만 정리하고 직접 선택·양념 계산 유지',()=>{
  const d={...defaultDraft(),selectedIngredientIds:['onion'],activeInterestIds:['onion']};
  syncMenuIngredients(d,ingredients,recipes);
  d.selectedRecipes=[{recipeId:'stew',times:1},{recipeId:'stir',times:2}];
  syncMenuIngredients(d,ingredients,recipes,['kimchi']);
  assert.deepEqual(d.selectedIngredientIds,['onion','pork']);
  assert.deepEqual(d.activeInterestIds,['onion']);
  assert.ok(aggregate(ingredients,recipes,d.selectedRecipes,1).some(r=>r.ingredient.id==='salt'));
  d.selectedRecipes=d.selectedRecipes.filter(s=>s.recipeId!=='stew');
  syncMenuIngredients(d,ingredients,recipes,['kimchi']);assert.ok(d.selectedIngredientIds.includes('pork'));
  assert.ok(!aggregate(ingredients,recipes,d.selectedRecipes,1).some(r=>r.ingredient.id==='salt'));
  d.selectedRecipes=[];syncMenuIngredients(d,ingredients,recipes);assert.deepEqual(d.selectedIngredientIds,['onion']);
});
test('저장 복원 후에도 출처를 보존하고 메뉴 삭제 시 자동 재료 정리, 초기화는 비움',()=>{
  const values=new Map(),memory={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  const first=createStore(memory);
  syncMenuIngredients(first.draft,ingredients,recipes);
  first.draft.selectedRecipes=[{recipeId:'stew',times:1}];syncMenuIngredients(first.draft,ingredients,recipes);first.saveDraft();
  const restored=createStore(memory);assert.deepEqual(restored.draft.manualIngredientIds,[]);
  restored.draft.selectedRecipes=[];syncMenuIngredients(restored.draft,ingredients,recipes);assert.deepEqual(restored.draft.selectedIngredientIds,[]);
  restored.reset();assert.deepEqual(restored.draft.selectedRecipes,[]);
  assert.equal(validDraft({...defaultDraft(),manualIngredientIds:'invalid'}),false);
});
test('자동 재료를 직접 고정하거나 해제한 선택을 보존하고 보유 여부 변경에 따라 갱신',()=>{
  const d=defaultDraft();syncMenuIngredients(d,ingredients,recipes);
  d.selectedRecipes=[{recipeId:'stew',times:1}];syncMenuIngredients(d,ingredients,recipes);
  d.manualIngredientIds=['pork'];d.suppressedAutoIngredientIds=['onion'];
  syncMenuIngredients(d,ingredients,recipes,['kimchi']);assert.deepEqual(d.selectedIngredientIds,['pork']);
  d.selectedRecipes=[];syncMenuIngredients(d,ingredients,recipes);assert.deepEqual(d.selectedIngredientIds,['pork']);
});
