import * as a from './mincook-a-policy.mjs';
import * as b from './mincook-b-policy.mjs';
import * as followup from './mincook-followup-policy.mjs';
import * as third from './mincook-batch-03-policy.mjs';
import * as fourth from './mincook-batch-04-policy.mjs';
import * as suyuk from './mincook-blog-91-correction.mjs';

const policies=[a,b,followup,third,fourth];
export const batch50=policies.flatMap(policy=>policy.batch50);
const suyukIndex=batch50.findIndex(row=>row[0]===suyuk.sourceId);
const suyukSelection=[suyuk.sourceId,'수육 & 무김치',suyuk.baseServings,'수육','한식 주메뉴'];
if(suyukIndex<0)batch50.push(suyukSelection);else batch50[suyukIndex]=suyukSelection;
const owner=id=>policies.find(policy=>policy.batch50.some(row=>row[0]===id));
export const canonicalOverrides=Object.assign({},...policies.map(policy=>policy.canonicalOverrides));
const key=name=>name.normalize('NFKC').replace(/\s/g,'');
// Review uncommon seafood/offal and fresh produce explicitly instead of relying
// on a name-fragment fallback to the miscellaneous category.
const seafoodAndMeat=new Set(['곤이','알','대구 이리','명태알','이리','소힘줄','수구레','우니','갈매기살','오만둥이','오돌뼈','소 늑간살','꽁치통조림'].map(key));
const produce=new Set(['초당옥수수','샤인머스켓','냉동 애플망고','생 애플망고','냉동 열대과일 믹스','말린 대추','하루 불린 콩'].map(key));
const reviewedDefinitions=policies.flatMap(policy=>policy.definitions??[]).map(row=>{
 const [id,name]=row;
 if(seafoodAndMeat.has(key(name)))return [id,name,'육류·해산물',false];
 if(produce.has(key(name)))return [id,name,'채소·버섯',false];
 if(key(name)===key('페이스트리 생지'))return [id,name,'두부·계란·기타',false];
 if(key(name)===key('몬트리올 스테이크 시즈닝'))return [id,name,'양념·조미료',true];
 return row;
});
export const definitions=[...new Map(reviewedDefinitions.map(row=>[key(row[1]),row])).values()];
export const intermediateRows=new Map(policies.flatMap(policy=>[...(policy.intermediateRows??new Map())]));
export const lineOverrides=Object.assign({},...policies.map(policy=>policy.lineOverrides));
lineOverrides[suyuk.sourceId]=suyuk.lineOverrides;
export const servingsOverrides=Object.assign({},...policies.map(policy=>policy.servingsOverrides));
servingsOverrides[suyuk.sourceId]={status:'estimated',evidence:suyuk.servingsEvidence};
export const skips=policies.flatMap(policy=>policy.skips??[]);
export const groupPolicy=(id,group)=>owner(id)?.groupPolicy?.(id,group)??{scale:1};
export function prepareText(entry){
 if(entry.sourceId===suyuk.sourceId){
  lineOverrides[suyuk.sourceId]=suyuk.lineOverrides;
  entry.nameSource='official-blog';entry.nameSourceText='수육 & 무김치';
  entry.servingsBasisLabel=suyuk.servingsBasisLabel;entry.accompanimentNote=suyuk.accompanimentNote;entry.components=suyuk.components;
  return suyuk.prepareText();
 }
 const policy=owner(entry.sourceId);
 const text=policy?.prepareText?.(entry)??entry.ingredientText;
 Object.assign(lineOverrides,policy?.lineOverrides??{});
 return text;
}
