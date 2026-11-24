import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ingredientBrowseGroup,browseIngredients} from '../js/ingredient-browse.js';
import {ingredientDisplayName,ingredientDetailNote,SEAFOOD_DISPLAY_NAMES} from '../js/ingredient-display-names.js';
import {searchIngredients} from '../js/ingredients.js';
import {matchIngredient,representativeIngredient} from '../js/ingredient-matching.js';
import {aggregate,totalText} from '../js/shopping-list.js';
import {createStore,KEYS} from '../js/storage.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const get=name=>ingredients.find(i=>i.name===name),byId=new Map(ingredients.map(i=>[i.id,i]));

test('승인된 미더덕·조갯살 분류와 동의어 통합은 특정 조개·수량·저장을 보존',()=>{
 for(const name of ['미더덕','조개살','조갯살'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'육·수산',subcategory:'해산물'});
 assert.equal(representativeIngredient(get('조개살'),byId).id,get('조갯살').id);
 assert.deepEqual(searchIngredients(ingredients,'조개살').map(i=>i.id),[get('조갯살').id]);
 assert.ok(!browseIngredients(ingredients,'육·수산','생선').some(i=>['미더덕','조개살','조갯살'].includes(i.name)));
 assert.equal(matchIngredient(get('조갯살').id,get('바지락').id,{name:'테스트'},byId),0);
 const recipe={id:'clams',name:'조개 요리',baseServings:1,ingredients:['조개살','조갯살'].map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:null}))};
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1}],1);assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'20g');
 const map=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:[get('조개살').id,get('조갯살').id],excludedRecipeIds:[]})]]);
 const store=createStore({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});store.reconcile(ingredients,[recipe]);assert.deepEqual(store.pantryIngredientIds,[get('조갯살').id]);
});

test('고기·내장·가공품은 생선으로 분류하지 않고 실제 생선·곁들임 채소는 유지',()=>{
 for(const name of ['대패 목살','등심얇게썬것','부채살','소힘줄','소불고기','항정살','염통','오돌뼈','오소리감투','초벌소깐양'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'육·수산',subcategory:'고기'},name);
 for(const name of ['스팸(마일드)','육포','페퍼로니','편육','통단팥'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'기타',subcategory:'가공식품'},name);
 for(const name of ['손질된 고등어','손질된 흰살생선','연어 필렛'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'육·수산',subcategory:'생선'},name);
 assert.deepEqual(ingredientBrowseGroup(get('곁들임 채소')),{category:'농산물',subcategory:'채소'});
 assert.equal(ingredientDisplayName(get('항정살')),'돼지고기(항정살)');
 assert.equal(ingredientDisplayName(get('초벌소깐양')),'소고기(깐양)');
 assert.equal(ingredientDisplayName(get('염통')),'돼지고기(염통)');
 assert.equal(ingredientDisplayName(get('오돌뼈')),'돼지고기(오돌뼈)');
 assert.equal(matchIngredient(get('오돌뼈').id,get('닭오돌뼈').id,{name:'테스트'},byId),0);
 assert.match(ingredientDisplayName(get('등심얇게썬것')),/축종 미기재/);
});

test('사이즈·동의어·부분 재료 선택을 통합하고 다른 식품과 가공품은 구분',()=>{
 const before=JSON.stringify(ingredients);
 for(const [source,base] of [['표고버섯 밑동','표고버섯'],['표고버섯 기둥','표고버섯'],['참느타리버섯','느타리버섯'],['건곤드레','건곤드레나물'],['아보카도작은것','아보카도'],['사과작은것','사과'],['수박 속껍질','수박껍질'],['체리토마토','방울토마토'],['보리','보리쌀'],['현미(불린것)','현미'],['현미쌀','현미'],['옥수수알','옥수수'],['옥수수콘','캔 옥수수'],['완두콩알','완두콩'],['혼합견과','혼합견과류'],['견과류 믹스','혼합견과류'],['슬라이스연어','연어'],['연어 필레','연어'],['손질된 고등어','고등어'],['혼다랑어가쓰오부시','가다랑어포']]){
  assert.equal(representativeIngredient(get(source),byId).id,get(base).id,source);
  assert.ok(searchIngredients(ingredients,source).some(i=>i.id===get(base).id),source);
  if(source!==base)for(const category of ['농산물','육·수산','기타','양념'])assert.ok(!browseIngredients(ingredients,category).some(i=>i.id===get(source).id),source);
 }
 for(const [a,b] of [['수박','수박껍질'],['옥수수','캔 옥수수'],['팥','통단팥'],['연어','훈제연어'],['연어','통조림 연어'],['곤드레나물','건곤드레나물'],['소불고기','소고기 불고기용'],['사과','미니사과']])assert.equal(matchIngredient(get(a).id,get(b).id,{name:'일반 요리'},byId),0,`${a}/${b}`);
 const values=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:['혼합견과','견과류 믹스','혼합견과류'].map(name=>get(name).id),excludedRecipeIds:[]})]]);
 const store=createStore({getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)});store.reconcile(ingredients,[]);assert.deepEqual(store.pantryIngredientIds,[get('혼합견과류').id]);
 assert.equal(JSON.stringify(ingredients),before);
});

