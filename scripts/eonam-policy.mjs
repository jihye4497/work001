import * as a from './eonam-a-policy.mjs';
import * as b from './eonam-b-policy.mjs';
const policies=[a,b];
export const batch50=policies.flatMap(p=>p.batch50);
const owner=id=>policies.find(p=>p.batch50.some(r=>r[0]===id));
export const canonicalOverrides=Object.assign({},...policies.map(p=>p.canonicalOverrides));
export const definitions=[...new Map(policies.flatMap(p=>p.definitions??[]).map(row=>[row[1].normalize('NFKC').replace(/\s/g,''),row])).values()];
export const intermediateRows=new Map(policies.flatMap(p=>[...(p.intermediateRows??new Map())]));
export const groupPolicy=(id,g)=>owner(id)?.groupPolicy?.(id,g)??{scale:1};
export const lineOverrides=Object.assign({},...policies.map(p=>p.lineOverrides));
export function prepareText(e){
 const p=owner(e.videoId);const text=p?.prepareText?.(e)??e.ingredientText;
 Object.assign(lineOverrides,p?.lineOverrides??{});return text;
}
export const servingsOverrides=Object.assign({},...policies.map(p=>p.servingsOverrides));
export const skips=policies.flatMap(p=>p.skips??[]);
