import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {safeImageUrl,imageEntry,applyRecipeImages} from '../js/recipe-images.js';
const recipe={id:'demo',name:'김치찌개',sourceNote:'식약처 RCP_SEQ=123; 원본 검수',imagePath:null,ingredients:[{amount:400}]};
const row={RCP_SEQ:'123',RCP_NM:'김치찌개',ATT_FILE_NO_MAIN:'http://www.foodsafetykorea.go.kr/uploadimg/food.jpg'};
test('공식 이미지의 ID·이름을 확인하고 HTTPS로 연결하며 원본을 변경하지 않음',()=>{
 const entry=imageEntry(recipe,row);assert.equal(entry.url,'https://www.foodsafetykorea.go.kr/uploadimg/food.jpg');
 assert.equal(imageEntry(recipe,{...row,RCP_SEQ:'124'}),null);
 assert.equal(imageEntry(recipe,{...row,RCP_NM:'다른 요리'}),null);
 const result=applyRecipeImages([recipe],{schemaVersion:1,entries:[entry]});
 assert.equal(recipe.imagePath,null);assert.equal(result[0].ingredients,recipe.ingredients);assert.equal(result[0].imagePath,entry.url);
 assert.equal(applyRecipeImages([recipe],{schemaVersion:1,entries:[{...entry,name:'다른 요리'}]})[0].imagePath,null);
});
test('비공식·위험 URL은 연결하지 않고 작은 사진이 없으면 큰 사진 사용',()=>{
 for(const url of ['javascript:alert(1)','https://evil.example/a.jpg','https://www.foodsafetykorea.go.kr.evil.example/a.jpg','https://user:password@www.foodsafetykorea.go.kr/a.jpg'])assert.equal(safeImageUrl(url),null);
 assert.ok(imageEntry(recipe,{...row,ATT_FILE_NO_MAIN:'',ATT_FILE_NO_MK:row.ATT_FILE_NO_MAIN}));
});
test('사진 연결 파일은 기존 메뉴와 ID·이름이 일치하고 중복이 없음',async()=>{
 const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const metadata=JSON.parse(await readFile(new URL('../data/recipe-images.json',import.meta.url),'utf8'));
 assert.equal(new Set(metadata.entries.map(e=>e.recipeId)).size,metadata.entries.length);
 for(const entry of metadata.entries){const r=recipes.find(r=>r.id===entry.recipeId);assert.ok(r);assert.equal(applyRecipeImages([r],{schemaVersion:1,entries:[entry]})[0].imagePath,entry.url);}
});


test('생성 이미지 8개는 프로젝트 파일로 연결하고 출처를 공식 사진과 구분',async()=>{
 const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const generated=JSON.parse(await readFile(new URL('../data/generated-recipe-images.json',import.meta.url),'utf8'));
 assert.equal(generated.entries.length,8);
 for(const entry of generated.entries){
  const original=recipes.find(r=>r.id===entry.recipeId);assert.ok(original);
  const image=applyRecipeImages([original],{schemaVersion:1,entries:[]},generated)[0];
  assert.equal(image.imageKind,'generated');assert.equal(image.ingredients,original.ingredients);
  const bytes=await readFile(new URL(image.imagePath));assert.equal(bytes.subarray(1,4).toString(),'PNG');
 }
 const bad={...generated,entries:[{...generated.entries[0],path:'../private.png'}]};
 const r=recipes.find(r=>r.id===bad.entries[0].recipeId);assert.equal(applyRecipeImages([r],{},bad)[0].imagePath,null);
});
