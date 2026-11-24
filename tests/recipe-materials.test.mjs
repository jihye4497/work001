import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {recipeMaterialNames} from '../js/shopping-list.js';
import {ingredientDisplayName} from '../js/ingredient-display-names.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const get=name=>ingredients.find(i=>i.name===name);

test('카드 재료 안내는 보유 양념을 생략하고 살 재료에 모든 미보유 재료·양념 포함',()=>{
 const recipe={id:'materials',name:'재료 안내',baseServings:1,ingredients:['양파','소금','돼지 앞다리살','두부','고추장','물'].map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:null}))};
 const before=JSON.stringify(recipe);
 const result=recipeMaterialNames(recipe,ingredients,[get('양파').id,get('소금').id]);
 assert.deepEqual(result.owned,['양파']);
 assert.deepEqual(new Set(result.buy),new Set(['돼지고기(앞다리살)','두부','고추장']));
 assert.equal(JSON.stringify(recipe),before);
 const allOwned=recipeMaterialNames(recipe,ingredients,recipe.ingredients.map(i=>i.ingredientId));assert.deepEqual(allOwned.buy,[]);
});

test('카드 안내는 실제 부위 대체와 준비 재료 연결을 장보기와 일치시킴',()=>{
 const from=get('돼지 앞다리살'),to=get('돼지고기 목심');
 const recipe={id:'substitute',name:'김치찌개',baseServings:1,ingredients:[{ingredientId:from.id,amount:100,unit:'g',note:null}]};
 assert.deepEqual(recipeMaterialNames(recipe,ingredients,[],{[from.id]:to.id}).buy,[ingredientDisplayName(to)]);
 assert.deepEqual(recipeMaterialNames(recipe,ingredients,[to.id],{[from.id]:to.id}).owned,[ingredientDisplayName(to)]);
});
