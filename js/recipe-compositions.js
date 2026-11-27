// 2026-11-25 official blog tables + body ingredient facts rechecked.
// Keep original manufacturing quantities. Usage of the finished base is a link,
// never another purchase item or an invented conversion into raw ingredients.
const batch=(id,name,usesComponentId,quantityUnknown=false)=>({id,name,mode:'batch',...(usesComponentId?{usesComponentId}:{}),...(quantityUnknown?{quantityUnknown:true}:{})});
const fact=(ingredientId,componentId,note)=>({ingredientId,componentId,amount:null,unit:null,note:`원문 본문 재료: ${note} · 수량 미기재`});
export const COMPOSITION_REVIEWS={
 'mincook-blog-442':{
  name:'양지수육 & 평양냉면',
  components:[{id:'suyuk',name:'양지수육',mode:'servings'},batch('cold-noodles','평양냉면','suyuk',true)],
  groups:[['suyuk',0,7]],
  additional:[
   fact('mfds-ingredient-3ba1c580e487','cold-noodles','오이'),
   fact('mfds-ingredient-0bca21b1b662','cold-noodles','쌈무'),
   fact('mfds-ingredient-db39a8630179','cold-noodles','메밀 (본문: 메밀면)'),
   fact('mincook-ingredient-f96bdc5100d3','cold-noodles','계란 지단'),
   fact('dashida-seasoning','cold-noodles','다시다')
  ],
  note:'양지수육은 사용자 승인 생고기250g/인 기준으로12인분(추정)이에요. 평양냉면은 앞서 만든 수육과 육수를 활용하며, 그 사용량과 추가재료의 양은 원문에 없어 수량 미기재로 표시해요. 평양냉면을0회로 빼면 오이·쌈무·메밀면·계란 지단·다시다가 빠지고 양지수육 재료는 유지돼요.',
  excluded:'2026-11-27 사용자 승인 및 공식 블로그442 전체 공개본문 확인: 뒤쪽 평양냉면 재료표5행 누락 보완. 메밀은 본문 메밀면 표기 확인. 양지/육수는 앞선 조리물 연결로만 기록하여 중복구매하지 않음. 메인17인분 변경없음.'
 },
 'paik-1vfJqpklDSI':{
  name:'사과조림 & 토스트 & 프렌치토스트',
  components:[batch('apple','사과조림'),batch('toast','토스트','apple'),batch('french-toast','프렌치토스트','apple')],
  groups:[['apple',0,5]],
  additional:[
   {ingredientId:'mfds-ingredient-4af4045bfc6e',componentId:'toast',amount:1,unit:'개',note:'사용자 제공 원문(2026-11-27): 사과조림 토스트 · 식빵 1개'},
   {ingredientId:'mfds-ingredient-46b97d1a17c3',componentId:'toast',amount:10,unit:'g',note:'사용자 제공 원문(2026-11-27): 스틱버터 1/8개(10g)'},
   {ingredientId:'egg',componentId:'french-toast',amount:60,unit:'g',note:'사용자 제공 원문(2026-11-27): 달걀 1개(60g)'},
   {ingredientId:'mfds-ingredient-2b7e75051be2',componentId:'french-toast',amount:60,unit:'g',note:'사용자 제공 원문(2026-11-27): 우유 1/3컵(60g)'},
   {ingredientId:'mfds-ingredient-4af4045bfc6e',componentId:'french-toast',amount:1,unit:'개',note:'사용자 제공 원문(2026-11-27): 사과조림 프렌치토스트 · 식빵 1개'},
   {ingredientId:'salt',componentId:'french-toast',amount:1,unit:'꼬집',note:'사용자 제공 원문(2026-11-27): 소금 1꼬집'},
   {ingredientId:'mfds-ingredient-46b97d1a17c3',componentId:'french-toast',amount:20,unit:'g',note:'사용자 제공 원문(2026-11-27): 스틱버터(토스트용) 1/4개(20g)'},
   {ingredientId:'mfds-ingredient-46b97d1a17c3',componentId:'french-toast',amount:10,unit:'g',note:'사용자 제공 원문(2026-11-27): 스틱버터(토핑용) 1/8개(10g)'}
  ],
  note:'사과조림은 원문 전체1회 제조량이에요. 토스트와 프렌치토스트는 각각 식빵1개 기준이며 만든 사과조림을1큰술(30g)씩 사용해요. 완성 사과조림의 총중량이 없어 사과·설탕으로 다시 환산하지 않아요. 구성별0회로 빼면 그 구성의 재료만 빠져요.',
  excluded:'2026-11-27 사용자 제공 정보란 재료표 및 승인: 누락 토스트/프렌치토스트8행 보완, 사과조림30g씩2행은 제조물 연결로 보존해 별도 구매하지 않음. 직접 영상/정보란 재접근 검증과 구분.'
 },
 'mincook-blog-728':{
  name:'열무물김치 & 국수 & 비빔밥',
  components:[batch('kimchi','열무물김치'),batch('noodles','국수','kimchi',true),batch('rice','비빔밥','kimchi',true)],
  groups:[['kimchi',0,19],['noodles',19,21],['rice',22,23],['rice',24,28]],
  additional:[fact('mfds-ingredient-432965f9b47f','noodles','삶은 계란'),fact('sesame-seeds','noodles','참깨'),fact('sesame-seeds','rice','참깨')],
  note:'국수와 비빔밥은 만든 열무물김치를 활용해요. 원문에 없는 재료량과 김치 사용량은 추정하지 않아요. 각각0회로 빼도 김치 제조 재료는 유지되며, 김치를 이미 가지고 있다면 김치 제조를0회로 바꿀 수 있어요.',
  excluded:'활용요리에 적힌 열무김치2행은 만든 김치 연결로만 보존하고 별도 구매하지 않음. 본문 삶은계란/참깨 재료 보완.'
 },
 'mincook-blog-625':{
  name:'김치버터 & 볶음밥 & 샌드위치',
  components:[batch('butter','김치버터'),batch('rice','볶음밥','butter',true),batch('sandwich','샌드위치','butter',true)],
  groups:[['butter',0,6],['rice',6,9],['sandwich',9,14]],
  additional:[fact('oil','sandwich','소고기를 굽는 식용유')],
  note:'볶음밥과 샌드위치는 만든 김치버터를 활용해요. 원문에 없는 재료량과 버터 사용량은 추정하지 않아요. 활용요리를0회로 빼면 그 요리에만 필요한 재료가 빠지고 김치버터 제조량은 유지돼요.',
  excluded:'김치버터 자체6재료와 볶음밥/오픈샌드위치 재료 구분. 본문 소고기구이 식용유 미기재 보완.'
 },
 'mincook-blog-598':{
  name:'썬드라이토마토 & 샐러드파스타',
  components:[batch('tomato','썬드라이토마토'),batch('pasta','샐러드파스타','tomato',true)],
  groups:[['tomato',0,6],['pasta',6,13]],
  additional:[fact('salt','pasta','파스타를 삶는 소금')],
  note:'샐러드파스타는 만든 썬드라이토마토를 활용해요. 원문에 없는 파스타 재료량과 썬드라이토마토 사용량은 추정하지 않아요. 파스타를0회로 빼도 토마토 제조 재료는 유지돼요.',
  excluded:'토마토 자체6재료와 파스타7재료 구분. 본문 파스타삶는 소금 미기재 보완.'
 },
 'mincook-blog-623':{
  name:'만능 간장양념장 & 활용 반찬',
  components:[batch('sauce','간장양념장'),batch('bracken','고사리볶음','sauce'),batch('fishcake','어묵볶음','sauce'),batch('braise','메추리알 장조림','sauce'),batch('tofu','연두부양념장','sauce',true),batch('perilla','깻잎찌','sauce',true)],
  groups:[['sauce',0,8],['bracken',8,10],['fishcake',10,11],['braise',11,15],['tofu',15,17],['perilla',15,16]],
  additional:[fact('oil','bracken','고사리볶음 식용유'),fact('sesame-seeds','bracken','고사리볶음 참깨'),fact('oil','fishcake','어묵볶음 식용유'),fact('sesame-oil','fishcake','어묵볶음 참기름 (사용자 확인: 약간)'),fact('sesame-seeds','fishcake','어묵볶음 참깨 (사용자 확인: 약간)'),fact('sesame-oil','braise','메추리알 장조림 참기름 (사용자 확인: 약간)'),fact('sesame-seeds','braise','메추리알 장조림 참깨 (사용자 확인: 약간)'),fact('sesame-oil','perilla','깻잎찌 참기름 (사용자 확인: 약간)'),fact('sesame-seeds','perilla','깻잎찌 참깨 (사용자 확인: 약간)'),fact('mfds-ingredient-a1119fcde4c7','perilla','깻잎찌 간장')],
  note:'양념장 자체는1회 제조량이며 반찬과 각각 조절해요. 원문 양념장 사용량은 고사리볶음4숟가락, 어묵볶음3숟가락, 장조림150ml, 연두부는 남은 양념장, 깻잎찌는 깻잎2~3장 사이마다1숟가락이에요. 완성 양념장 총량이 없어 원재료로 다시 환산하지 않아요. 약간·수량미기재는 그대로 유지해요.',
  excluded:'2026-11-25 사용자 제공 수량으로 양념장1회제조+5반찬6구성 확정. 본문 식용유/고사리참깨/깻잎찌간장 미기재 보완, 완성양념장은 연결로만 보존하여 중복구매 방지.'
 }
};
export function composeRecipe(recipe){
 const review=COMPOSITION_REVIEWS[recipe.id];
 if(!review)return recipe;
 return {...recipe,components:review.components,accompanimentNote:review.note,
  ingredients:[...review.groups.flatMap(([componentId,start,end])=>recipe.ingredients.slice(start,end).map(i=>({...i,componentId}))),...review.additional.map(i=>({...i}))]};
}
