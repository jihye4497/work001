import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MEAT_DISPLAY_NAMES,ingredientDisplayName} from '../js/ingredient-display-names.js';
import {representativeIngredient} from '../js/ingredient-matching.js';
import {searchIngredients} from '../js/ingredients.js';
import {browseIngredients} from '../js/ingredient-browse.js';
import {aggregate,selectedCopyText,totalText} from '../js/shopping-list.js';
import {createStore,KEYS} from '../js/storage.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const get=name=>ingredients.find(i=>i.name===name),byId=new Map(ingredients.map(i=>[i.id,i]));

test('고기 표시명은 등록된 재료만 바꾸며 부위·축종과 원본 이름·ID 보존',()=>{
 const before=JSON.stringify(ingredients);
 for(const [name,display] of Object.entries(MEAT_DISPLAY_NAMES)){
  assert.ok(get(name),name);assert.equal(ingredientDisplayName(get(name)),display);
  assert.ok(searchIngredients(ingredients,display).some(i=>i.id===representativeIngredient(get(name),byId).id),display);
 }
 assert.equal(ingredientDisplayName(get('소고기(양지)')),'소고기(양지)');
 assert.equal(ingredientDisplayName(get('닭고기(다리살)')),'닭고기(다릿살)');
 assert.equal(ingredientDisplayName(get('돼지감자가루')),'돼지감자가루');
 assert.equal(ingredientDisplayName(get('등심얇게썬것')),'축종 미기재(등심)');
 assert.equal(JSON.stringify(ingredients),before);
});

test('오리로스/삼계탕용닭/닭볶음용닭의 선택 통합·저장 복원·원문 수량 보존',()=>{
 const forms=['오리고기','오리로스','생오리로스','오리'];
 for(const name of forms){assert.equal(representativeIngredient(get(name),byId).id,get('오리고기').id);if(name!=='오리고기')assert.ok(!browseIngredients(ingredients,'육·수산').some(i=>i.id===get(name).id));}
 for(const name of ['통닭','삼계탕용 닭'])assert.equal(ingredientDisplayName(representativeIngredient(get(name),byId)),'닭고기(한 마리)');
 assert.equal(ingredientDisplayName(representativeIngredient(get('닭볶음용 닭'),byId)),'닭고기(토막)');
 const r={id:'duck',name:'오리 요리',baseServings:1,ingredients:forms.map(name=>({ingredientId:get(name).id,amount:50,unit:'g',note:`원문: ${name} 50g`}))};
 const rows=aggregate(ingredients,[r],[{recipeId:r.id,servings:2}],1);
 assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'400g');assert.equal(selectedCopyText(rows,[get('오리고기').id]),'오리고기: 400g');
 assert.deepEqual(rows[0].uses.map(u=>u.originalIngredientName),forms);
 const map=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:forms.map(name=>get(name).id),excludedRecipeIds:[]})]]);
 const store=createStore({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});store.reconcile(ingredients,[r]);assert.deepEqual(store.pantryIngredientIds,[get('오리고기').id]);
 const beef={id:'beef',name:'등심 요리',baseServings:1,ingredients:[{ingredientId:get('소등심').id,amount:100,unit:'g',note:null}]};
 const beefRows=aggregate(ingredients,[beef],[{recipeId:beef.id,servings:1}],1);
 assert.equal(selectedCopyText(beefRows,[get('소고기 등심').id]),'소고기(등심): 100g');
});
