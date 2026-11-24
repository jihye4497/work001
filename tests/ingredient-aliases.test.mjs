import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {INGREDIENT_ALIAS_GROUPS} from '../js/ingredient-aliases.js';
import {ingredientDisplayName} from '../js/ingredient-display-names.js';
import {representativeIngredient,matchIngredient} from '../js/ingredient-matching.js';
import {searchIngredients} from '../js/ingredients.js';
import {ingredientBrowseGroup,browseIngredients} from '../js/ingredient-browse.js';
import {aggregate,partitionShoppingRows,totalText} from '../js/shopping-list.js';
import {createStore,KEYS,defaultDraft} from '../js/storage.js';
import {syncMenuIngredients} from '../js/menu-ingredients.js';
import {recommend} from '../js/recommendations.js';
const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
const byId=new Map(ingredients.map(i=>[i.id,i]));const get=name=>ingredients.find(i=>i.name===name);
const recipe=item=>({id:'alias-fixture',name:'양파 생강 로즈마리 볶음',baseServings:1,ingredients:[{ingredientId:item.id,amount:10,unit:'g',note:null}]});
test('승인된 모든 표기는 등록된 대표 재료로 연결하고 목록·검색에서 중복 제거',()=>{
 const before=JSON.stringify(ingredients);
 for(const group of INGREDIENT_ALIAS_GROUPS){
  const registered=get(group.name);assert.ok(registered,group.name);const target=representativeIngredient(registered,byId);
  for(const alias of group.aliases){const source=get(alias);assert.ok(source,alias);assert.equal(representativeIngredient(source,byId).id,target.id,alias);assert.equal(matchIngredient(source.id,target.id,recipe(source),byId),2);assert.ok(searchIngredients(ingredients,alias).some(i=>i.id===target.id));for(const category of ['농산물','육·수산','기타','양념'])assert.equal(browseIngredients(ingredients,category).some(i=>i.id===source.id),false);}
 }
 assert.equal(JSON.stringify(ingredients),before);
});
test('생강가루·즙·청, 치즈가루·치즈, 생허브·건허브는 자동 대체하지 않음',()=>{
 for(const [a,b] of [['생강','생강가루'],['생강','생강즙'],['생강','생강청'],['바질','건바질'],['바질','바질페스토'],['로즈마리','건로즈마리'],['파르메산 치즈','파르메산 치즈가루'],['파프리카','파프리카가루'],['양파','적양파']])assert.equal(matchIngredient(get(a).id,get(b).id,recipe(get(a)),byId),0,`${a}/${b}`);
});

test('건조 재료는 건 접두어로 표시하고 동일 건조 재료만 선택 통합',()=>{
 const labels={'건 표고버섯':'건표고버섯','마른 표고버섯':'건표고버섯','월계수잎마른것':'건월계수잎','오레가노마른것':'건오레가노','파슬리말린것':'건파슬리','말린 자두':'건자두','말린 매생이':'건매생이','건조체리':'건체리','건조미역줄기':'건미역줄기','마른미역줄기':'건미역줄기','말린오미자':'건오미자','말린 크랜베리':'건크랜베리','말린 아로니아':'건아로니아','말린 능이버섯':'건능이버섯','건조 코코넛':'건코코넛','말린 토마토':'건토마토','건조토마토':'건토마토','드라이토마토':'건토마토','마른 새우':'건새우','홍고추마른것':'건홍고추','말린 홍고추':'건홍고추','말린 청양고추':'건청양고추','마른 다시마':'건다시마'};
 for(const [name,label] of Object.entries(labels)){
  assert.equal(ingredientDisplayName(get(name)),label,name);
  const target=representativeIngredient(get(name),byId);
  assert.ok(searchIngredients(ingredients,label).some(i=>i.id===target.id),label);
 }
 for(const [a,b] of [['말린 토마토','토마토'],['말린 크랜베리','크랜베리'],['말린 자두','자두'],['건새우','새우'],['건고추','건홍고추'],['파슬리말린것','파슬리가루']]){
  assert.equal(matchIngredient(get(a).id,get(b).id,recipe(get(a)),byId),0,`${a}/${b}`);
 }
 const names=['말린 토마토','건조토마토','드라이토마토'];
 const r={id:'dried-tomatoes',name:'검수',baseServings:1,ingredients:names.map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:null}))};
 const before=JSON.stringify(r),rows=aggregate(ingredients,[r],[{recipeId:r.id,servings:1}],1);
 assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'30g');
 assert.deepEqual(rows[0].uses.map(u=>u.originalIngredientName),names);assert.equal(JSON.stringify(r),before);
});

