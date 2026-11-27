import {readFile,writeFile} from 'node:fs/promises';
import {SUYUK_RAW_MEAT_GRAMS,SUYUK_SERVINGS_REVIEWS} from '../js/suyuk-servings-review.js';
const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
const entries=Object.entries(SUYUK_SERVINGS_REVIEWS).map(([id,review])=>{
 const recipe=recipes.find(r=>r.id===id);
 if(!recipe||recipe.servingsStatus!=='estimated')throw Error(id);
 return {recipeId:id,name:recipe.name,sourceUrl:recipe.sourceUrl,previousBaseServings:recipe.baseServings,rawMeatGrams:SUYUK_RAW_MEAT_GRAMS[id],baseServings:review.baseServings,status:'user-approved-estimate',reason:review.reason,sourceQuantitiesUnchanged:true};
});
const report={checkedOn:'2026-11-27',basis:'생고기250g/인·정수반올림·최소1인분. 공식기준아닌사용자승인서비스추정.',scope:'인분미명시 유튜브/연결블로그의 뼈없는생고기 중량확인 수육류15개. 식약처/테팔·원문명시인분·탕수육·국물전골·뼈있는고기·고기량미기재 제외.',limits:'이전 보관원문 중량으로 계산하며 원문 신규접속/완성수율 검증으로 표시하지 않음. 600g은2인분으로반올림하므로 실제계산300g/인,250g은정수추정의기준값. 원문재료/수량/단위/기존선택 유지.',entries,excluded:[{recipeId:'mincook-blog-277',reason:'수육전골은국물요리이므로이번범위제외'},{recipeId:'mincook-blog-460',reason:'족발수육 고기량미기재'},{recipeId:'mincook-blog-348',reason:'수육보쌈김치 앞다리살중량미기재·기존제조량유지'},{recipeId:'mincook-blog-200',reason:'다시마수육굴보쌈 삼겹살중량미기재'}]};
await writeFile(new URL('../data/source/suyuk-servings-review.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(entries.map(e=>({name:e.name,before:e.previousBaseServings,after:e.baseServings}))));
