import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {batch50,skips} from './caden-policy.mjs';
import {applyPendingReviewPolicy} from './pending-review-policy.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const write=(p,v)=>writeFile(new URL('../'+p,import.meta.url),JSON.stringify(v,null,2)+'\n');
const index=await read('data/source/caden-video-index.json');
const review=await read('data/source/caden-review.json');
const recipes=await read('data/recipes.json');
assert.equal(index.completePublicTraversal,true);assert.equal(index.completeShortsTraversal,true);
assert.equal(index.channelId,'UCWyjY6ykM58LO5ipzRgIzGA');
const selected=new Set(batch50.map(r=>r[0]));
const reasons=new Map(skips.map(e=>[e.videoId,e.reason]));
const sourceRows=new Map([...review.entries,...(review.held??[]),...(review.excluded??[])].map(e=>[e.videoId,e]));
const entries=applyPendingReviewPolicy(index.entries.map(e=>{
 const source=sourceRows.get(e.videoId);
 const status=e.videoFormat==='short'?'excluded-short':source?.channelId&&source.channelId!==index.channelId?'excluded-other-channel':selected.has(e.videoId)?'registered':'pending';
 const reason=status==='excluded-short'?'사용자 요청에 따라 쇼츠는 수집·등록 대상에서 제외.':status==='excluded-other-channel'?'다른 채널의 영상. 해당 채널의 레시피로 등록하지 않음.':reasons.get(e.videoId)??source?.originalReason??source?.reason??source?.heldReason??'원본 재료·분량 추가 확인 필요';
 return {videoId:e.videoId,sourceTitle:e.title,sourceUrl:'https://www.youtube.com/watch?v='+e.videoId,playlistIds:e.playlistIds,playlistTitles:e.playlistTitles,videoFormat:e.videoFormat,status,...(status==='registered'?{recipeId:'caden-'+e.videoId}:{reason}),...(source?.channelId?{channelId:source.channelId}:{})};
}));
assert.equal(new Set(entries.map(e=>e.videoId)).size,entries.length);
const counts=Object.fromEntries(['registered','pending','excluded-short','excluded-other-channel','excluded-policy'].map(s=>[s,entries.filter(e=>e.status===s).length]));
assert.equal(counts.registered,selected.size);assert.equal(Object.values(counts).reduce((n,v)=>n+v,0),entries.length);
for(const r of recipes.filter(r=>r.id.startsWith('caden-')))assert.ok(entries.some(e=>e.recipeId===r.id));
if(process.argv.includes('--write')){
 review.note='공개 재생목록의 쇼츠·중복 영상을 제외하고 원본 재료 사실을 검수. 사진·조리 문장 미사용. 불명확한 분량과 미확인 재료표는 보류.';
 review.held=entries.filter(e=>e.status==='pending').map(({status,...e})=>e);
 review.excluded=entries.filter(e=>e.status.startsWith('excluded-')).map(e=>e);
 await write('data/source/caden-review.json',review);
 await write('data/source/caden-coverage.json',{schemaVersion:1,checkedOn:'2026-11-23',channelId:index.channelId,sourceName:index.sourceName,sourceUrl:index.sourceUrl,completePublicTraversal:true,publicVideoCount:entries.length,counts,scope:'채널 공개 재생목록들의 중복 제거 목록 기준. Shorts는 제외. 모든 영상의 레시피 등록 완료를 뜻하지 않으며, 영상 내 여러 요리는 검수한 대표 요리로 등록.',entries});
}
console.log(JSON.stringify({publicVideoCount:entries.length,...counts,write:process.argv.includes('--write')}));