test('불림·볶음·부분·손질 생선의 무게와 단위는 통재료 구매량으로 환산하지 않음',()=>{
 for(const [base,forms] of [['표고버섯',['표고버섯 밑동']],['현미',['불린 현미','볶은현미','현미(불린것)']],['수수',['볶은수수']],['율무',['볶은율무']],['쌀',['불린쌀']],['찹쌀',['불린 찹쌀']],['건곤드레나물',['불린 곤드레나물']],['고등어',['손질된 고등어','고등어 필렛']],['흰살생선',['손질된 흰살생선']],['연어',['슬라이스연어','연어 필레']],['옥수수',['옥수수알']]]){
  const recipe={id:'forms',name:'원본 상태',baseServings:1,ingredients:[base,...forms].map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:`원문 ${name} 10g`}))};
  const before=JSON.stringify(recipe),rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:2}],1);
  assert.equal(rows.length,1,base);assert.equal(rows[0].ingredient.id,get(base).id);
  assert.match(totalText(rows[0]),/20g/);assert.ok(rows[0].preparations.size>=2,base);assert.deepEqual(rows[0].uses.map(u=>u.originalIngredientName),[base,...forms]);
  assert.equal(JSON.stringify(recipe),before);
 }
});

test('추가 고기·내장은 고기, 가다랑어포·저염살라미는 가공품이며 축종(부위) 유지',()=>{
 for(const name of ['간','허파','갈매기살','구운 대창','소 늑간살','소꼬리','소대창'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'육·수산',subcategory:'고기'},name);
 for(const name of ['가다랑어포','저염살라미'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'기타',subcategory:'가공식품'},name);
 for(const [name,label] of [['소 늑간살','소고기(늑간살)'],['소꼬리','소고기(꼬리)'],['소대창','소고기(대창)'],['갈매기살','돼지고기(갈매기살)'],['간','축종 미기재(간)'],['허파','축종 미기재(허파)'],['구운 대창','축종 미기재(대창)']])assert.equal(ingredientDisplayName(get(name)),label);
 assert.equal(ingredientDisplayName(get('생선살')),'생선살');assert.equal(ingredientDisplayName(get('회')),'회');
});

test('황태채·황태포는 선택을 공유하되 각 원문 형태와 수량 유지',()=>{
 assert.ok(searchIngredients(ingredients,'황태채').some(i=>i.id===get('황태포').id));
 const recipe={id:'pollock',name:'황태 요리',baseServings:1,ingredients:['황태포','황태채'].map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:`원문 ${name}`}))};
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:2}],1);
 assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'황태포 20g + 황태채 20g');assert.deepEqual(rows[0].uses.map(u=>u.originalIngredientName),['황태포','황태채']);
});

test('칠게·민물 패류는 해산물, 잡채용 등심은 사용자 돼지 추정과 원문 양 유지',()=>{
 for(const name of ['칠게','논우렁','다슬기살'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'육·수산',subcategory:'해산물'});
 assert.equal(representativeIngredient(get('잡채용 등심'),byId).id,get('돼지고기 등심').id);
 assert.equal(ingredientDisplayName(get('잡채용 등심')),'돼지고기(등심·추정)');
 const recipe={id:'estimated-pork',name:'잡채',baseServings:1,ingredients:[{ingredientId:get('잡채용 등심').id,amount:200,unit:'g',note:'원문: 잡채용 등심 200g'}]};
 const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1}],1);
 assert.equal(totalText(rows[0]),'돼지고기(등심·추정) 200g');assert.equal(rows[0].uses[0].originalIngredientName,'잡채용 등심');
 assert.match(ingredientDisplayName(get('등심얇게썬것')),/축종 미기재/);
});

test('해산물 분류·표시명과 손질·오타 연결, 어종 안내는 장보기 목록에만 유지',()=>{
 for(const name of ['우렁','우렁이','해물','오만둥이','패주'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'육·수산',subcategory:'해산물'});
 for(const name of ['대구 이리','동태 이리','이리'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'육·수산',subcategory:'생선'});
 for(const name of ['게살(크래미)','크래미','새우튀김'])assert.deepEqual(ingredientBrowseGroup(get(name)),{category:'기타',subcategory:'가공식품'});
 for(const [source,base] of [['우렁','우렁이'],['패주','관자'],['게살(크래미)','크래미'],['새우(대하)','대하'],['새우살다진것','새우살'],['잔새우살다진것','새우살'],['칵텔새우','칵테일새우'],['멍게살','멍게'],['소라살','소라'],['전복살','전복']])assert.equal(representativeIngredient(get(source),byId).id,get(base).id,source);
 for(const [name,label] of Object.entries(SEAFOOD_DISPLAY_NAMES)){assert.ok(get(name),name);assert.equal(ingredientDisplayName(get(name)),label);}
 assert.ok(searchIngredients(ingredients,'오만둘이').some(i=>i.id===get('오만둥이').id));
 for(const name of ['회','생선살','알']){
  assert.equal(ingredientDisplayName(get(name)),name);
  const recipe={id:'note',name:'확인 필요',baseServings:1,ingredients:[{ingredientId:get(name).id,amount:10,unit:'g',note:`원문 ${name}`} ]};
  const rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:1}],1);assert.equal(rows[0].detailNote,ingredientDetailNote(name));assert.match(rows[0].detailNote,/원문에 명시되지/);
 }
 assert.equal(matchIngredient(get('게살').id,get('크래미').id,{name:'테스트'},byId),0);
});

test('멍게·소라·전복의 살 수량을 통째 무게와 합치거나 환산하지 않음',()=>{
 for(const base of ['멍게','소라','전복']){
  const recipe={id:'parts',name:'원문 부위',baseServings:1,ingredients:[base,base+'살'].map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:null}))};
  const before=JSON.stringify(recipe),rows=aggregate(ingredients,[recipe],[{recipeId:recipe.id,servings:2}],1);
  assert.equal(rows.length,1);assert.equal(totalText(rows[0]),`${base} 20g + ${base}(살) 20g`);assert.equal(JSON.stringify(recipe),before);
 }
});
