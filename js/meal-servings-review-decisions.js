// Explicit 2026-11-25 review decisions; never classify recipes by name at runtime.
// Only the original YouTube creator cohort with estimated servings >= 4 is in scope.
const sideIds=[
 'paik-7VNH9Fvvus0','paik-JrTVWvj8uhs','paik-0wqp-Ii5wQM','paik-3gQwydGHIG8',
 'paik-C_PYoYG1fWY','paik-EUdt9GjWj5c','paik-_m_HiEJukX4','paik-_qnLV46GSr4',
 'paik-bZWlQXGywRc','paik-aXJgN_JjYDg','paik-b0VqL4-dSPM','paik-xecKUiZBCtM',
 'paik-JmiW-dD1RqM','paik-2vrJR3ZpRf0','paik-tD8ApzPsDx8','paik-dXN1dlsYdJI',
 'paik-tHkbJgBUaiI','caden-2BvBrecFJS0','caden-6Ljb9ZqAmF8','caden-GpIMVmW20u0',
 'caden-shP5i5OJcj4','caden-SNimRYX9YaQ','caden-u3v0zLwySd4','caden-Z0NMTwkZVYM',
 'caden-X3If0w8Lh4A','caden-0GeQF6nLnt8','caden-QUQo8Js-ttQ',
 'eonam-tjaY3RjR38M','eonam-5GdYq4SEkjI','moony-cBBhf7BJdZI',
 'moony-vspl-Oy5bsk','moony-WSSLsGbwcJM','moony-relI8nAKNKw','moony-r-BA0P8uOkc',
 'mincook-blog-783','mincook-blog-749','mincook-blog-713','mincook-blog-694',
 'mincook-blog-681','mincook-blog-167','mincook-blog-163','mincook-blog-126',
 'mincook-blog-184','mincook-blog-154'
];
export const MEAL_REVIEW_BATCHES=Object.fromEntries(sideIds.map(id=>[id,{
 reason:'2026-11-25 사용자 승인: 반찬·즉석무침·샐러드도 식사인분 대신 원문 전체를1회 제조량으로 계산. 기존 추정인분은 원본기록에 보존.'
}]));
// The registered scope contains only the base stock/spread, not the later serving example.
MEAL_REVIEW_BATCHES['mincook-blog-715']={reason:'2026-11-25 등록범위는 사골3kg·잡뼈3kg 육수제조만 포함. 원문 완성국물량이 없으므로 기존20식사인분 대신 원문1회 제조량. 기존 제조물 정책 적용.'};
MEAL_REVIEW_BATCHES['eonam-kn9woORbeK8']={reason:'2026-11-25 등록범위는 땅콩마요잼4재료만 포함. 샌드위치 재료는 등록범위 밖. 기존 소스·잼 제조물 정책에 따라 원문1회 제조량.'};
MEAL_REVIEW_BATCHES['mincook-blog-101']={reason:'2026-11-25 사용자 승인 반찬1회 제조량 정책 적용. 경상도식 콩나물잡채는 반찬 제조전체를1회로 계산, 당면 포장의 약15인분을 완성잡채 명시인분으로 오인하지 않음.'};
MEAL_REVIEW_BATCHES['mincook-blog-58']={reason:'2026-11-25 공식 원문 앞발1개 확인, 중량 미기재. 사용자 승인:6인분 추정을 사용하지 않고 앞발1개 전체를1회 제조량으로 계산.'};
export const MEAL_REVIEW_RETAINED={
 'mincook-blog-122':'2026-11-25 사용자 승인:4인분(추정) 유지, 속재료는 김밥4줄 기준으로 계산. 밥2공기·소스2봉·후레이크2봉·두부반모·달걀3개는 전체양 유지. 유부는 사용자 사진확인 한줄5장으로 총20장. 햄 중복1행 제외. 완성4줄은 사용자 계산기준이며 원작자 명시수율 아님.',
 'paik-wyCV_de0CDY':'2026-11-25 사용자 확인: 약5개 만드는 떡갈비는5인분(추정) 유지.',
 'mincook-blog-481':'돼지뒷다리살3.5kg에19인분은 원재료 약184g/인. 대량 고기국 범위로 유지. 물5L는 완성국물량이 아니므로 부족시 국물추가/수율까지 검증했다는 뜻은 아님.',
 'moony-h21WuV-YLX0':'팥300ml·물1L로 나누는4그릇 추정 유지. 팥 부피를 g으로 환산하거나 완성죽1L라고 단정하지 않음.'
};
export const MEAL_REVIEW_SERVINGS={
 'mincook-blog-510':{baseServings:4,reason:'2026-11-25 사용자 승인: 순두부800g·소고기300g·쫄면150g 전체를4인분(추정).'},
 'mincook-blog-441':{baseServings:4,reason:'2026-11-25 사용자 승인: 순두부700g·차돌200g 전체를4인분(추정).'},
 'mincook-blog-249':{baseServings:4,reason:'2026-11-25 사용자 승인: 뼈포함 통닭다리1kg 전체를4인분(추정).'},
 'mincook-blog-469':{baseServings:2,reason:'2026-11-25 사용자 확인: 고기800g 전량과 밥2공기 모두 포함하여2인분(추정). 남기는 고기량이나 밥을 임의추가하지 않음.'},
 'mincook-blog-734':{baseServings:4,reason:'2026-11-25 원문 순두부700g·삼겹살300g·달걀2개. 사용자 승인4인분(추정).'},
 'mincook-blog-609':{baseServings:4,reason:'2026-11-25 원문 순두부700g·굴350g·바지락100g. 사용자 승인4인분(추정).'},
 'mincook-blog-550':{baseServings:3,reason:'2026-11-25 원문 계란밥3개·밥750g·달걀6개. 사용자 승인 한개를1인분으로 보고3인분(추정). 원작자 명시인분 아님.'},
 'mincook-blog-534':{baseServings:4,reason:'2026-11-25 사용자 확인: 닭700g 두마리를 나누어 먹는4인분(추정)으로 계산. 원작자 명시인분 아님.'},
 'mincook-blog-627':{baseServings:4,reason:'2026-11-25 공식 원문 돼지앞발1.7kg 확인. 뼈포함 중량을 고려하여 사용자 승인4인분(추정).'},
 'mincook-blog-330':{baseServings:6,reason:'2026-11-25 공식 원문 돼지꼬리2kg 확인. 뼈포함 중량을 고려하여 사용자 승인6인분(추정).'},
 'mincook-blog-379':{baseServings:4,reason:'2026-11-25 공식 원문 병어1kg 및 채소 확인. 뼈포함 통생선 중량을 고려하여 사용자 승인4인분(추정).'},
 'mincook-blog-578':{baseServings:4,reason:'2026-11-25 공식 본문 스테이크1kg 확인·사용자 승인4인분(추정). 소스만으로 추정한 기존10인분을 대체. 마늘0.5숟가락 사용자확인 유지.'},
 'mincook-blog-611':{baseServings:9,reason:'2026-11-25 공식 원문 LA갈비3kg 재확인. 뼈포함 중량을 고려하여 사용자 승인9인분(추정); 원작자 명시인분 아님.'},
 'mincook-blog-669':{baseServings:6,reason:'2026-11-25 공식 원문 LA갈비2kg 재확인. 뼈포함 중량을 고려하여 사용자 승인6인분(추정); 원작자 명시인분 아님.'},
 'mincook-blog-489':{baseServings:5,reason:'2026-11-25 공식 원문 LA갈비1.5kg 재확인. 뼈포함 중량을 고려하여 사용자 승인5인분(추정); 잡채 별도제조량과 구분.'}
};
export function applyMealServingReview(recipe){
 let result=recipe;
 if(recipe.id==='mincook-blog-122'){
  const marker=' · 사용자 확인 김밥4줄 기준(2026-11-25)';
  let hamSeen=false;
  result={...result,baseServings:4,servingsStatus:'estimated',servingsEvidence:MEAL_REVIEW_RETAINED[recipe.id],showSourceNotes:true,
   ingredients:result.ingredients.filter(i=>{
    if(!i.note?.startsWith('원문: 김밥용 햄 : 1줄'))return true;
    if(hamSeen)return false;
    hamSeen=true;return true;
   }).map((i,index)=>{
    // The first five rows are the whole rice mixture, not one roll.
    if(index<5||i.note?.includes(marker))return i;
    const tofuSkin=i.note==='원문: 유부초밥용 유부 : 4장';
    return {...i,amount:tofuSkin?20:i.amount===null?null:i.amount*4,
     note:i.note+marker+(tofuSkin?' · 원문표4장/본문5장 중 사용자 사진확인 한줄5장×4줄=20장':' · 한줄분을4배, 수량미기재는 그대로 유지')};
   })};
 }
 if(recipe.id==='mincook-blog-578')result={...result,showSourceNotes:true,ingredients:result.ingredients.map(i=>i.note==='원문: 냉동 스테이크'?{...i,amount:1,unit:'kg',note:'원문: 냉동 스테이크 · 공식 본문에 무게1kg 명시(2026-11-25 재확인). 다진마늘0.5숟가락 사용자확인 유지.'}:i)};
 if(recipe.id==='mincook-blog-167'){
  let seen=false;
  result={...result,showSourceNotes:true,ingredients:result.ingredients.filter(i=>{
   if(i.note!=='원문: 콩나물 500g')return true;
   if(seen)return false;
   seen=true;return true;
  })};
 }
 const decision=MEAL_REVIEW_SERVINGS[recipe.id];
 return decision?{...result,baseServings:decision.baseServings,servingsStatus:'estimated',servingsEvidence:decision.reason}:result;
}
