import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applyCalculationBasis} from '../js/recipe-calculation-basis.js';
import {MEAL_REVIEW_BATCHES,MEAL_REVIEW_SERVINGS,applyMealServingReview} from '../js/meal-servings-review-decisions.js';
import {aggregate} from '../js/shopping-list.js';
import {servingLabel} from '../js/servings.js';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const [raw,ingredients,baseline]=await Promise.all(['data/recipes.json','data/ingredients.json','data/source/creator-meal-servings-baseline.json'].map(read));
const effective=applyCalculationBasis(raw);
test('추가 검토는 유튜브 지정채널 추정4이상250개만 포함; 1~3/명시인분/식약처/테팔 불변',()=>{
 assert.equal(baseline.recipeIds.length,250);assert.equal(new Set(baseline.recipeIds).size,250);
 for(const id of [...Object.keys(MEAL_REVIEW_BATCHES),...Object.keys(MEAL_REVIEW_SERVINGS)]){
  const r=raw.find(r=>r.id===id);assert.ok(baseline.recipeIds.includes(id),id);assert.ok(r.baseServings>=4);assert.equal(r.servingsStatus,'estimated');
 }
 for(const r of raw.filter(r=>r.baseServings<4||r.servingsStatus!=='estimated'||/^(mfds|tefal)-/.test(r.id)))assert.deepEqual(applyMealServingReview(r),r,r.id);
});
test('승인 인분수정은 원문재료를 보존하고 선택인분에 비례해 계산; 원본/선택값 불변',()=>{
 for(const [id,d] of Object.entries(MEAL_REVIEW_SERVINGS)){
  const r=effective.find(r=>r.id===id);assert.equal(r.baseServings,d.baseServings);assert.equal(r.servingsStatus,'estimated');assert.match(servingLabel(r),/\(추정\)/);
 }
 const id='mincook-blog-578',r=effective.find(r=>r.id===id);
 const selected=[{recipeId:id,servings:2,times:1}],snapshot=JSON.stringify(selected);
 const use=aggregate(ingredients,[r],selected,2).flatMap(row=>row.uses).find(u=>u.note.includes('본문에 무게1kg'));
 assert.equal(use.amount,0.5);assert.equal(use.unit,'kg');assert.equal(JSON.stringify(selected),snapshot);
 assert.equal(r.ingredients.find(i=>i.ingredientId==='minced-garlic').amount,0.5);
 assert.equal(raw.find(r=>r.id===id).baseServings,10);
});
test('반찬1회 제조량은 인원에 비례하지 않으며 원문단위/미기재 보존',()=>{
 for(const id of Object.keys(MEAL_REVIEW_BATCHES)){
  const r=effective.find(r=>r.id===id);assert.equal(servingLabel(r),'1회 제조량');
  const uses=n=>aggregate(ingredients,[r],[{recipeId:id,servings:n,times:1}],n).flatMap(row=>row.uses).map(u=>[u.amount,u.unit,u.note]);
  assert.deepEqual(uses(1),uses(4),id);
 }
});
test('콩나물무침은 콩나물500g중복을 제거, 인분조정원문보완을 반복해도 불변',()=>{
 const r=effective.find(r=>r.id==='mincook-blog-167');
 const uses=aggregate(ingredients,[r],[{recipeId:r.id,servings:2,times:1}],2).flatMap(row=>row.uses).filter(u=>u.note==='원문: 콩나물 500g');
 assert.equal(uses.length,1);assert.equal(uses[0].amount,500);
 const reviewed=effective.filter(r=>MEAL_REVIEW_BATCHES[r.id]||MEAL_REVIEW_SERVINGS[r.id]);
 assert.deepEqual(applyCalculationBasis(reviewed),reviewed);
});
test('유부초김밥4인분은 속재료4줄/사진확인 유부20장, 밥혼합물전량과 햄중복제거 보존',()=>{
 const id='mincook-blog-122',original=raw.find(r=>r.id===id),r=effective.find(r=>r.id===id);
 assert.equal(servingLabel(r),'4인분(추정)');
 assert.deepEqual(r.ingredients.slice(0,5),original.ingredients.slice(0,5));
 const find=(prefix)=>r.ingredients.filter(i=>i.note.startsWith(prefix));
 assert.equal(find('원문: 유부초밥용 유부')[0].amount,20);
 assert.equal(find('원문: 김밥용 김')[0].amount,4);
 assert.equal(find('원문: 깻잎')[0].amount,12);
 assert.equal(find('원문: 김밥용 햄').length,1);
 assert.equal(find('원문: 김밥용 햄')[0].amount,4);
 assert.equal(find('원문: 김밥용 단무지')[0].amount,4);
 assert.equal(find('원문: 사각어묵')[0].amount,4/3);
 assert.equal(find('원문: 당근')[0].amount,null);
 const selected=[{recipeId:id,servings:2,times:1}],snapshot=JSON.stringify(selected);
 const uses=aggregate(ingredients,[r],selected,2).flatMap(row=>row.uses);
 assert.equal(uses.find(u=>u.note.startsWith('원문: 유부초밥용 유부')).amount,10);
 assert.equal(uses.find(u=>u.note.startsWith('원문: 김밥용 단무지')).amount,2);
 assert.equal(uses.find(u=>u.note.startsWith('원문: 밥 : 2공기')).amount,1);
 assert.equal(JSON.stringify(selected),snapshot);
 assert.deepEqual(applyCalculationBasis([r]),[r]);
 assert.equal(original.ingredients.filter(i=>i.note.startsWith('원문: 김밥용 햄')).length,2);
});
