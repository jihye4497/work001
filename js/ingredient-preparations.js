// Availability families only: preparation quantities are never converted to raw weight.
const groups = [
  {name:'계란', forms:['삶은 달걀','달걀노른자','달걀지단','달걀흰자','달걀물','삶은 달걀 노른자','계란노른자','달걀 삶은것','계란프라이','삶은 계란','계란 지단','반숙 계란']},
  {name:'메추리알', forms:['삶은 메추리알']},
  {name:'건미역', forms:['불린 미역']}
];
const compact = name => name?.normalize('NFKC').replace(/\s/g,'');
const families = new Map(groups.flatMap(group => [group.name,...group.forms].map(name => [compact(name),group.name])));
export function preparationFamilyName(ingredient) {return families.get(compact(ingredient?.name)) || null;}
export function isPreparationVariant(ingredient) {
  const family=preparationFamilyName(ingredient);
  return Boolean(family && compact(ingredient.name)!==compact(family));
}