test('멜론·크랜베리 표기 통합은 원문과 수량·저장 선택을 보존하고 다른 제품과 구분',()=>{
 for(const [a,b] of [['크랜베리','말린 크랜베리'],['멜론','메로나'],['케첩','저당 케첩'],['토르티야','통밀또띠아'],['커민','커민파우더'],['에멘탈 치즈','모차렐라 치즈']]){
  assert.equal(matchIngredient(get(a).id,get(b).id,recipe(get(a)),byId),0,`${a}/${b}`);
 }
 const names=['크랜베리','크렌베리','크린베리'];
 const r={id:'cranberry-spelling',name:'검수',baseServings:1,ingredients:names.map(name=>({ingredientId:get(name).id,amount:10,unit:'g',note:null}))};
 const before=JSON.stringify(r),draft={...defaultDraft(),selectedIngredientIds:names.map(n=>get(n).id),manualIngredientIds:names.map(n=>get(n).id),activeInterestIds:names.map(n=>get(n).id),selectedRecipes:[{recipeId:r.id,servings:1}]};
 syncMenuIngredients(draft,ingredients,[r]);
 assert.deepEqual(draft.selectedIngredientIds,[get('크랜베리').id]);
 const rows=aggregate(ingredients,[r],draft.selectedRecipes,1);
 assert.equal(rows.length,1);assert.equal(totalText(rows[0]),'30g');
 assert.deepEqual(rows[0].uses.map(u=>u.originalIngredientName),names);assert.equal(JSON.stringify(r),before);
 const saved=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:[get('메론').id,...names.map(n=>get(n).id)],excludedRecipeIds:[]})]]);
 const store=createStore({getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)});store.reconcile(ingredients,[r]);
 assert.deepEqual(store.pantryIngredientIds,[get('멜론').id,get('크랜베리').id]);
});
test('자동 관심·보유·추천·합산은 대표 재료로 연결하며 단위·원문 손질 메모 유지',()=>{
 const source=get('다진 양파'),target=get('양파');const r=recipe(source);
 const draft={...defaultDraft(),selectedIngredientIds:[source.id],manualIngredientIds:[source.id],activeInterestIds:[source.id],selectedRecipes:[{recipeId:r.id,times:1}]};
 syncMenuIngredients(draft,ingredients,[r]);assert.deepEqual(draft.selectedIngredientIds,[target.id]);assert.deepEqual(draft.manualIngredientIds,[target.id]);
 assert.equal(recommend(ingredients,[r],{...draft,selectedRecipes:[]}).length,1);
 const rows=aggregate(ingredients,[r],draft.selectedRecipes,1);assert.equal(rows[0].ingredient.id,target.id);assert.equal(totalText(rows[0]),'10g');assert.equal(rows[0].uses[0].originalIngredientName,'다진 양파');assert.equal(partitionShoppingRows(rows,[source.id],ingredients)[1].rows.length,1);
 const map=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:[source.id,target.id],excludedRecipeIds:[]})]]);const store=createStore({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});store.reconcile(ingredients,[r]);assert.deepEqual(store.pantryIngredientIds,[target.id]);
 const rosemary=get('로즈마리마다진것');const herb=recipe(rosemary);const hd={...defaultDraft(),selectedIngredientIds:[get('로즈마리').id],activeInterestIds:[get('로즈마리').id]};assert.equal(recommend(ingredients,[herb],hd).length,1);
});


