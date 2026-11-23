import test from 'node:test';
import assert from 'node:assert/strict';
import { recipeSource } from '../js/recipe-sources.js';

test('explicit creator credit preserves the original URL and does not infer ownership from a title',()=>{
  assert.deepEqual(recipeSource({name:'김치찌개',sourceName:'백종원의 요리비책',sourceUrl:'https://www.youtube.com/watch?v=qWbHSOplcvY'}),{
    name:'백종원의 요리비책',url:'https://www.youtube.com/watch?v=qWbHSOplcvY'
  });
  assert.equal(recipeSource({name:'백종원 김치찌개',sourceNote:'미확인'}),null);
  assert.deepEqual(recipeSource({sourceName:'출처',sourceUrl:'javascript:alert(1)'}),{name:'출처',url:null});
  assert.deepEqual(recipeSource({sourceName:'출처',sourceUrl:'/unknown'}),{name:'출처',url:null});
});

test('existing verified source notes retain their actual publishers',()=>{
  assert.equal(recipeSource({sourceNote:'식품의약품안전처 COOKRCP01 / RCP_SEQ=29; 원문 검수'}).name,'식품의약품안전처');
  assert.equal(recipeSource({sourceNote:'테팔 터보퀴진 레시피북 p.17'}).name,'테팔 레시피북');
});
