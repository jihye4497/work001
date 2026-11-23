import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {batch50,skips} from './mincook-policy.mjs';
import {applyPendingReviewPolicy} from './pending-review-policy.mjs';

const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
const write=(path,value)=>writeFile(new URL('../'+path,import.meta.url),JSON.stringify(value,null,2)+'\n');
const index=await read('data/source/mincook-blog-index.json');
const review=await read('data/source/mincook-review.json');
const recipes=await read('data/recipes.json');
assert.equal(index.completePublicTraversal,true,'공식 블로그 공개 목록을 끝까지 확인해 주세요.');
assert.ok(Array.isArray(index.entries)&&index.entries.length>0);
function blogArticleId(sourceUrl){
 try{
  const url=new URL(sourceUrl);
  if(url.protocol==='https:'&&url.hostname==='chef-choice.tistory.com'&&/^\/\d+\/?$/.test(url.pathname)&&!url.search&&!url.hash)return url.pathname.split('/')[1];
 }catch{}
 return null;
}
const previousArticles=new Map(recipes.filter(recipe=>!recipe.id.startsWith('mincook-blog-')).map(recipe=>[blogArticleId(recipe.sourceUrl),recipe]).filter(([id])=>id));
const selected=new Map(batch50.map(row=>[row[0],row]));
assert.equal(selected.size,batch50.length,'선정 출처 ID가 중복되어 있어요.');
assert.equal(new Set(index.entries.map(entry=>entry.sourceId)).size,index.entries.length,'공개 목록의 출처 ID가 중복되어 있어요.');
for(const sourceId of selected.keys())assert.ok(index.entries.some(entry=>entry.sourceId===sourceId),`선정 게시글이 공개 목록에 없어요: ${sourceId}`);
const decisions=new Map(skips.map(entry=>[entry.sourceId,entry]));
const sourceRows=new Map([...(review.held??[]),...(review.excluded??[]),...(review.existing??[]),...review.entries].map(entry=>[entry.sourceId,entry]));
const entries=applyPendingReviewPolicy(index.entries.map(indexed=>{
 const articleId=String(indexed.articleId),sourceId=indexed.sourceId;
 assert.equal(sourceId,`blog-${articleId}`);
 assert.equal(blogArticleId(indexed.url),articleId,'공식 블로그 게시글 번호와 원본 주소가 달라요.');
 const source=sourceRows.get(sourceId),decision=decisions.get(sourceId),previous=previousArticles.get(articleId);
 const status=previous?'existing':decision?.status?.startsWith('excluded-')?decision.status:selected.has(sourceId)?'registered':'pending';
 const reason=decision?.reason??source?.originalReason??source?.reason??source?.heldReason??'공식 블로그의 원본 재료·사용 분량 추가 확인 필요';
 return {sourceId,articleId,sourceKind:'official-blog',sourceTitle:source?.sourceTitle??indexed.sourceTitle??indexed.title??null,sourceUrl:indexed.url,sourceName:source?.sourceName??index.sourceName??'1분요리 뚝딱이형',status,
  ...(status==='registered'?{recipeId:`mincook-${sourceId}`,name:source?.name??selected.get(sourceId)[1],nameSource:source?.nameSource??null}:status==='existing'?{recipeId:previous.id,reason:'같은 공식 블로그 원본으로 이미 등록한 메뉴를 유지하며 중복 생성하지 않음.'}:{reason}),
  ...(decision?.duplicateOf?{duplicateOf:decision.duplicateOf}:{})};
}));
const statuses=['registered','existing','pending','excluded-duplicate','excluded-nonrecipe','excluded-policy'];
assert.ok(entries.every(entry=>statuses.includes(entry.status)),'출처 상태를 확인해 주세요.');
const counts=Object.fromEntries(statuses.map(status=>[status,entries.filter(entry=>entry.status===status).length]));
assert.equal(counts.registered,selected.size);
assert.equal(Object.values(counts).reduce((total,count)=>total+count,0),entries.length);
for(const recipe of recipes.filter(recipe=>recipe.id.startsWith('mincook-blog-')))assert.ok(entries.some(entry=>entry.recipeId===recipe.id));
if(process.argv.includes('--write')){
 review.note='사용자가 별도 출처로 승인한 채널 공식 블로그 공개 목록 전체 대조. 원본 메뉴명·재료 사실만 검수하며 사진·조리 문장은 복제하지 않는다. YouTube 영상과의 연결을 임의 생성하지 않고 공식 블로그 개별 게시글로 출처를 연결한다. 미확인 재료표·분량은 보류하고 기존 원본은 중복 등록하지 않는다.';
 review.held=entries.filter(entry=>entry.status==='pending').map(({status,...entry})=>entry);
 review.excluded=entries.filter(entry=>entry.status.startsWith('excluded-'));
 review.existing=entries.filter(entry=>entry.status==='existing');
 await write('data/source/mincook-review.json',review);
 await write('data/source/mincook-coverage.json',{schemaVersion:1,checkedOn:'2026-11-23',sourceKind:'official-blog',sourceName:index.sourceName??'1분요리 뚝딱이형',sourceUrl:'https://chef-choice.tistory.com/',playlistUrl:index.playlistUrl??'https://www.youtube.com/playlist?list=PLX6_obOL1a8lg1oU0NeEMdnfYLNrA_Gxq',completePublicTraversal:true,publicArticleCount:entries.length,counts,scope:'사용자가 별도 출처로 승인한 채널 공식 블로그 공개 게시글 기준. 원문 메뉴명·재료 사실만 대조하며 사진·조리 문장은 복제하지 않음. YouTube 재생목록 영상 전부를 레시피로 등록했다는 뜻이 아니며 영상 링크를 임의로 만들지 않음.',entries});
}
console.log(JSON.stringify({publicArticleCount:entries.length,...counts,write:process.argv.includes('--write')}));
