import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { imageEntry, sourceSequence } from '../js/recipe-images.js';
const root=new URL('../',import.meta.url);
export async function collectImages(key,fetcher=fetch) {
  const found=new Map();let total=0;
  for(let start=1;;start+=1000) {
    const response=await fetcher(`https://openapi.foodsafetykorea.go.kr/api/${encodeURIComponent(key)}/COOKRCP01/json/${start}/${start+999}`,{signal:AbortSignal.timeout(45000)});
    if(!response.ok)throw Error('API 응답 오류');
    const api=(await response.json()).COOKRCP01;
    if(api?.RESULT?.CODE!=='INFO-000'||!Array.isArray(api.row)||!api.row.length)throw Error('API 데이터 오류');
    total=Number(api.total_count);if(!Number.isSafeInteger(total)||total<1)throw Error('전체 건수 오류');
    let added=0;
    for(const row of api.row)if(!found.has(String(row.RCP_SEQ))){found.set(String(row.RCP_SEQ),row);added++;}
    if(!added)throw Error('반복 페이지 응답');
    if(found.size>=total)break;
    if(key==='sample')throw Error('전체 이미지 수집에는 인증키가 필요합니다.');
  }
  return {total,rows:[...found.values()]};
}
async function main() {
  let key=process.env.MFDS_API_KEY;
  if(!key){console.log('인증키 입력 대기 (저장·출력하지 않음)');const input=createInterface({input:process.stdin,terminal:false});for await(const line of input){key=line.trim();input.close();break;}}
  if(!key)throw Error('인증키 없음');
  const result=await collectImages(key);key=undefined;
  const recipes=JSON.parse(await readFile(new URL('data/recipes.json',root),'utf8'));
  const byId=new Map(result.rows.map(row=>[String(row.RCP_SEQ),row]));
  const entries=[];const missing=[];
  for(const recipe of recipes){const row=byId.get(sourceSequence(recipe));const entry=row&&imageEntry(recipe,row);if(entry)entries.push(entry);else missing.push({recipeId:recipe.id,name:recipe.name});}
  const metadata={schemaVersion:1,collectedOn:new Date().toISOString().slice(0,10),source:'식품의약품안전처 COOKRCP01',license:'https://www.data.go.kr/catalog/15060073/openapi.json',entries};
  await writeFile(new URL('data/recipe-images.json',root),JSON.stringify(metadata,null,2)+'\n');
  await writeFile(new URL('data/source/mfds-images-report.json',root),JSON.stringify({collectedOn:metadata.collectedOn,sourceTotal:result.total,recipes:recipes.length,linked:entries.length,missing},null,2)+'\n');
  console.log(`원본 ${result.total}건 / 이미지 연결 ${entries.length}개 / 미연결 ${missing.length}개`);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{console.error('이미지 수집 실패: 네트워크·인증 상태를 확인해 주세요. 인증키가 포함된 오류는 출력하지 않습니다.');process.exitCode=1;});
