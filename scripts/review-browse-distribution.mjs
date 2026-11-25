// Proposal only: this report does not add UI tabs or alter browsing metadata.
import {readFile} from 'node:fs/promises';
import {browseIngredients} from '../js/ingredient-browse.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
export function proposedGroup(name,subcategory){
 if(subcategory==='가공식품'){
  if(/컵라면|빵/.test(name))return '간편식·간식';
  if(/두부|두유|유부|푸주|도토리묵|깨묵|메밀묵|묵말랭이|올방개묵|우무묵|청포묵|곤약|콩비지|낫토|청국장|콩고기|콩국물|콩물/.test(name))return '두부·묵';
  if(/햄|소시지|베이컨|살라미|잠봉|스팸|육포|페퍼로니|편육|순대|어묵|맛살|크래미|참치|통조림|김치|깍두기|묵은지|피클|쌈무|치킨무|단무지|초생강|절임|삭힌|우엉조림/.test(name))return '반찬·통조림';
  return '간편식·간식';
 }
 if(/고춧가루|고추|페퍼|후추|후춧|페페론치노|실고추/.test(name))return '고추·후추';
 if(/허브|바질|로즈마리|타임|오레가노|월계수|파슬리|시즈닝|시치미|스파이스|가람마살라|피클링/.test(name))return '허브·시즈닝';
 return '기타 향신';
}
for(const [category,subcategory] of [['기타','가공식품'],['양념','향신']]){
 const items=browseIngredients(ingredients,category,subcategory),groups={};
 for(const item of items)(groups[proposedGroup(item.name,subcategory)]??=[]).push(item.name);
 console.log(JSON.stringify({subcategory,total:items.length,groups:Object.fromEntries(Object.entries(groups).map(([name,items])=>[name,{count:items.length,items}]))},null,2));
}
