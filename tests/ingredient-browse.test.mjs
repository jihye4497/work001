import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {browseCategory,browseIngredients,seasonalIngredients,koreaMonth} from '../js/ingredient-browse.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
test('화면 분류는 농산·육수산·기타·양념으로 구분하고 원본을 바꾸지 않음',()=>{
 const before=JSON.stringify(ingredients);
 for(const [name,category] of [['쌀','농산물'],['현미','농산물'],['사과','농산물'],['팽이버섯','농산물'],['미역','육·수산'],['다시마','육·수산'],['두부','기타'],['계란','기타'],['소금','양념']]) {
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
