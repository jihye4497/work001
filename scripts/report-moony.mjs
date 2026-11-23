import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {batch50,skips} from './moony-policy.mjs';
import {applyPendingReviewPolicy} from './pending-review-policy.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const write=(p,v)=>writeFile(new URL('../'+p,import.meta.url),JSON.stringify(v,null,2)+'\n');
const index=await read('data/source/moony-video-index.json');
const review=await read('data/source/moony-review.json');
const recipes=await read('data/recipes.json');
assert.equal(index.completePublicTraversal,true);
assert.equal(index.channelId,'UCQg7opkHC1IIHYsIRuivMbw');
assert.ok(Array.isArray(index.entries)&&index.entries.length>0);
const selected=new Set(batch50.map(r=>r[0]));
assert.equal(selected.size,batch50.length,'선정 영상 ID가 중복되어 있어요.');
for(const id of selected)assert.ok(index.entries.some(e=>e.videoId===id),`선정 영상이 공개 목록에 없어요: ${id}`);
const decisions=new Map(skips.map(e=>[e.videoId,e]));
const sourceRows=new Map([...review.entries,...(review.held??[]),...(review.excluded??[])].map(e=>[e.videoId,e]));
const entries=applyPendingReviewPolicy(index.entries.map(e=>{
 const source=sourceRows.get(e.videoId);const decision=decisions.get(e.videoId);
 const status=e.videoFormat==='short'?'excluded-short':decision?.status?.startsWith('excluded-')?decision.status:selected.has(e.videoId)?'registered':'pending';
 const reason=status==='excluded-short'?'채널 Shorts 탭 또는 원본 영상 메타에서 쇼츠로 확인되어 등록 대상에서 제외.':decision?.reason??source?.originalReason??source?.reason??source?.heldReason??'원본 재료·사용 분량 추가 확인 필요';
 return {videoId:e.videoId,sourceTitle:e.title,sourceUrl:'https://www.youtube.com/watch?v='+e.videoId,sourceName:e.sourceName??source?.sourceName??null,channelId:e.channelId??source?.channelId??null,playlistIds:e.playlistIds??[],playlistTitles:e.playlistTitles??[],videoFormat:e.videoFormat,status,...(status==='registered'?{recipeId:'moony-'+e.videoId,descriptionMenuName:source?.descriptionMenuName??null}:{reason}),...(decision?.duplicateOf?{duplicateOf:decision.duplicateOf}:{}),...(source?.recipeLinks?{recipeLinks:source.recipeLinks}:{})};
}));
assert.equal(new Set(entries.map(e=>e.videoId)).size,entries.length);
const statuses=['registered','pending','excluded-short','excluded-duplicate','excluded-nonrecipe','excluded-other-channel','excluded-policy'];
assert.ok(entries.every(e=>statuses.includes(e.status)));
const counts=Object.fromEntries(statuses.map(s=>[s,entries.filter(e=>e.status===s).length]));
assert.equal(counts.registered,selected.size);assert.equal(Object.values(counts).reduce((n,v)=>n+v,0),entries.length);
for(const entry of entries.filter(e=>e.status==='excluded-nonrecipe')){
 assert.equal(entry.channelId,index.channelId,'안내 영상 제외도 실제 원본 확인이 필요합니다.');
 assert.equal(entry.videoFormat,'long-form','형식 미확인 영상을 제목만 보고 안내 영상으로 제외하지 않습니다.');
}
for(const r of recipes.filter(r=>r.id.startsWith('moony-')))assert.ok(entries.some(e=>e.recipeId===r.id));
if(process.argv.includes('--write')){
 review.note='사용자 지정 채널 공개 재생목록 전체 대조. 메뉴명은 영상 정보란에서 확인하고 원본 재료 사실만 검수한다. 쇼츠·명백한 중복은 제외하며 미확인 재료표·사용 비율은 보류. 사진·조리 문장 미사용.';
 review.held=entries.filter(e=>e.status==='pending').map(({status,...e})=>e);
 review.excluded=entries.filter(e=>e.status.startsWith('excluded-'));
 await write('data/source/moony-review.json',review);
 await write('data/source/moony-coverage.json',{schemaVersion:1,checkedOn:'2026-11-23',channelId:index.channelId,sourceName:index.sourceName,sourceUrl:index.sourceUrl,completePublicTraversal:true,completeShortsTraversal:index.completeShortsTraversal===true,publicShortsCount:index.publicShortsCount,publicVideoCount:entries.length,counts,scope:'사용자 지정 채널의 공개 재생목록 기준. 메뉴명은 정보란에서 확인하고 사진·조리 문장을 복제하지 않으며 원본 재료 사실을 대조한 메뉴만 등록. 모든 영상의 레시피 등록 완료를 뜻하지 않음.',entries});
}
console.log(JSON.stringify({publicVideoCount:entries.length,...counts,write:process.argv.includes('--write')}));
