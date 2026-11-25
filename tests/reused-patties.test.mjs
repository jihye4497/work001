import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyCalculationBasis} from '../js/recipe-calculation-basis.js';
import {aggregate} from '../js/shopping-list.js';
import {searchIngredients} from '../js/ingredients.js';
import {browseIngredients,BROWSE_CATEGORIES} from '../js/ingredient-browse.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
const id='mincook-blog-742',intermediate='mincook-ingredient-e3213eb3c849';
test('homemade patties reused in bowl/burger do not become extra purchase ingredients',()=>{
 const snapshot=JSON.stringify(recipes),raw=recipes.find(r=>r.id===id);
 assert.equal(raw.ingredients.filter(i=>i.ingredientId===intermediate).length,2);
 const r=applyCalculationBasis([raw])[0];
 assert.deepEqual(r.ingredients,raw.ingredients.filter(i=>i.ingredientId!==intermediate));
 assert.equal(r.baseServings,raw.baseServings);
 assert.deepEqual(applyCalculationBasis([r])[0],r);
 const selection=[{recipeId:id,servings:raw.baseServings,times:1}];
 const before=aggregate(ingredients,[{...raw,showSourceNotes:true}],selection,raw.baseServings);
 const after=aggregate(ingredients,[r],selection,raw.baseServings);
 assert.ok(!after.some(row=>row.ingredient.id===intermediate));
 assert.deepEqual(after,before.filter(row=>row.ingredient.id!==intermediate));
 assert.equal(JSON.stringify(recipes),snapshot);
});
test('homemade patties are hidden from picker and search, archived source remains',()=>{
 assert.ok(ingredients.some(i=>i.id===intermediate));
 assert.ok(!searchIngredients(ingredients,'청양 떡갈비').some(i=>i.id===intermediate));
 for(const category of BROWSE_CATEGORIES)assert.ok(!browseIngredients(ingredients,category).some(i=>i.id===intermediate));
});
