// Reviewed cooking intermediates: never reuse their liquid weight as raw ingredient weight.
const compact=name=>name?.replace(/\s/g,'');
const starchNames=new Set(['물전분','물녹말','녹말물','전분물']);
export function preparedIngredientKind(ingredient) {
 const n=compact(ingredient?.name);
 return starchNames.has(n)?'starch':n==='멸치육수'?'anchovy-broth':n==='골뱅이국물'?'canned-whelk-liquid':null;
}
export function preparedSubstitution(source,target) {
 const kind=preparedIngredientKind(source),name=compact(target?.name);
 return kind==='anchovy-broth'&&['국멸치','육수용멸치','국물용멸치','멸치육수코인'].includes(name)
  ||kind==='starch'&&['전분','녹말','녹말가루','전분가루','감자전분','감자녹말가루'].includes(name)
  ||kind==='canned-whelk-liquid'&&name==='골뱅이통조림';
}
// Exact quantities explicitly present in the preserved recipe notes (not guessed ratios).
const starchAmounts={
 'mfds-cookrcp01-543':['전분',10,'g'], 'mfds-cookrcp01-442':['전분',10,'g'],
 'mfds-cookrcp01-484':['전분',10,'g'], 'mfds-cookrcp01-436':['전분',5,'g'],
 'mfds-cookrcp01-544':['전분',10,'g'], 'mfds-cookrcp01-3771':['전분',30,'g'],
 'mincook-blog-665':['감자전분',1,'스푼']
};
export function preparedPurchase(item,recipe,ingredients,replacementId) {
 const original=ingredients.get(item.ingredientId),kind=preparedIngredientKind(original);
 if(!kind)return null;
 const find=name=>[...ingredients.values()].find(i=>i.name===name);
 if(kind==='canned-whelk-liquid') {
  const existing=recipe.ingredients.find(i=>ingredients.get(i.ingredientId)?.name==='골뱅이'&&i.unit==='캔');
  const ingredient=existing?ingredients.get(existing.ingredientId):find('골뱅이 통조림');
  return {ingredient,amount:null,unit:null,skipQuantity:Boolean(existing),help:existing?'메뉴에 포함된 골뱅이 통조림의 국물을 사용해요. 국물 때문에 통조림을 추가로 계산하지 않아요.':'골뱅이 통조림의 국물을 사용해요. 필요한 통조림 수는 제품의 국물 양을 확인해 주세요.'};
 }
 if(kind==='starch') {
  const [name,amount,unit]=starchAmounts[recipe.id]||['전분',null,null];
  const replacement=ingredients.get(replacementId);
  return {ingredient:preparedSubstitution(original,replacement)?replacement:find(name),amount,unit,help:'전분을 물에 풀어 사용해요. 전분 양이 원문에 없으면 원본 레시피에서 확인해 주세요.'};
 }
 const replacement=ingredients.get(replacementId);
 return {ingredient:preparedSubstitution(original,replacement)?replacement:{...original,name:'국멸치 또는 멸치 육수 코인'},amount:null,unit:null,
  help:'국멸치로 육수를 내거나 멸치 육수 코인으로 준비할 수 있어요. 필요한 멸치 양은 원본 레시피, 코인 개수는 제품의 물 용량 기준을 확인해 주세요.'};
}
