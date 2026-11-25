import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyCalculationBasis,ACTIVE_COMPOSITION_IDS} from '../js/recipe-calculation-basis.js';
import {applyRecipeDisplayNames} from '../js/recipe-display-names.js';
import {composeRecipe,COMPOSITION_REVIEWS} from '../js/recipe-compositions.js';
import {aggregate} from '../js/shopping-list.js';
import {validateData} from '../js/ingredients.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const [ingredients,raw]=await Promise.all([read('data/ingredients.json'),read('data/recipes.json')]);
const before=JSON.stringify(raw),recipes=applyCalculationBasis(applyRecipeDisplayNames(raw));
const previews=raw.map(r=>composeRecipe(r));
test('활용요리별0회는 해당재료만 빼고 제조원재료/다른활용요리를 보존',()=>{
 validateData(ingredients,previews);
 assert.deepEqual([...ACTIVE_COMPOSITION_IDS].sort(),Object.keys(COMPOSITION_REVIEWS).sort());
 for(const id of Object.keys(COMPOSITION_REVIEWS)){
  assert.deepEqual(recipes.find(r=>r.id===id).components,COMPOSITION_REVIEWS[id].components);
  const r=previews.find(r=>r.id===id),base=r.components[0];
  const uses=counts=>aggregate(ingredients,[r],[{recipeId:id,times:1,servings:4,componentBatches:counts}],4).flatMap(row=>row.uses);
  assert.ok(r.components.length>=2);
  const all=uses({});
  assert.equal(all.length,r.ingredients.length);
  for(const c of r.components.slice(1)){
   const remaining=uses({[c.id]:0});
   assert.ok(!remaining.some(u=>u.name.endsWith(` · ${c.name}`)));
   assert.equal(remaining.filter(u=>u.name.endsWith(` · ${base.name}`)).length,r.ingredients.filter(i=>i.componentId===base.id).length);
   assert.equal(remaining.length,all.length-r.ingredients.filter(i=>i.componentId===c.id).length);
  }
  for(const c of r.components){
   const remaining=uses(Object.fromEntries(r.components.filter(x=>x.id!==c.id).map(x=>[x.id,0])));
   assert.equal(remaining.length,r.ingredients.filter(i=>i.componentId===c.id).length);
  }
 }
 assert.equal(JSON.stringify(raw),before);
});
test('활용열무김치 중복구매 제거·본문 달걀/깨/기름/소금 보완·미기재는 그대로',()=>{
 const kimchi=previews.find(r=>r.id==='mincook-blog-728');
 assert.equal(kimchi.ingredients.length,29);
 assert.ok(!kimchi.ingredients.some(i=>i.note==='원문: 열무김치'));
 assert.ok(kimchi.ingredients.some(i=>i.componentId==='noodles'&&i.note.includes('삶은 계란')));
 assert.equal(kimchi.ingredients.filter(i=>i.note.includes('원문 본문 재료: 참깨')).length,2);
 const butter=previews.find(r=>r.id==='mincook-blog-625');
 assert.equal(butter.ingredients.length,15);assert.ok(butter.ingredients.some(i=>i.componentId==='sandwich'&&i.ingredientId==='oil'));
 const tomato=previews.find(r=>r.id==='mincook-blog-598');
 assert.equal(tomato.ingredients.length,14);assert.ok(tomato.ingredients.some(i=>i.componentId==='pasta'&&i.ingredientId==='salt'));
 for(const r of [kimchi,butter,tomato])for(const item of r.ingredients.filter(i=>i.note.startsWith('원문 본문 재료:'))){assert.equal(item.amount,null);assert.equal(item.unit,null);}
});
test('사용자 확인한 간장양념장은1회 제조와5반찬을 독립 계산하고 약간 표기를 보존',()=>{
 const original=raw.find(r=>r.id==='mincook-blog-623');
 const draft=composeRecipe(original);
 assert.equal(draft.components.length,6);assert.equal(draft.ingredients.length,28);
 const live=recipes.find(r=>r.id===original.id);
 assert.equal(live.components.length,6);
 assert.equal(live.ingredients.find(i=>i.componentId==='bracken'&&i.note==='원문: 삶은 고사리 : 200g').amount,200);
 assert.equal(live.ingredients.find(i=>i.componentId==='fishcake'&&i.note==='원문: 어묵 : 350g').amount,350);
 for(const c of ['fishcake','braise','perilla']){
  const small=live.ingredients.filter(i=>i.componentId===c&&i.note.includes('사용자 확인: 약간'));
  assert.equal(small.length,2);assert.ok(small.every(i=>i.amount===null&&i.unit===null));
 }
 assert.equal(live.ingredients.filter(i=>i.componentId==='perilla').length,4);
 validateData(ingredients,[draft]);
});