test('추가 승인 재료 분류·조리용 물 제외와 불린 상태 분리는 원문 수량을 보존',()=>{
 assert.deepEqual(ingredientBrowseGroup(get('보리새우')),{category:'육·수산',subcategory:'해산물'});
 assert.deepEqual(ingredientBrowseGroup(get('땅콩버터')),{category:'기타',subcategory:'가공식품'});
 for(const [a,b] of [['들깨가루','거피들깨가루'],['된장','미소된장'],['레몬','레몬껍질'],['레몬즙','레몬껍질']])assert.equal(matchIngredient(get(a).id,get(b).id,recipe(get(a)),byId),0);
 const water=get('건표고버섯 불릴 물');const r=recipe(water);
 const rows=aggregate(ingredients,[r],[{recipeId:r.id,times:1}],1);
 assert.equal(totalText(rows[0]),'10g');assert.equal(rows[0].uses[0].originalIngredientName,water.name);
 assert.equal(partitionShoppingRows(rows,[],ingredients)[0].rows.length,0);
 assert.equal(searchIngredients(ingredients,water.name).length,0);
 assert.equal(browseIngredients(ingredients,'양념').some(i=>i.id===water.id),false);
});

test('고기 표기를 합쳐도 축종·부위·뼈·양념·고춧가루 입자와 매운맛은 구분',()=>{
 for(const [a,b] of [['닭다릿살','닭다리'],['닭다릿살','통닭다리'],['닭 가슴살','닭다릿살'],['닭 가슴살','조미닭가슴살'],['닭고기살','닭'],['닭고기살','닭 가슴살'],['다진 돼지고기','소고기 다짐육'],['다진 돼지고기','돼지목살다진것'],['다진 돼지고기','돼지 앞다리살'],['소고기 다짐육','다진 쇠고기 등심'],['고춧가루','고운 고춧가루'],['고춧가루','굵은 고춧가루'],['고춧가루','청양고춧가루'],['고춧가루','매운고춧가루']])assert.equal(matchIngredient(get(a).id,get(b).id,recipe(get(a)),byId),0,`${a}/${b}`);
 const names=['다진 돼지고기','돈민찌','돈육(분쇄육)','돼지고기다진것'];
 const r={id:'minced',name:'다짐육 요리',baseServings:1,ingredients:names.map((name,index)=>({ingredientId:get(name).id,amount:10*(index+1),unit:'g',note:`원문: ${name}`}))};
 const before=JSON.stringify(r),rows=aggregate(ingredients,[r],[{recipeId:r.id,servings:1}],1);
 assert.equal(rows.length,1);assert.equal(rows[0].ingredient.id,get('다진 돼지고기').id);assert.equal(totalText(rows[0]),'100g');assert.deepEqual(rows[0].uses.map(u=>u.originalIngredientName),names);assert.equal(JSON.stringify(r),before);
 const map=new Map([[KEYS.preferences,JSON.stringify({schemaVersion:1,pantryIngredientIds:names.map(name=>get(name).id),excludedRecipeIds:[]})]]);
 const store=createStore({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)});store.reconcile(ingredients,[r]);assert.deepEqual(store.pantryIngredientIds,[get('다진 돼지고기').id]);
 const draft={...defaultDraft(),selectedIngredientIds:[get('돈민찌').id],manualIngredientIds:[get('돈민찌').id],activeInterestIds:[get('돈민찌').id],selectedRecipes:[{recipeId:r.id,servings:1}]};syncMenuIngredients(draft,ingredients,[r]);assert.deepEqual(draft.selectedIngredientIds,[get('다진 돼지고기').id]);assert.equal(recommend(ingredients,[r],{...draft,selectedRecipes:[]}).length,1);
});

