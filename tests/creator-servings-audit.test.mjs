import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {buildAudit,reviewBucket,proposeCalculationBasis} from '../scripts/audit-creator-servings.mjs';
import {BATCH_RECIPE_REVIEWS,COMPOSITE_BATCH_REVIEWS} from '../js/recipe-calculation-basis.js';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));

test('인분감사 대상은 채널 추정4이상만 포함하고 실제 데이터와 제안수치를 변경하지 않음',()=>{
 const ingredient={id:'pork',name:'고기'};
 const make=(id,status,n)=>({id,name:'요리',sourceName:'검수',baseServings:n,servingsStatus:status,servingsEvidence:'추정',ingredients:[{ingredientId:'pork',amount:600,unit:'g',note:null}]});
 const recipes=[make('mincook-test','estimated',6),make('paik-test','estimated',3),make('moony-test','explicit',6),make('mfds-test','estimated',10),make('tefal-test','estimated',4)];
 const text='고기600g',entry={recipeId:'mincook-test',baseServings:6,ingredientText:text,ingredientHash:createHash('sha256').update(text).digest('hex')};
 const before=JSON.stringify({recipes,entry});
 const report=buildAudit(recipes,[ingredient],[],[{file:'test',document:{entries:[entry]}}]);
 assert.equal(report.entries.length,1);assert.equal(report.entries[0].proposedBaseServings,null);
 assert.equal(report.entries[0].cachedTextHashVerified,true);
 entry.ingredientText+='변경';
 assert.ok(buildAudit(recipes,[ingredient],[],[{file:'test',document:{entries:[entry]}}]).entries[0].flags.includes('cached-text-hash-mismatch'));
 entry.ingredientText=text;assert.equal(JSON.stringify({recipes,entry}),before);
 assert.equal(reviewBucket({id:'mincook-blog-443',name:'사과 크림소스 목살 스테이크'}),'meal');
});

test('저장된 감사목록은 전체368개와 채널집계/근거/미확정상태를 빠짐없이 기록',async()=>{
 const [report,recipes]=await Promise.all([read('../data/source/creator-servings-audit.json'),read('../data/recipes.json')]);
 const ids=recipes.filter(r=>/^(paik|caden|eonam|moony|mincook)-/.test(r.id)&&r.servingsStatus==='estimated'&&(r.baseServings>=4||(r.id==='mincook-blog-91'&&r.servingsBasisLabel))).map(r=>r.id).sort();
 assert.equal(ids.length,368);assert.deepEqual(report.entries.map(e=>e.recipeId).sort(),ids);
 assert.equal(report.summary.channels.reduce((n,c)=>n+c.count,0),ids.length);
 for(const e of report.entries){assert.ok(e.cachedIngredientText);assert.equal(e.proposedBaseServings,null);assert.equal(e.reviewStatus,e.recipeId==='mincook-blog-91'?'resolved-main-dish-basis':Boolean(BATCH_RECIPE_REVIEWS[e.recipeId])?'resolved-batch':Boolean(COMPOSITE_BATCH_REVIEWS[e.recipeId])?'resolved-composite':'needs-editorial-decision');}
 assert.equal(report.summary.calculationBasisProposals.reduce((n,c)=>n+c.count,0),ids.length);
 assert.ok(report.entries.every(e=>['proposal-only','applied-main-dish-basis','applied-batch','applied-scope','applied-composite'].includes(e.calculationBasisProposal.status)));
 assert.equal(report.entries.find(e=>e.recipeId==='mincook-blog-91').resolution.baseServings,3);
 assert.equal(report.entries.find(e=>e.recipeId==='moony-kOS_EGIExvU').latestExternalCheck.status,'source-access-unverified');
});

test('저장반찬 제조횟수 제안은 인원과 분리하고 일반반찬/주메뉴/혼합요리는 구분',()=>{
 for(const name of ['감동란','달걀장조림','돼지고기 장조림','깍두기','무피클','수제 마요네즈','만능양파볶음','만능 겉절이양념']){
  const p=proposeCalculationBasis({id:'sample',name});
  assert.equal(p.mode,'batch',name);assert.equal(p.householdScaling,false);assert.equal(p.defaultBatchCount,1);
 }
 for(const name of ['파채무침','시금치나물','계란말이','김치찌개','양념치킨','삼겹살 김치 솥밥']){
  const p=proposeCalculationBasis({id:'sample',name});
  assert.equal(p.mode,'servings',name);assert.equal(p.householdScaling,true);assert.equal(p.defaultBatchCount,null);
 }
 for(const name of ['수육 & 무김치','수육, 보쌈김치','봄동 겉절이','치즈케이크'])assert.equal(proposeCalculationBasis({id:'sample',name}).mode,'pending',name);
 assert.equal(proposeCalculationBasis({id:'mincook-blog-226',name:'베트남식 장조림 (팃 코 따우)'}).mode,'batch');
});
