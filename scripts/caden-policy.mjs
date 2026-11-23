import * as a from './caden-a-policy.mjs';
import * as b from './caden-b-policy.mjs';
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
 // Individual policies may build exact source-token overrides during preparation.
 Object.assign(lineOverrides,p?.lineOverrides??{});
 return text;
}
export const skips=policies.flatMap(p=>p.skips??[]);
// A portion count on rice/noodles is not an explicit yield for the whole dish.
export const servingsOverrides={
 VOLdYvZKGYk:{status:'estimated',evidence:'원문 밥 2인분 및 우삼겹 300g의 전체 구성을 2인분으로 편집 추정(2026-11-23 사용자 승인). 밥의 인분 표기이며 요리 전체 인분 명시는 아님.'},
 l5ctHOjWzg0:{status:'estimated',evidence:'원문 중화면 1인분과 다진 돼지고기 150g 구성을 1인분으로 편집 추정(2026-11-23 사용자 승인). 면의 인분 표기이며 요리 전체 인분 명시는 아님.'},
 ktUEcwWfPzU:{status:'estimated',evidence:'원문 엔젤헤어 파스타 2인분과 부재료의 전체 구성을 2인분으로 편집 추정(2026-11-23 사용자 승인). 면의 인분 표기이며 요리 전체 인분 명시는 아님.'},
 Nf64M49MMYk:{status:'estimated',evidence:'선택한 우삼겹 300g·카레 3조각·우동 사리 구성을 2인분으로 편집 추정(2026-11-23 사용자 승인). 별도 해산물 카레의 쌀 2인분 표기는 이 메뉴 인분의 근거로 사용하지 않음.'}
};
