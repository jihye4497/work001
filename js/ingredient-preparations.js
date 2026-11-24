// Availability families only: preparation quantities are never converted to raw weight.
const groups = [
 // User-approved bovine estimate, 2026-11-24; source 177 only says grilled intestine.
 {name:'소대창', forms:['구운 대창']},
 // Reviewed across the vegetable catalog, not inferred by stripping arbitrary words.
 // Chopped and blended remain distinct source forms; cooked weights never become raw weights.
 {name:'양파', forms:['간 양파']},
 {name:'홍고추', forms:['간 홍고추']},
 {name:'다진 마늘', forms:['간 마늘']},
 {name:'토마토', forms:['토마토콩카세']},
 {name:'미나리', forms:['데친 미나리']},
 {name:'감자', forms:['찐 감자']},
 {name:'고구마', forms:['찐 고구마']},
 {name:'연근', forms:['자숙 연근']},
 {name:'우거지', forms:['데친 우거지']},
 {name:'토란줄기', forms:['데친 토란대','삶은 토란대','데친 토란줄기']},
 {name:'고사리', forms:['불린 고사리']},
 {name:'무말랭이', forms:['불린 무말랭이']},
 {name:'건함초', forms:['불린 함초']},
 {name:'목이버섯', forms:['불린 목이버섯']},
 {name:'콩나물', forms:['두절콩나물']},
 {name:'꼬막', forms:['데친 꼬막살','자숙꼬막']},
  {name:'멍게', forms:['멍게살']},
  {name:'소라', forms:['소라살']},
  {name:'전복', forms:['전복살']},
  // User's species estimate (2026-11-24), not an explicit statement in the source.
  {name:'돼지고기 등심', forms:['잡채용 등심']},
  {name:'황태포', forms:['황태채']},
  {name:'고등어', forms:['손질된 고등어','고등어 필렛']},
  {name:'흰살생선', forms:['손질된 흰살생선']},
  {name:'연어', forms:['슬라이스연어','연어 필렛']},
  {name:'표고버섯', forms:['표고버섯 기둥']},
  {name:'현미', forms:['불린 현미','볶은현미']},
  {name:'수수', forms:['볶은수수']},
  {name:'율무', forms:['볶은율무']},
  {name:'쌀', forms:['불린쌀']},
  {name:'찹쌀', forms:['불린 찹쌀']},
  {name:'건곤드레나물', forms:['불린 곤드레나물']},
  {name:'옥수수', forms:['옥수수알']},
  {name:'참깨', forms:['볶은통깨']},
  {name:'건 표고버섯', forms:['불린 표고버섯']},
  {name:'사과즙', forms:['사과주스']},
  {name:'오미자청', forms:['오미자액','오미자 액기스']},
  {name:'매실청', forms:['매실액','매실엑기스','매실농축액','매실원액']},
  {name:'산초', forms:['산초가루']},
  {name:'감자', forms:['삶은 감자']},
  {name:'검은콩', forms:['삶은 검은콩']},
  {name:'완두콩', forms:['삶은 완두콩']},
  {name:'콩나물', forms:['삶은 콩나물']},
  {name:'옥수수', forms:['삶은 옥수수']},
  {name:'스파게티', forms:['삶은 스파게티']},
  {name:'메밀면', forms:['삶은 메밀면']},
  {name:'시래기', forms:['삶은 시래기','데친 시래기','시래기불린것']},
  {name:'돼지곱창', forms:['삶은 돼지곱창']},
  {name:'무뼈 닭발', forms:['삶은 무뼈닭발']},
  {name:'닭 가슴살', forms:['삶은 닭가슴살']},
  {name:'계란', forms:['삶은 달걀','달걀노른자','달걀지단','달걀흰자','달걀물','삶은 달걀 노른자','계란노른자','달걀 삶은것','계란프라이','삶은 계란','계란 지단','반숙 계란','수란']},
  {name:'메추리알', forms:['삶은 메추리알']},
  {name:'건미역', forms:['불린 미역']},
  {name:'호두', forms:['볶은 호두','구운 호두']},
  {name:'아몬드', forms:['아몬드 슬라이스','볶은 아몬드 슬라이스']},
  {name:'곤약미', forms:['불린 곤약쌀']}
];
const compact = name => name?.normalize('NFKC').replace(/\s/g,'');
const families = new Map(groups.flatMap(group => [group.name,...group.forms].map(name => [compact(name),group.name])));
export function preparationFamilyName(ingredient) {return families.get(compact(ingredient?.name)) || null;}
export function isPreparationVariant(ingredient) {
  const family=preparationFamilyName(ingredient);
  return Boolean(family && compact(ingredient.name)!==compact(family));
}
