import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {searchMenus} from '../js/recommendations.js';
import {applyRecipeDisplayNames} from '../js/recipe-display-names.js';
const raw=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
const recipes=applyRecipeDisplayNames(raw);
test('메뉴 검색은 공백·연결기호 생략과 와/과 표현을 함께 지원',()=>{
 for(const query of ['수육무김치','수육 & 무김치','수육＆무김치','수육와무김치','수육과무김치','수육·무김치'])assert.ok(searchMenus(recipes,query).some(r=>r.id==='mincook-blog-91'),query);
 for(const query of ['스테이크페퍼콘소스','스테이크와 페퍼콘소스','스테이크&페퍼콘소스'])assert.ok(searchMenus(recipes,query).some(r=>r.id==='mincook-blog-578'),query);
 for(const query of ['', ' ', '&', ' · & '])assert.deepEqual(searchMenus(recipes,query),[]);
});
test('연결어만 표시 통일하고 사과·와인·와사비 같은 단어와 원본 정보는 보존',()=>{
 assert.equal(recipes.find(r=>r.id==='mfds-cookrcp01-506').name,'새우 & 스테이크');
 assert.equal(recipes.find(r=>r.id==='mincook-blog-112').name,'와인수육 & 파절이');
 for(const name of ['사과조림','홍합와인탕','와사비 연어초밥'])assert.equal(recipes.find(r=>r.name===name)?.name,name);
 for(let i=0;i<raw.length;i++)assert.deepEqual({...recipes[i],name:raw[i].name},raw[i]);
 assert.deepEqual(applyRecipeDisplayNames(recipes),recipes);
});
