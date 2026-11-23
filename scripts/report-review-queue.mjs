import {readFile,writeFile} from 'node:fs/promises';
import {SIMPLIFIED_REVIEW_POLICY} from './pending-review-policy.mjs';
const channels=['paik-playlist','caden','eonam','moony','mincook'];
const entries=[],summary=[];
for(const channel of channels){
 const coverage=JSON.parse(await readFile(new URL(`../data/source/${channel}-coverage.json`,import.meta.url),'utf8'));
 const pending=coverage.entries.filter(e=>e.status==='pending');
 const access=entry=>entry.reviewState==='access-unverified'||/429|요청 제한|원본 확인 미실행/.test(entry.reason??'');
 summary.push({channel,pending:pending.length,excludedByPolicy:coverage.entries.filter(e=>e.status==='excluded-policy').length,sourceAccessUnverified:pending.filter(access).length,editorialReview:pending.filter(e=>!access(e)).length});
 for(const entry of pending)entries.push({channel,sourceId:entry.videoId??entry.sourceId,sourceTitle:entry.sourceTitle,sourceUrl:entry.sourceUrl,reason:entry.reason,reviewType:access(entry)?'source-access-unverified':entry.reviewState==='awaiting-user'?'awaiting-user':/인분.*근거|인분.*범위/.test(entry.reason)?'servings-review':'source-detail-review'});
}
const order={'servings-review':0,'source-detail-review':1,'awaiting-user':2,'source-access-unverified':3};
entries.sort((a,b)=>order[a.reviewType]-order[b.reviewType]||channels.indexOf(a.channel)-channels.indexOf(b.channel));
const result={schemaVersion:1,checkedOn:SIMPLIFIED_REVIEW_POLICY.checkedOn,policy:SIMPLIFIED_REVIEW_POLICY,summary,totals:summary.reduce((total,row)=>{for(const k of ['pending','excludedByPolicy','sourceAccessUnverified','editorialReview'])total[k]=(total[k]??0)+row[k];return total;},{}),batchSize:20,nextBatch:entries.filter(e=>!['source-access-unverified','awaiting-user'].includes(e.reviewType)).slice(0,20),entries};
if(process.argv.includes('--write'))await writeFile(new URL('../data/source/recipe-review-queue.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({totals:result.totals,summary,nextBatch:result.nextBatch.map(e=>({channel:e.channel,title:e.sourceTitle,reason:e.reason}))},null,2));
