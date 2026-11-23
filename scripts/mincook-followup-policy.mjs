// First follow-up: keep source 1~1.5 servings, use 1 serving by explicit user instruction.
export const batch50=[['blog-15','청국장찌개',1,'찌개','한식 국·찌개',[1,1.5]]];
export const servingsOverrides={
 'blog-15':{status:'explicit',rangeBasis:'user-confirmed-min',evidence:'원문 전체 1~1.5인분은 그대로 표시. 2026-11-23 사용자 지시로 재료표 전량을 계산 기준 1인분으로 사용. 원문 범위와 사용자 지정 계산 기준을 구분.'}
};
const rows=[
 ['참기름 : 1숟가락','참기름',1,'숟가락'],['다진 소고기 : 100g (약 3숟가락)','소고기 다짐육',100,'g'],
 ['된장 : 1숟가락','된장',1,'숟가락'],['고춧가루 : 1숟가락','고춧가루',1,'숟가락'],['표고버섯 : 15g','표고버섯',15,'g'],
 ['무 : 100g','무',100,'g'],['양파 : 80g','양파',80,'g'],['물 : 종이컵 1컵 (180ml)','물',180,'ml'],
 ['청양고추 : 7g','청양고추',7,'g'],['홍고추 : 7g','홍고추',7,'g'],['마늘 : 20g','마늘',20,'g'],['생 청국장 : 80g','생청국장',80,'g'],
 ['애호박 : 60g','애호박',60,'g'],['다진 김치 : 2숟가락 (40g)','김치',40,'g'],['김칫국물 : 1숟가락','김치국물',1,'숟가락'],
 ['국간장 : 1숟가락','국간장',1,'숟가락'],['두부 : 150g','두부',150,'g'],['멸치액젓 : 1숟가락','멸치액젓',1,'숟가락'],
 ['멸치 다시다 : 0.3숟가락','멸치다시다',0.3,'숟가락'],['팽이버섯 : 50g','팽이버섯',50,'g'],['대파 : 70g','대파',70,'g'],['고춧가루 : 1숟가락','고춧가루',1,'숟가락']
];
export const ingredientText=rows.map(row=>row[0]).join('\n');
export const lineOverrides={'blog-15':Object.fromEntries(rows.map(([sourceText,name,sourceAmount,unit])=>[sourceText,{name,sourceAmount,unit}]))};
export function prepareText(entry){
 entry.nameSource='official-blog';entry.nameSourceText='청국장 찌개 레시피';
 return entry.ingredientText;
}
