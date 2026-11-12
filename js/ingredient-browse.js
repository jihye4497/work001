import { CATEGORIES, quickPickIngredients } from './ingredients.js';
export const BROWSE_CATEGORIES=['농산물','육·수산','기타','양념'];
const SEAWEED=new Set(['김','미역','다시마','파래','매생이','톳','청각','감태','곰피','모자반']);
const GRAINS=new Set(['쌀','현미','잡곡','찹쌀','보리','귀리','흑미','수수','기장','조','율무','퀴노아','검은콩','팥','녹두','콩']);
export function browseCategory(ingredient) {
  if(SEAWEED.has(ingredient.name))return '육·수산';
  if(ingredient.isSeasoning)return '양념';
  if(GRAINS.has(ingredient.name)||ingredient.category==='채소·버섯')return '농산물';
  if(ingredient.category==='육류·해산물')return '육·수산';
  return '기타';
}
export function browseIngredients(ingredients,category) {
  const preferred=['사과','배','귤','포도','딸기','바나나','쌀','현미','잡곡','김','미역','다시마'];
  const originals=CATEGORIES.flatMap(c=>quickPickIngredients(ingredients,c));
  const candidates=[...originals,...preferred.map(name=>ingredients.find(i=>i.name===name)).filter(Boolean)];
  return [...new Map(candidates.filter(i=>browseCategory(i)===category).map(i=>[i.id,i])).values()];
}
export function koreaMonth(date=new Date()) {
  return Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',month:'numeric'}).format(date));
}
const FARM_SOURCE='https://foodnuri.go.kr/portal/bbs/B0000299/view.do?menuNo=300106&nttId=235074';
const FISH_SOURCE='https://info.childcare.go.kr/info_html5/pnis/search/PnisFileDownload.jsp?STCODE=46820000006&flag=DNLL&wkyymm=202511';
// Only months checked against published official material are enabled; no price claim.
export const SEASONAL_RECORDS=[
  {months:[11],names:['배추','무','포도'],source:FARM_SOURCE,sourceName:'농식품정보누리 · 11월 제철 농산물'},
  {months:[11],names:['굴','대구','홍합'],source:FISH_SOURCE,sourceName:'어린이집정보공개포털 · 11월 제철 식재료 안내'},
  {months:[9],names:['고구마','배','표고버섯'],source:'https://m.foodnuri.go.kr/portal/bbs/B0000284/view.do?menuNo=300054&nttId=235010',sourceName:'농식품정보누리 · 9월 제철 농식품'}
];
export function seasonalIngredients(ingredients,month=koreaMonth()) {
  const records=SEASONAL_RECORDS.filter(r=>r.months.includes(month));
  const names=new Set(records.flatMap(r=>r.names));
  return {month,items:ingredients.filter(i=>names.has(i.name)),sources:records.map(r=>({url:r.source,name:r.sourceName}))};
}
