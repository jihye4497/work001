// Explicitly reviewed overrides; never infer a calculation mode from a menu name.
// Raw importer records keep their historical serving estimates and source quantities.
import {REVIEWED_BATCH_RECIPES} from './reviewed-batch-recipes.js';
import {composeRecipe,COMPOSITION_REVIEWS} from './recipe-compositions.js';
import {USER_CONFIRMED_BATCH_RECIPES,BATCH_SOURCE_ADDITIONS} from './user-confirmed-batch-recipes.js';
import {MEAL_REVIEW_BATCHES,applyMealServingReview} from './meal-servings-review-decisions.js';
// Only activate compositions whose quantities have been reviewed with the user.
export const ACTIVE_COMPOSITION_IDS=['mincook-blog-623','mincook-blog-728','mincook-blog-625','mincook-blog-598'];
export const BATCH_RECIPE_REVIEWS = {
  ...REVIEWED_BATCH_RECIPES,
  ...USER_CONFIRMED_BATCH_RECIPES,
  ...MEAL_REVIEW_BATCHES,
  'mincook-blog-238': {summary:'생크림 1L',reason:'2026-11-25 사용자 원문 확인: 생크림1L 유지. 도구인 전기밥솥은 제외하고 원문 제조량을1회로 계산.'},
  'caden-DX6ydTY05O4': { summary: '삼겹살 다짐육 500g', reason: '2026-11-25 사용자 확인: 고기 된장조림(꼬기 된장)은 원문 전체를1회 제조량으로 계산.' },
  'moony-UOWYEGyvVs0': { summary: '달걀 6개', reason: '달걀6개를6인분으로 보던 추정을 폐기하고 원문 전체를1회 제조량으로 계산.' },
  'moony-kOS_EGIExvU': { summary: '두부 200g', reason: '두부200g·오일50ml 전체를10인분이 아닌 원문1회 제조량으로 계산.' },
  'paik-uAShnbgCLSU': { summary: '양파 15kg', reason: '껍질 포함 양파15kg·식용유300ml 전체를100인분이 아닌 원문1회 제조량으로 계산.' }
};
export const COMPOSITE_BATCH_REVIEWS={
 ...Object.fromEntries(ACTIVE_COMPOSITION_IDS.map(id=>[id,{reason:`2026-11-25 사용자 승인 구성별 제조횟수 조절. ${COMPOSITION_REVIEWS[id].excluded}`} ])),
 'mincook-blog-601':{reason:'2026-11-25 사용자 승인: 수박청 & 수박에이드로 묶고 각각 제조횟수 조절. 에이드0회는 전용재료 제외. 모히또 전용 소주 제외, 원문 미기재 사용량은 추정하지 않음.'}
};
export function applyCalculationBasis(recipes) {
  return recipes.map(recipe => {
    let result=applyMealServingReview(recipe);
    if(BATCH_SOURCE_ADDITIONS[recipe.id])result={...result,showSourceNotes:true,ingredients:[...result.ingredients,...BATCH_SOURCE_ADDITIONS[recipe.id].filter(i=>!result.ingredients.some(prior=>prior.note===i.note)).map(i=>({...i}))]};
    if(recipe.id==='mincook-blog-59')result={...result,ingredients:result.ingredients.map(i=>i.note?.startsWith('원문: 양파 : 큰 것 기준 1개')?{...i,amount:1,unit:'개',note:'원문: 양파 : 큰 것 기준 1개 · 2026-11-25 공식 원문에서 큰 양파1개 명시 재확인. 중량 환산 없음.'}:i)};
    if(recipe.id==='mincook-blog-238')result={...result,ingredients:result.ingredients.filter(i=>i.note!=='원문: 전기밥솥')};
    // Official article742: bowls/burgers reuse the patties made from the first
    // ingredient section. They are not additional purchased patties.
    if(recipe.id==='mincook-blog-742')result={...result,showSourceNotes:true,ingredients:result.ingredients.filter(i=>i.ingredientId!=='mincook-ingredient-e3213eb3c849')};
    if(ACTIVE_COMPOSITION_IDS.includes(recipe.id))result=composeRecipe(result);
    if(recipe.id==='mincook-blog-601')result={...result,
      components:[{id:'syrup',name:'수박청',mode:'batch'},{id:'ade',name:'수박에이드',mode:'batch',quantityUnknown:true,usesComponentId:'syrup'}],
      accompanimentNote:'수박에이드는 만든 수박청을 활용해요. 에이드 재료와 한 잔에 쓰는 수박청 양은 원문에 없어 수량 미기재로 표시해요. 에이드를0회로 바꾸면 얼음·탄산수·애플민트가 빠져요. 수박청 제조 재료는 한 번만 계산해요.',
      ingredients:result.ingredients.filter(i=>i.note!=='원문: 소주').map((i,index)=>({...i,componentId:index<4?'syrup':'ade'}))
    };
    return BATCH_RECIPE_REVIEWS[recipe.id]
      ? {...result, calculationMode:'batch', ...(BATCH_RECIPE_REVIEWS[recipe.id].summary?{batchSummary:BATCH_RECIPE_REVIEWS[recipe.id].summary}:{})}
      : result;
  });
}
export function selectedBatchCount(selection) { return selection.batchCount ?? selection.times ?? 1; }
