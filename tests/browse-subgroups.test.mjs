import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {browseIngredients,BROWSE_SUBCATEGORIES} from '../js/ingredient-browse.js';
import {aggregate} from '../js/shopping-list.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
test('new filters partition all visible ingredients exactly once',()=>{
 for(const category of ['기타','양념']){
  const all=browseIngredients(ingredients,category).map(i=>i.id).sort();
  const filtered=BROWSE_SUBCATEGORIES[category].flatMap(sub=>browseIngredients(ingredients,category,sub).map(i=>i.id));
  assert.deepEqual(filtered.sort(),all);assert.equal(new Set(filtered).size,all.length);
 }
 for(const [sub,names] of [['두부·묵',['두부','유부']],['반찬·통조림',['어묵','묵은지']],['간편식·간식',['햄버거 빵']]]){
  const visible=browseIngredients(ingredients,'기타',sub);
  for(const name of names)assert.ok(visible.some(i=>i.name===name),name);
 }
});
test('wet glutinous flour source quantities merge without changing original recipe records',async()=>{
 const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const snapshot=JSON.stringify(recipes),base=ingredients.find(i=>i.name==='습식찹쌀가루');
 const selected=['mfds-cookrcp01-852','mfds-cookrcp01-992'];
 const rows=aggregate(ingredients,recipes,selected.map(recipeId=>({recipeId,servings:1,times:1})),1);
 const row=rows.find(r=>r.ingredient.id===base.id);
 assert.ok(row);assert.equal(row.uses.length,2);
 assert.deepEqual(row.uses.map(u=>u.amount).sort((a,b)=>a-b),[30,50]);
 assert.ok(row.uses.every(u=>u.originalIngredientName==='젖은 찹쌀가루'));
 assert.equal(JSON.stringify(recipes),snapshot);
});