test('괄호·공백·쇠/소 검색은 같은 부위로 모으고 원문에 명시된 손질 고기 부위를 유지',()=>{
 for(const [query,target] of [['쇠등심','소고기 등심'],['소등심','소고기 등심'],['소고기(등심)','소고기 등심'],['소고기양지','소고기 양지'],['소고기 ( 양지 )','소고기 양지'],['돼지고기삼겹살','삼겹살'],['훈제오리가슴살','훈제 오리'],['얇게 썬 쇠고기','부채살'],['채썬쇠고기','소고기 우둔살']])assert.ok(searchIngredients(ingredients,query).some(i=>i.id===get(target).id),query);
 for(const [a,b] of [['부채살','소고기 우둔살'],['소고기 등심','돼지고기 등심'],['소고기 양지','소고기 사태'],['소고기','대패삼겹살'],['훈제 오리','오리고기'],['돼지고기 등심','등심얇게썬것']])assert.equal(matchIngredient(get(a).id,get(b).id,{name:'일반 요리'},byId),0,`${a}/${b}`);
});

test('띄어쓰기만 다른 별칭이 대표 재료까지 숨기지 않고 외래어·손질 표기를 통합',()=>{
 for(const group of INGREDIENT_ALIAS_GROUPS){
  const target=representativeIngredient(get(group.name),byId),category=ingredientBrowseGroup(target).category;
  assert.ok(browseIngredients(ingredients,category).some(i=>i.id===target.id),group.name);
 }
 for(const [query,target] of [['건표고버섯','건 표고버섯'],['마른표고버섯','건 표고버섯'],['다진파','대파'],['카엔페퍼','카옌 페퍼'],['카엔패퍼','카옌 페퍼'],['케이엔페퍼','카옌 페퍼'],['키엔페퍼','카옌 페퍼'],['일본식고체형카레','고형 카레'],['고체카레','고형 카레']])assert.ok(searchIngredients(ingredients,query).some(i=>i.id===get(target).id),query);
 for(const [a,b] of [['대파','쪽파'],['대파','실파'],['표고버섯','건 표고버섯'],['표고버섯가루','건 표고버섯'],['카레 가루','고형 카레'],['오레가노','오레가노마른것'],['사과','사과즙']])assert.equal(matchIngredient(get(a).id,get(b).id,{name:'테스트'},byId),0,`${a}/${b}`);
});

test('양념 오타·동의어는 모으고 입자·껍질·생건조·미기재 카레 형태는 추정하지 않음',()=>{
 for(const [query,target] of [['와사미','고추냉이'],['와사비','고추냉이'],['통깨','참깨'],['커리 가루','카레 가루'],['코리엔더파우더','코리앤더가루'],['할라피뇨다진것','할라피뇨'],['통후추부순것','통후추'],['건월계수잎','월계수잎마른것'],['건오레가노','오레가노마른것']])assert.ok(searchIngredients(ingredients,query).some(i=>i.id===get(target).id),query);
 for(const [a,b] of [['코리앤더 씨드','코리앤더가루'],['고수','코리앤더가루'],['통후추','후추가루'],['통후추','흰 후추'],['들깨가루','거피들깨가루'],['카레','카레 가루'],['카레 가루','고형 카레'],['월계수잎','월계수잎마른것'],['오레가노','오레가노마른것'],['할라피뇨','할라피뇨 피클']])assert.equal(matchIngredient(get(a).id,get(b).id,{name:'테스트'},byId),0,`${a}/${b}`);
 const source=get('와사미'),r=recipe(source),before=JSON.stringify(r),rows=aggregate(ingredients,[r],[{recipeId:r.id,servings:1}],1);
 assert.equal(rows[0].ingredient.id,get('고추냉이').id);assert.equal(rows[0].uses[0].originalIngredientName,'와사미');assert.equal(totalText(rows[0]),'10g');assert.equal(JSON.stringify(r),before);
});
