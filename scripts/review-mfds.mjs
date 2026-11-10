// This allowlist records the source rows inspected for explicit servings and complete ingredient lists.
// Rows with ranges, multiple foods in one quantity, or missing main ingredients remain pending.
import { readFile, writeFile } from 'node:fs/promises';
import { hash } from './import-mfds.mjs';
import { parseWrittenAmount } from './mfds-quantity.mjs';

const root = new URL('../', import.meta.url);
const read = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const source = (await read('data/source/mfds-response.json')).COOKRCP01.row;
const existing = await read('data/ingredients.json');
const reviews = await read('data/source/mfds-reviews.json');
const approved = new Set(['3260','3261','3265','3266','3267','3269','3273','3278','3279','3280','3281','3282','3283','3285','3287','3289','3292','3293','3295','3296','3297','3298']);
const seasoningNames = new Set(['후춧가루','백후춧가루','통후추','올리브유','아보카도유','저염 된장','다진 양파','참깨','들깻가루','고춧가루','고운 고춧가루','다진 마늘','다진 청고추','다진 홍고추','다진 파','사과즙','레몬즙','라임즙','라임청','다시마가루','매실식초','매실청','현미식초','식초','간장','저염 간장','꿀','카레가루','플레인 요거트','무가당 플레인 요거트','마요네즈','무가당 아보카도 마요네즈','살사소스','스리라차 소스','스테비아','강황가루','파슬리가루','다진 파슬리','버섯가루','새우젓','훈제 파프리카파우더','카옌 페퍼','커민','그라나파다노 치즈','파르메산 치즈','파프리카가루','스테이크 시즈닝','홀그레인 머스터드','월계수잎','화이트와인','천일염','넛맥가루','고추기름','블랙올리브 파우더','페페론치노','소금','맛간장']);
const meatNames = new Set(['삼겹살','관자','새우','모시조개','대패삼겹살','닭다릿살','다진 돼지고기','소고기','흰다리새우','닭','칵테일새우','오징어','새우살','게살','북어채','건새우','훈제 오리','육수용 멸치']);
const vegetableNames = new Set(['양파','마늘','참외','영양부추','대파','미나리','방울토마토','아보카도','로메인','방아잎','사과','가지','주키니호박','토마토','단호박','알배추','쪽파','팽이버섯','느타리버섯','당근','숙주','쑥갓','미니 단호박','생표고버섯','청경채','다진 쪽파','다진 청양고추','양상추','파프리카','오이','청양고추','새송이버섯','양송이버섯','다진 토마토','다진 파프리카','어린잎채소','바질','바질잎','다시마','시금치','레몬','블루베리','애플민트잎','노랑 파프리카','브로콜리','감자','깻잎','미역 줄기','청상추']);
vegetableNames.add('아스파라거스');
vegetableNames.add('콜리플라워');
vegetableNames.add('다진 양파');
meatNames.add('황태 머리');
seasoningNames.add('올리고당');
for (const name of ['다진 양파','플레인 요거트','무가당 플레인 요거트','그라나파다노 치즈','파르메산 치즈']) seasoningNames.delete(name);
const additionalOther = new Set(['플레인 요거트','무가당 플레인 요거트','그라나파다노 치즈','파르메산 치즈']);


for (const row of source.filter(r => approved.has(r.RCP_SEQ))) {
  if (reviews.some(r => r.sourceId === row.RCP_SEQ)) continue;
  const serving = row.RCP_PARTS_DTLS.match(/^\[\s*(\d+)\s*인분\s*\]/u);
  if (!serving) throw new Error(`인분 근거 없음: ${row.RCP_SEQ}`);
  const body = row.RCP_PARTS_DTLS.slice(serving[0].length).trim();
  const matches = [...body.matchAll(/([^(),+]+)\(([^()]*)\)/gu)];
  let residue = body;
  const ingredients = [], definitions = [];
  for (const match of matches) {
    const name = match[1].trim(), written = match[2].trim(), sourceText = `${name}(${match[2]})`;
    residue = residue.replace(sourceText, '');
    const parsed = parseWrittenAmount(written);
    const normalized = name.replace(/\s/g,'');
    const known = existing.find(i => [i.name,...i.aliases].some(n => n.replace(/\s/g,'') === normalized));
    const id = known?.id || `mfds-ingredient-${hash(name).slice(0,12)}`;
    if (!known && !definitions.some(i => i.id === id)) {
      if (!seasoningNames.has(name) && !meatNames.has(name) && !vegetableNames.has(name) && !additionalOther.has(name) && !['두부','두부면','건두부','견과류','슈레드 모차렐라치즈','달걀노른자','삶은 검은콩','통밀가루','돼지감자가루','현미쌀가루','치아바타','쌀','사각 라이스페이퍼','라이스페이퍼','감자전분','전분','찹쌀가루','통조림 참치','잡곡밥','토르티야','밥','불린 병아리콩','우유','무가당 두유','생크림','바게트','아몬드','맛살','부침가루','튀김가루','탄산수','삶은 달걀','식빵','슬라이스 체더치즈','말린 자두','아몬드 슬라이스','체더치즈','할라피뇨 피클','잣'].includes(name)) throw new Error(`미검수 분류: ${name}`);
      const category = seasoningNames.has(name) ? '양념·조미료' : meatNames.has(name) ? '육류·해산물' : vegetableNames.has(name) ? '채소·버섯' : '두부·계란·기타';
      definitions.push({ id, name, aliases: [], category, isSeasoning: seasoningNames.has(name), isQuickPick: false });
    }
    ingredients.push({ ingredientId: id, sourceName: name, sourceText, amount: parsed.amount, unit: parsed.unit, note: `원문 수량: ${written}` });
  }
  if (residue.replace(/[\s,+]/g,'')) throw new Error(`누락 재료: ${row.RCP_SEQ} ${residue}`);
  const kind = { '찌기':'찜','끓이기':'끓이기','굽기':'구이','볶기':'볶음','튀기기':'튀김','기타':'기타' }[row.RCP_WAY2];
  if (!kind) throw new Error(`조리 유형 확인 필요: ${row.RCP_SEQ}`);
  for (const definition of definitions) if (!existing.some(i => i.id === definition.id)) existing.push(definition);
  reviews.push({ sourceId: row.RCP_SEQ, sourceHash: hash(row.RCP_PARTS_DTLS), reviewedOn: '2026-11-10', baseServings: Number(serving[1]), servingEvidence: serving[0], cookingType: kind, sectionLabels: [], ingredientDefinitions: definitions, ingredients });
}
await writeFile(new URL('data/source/mfds-reviews.json',root), JSON.stringify(reviews,null,2)+'\n');
console.log(`인분·전체 재료 대조 기록 ${reviews.length}건`);
