// 2026-11-27 user-approved product convention, NOT an official serving standard.
// Curated raw boneless meat amounts only; never infer eligibility from a name.
export const SUYUK_RAW_MEAT_GRAMS={
 'caden-F3d9odPcgek':1500,
 'eonam-3Cb1Le-NzRc':600,
 'mincook-blog-737':1000,
 'mincook-blog-714':1200,
 'mincook-blog-699':600,
 'mincook-blog-668':1200,
 'mincook-blog-588':600,
 'mincook-blog-496':1200,
 'mincook-blog-442':3000,
 'mincook-blog-374':600,
 'mincook-blog-209':600,
 'mincook-blog-112':800,
 'mincook-blog-91':600,
 'mincook-blog-83':600,
 'mincook-blog-47':600
};
export const SUYUK_SERVINGS_REVIEWS=Object.fromEntries(Object.entries(SUYUK_RAW_MEAT_GRAMS).map(([id,grams])=>[id,{
 baseServings:Math.max(1,Math.round(grams/250)),
 reason:`2026-11-27 사용자 승인: 수육류는 삶기 전 뼈 없는 생고기250g/인 기준을 사용하고 정수로 반올림. 원문 고기${grams}g÷250g=${grams/250}인분을${Math.max(1,Math.round(grams/250))}인분(추정)으로 표시·계산. 공식 영양/제공량 기준 또는 원작자 명시인분이 아님. 다른 요리/뼈있는고기/수량미기재에는 적용하지 않음.`
}]));
export function applySuyukServingReview(recipe){
 const review=SUYUK_SERVINGS_REVIEWS[recipe.id];
 if(!review||recipe.servingsStatus!=='estimated')return recipe;
 // A prior batch decision for wine suyuk is superseded by the user's suyuk rule.
 const {batchSummary,...rest}=recipe;
 return {...rest,baseServings:review.baseServings,calculationMode:'servings',servingsEvidence:review.reason};
}
