import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ingredientBrowseGroup,browseIngredients} from '../js/ingredient-browse.js';
import {searchIngredients} from '../js/ingredients.js';
import {aggregate} from '../js/shopping-list.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const get=name=>{const i=ingredients.find(i=>i.name===name);assert.ok(i,name);return i;};
test('reviewed exceptions override imported flags without mutating source data',()=>{
 const snapshot=JSON.stringify(ingredients);
 for(const [names,category,subcategory] of [
  [['백미','안남미','메주콩','캐슈넛'],'농산물','곡물·콩'],
  [['오겹살','한우 사골'],'육·수산','고기'],
  [['강력분','박력분','빵가루','멥쌀가루'],'기타','가루류'],
  [['중화면','메밀면','페투치네면'],'기타','면·떡'],
  [['딸기우유','무염 치즈','식물성 생크림'],'기타','유제품'],
  [['카놀라유','포도씨유','라드'],'양념','기름'],
  [['치킨스톡','코인육수','다시다'],'양념','조미'],
  [['고춧가루','건로즈마리'],'양념','향신']
 ])for(const name of names)assert.deepEqual(ingredientBrowseGroup(get(name)),{category,subcategory});
 assert.equal(JSON.stringify(ingredients),snapshot);
});
test('potato starch alias shares selection and totals; wet flours remain distinct',()=>{
 const base=get('감자전분'),alias=get('감자녹말가루');
 assert.ok(searchIngredients(ingredients,alias.name).some(i=>i.id===base.id));
 assert.ok(!browseIngredients(ingredients,'기타','가루류').some(i=>i.id===alias.id));
 const recipe={id:'starch',name:'검증',baseServings:1,ingredients:[base,alias].map(i=>({ingredientId:i.id,amount:10,unit:'g',note:i.name}))};
 const rows=aggregate(ingredients,[recipe],[{recipeId:'starch',servings:1,times:1}],1);
 assert.equal(rows.length,1);assert.equal(rows[0].uses.length,2);
 const visible=browseIngredients(ingredients,'기타','가루류');
 for(const name of ['습식찹쌀가루','습식쌀가루'])assert.ok(visible.some(i=>i.id===get(name).id));
 assert.ok(!visible.some(i=>i.id===get('젖은 찹쌀가루').id));
 assert.ok(searchIngredients(ingredients,'젖은 찹쌀가루').some(i=>i.id===get('습식찹쌀가루').id));
});
