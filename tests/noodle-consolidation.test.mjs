import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {browseIngredients,BROWSE_CATEGORIES} from '../js/ingredient-browse.js';
import {searchIngredients} from '../js/ingredients.js';
import {aggregate,totalText} from '../js/shopping-list.js';
import {matchIngredient} from '../js/ingredient-matching.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const get=name=>{const i=ingredients.find(i=>i.name===name);assert.ok(i,name);return i;};
test('noodle synonyms share one picker choice, quantities and raw notes remain',()=>{
 const snapshot=JSON.stringify(ingredients);
 for(const [base,form] of [['해초국수','해조국수'],['우동면','우동'],['쫄면','쫄면 사리']]){
  const a=get(base),b=get(form);
  assert.ok(searchIngredients(ingredients,form).some(i=>i.id===a.id));
  for(const category of BROWSE_CATEGORIES)assert.ok(!browseIngredients(ingredients,category).some(i=>i.id===b.id));
  const recipe={id:'noodle',name:'검증',baseServings:1,ingredients:[a,b].map(i=>({ingredientId:i.id,amount:100,unit:'g',note:i.name}))};
  const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1,times:1}],1);
  assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'200g');assert.deepEqual(rows[0].uses.map(u=>u.originalIngredientName),[base,form]);
 }
 assert.equal(JSON.stringify(ingredients),snapshot);
});
test('soaked noodles and rice cakes share availability but retain their water-containing weights',()=>{
 const byId=new Map(ingredients.map(i=>[i.id,i]));
 for(const [base,form] of [['당면','불린 당면'],['떡국 떡','불린 떡국떡'],['떡볶이떡','불린 떡볶이떡']]){
  const a=get(base),b=get(form);
  assert.ok(matchIngredient(a.id,b.id,{name:'검증'},byId)>0);
  assert.ok(searchIngredients(ingredients,form).some(i=>i.id===a.id));
  const recipe={id:'soaked',name:'검증',baseServings:1,ingredients:[a,b].map(i=>({ingredientId:i.id,amount:100,unit:'g',note:i.name}))};
  const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1,times:1}],1);
  assert.equal(rows.length,1);assert.equal(totalText(rows[0]),`${base} 100g + ${form} 100g`);
 }
 for(const name of ['냉동 우동사리','생생우동','곤약우동','삶은 쌀소면'])assert.ok(browseIngredients(ingredients,'기타','면·떡').some(i=>i.id===get(name).id),name);
 assert.equal(matchIngredient(get('소면').id,get('삶은 쌀소면').id,{name:'검증'},byId),0);
});
