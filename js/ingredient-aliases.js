// User-reviewed equivalences only. Fresh/dried/powder/liquid and distinct products stay separate.
export const INGREDIENT_ALIAS_GROUPS=[
 {name:'양파',aliases:['다진 양파','깐양파','양파다진것','양파채썬것','양파작게자른것','간 양파','채 썬 양파'],note:'원문 손질 상태 유지'},
 {name:'생강',aliases:['통생강','깐생강','얇게 썬 생강','다진 생강','생강다진것'],note:'원문 손질 상태 유지'},
 {name:'파프리카',aliases:['다진 파프리카','2가지색 파프리카','두 가지 색 파프리카','삼색파프리카'],note:'원문 색상·손질 요구 유지'},
 {name:'미니파프리카',aliases:['2가지색 미니파프리카'],note:'두 가지 색 사용'},
 {name:'빨강 파프리카',aliases:['홍파프리카','빨간 파프리카','적파프리카','붉은 파프리카']},
 {name:'노랑 파프리카',aliases:['황파프리카','노란 파프리카','노란색 파프리카','다진 파프리카(노랑)']},
 {name:'로즈마리',aliases:['로즈메리','로즈마리다진것','로즈마리마다진것'],note:'다진 표기·오타 해석은 사용자 승인'},
 {name:'건로즈마리',aliases:['건로즈메리','로즈마리마른것']},
 {name:'바질',aliases:['바질잎','바질다진것']},
 {name:'건바질',aliases:['바질마른것']},
 {name:'파르메산 치즈',aliases:['파마산치즈','간 파르메산치즈'],note:'갈아서 사용한 원문 형태 유지'},
 {name:'파르메산 치즈가루',aliases:['파마산치즈가루','파마산가루']},
 {name:'호두',aliases:['다진 호두'],note:'칼로 다진 손질 정보는 원문에 유지'},
 {name:'볶은 호두',aliases:['구운 호두']},
 {name:'밤',aliases:['깐밤']},
 {name:'거피들깨가루',aliases:['거피한 들깨가루']},
 {name:'미소된장',aliases:['일본된장','일식된장','일식된장 미소']},
 {name:'고추냉이',aliases:['고추냉이 갠것']},
 {name:'가다랑어포',aliases:['가쓰오부시','가쯔오부시','가츠오부시']},
 {name:'사과',aliases:['굵게 다진 사과']},
 {name:'레몬껍질',aliases:['레몬(껍질)']},
 {name:'건미역',aliases:['건조미역','미역마른것','마른 미역']}
];
const compact=name=>name?.normalize('NFKC').replace(/\s/g,'');
const aliases=new Map(INGREDIENT_ALIAS_GROUPS.flatMap(group=>group.aliases.map(name=>[compact(name),group.name])));
const bases=new Map(INGREDIENT_ALIAS_GROUPS.map(group=>[compact(group.name),group.name]));
export function canonicalIngredientName(ingredient) {return aliases.get(compact(ingredient?.name))||bases.get(compact(ingredient?.name))||null;}
export function isIngredientAlias(ingredient) {return aliases.has(compact(ingredient?.name));}
// Exact reviewed cooking-water label only; preserve its raw recipe amount and purpose.
export function isCookingWater(ingredient) {return ['물','생수','건표고버섯불릴물'].includes(compact(ingredient?.name));}
