import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {browseCategory,ingredientBrowseGroup,BROWSE_SUBCATEGORIES,browseIngredients,seasonalIngredients,koreaMonth} from '../js/ingredient-browse.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
test('화면 분류는 농산·육수산·기타·양념으로 구분하고 원본을 바꾸지 않음',()=>{
 const before=JSON.stringify(ingredients);
 for(const [name,category] of [['쌀','농산물'],['현미','농산물'],['사과','농산물'],['팽이버섯','농산물'],['미역','육·수산'],['다시마','육·수산'],['두부','기타'],['계란','육·수산'],['소금','양념']]) {
  const item=ingredients.find(i=>i.name===name);assert.ok(item);assert.equal(browseCategory(item),category);
  assert.ok(browseIngredients(ingredients,category).some(i=>i.id===item.id));
 }
 assert.equal(JSON.stringify(ingredients),before);
});
test('제철은 공식 확인 월만 제공하고 한국 날짜로 월을 결정',()=>{
 const result=seasonalIngredients(ingredients,11);
 for(const name of ['배추','무','포도','굴','대구','홍합'])assert.ok(result.items.some(i=>i.name===name));
 assert.ok(result.sources.length>0);assert.equal(seasonalIngredients(ingredients,2).items.length,0);
 assert.equal(koreaMonth(new Date('2026-10-31T16:00:00Z')),11);
});


test('합의한 세부 분류와 전체 우선순위가 원본 수량·분류 변경 없이 적용',()=>{
 const pairs=[['계란','알류'],['메추리알','알류'],['날치알','알류'],['두부','가공식품'],['유부','가공식품'],['우유','유제품'],['스파게티','면·떡'],['밀가루','가루류'],['식용유','기름'],['소금','조미'],['맛술','조미'],['간장','장류'],['후추가루','향신'],['팽이버섯','버섯'],['쌀','곡물·콩']];
 for(const [name,sub] of pairs){const i=ingredients.find(i=>i.name===name);assert.ok(i,name);assert.equal(ingredientBrowseGroup(i).subcategory,sub,name);}
 for(const i of ingredients){const group=ingredientBrowseGroup(i);assert.ok(BROWSE_SUBCATEGORIES[group.category].includes(group.subcategory),i.name);}
 assert.equal(browseIngredients(ingredients,'농산물')[0].name,'양파');
 assert.equal(browseIngredients(ingredients,'육·수산')[0].name,'계란');
 assert.equal(browseIngredients(ingredients,'기타')[0].name,'두부');
 assert.equal(browseIngredients(ingredients,'양념')[0].name,'소금');
 assert.ok(browseIngredients(ingredients,'농산물','과일').every(i=>ingredientBrowseGroup(i).subcategory==='과일'));
});


test('소금 용도 표기는 선택 목록에서 숨기고 실제 다른 소금 제품은 유지',()=>{
 const rows=browseIngredients(ingredients,'양념');
 for(const name of ['소금(데치는용)','소금(쓴맛 제거용)','소금물'])assert.equal(rows.some(i=>i.name===name),false);
 for(const name of ['소금','저염소금','천일염','맛소금'])assert.ok(rows.some(i=>i.name===name),name);
 assert.deepEqual(BROWSE_SUBCATEGORIES['양념'],['장류','소스','기름','조미','향신']);
});
