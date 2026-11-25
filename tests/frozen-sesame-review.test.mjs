import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ingredientDisplayName} from '../js/ingredient-display-names.js';
import {ingredientBrowseGroup,browseIngredients} from '../js/ingredient-browse.js';
import {searchIngredients} from '../js/ingredients.js';
import {aggregate,totalText} from '../js/shopping-list.js';
import {matchIngredient} from '../js/ingredient-matching.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const get=name=>ingredients.find(i=>i.name===name),byId=new Map(ingredients.map(i=>[i.id,i]));
test('검은깨/검정깨/흑임자 선택통합·볶은상태수량 보존·가루와묵 구분',()=>{
 const names=['검은깨','검정깨','흑임자','검정깨(볶은 것)','볶은 흑임자'];
 for(const name of names){
  assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'농산물',subcategory:'곡물·콩'});
  assert.deepEqual(searchIngredients(ingredients,name).filter(i=>names.includes(i.name)).map(i=>i.id),[get('검은깨').id]);
 }
 assert.equal(browseIngredients(ingredients,'농산물','곡물·콩').filter(i=>names.includes(i.name)).length,1);
 const r={id:'sesame',name:'깨',baseServings:1,ingredients:names.map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:name}))};
 const rows=aggregate(ingredients,[r],[{recipeId:r.id,servings:1,times:1}],1);
 assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'검은깨 30g + 검정깨(볶은 것) 10g + 볶은 흑임자 10g');
 for(const name of ['흑임자가루','검정깨묵'])assert.equal(matchIngredient(get('검은깨').id,get(name).id,r,byId),0);
});
test('전체 냉동재료는 원문명/ID 보존하며 뒤쪽괄호표시 및 새이름검색 지원',()=>{
 const before=JSON.stringify(ingredients),frozen=ingredients.filter(i=>i.name.includes('냉동'));
 assert.ok(frozen.length>=15);
 for(const i of frozen){
  const label=ingredientDisplayName(i);assert.ok(label.includes('냉동'),i.name);
  assert.ok(!label.startsWith('냉동')&&!label.endsWith('냉동'),`${i.name} -> ${label}`);
  assert.ok(searchIngredients(ingredients,label).length>0,label);
 }
 for(const [a,b] of [['냉동 곤약','곤약(냉동)'],['냉동 돈가스','돈까스(냉동)'],['냉동 스테이크','스테이크(냉동)'],['냉동 우동사리','우동사리(냉동)']])assert.equal(ingredientDisplayName(get(a)),b);
 assert.equal(JSON.stringify(ingredients),before);
});
