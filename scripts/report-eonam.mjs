import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {batch50,skips} from './eonam-policy.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const write=(p,v)=>writeFile(new URL('../'+p,import.meta.url),JSON.stringify(v,null,2)+'\n');
const index=await read('data/source/eonam-video-index.json');
const review=await read('data/source/eonam-review.json');
const recipes=await read('data/recipes.json');
assert.equal(index.completePublicTraversal,true);
const selected=new Set(batch50.map(r=>r[0]));
const decisions=new Map(skips.map(e=>[e.videoId,e]));
const sourceRows=new Map([...review.entries,...(review.held??[]),...(review.excluded??[])].map(e=>[e.videoId,e]));
const entries=index.entries.map(e=>{
 const source=sourceRows.get(e.videoId);const decision=decisions.get(e.videoId);
 const status=e.videoFormat==='short'?'excluded-short':decision?.status?.startsWith('excluded-')?decision.status:selected.has(e.videoId)?'registered':'pending';
 const reason=status==='excluded-short'?'원본 영상 메타에서 쇼츠로 확인되어 등록 대상에서 제외.':decision?.reason??source?.reason??source?.heldReason??'원본 재료·사용 분량 추가 확인 필요';
 return {videoId:e.videoId,sourceTitle:e.title,sourceUrl:'https://www.youtube.com/watch?v='+e.videoId,sourceName:e.sourceName??source?.sourceName??null,channelId:e.channelId??source?.channelId??null,videoFormat:e.videoFormat,status,...(status==='registered'?{recipeId:'eonam-'+e.videoId}:{reason}),...(decision?.duplicateOf?{duplicateOf:decision.duplicateOf}:{}),...(source?.recipeLinks?{recipeLinks:source.recipeLinks}:{})};
});
assert.equal(new Set(entries.map(e=>e.videoId)).size,entries.length);
const statuses=['registered','pending','excluded-short','excluded-duplicate','excluded-nonrecipe'];
assert.ok(entries.every(e=>statuses.includes(e.status)));
const counts=Object.fromEntries(statuses.map(s=>[s,entries.filter(e=>e.status===s).length]));
assert.equal(counts.registered,selected.size);assert.equal(Object.values(counts).reduce((n,v)=>n+v,0),entries.length);
for(const r of recipes.filter(r=>r.id.startsWith('eonam-')))assert.ok(entries.some(e=>e.recipeId===r.id));
if(process.argv.includes('--write')){
 review.note='사용자 지정 공개 재생목록 전체 대조. 원본 재료 사실만 검수하고 쇼츠·명백한 중복은 제외. 미확인 재료표·사용 비율은 보류. 사진·조리 문장 미사용.';
 review.held=entries.filter(e=>e.status==='pending').map(({status,...e})=>e);
 review.excluded=entries.filter(e=>e.status.startsWith('excluded-'));
 await write('data/source/eonam-review.json',review);
 await write('data/source/eonam-coverage.json',{schemaVersion:1,checkedOn:'2026-11-23',playlistUrl:index.playlistUrl,playlistTitle:index.playlistTitle,completePublicTraversal:true,publicVideoCount:entries.length,counts,scope:'사용자 지정 공개 재생목록 기준. 사진·조리 문장을 복제하지 않고 원본 재료 사실을 대조한 메뉴만 등록. 모든 영상의 레시피 등록 완료를 뜻하지 않음.',entries});
}
console.log(JSON.stringify({publicVideoCount:entries.length,...counts,write:process.argv.includes('--write')}));
