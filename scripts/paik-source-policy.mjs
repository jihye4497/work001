import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

// Offline evidence from the channel's public Shorts tab. Duration is not a format test.
const formats=JSON.parse(await readFile(new URL('../data/source/paik-video-formats.json',import.meta.url),'utf8'));
assert.equal(formats.channelId,'UCyn-K7rZLXjGl7VXGweIlcA');
assert.equal(formats.completeShortsTraversal,true);
assert.ok(Array.isArray(formats.entries));
assert.equal(new Set(formats.entries.map(e=>e.videoId)).size,formats.entries.length);
assert.ok(formats.entries.every(e=>/^[\w-]{11}$/.test(e.videoId)&&['short','not-listed-as-short'].includes(e.videoFormat)));
const shortIds=new Set(formats.entries.filter(e=>e.videoFormat==='short').map(e=>e.videoId));
const auditedIds=new Set(formats.entries.map(e=>e.videoId));

export function isShortVideo(videoId,sourceUrl=''){
 if(shortIds.has(videoId))return true;
 try{
  const url=new URL(sourceUrl);
  return ['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)&&url.pathname.startsWith('/shorts/');
 }catch{return false;}
}
export function assertNotShortVideo(videoId,sourceUrl=''){
 assert.ok(!isShortVideo(videoId,sourceUrl),`쇼츠는 등록 대상에서 제외합니다: ${videoId}`);
 assert.ok(auditedIds.has(videoId),`먼저 채널 Shorts 목록과 대조해 주세요: ${videoId}`);
}
