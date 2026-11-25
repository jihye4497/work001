import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {RECIPE_DISPLAY_NAMES,applyRecipeDisplayNames} from '../js/recipe-display-names.js';
import {PAIRED_MENU_IDS} from '../js/paired-menu-names.js';
import {ACTIVE_COMPOSITION_IDS} from '../js/recipe-calculation-basis.js';
import {searchMenus} from '../js/recommendations.js';
import {aggregate,totalText} from '../js/shopping-list.js';
import {loadData} from '../js/ingredients.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const recipes=await read('data/recipes.json'),ingredients=await read('data/ingredients.json');
const compact=s=>s.replace(/\s/g,'');
const key=r=>`${r.sourceName||''}|${compact(r.name)}`;
test('같은 채널의 중복 이름만 검토한 이름으로 구분하고 원본·다른 채널·계산량 보존',()=>{
 const before=JSON.stringify(recipes),renamed=applyRecipeDisplayNames(recipes),groups=new Map();
 for(const r of recipes){const k=key(r);groups.set(k,(groups.get(k)||0)+1);}
 assert.equal(new Set(RECIPE_DISPLAY_NAMES.map(e=>e[0])).size,RECIPE_DISPLAY_NAMES.length);
 const seen=new Set();
 for(let i=0;i<recipes.length;i++){
  const original=recipes[i],display=renamed[i];
  assert.ok(!seen.has(key(display)),`남은 동일 채널 중복: ${key(display)}`);seen.add(key(display));
  assert.deepEqual({...display,name:original.name},original);
  if(display.name!==original.name){assert.ok(groups.get(key(original))>1||['mincook-blog-578','mincook-blog-601',...ACTIVE_COMPOSITION_IDS].includes(original.id)||PAIRED_MENU_IDS.has(original.id)||/[&＆]/.test(original.name));assert.ok(searchMenus(renamed,display.name).some(r=>r.id===display.id));}
  else assert.equal(display,original);
 }
 for(const [id,originalName,name,evidence] of RECIPE_DISPLAY_NAMES){const r=recipes.find(r=>r.id===id);assert.ok(r,id);assert.equal(r.name,originalName);assert.ok(name&&evidence);}
 assert.equal(JSON.stringify(recipes),before);
 assert.deepEqual(applyRecipeDisplayNames(renamed),renamed);
 const selection=[{recipeId:'paik-TFcNckg-1bQ',servings:3}];
 const rows=list=>aggregate(ingredients,list,selection,2).map(r=>[r.ingredient.id,totalText(r)]);
 assert.deepEqual(rows(recipes),rows(renamed));
});
test('실제 데이터 로딩에서 사진·분류·주재료 판정 후 표시 이름 적용',async t=>{
 const images=await read('data/recipe-images.json'),generated=await read('data/generated-recipe-images.json'),categories=await read('data/recipe-categories.json');
 const responses=[ingredients,recipes,categories,images,generated];
 const originalFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=originalFetch;});
 globalThis.fetch=async()=>({ok:true,json:async()=>responses.shift()});
 const loaded=await loadData();
 assert.equal(loaded.recipes.find(r=>r.id==='paik-TFcNckg-1bQ').name,'돼지목살 두부 고추장찌개');
 assert.equal(loaded.recipes.find(r=>r.id==='caden-n6e08ay5tUw').name,'고추장찌개');
 const steak=loaded.recipes.find(r=>r.id==='mincook-blog-578');
 assert.equal(steak.name,'스테이크 & 페퍼콘소스');
 assert.equal(steak.ingredients.find(i=>i.note==='원문: 다진마늘 : 0.5숟가락').amount,0.5);
 assert.notEqual(steak.calculationMode,'batch');
 const kaimak=loaded.recipes.find(r=>r.id==='mincook-blog-238');
 assert.equal(kaimak.calculationMode,'batch');
 assert.ok(kaimak.ingredients.some(i=>i.note==='원문: 생크림 : 1L'&&i.amount===1&&i.unit==='L'));
 assert.equal(responses.length,0);
});
