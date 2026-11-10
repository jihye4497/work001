import { readFile, writeFile } from 'node:fs/promises';
import { hash } from './import-mfds.mjs';

const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path,root),'utf8'));
const reviews = await read('data/source/mfds-reviews.json');
const raw = (await read('data/source/mfds-supplement.json')).COOKRCP01.row;
const ingredients = await read('data/ingredients.json');
const definition = (id,name,category,isSeasoning=false) => ({id,name,aliases:[],category,isSeasoning,isQuickPick:false});
const item = (ingredientId,sourceText,amount,unit,note=null) => ({ingredientId,sourceText,amount,unit,note});
const seed = ingredients.find(i=>i.name==='참깨');
const riceFlour = ingredients.find(i=>i.name==='찹쌀가루');
const pineNuts = ingredients.find(i=>i.name==='잣');
if (!seed || !riceFlour || !pineNuts) throw new Error('기존 표준 재료를 확인하세요.');
const records = [
  {
    sourceId:'17', cookingType:'죽', sectionLabels:['고구마죽'],
    servingsEvidence:'원문 인분 미표기. 고구마 100g·물 200ml 및 나머지 재료의 전체 분량을 대조해 1인분으로 추정. 205kcal 표기는 보조 정황이며 인분 확정 근거로 사용하지 않음.',
    ingredientDefinitions:[definition('sweet-potato','고구마','채소·버섯')],
    ingredients:[item('sweet-potato','고구마 100g(2/3개)',100,'g','원문 병기 2/3개'),item('sugar','설탕 2g(1/3작은술)',2,'g','원문 병기 1/3작은술'),item(riceFlour.id,'찹쌀가루 3g(2/3작은술)',3,'g','원문 병기 2/3작은술'),item('water','물 200ml(1컵)',200,'ml','원문 병기 1컵'),item(pineNuts.id,'잣 8g(8알)',8,'g','원문 병기 8알')]
  },
  {
    sourceId:'16', cookingType:'죽', sectionLabels:['채소준비','누룽지 죽'],
    servingsEvidence:'원문 인분 미표기. 누룽지 70g·순두부 100g·달걀 50g 및 채소량을 대조해 1인분으로 추정. 380kcal 표기는 보조 정황이며 인분 확정 근거로 사용하지 않음. 물의 양은 원문에 없음.',
    ingredientDefinitions:[definition('scorched-rice','누룽지','두부·계란·기타'),definition('soft-tofu','순두부','두부·계란·기타'),definition('white-pepper','흰 후추','양념·조미료',true)],
    ingredients:[item('zucchini','애호박 30g(1/6개)',30,'g','원문 병기 1/6개'),item('shiitake','표고버섯 20g(2개)',20,'g','원문 병기 2개'),item('carrot','당근 5g(3×2×1cm)',5,'g','원문 크기 메모 3×2×1cm'),item('scorched-rice','누룽지 70g(1/3컵)',70,'g','원문 병기 1/3컵'),item('soft-tofu','순두부 100g(1/4모)',100,'g','원문 병기 1/4모'),{...item('egg','달걀 50g(1개)',50,'g','원문 병기 1개'),sourceAlias:'달걀'},item('sesame-oil','참기름 3g(2/3작은술)',3,'g','원문 병기 2/3작은술'),item('salt','소금 약간',null,null,'약간'),item(seed.id,'참깨 약간',null,null,'약간'),item('white-pepper','흰 후추 약간',null,null,'약간')],
    additionalUnquantifiedIngredients:[{ingredientId:'water',evidence:'누룽지와 물을 넣고 끓인다.'}]
  }
];
for (const record of records) {
  if (reviews.some(r=>r.sourceId===record.sourceId)) continue;
  const source=raw.find(r=>r.RCP_SEQ===record.sourceId);
  reviews.push({...record,sourceHash:hash(source.RCP_PARTS_DTLS),reviewedOn:'2026-11-10',baseServings:1,servingsStatus:'estimated',servingEvidence:null,assumptionApprovedOn:'2026-11-10'});
}
await writeFile(new URL('data/source/mfds-reviews.json',root),JSON.stringify(reviews,null,2)+'\n');
console.log('사용자 승인한 1인분 추정 검수 기록 2건 준비');
