import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {batch50,skips} from './paik-batch-remaining-policy.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const write=(p,v)=>writeFile(new URL('../'+p,import.meta.url),JSON.stringify(v,null,2)+'\n');
const index=await read('data/source/paik-playlist-candidates.json');
const review=await read('data/source/paik-batch-remaining-review.json');
const recipes=await read('data/recipes.json');
const selected=new Set(batch50.map(r=>r[0]));
const current=new Map(recipes.filter(r=>r.id.startsWith('paik-')).map(r=>[r.id.slice(5),r]));
const pending=new Map(skips.map(r=>[r.videoId,r.reason]));
const sourceRows=new Map([...review.entries,...(review.held??[])].map(e=>[e.videoId,e]));
assert.equal(index.completePublicTraversal,true);
const entries=index.entries.map(e=>{
 const status=selected.has(e.videoId)?'added':current.has(e.videoId)?'existing':'pending';
 const source=sourceRows.get(e.videoId);
 return {videoId:e.videoId,sourceTitle:e.title,sourceUrl:'https://www.youtube.com/watch?v='+e.videoId,status,
  ...(status==='pending'?{reason:pending.get(e.videoId)??source?.reason??source?.heldReason??'원본 재료표·사용 분량 추가 확인 필요'}:{recipeId:'paik-'+e.videoId}),
  ...(status==='pending'&&(source?.sourceAccessIssue||source?.heldReason?.includes('429'))?{sourceAccessIssue:source.sourceAccessIssue??'추가 원문 확인 시 YouTube HTTP 429 요청 제한 발생'}:{})};
});
assert.equal(new Set(entries.map(e=>e.videoId)).size,entries.length);
const counts=Object.fromEntries(['existing','added','pending'].map(status=>[status,entries.filter(e=>e.status===status).length]));
assert.equal(counts.added,selected.size);
assert.equal(Object.values(counts).reduce((n,v)=>n+v,0),entries.length);
if(process.argv.includes('--write')){
 review.note='남은 공개 재생목록 전체 대조. 검수 가능한 레시피를 일괄 등록하고 원재료 분해 불명확·원문 확인 실패 항목은 보류. 사진·조리 문장 미사용.';
 review.held=entries.filter(e=>e.status==='pending').map(({status,...e})=>e);
 await write('data/source/paik-batch-remaining-review.json',review);
 await write('data/source/paik-playlist-coverage.json',{schemaVersion:1,checkedOn:'2026-11-23',playlistUrl:index.playlistUrl,publicVideoCount:entries.length,completePublicTraversal:true,scope:'공개 영상 목록의 대조 완료를 의미하며, 모든 영상의 레시피 등록 완료를 뜻하지 않음. 한 영상의 여러 대체 조리법은 검수한 대표 버전으로 등록.',counts,entries});
}
console.log(JSON.stringify({publicVideoCount:entries.length,...counts,write:process.argv.includes('--write')}));
