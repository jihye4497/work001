import * as a from './moony-a-policy.mjs';
import * as b from './moony-b-policy.mjs';
import * as followup from './moony-followup-policy.mjs';
import * as third from './moony-batch-03-policy.mjs';

const policies=[a,b,followup,third];
export const batch50=policies.flatMap(p=>p.batch50);
const owner=id=>policies.find(p=>p.batch50.some(row=>row[0]===id));
export const canonicalOverrides=Object.assign({},...policies.map(p=>p.canonicalOverrides));
export const definitions=[...new Map(policies.flatMap(p=>p.definitions??[]).map(row=>[row[1].normalize('NFKC').replace(/\s/g,''),row])).values()];
export const intermediateRows=new Map(policies.flatMap(p=>[...(p.intermediateRows??new Map())]));
export const lineOverrides=Object.assign({},...policies.map(p=>p.lineOverrides));
export const servingsOverrides=Object.assign({},...policies.map(p=>p.servingsOverrides));
export const skips=policies.flatMap(p=>p.skips??[]);
export const groupPolicy=(id,group)=>owner(id)?.groupPolicy?.(id,group)??{scale:1};
export function prepareText(entry){
 const policy=owner(entry.videoId);
 const text=policy?.prepareText?.(entry)??entry.ingredientText;
 Object.assign(lineOverrides,policy?.lineOverrides??{});
 return text;
}
