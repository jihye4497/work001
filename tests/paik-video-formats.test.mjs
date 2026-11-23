import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {isShortVideo,assertNotShortVideo} from '../scripts/paik-source-policy.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const formats=await read('data/source/paik-video-formats.json');
const candidates=await read('data/source/paik-playlist-candidates.json');
const recipes=await read('data/recipes.json');
const shortIds=['UPv4_6jEOfw','vr1CkOr9Huw','eKw9vkBKDB0','pQb5r01FXeY'];
const byId=new Map(formats.entries.map(e=>[e.videoId,e]));

test('video-format evidence covers every playlist ID once and excludes confirmed Shorts from registered recipes',()=>{
 assert.equal(formats.completeShortsTraversal,true);
 assert.equal(formats.channelId,'UCyn-K7rZLXjGl7VXGweIlcA');
 assert.equal(byId.size,formats.entries.length);
 assert.deepEqual(new Set(byId.keys()),new Set(candidates.entries.map(e=>e.videoId)));
 assert.equal(formats.entries.length,380);
 assert.deepEqual(new Set(formats.entries.filter(e=>e.videoFormat==='short').map(e=>e.videoId)),new Set(shortIds));
 for(const e of formats.entries){
  assert.ok(['short','not-listed-as-short'].includes(e.videoFormat),e.videoId);
  assert.ok(typeof e.evidence==='string'&&e.evidence.length>0,e.videoId);
 }
 for(const id of shortIds)assert.equal(recipes.some(r=>r.id===`paik-${id}`),false,id);
});

test('the long-form counterparts of matching titles are not excluded by a Shorts title match',()=>{
 for(const [shortId,longId] of [['UPv4_6jEOfw','bFX5lJgCPBQ'],['vr1CkOr9Huw','4RnCNlE1b6U']]){
  const title=id=>candidates.entries.find(e=>e.videoId===id)?.title;
  assert.equal(title(shortId),title(longId));
  assert.equal(byId.get(shortId).videoFormat,'short');
  assert.equal(byId.get(longId).videoFormat,'not-listed-as-short');
  assert.equal(isShortVideo(longId),false,longId);
  assert.doesNotThrow(()=>assertNotShortVideo(longId));
 }
});

test('registration guards reject confirmed Shorts even through watch URLs and reject future explicit Shorts links',()=>{
 for(const id of shortIds){
  const watch=`https://www.youtube.com/watch?v=${id}`;
  assert.equal(isShortVideo(id,watch),true,id);
  assert.throws(()=>assertNotShortVideo(id,watch));
 }
 const futureId='abcdefghijk',futureUrl=`https://www.youtube.com/shorts/${futureId}`;
 assert.equal(isShortVideo(futureId,futureUrl),true);
 assert.throws(()=>assertNotShortVideo(futureId,futureUrl));
 // A one-minute dish title is not evidence that the source is a Short.
 const ordinaryId='6e-IbuuD6ZU';
 assert.equal(byId.get(ordinaryId).videoFormat,'not-listed-as-short');
 assert.equal(isShortVideo(ordinaryId,`https://www.youtube.com/watch?v=${ordinaryId}`),false);
 assert.doesNotThrow(()=>assertNotShortVideo(ordinaryId));
 assert.equal(isShortVideo(futureId,`https://www.youtube.com/watch?v=${futureId}`),false);
});

test('coverage distinguishes excluded Shorts from pending recipes without losing any public playlist entry',async()=>{
 const coverage=await read('data/source/paik-playlist-coverage.json');
 const review=await read('data/source/paik-batch-remaining-review.json');
 const statuses=['existing','added','pending','excluded-short','excluded-user','excluded-policy'];
 assert.equal(coverage.entries.length,candidates.entries.length);
 assert.deepEqual(new Set(coverage.entries.map(e=>e.videoId)),new Set(candidates.entries.map(e=>e.videoId)));
 assert.equal(statuses.reduce((sum,status)=>sum+coverage.counts[status],0),coverage.entries.length);
 for(const status of statuses)assert.equal(coverage.counts[status],coverage.entries.filter(e=>e.status===status).length,status);
 const excluded=coverage.entries.filter(e=>e.status==='excluded-short');
 assert.deepEqual(new Set(excluded.map(e=>e.videoId)),new Set(shortIds));
 assert.deepEqual(new Set(review.excludedShorts.map(e=>e.videoId)),new Set(shortIds));
 assert.ok(review.held.every(e=>!shortIds.includes(e.videoId)));
 assert.ok(review.entries.every(e=>!shortIds.includes(e.videoId)));
 const userExcluded=coverage.entries.filter(e=>e.status==='excluded-user');
 assert.deepEqual(new Set(review.excludedByUser.map(e=>e.videoId)),new Set(userExcluded.map(e=>e.videoId)));
 for(const e of userExcluded){assert.ok(e.reason);assert.equal(e.recipeId,undefined);assert.ok(!review.held.some(x=>x.videoId===e.videoId));}
 for(const e of excluded){
  assert.ok(e.reason,e.videoId);
  assert.equal(e.recipeId,undefined,e.videoId);
 }
});
