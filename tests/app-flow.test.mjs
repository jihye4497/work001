// Minimal DOM test double exercises app event wiring; it does not verify rendering.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
class Element {
  constructor(tag='div') { this.tagName=tag;this.childNodes=[];this.attrs={};this.events={};this.hidden=false;this.disabled=false;this.checked=false;this.name='';this.type='';this.value='';this.className='';this.open=false;this.scrollLeft=0;this.dataset={}; }
  append(...nodes) { for(const node of nodes){node.parent=this;this.childNodes.push(node);} }
  replaceChildren(...nodes) { this.childNodes=[];this.append(...nodes); }
  setAttribute(k,v) { this.attrs[k]=String(v);if(k==='id')this.id=v;if(k==='class')this.className=v; }
  removeAttribute(k){delete this.attrs[k];}
  getAttribute(k) {return this.attrs[k];}
  addEventListener(k,fn) {(this.events[k] ||= []).push(fn);}
  async fire(k,event={}) {for(const fn of this.events[k]||[])await fn({target:this,preventDefault(){},...event});}
  async click(){if(!this.disabled)await this.fire('click');}
  focus(){document.activeElement=this;}
  select(){this.selected=true;}
  scrollIntoView(options){this.scrollOptions=options;}
  remove(){if(this.parent)this.parent.childNodes=this.parent.childNodes.filter(x=>x!==this);}
  showModal(){this.open=true;}
  close(){this.open=false;void this.fire('close');}
  get children(){return this.childNodes;}
  get textContent(){return this.text??this.childNodes.map(x=>x.textContent).join('');}
  set textContent(v){this.text=String(v);this.childNodes=[];}
}
const all=node=>[node,...node.childNodes.flatMap(all)];
const find=(node,predicate)=>all(node).find(predicate);
const button=(node,text)=>find(node,x=>x.tagName==='button'&&x.textContent===text);
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const load=async (page,excludedIds=[],overrides={})=>{
  globalThis.Node=Element;
  const body=new Element('body');body.dataset.page=page;
  for(const id of ['app','warnings','live']){const node=new Element();node.id=id;body.append(node);}
  const setting=new Element('a');setting.attrs['data-settings']='';body.append(setting);
  globalThis.document={body,createElement:tag=>new Element(tag),createTextNode:text=>{const n=new Element('#text');n.textContent=text;return n;},getElementById:id=>find(body,x=>x.id===id),querySelector:selector=>selector.startsWith('#')?find(body,x=>x.id===selector.slice(1)):find(body,x=>x.className.split(' ').includes(selector.slice(1))),querySelectorAll:()=>[setting]};
  const saved=new Map([['jmd_settings_v1',JSON.stringify({'기본 식사 인원':2,'기본 추천 방식':'재료 최대 활용형'})],['jmd_draft_v1',JSON.stringify({schemaVersion:1,selectedIngredientIds:['onion'],selectedRecipes:[],activeRecommendationMode:'재료 최대 활용형',checkedIngredientIds:[]})]]);
  if(overrides.people)saved.set('jmd_settings_v1',JSON.stringify({'기본 식사 인원':overrides.people,'기본 추천 방식':'추가 구매 최소'}));
  if(overrides.unconfigured)saved.delete('jmd_settings_v1');
  if(overrides.draft)saved.set('jmd_draft_v1',JSON.stringify(overrides.draft));
  saved.set('jmd_recipe_preferences_v1',JSON.stringify({schemaVersion:1,excludedRecipeIds:excludedIds,pantryIngredientIds:overrides.pantry||[]}));
  globalThis.window={localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)}};
  globalThis.location={pathname:`/${page}.html`,hash:overrides.hash||'',search:overrides.search||'',protocol:'http:',href:`http://localhost/${page}.html`,assign(href){this.assigned=href;}};
  globalThis.history={replaceState(){}};
  // app.js derives its data URLs from import.meta.url (file: in this test).
  globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
  await import(`../js/app.js?flow=${page}-${Math.random()}`);
  for(let i=0;i<10&&!find(body,x=>x.className.includes(page==='recipes'?'recipe-card':page==='home'?'home-mode-guide':page==='shopping-list'?'shopping-category':'settings-form'));i++)await new Promise(resolve=>setTimeout(resolve,10));
  return {body,saved};
};

test('추천 화면의 다중 선택·담기·횟수 편집·제외와 실행 취소가 연결됨',async()=>{
  const {body,saved}=await load('recipes');
  assert.ok(find(body,x=>x.className.includes('recipe-card')));
  await document.getElementById('food-1').click();await document.getElementById('food-2').click();
  assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).selectedFoodCategories,['한식 주메뉴','한식 반찬']);
  const card=find(body,x=>x.className.includes('recipe-card'));
  await button(card,'담기 +').click();
  assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
  await document.getElementById('selected-drawer-toggle').click();
  await button(body,'+').click();
  assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes[0].servings,3);
  await document.getElementById('mode-0').click();
  const next=find(body,x=>x.className.includes('recipe-card'));
  await button(next,'앞으로 추천받지 않기').click();
  assert.equal(JSON.parse(saved.get('jmd_recipe_preferences_v1')).excludedRecipeIds.length,1);
  await button(body,'실행 취소').click();
  assert.equal(JSON.parse(saved.get('jmd_recipe_preferences_v1')).excludedRecipeIds.length,0);
});

test('기본 설정 관리창은 검색·개별 및 전체 복원·확인 취소·닫기를 처리하며 입력을 보존',async()=>{
  const raw=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
  const {body,saved}=await load('settings',raw.slice(0,35).map(r=>r.id));
  const radios=all(body).filter(x=>x.tagName==='input'&&x.name==='servings');
  assert.equal(radios.length,4);
  const chosen=radios[3];chosen.checked=true;await chosen.fire('change');
  const trigger=document.getElementById('manage-excluded');await trigger.click();await settle();
  const dialog=find(body,x=>x.tagName==='dialog');assert.equal(dialog.open,true);
  const rows=()=>all(dialog).filter(x=>x.className==='excluded-row');
  assert.equal(rows().length,10);await button(dialog,'더 보기').click();assert.equal(rows().length,20);
  const search=document.getElementById('excluded-search');search.value=raw[30].name;await search.fire('input');
  assert.equal(rows().length,1);await button(rows()[0],'다시 추천받기').click();assert.equal(rows().length,0);
  await button(dialog,'실행 취소').click();assert.equal(rows().length,1);
  const restoreAll=all(dialog).find(x=>x.tagName==='button'&&x.textContent==='모두 다시 추천받기');
  await restoreAll.click();await button(dialog,'취소').click();
  assert.equal(JSON.parse(saved.get('jmd_recipe_preferences_v1')).excludedRecipeIds.length,35);
  await restoreAll.click();
  const confirm=all(dialog).find(x=>x.tagName==='button'&&x.textContent==='모두 다시 추천받기'&&x!==restoreAll);
  await confirm.click();assert.equal(JSON.parse(saved.get('jmd_recipe_preferences_v1')).excludedRecipeIds.length,0);
  assert.match(dialog.textContent,/제외한 메뉴가 없어요/);
  await button(dialog,'실행 취소').click();assert.equal(JSON.parse(saved.get('jmd_recipe_preferences_v1')).excludedRecipeIds.length,35);
  await button(dialog,'닫기').click();
  assert.equal(document.getElementById('manage-excluded'),trigger);
  assert.equal(document.activeElement,trigger);
  assert.ok(all(body).includes(chosen));assert.equal(chosen.checked,true);
  await find(body,x=>x.tagName==='form').fire('submit');
  assert.equal(JSON.parse(saved.get('jmd_settings_v1'))['기본 식사 인원'],4);
});

test('홈에서 인원을 저장하고 보유 재료는 재료 선택의 별도 탭에 저장',async()=>{
 const {body,saved}=await load('home',[],{unconfigured:true});
 await document.getElementById('people-3').click();
 assert.equal(document.getElementById('people-3'),undefined);
 assert.equal(document.getElementById('pantry-quick-onion'),undefined);
 assert.ok(document.getElementById('home-start'));
 await load('ingredients',[],{search:'?tab=pantry'});
 await document.getElementById('pantry-quick-onion').click();
 assert.equal(JSON.parse(saved.get('jmd_settings_v1'))['기본 식사 인원'],3);
 assert.ok(document.getElementById('source-pantry').textContent.includes('1'));
 assert.match(body.textContent,/재료 선택하러 가기/);
});
test('메뉴 검색은 재료 해제 후에도 전체에서 찾고 검색 지우면 추천 조건을 복원',async()=>{
 const {body,saved}=await load('recipes');
 await document.getElementById('interest-onion').click();
 assert.equal(all(body).filter(x=>x.className==='recipe-card panel').length,0);
 const search=document.getElementById('menu-search');search.value='김치찌개';await search.fire('input');
 assert.ok(find(body,x=>x.className.includes('search-menu-option')));
 await find(body,x=>x.className.includes('search-menu-option')).click();
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
 const current=document.getElementById('menu-search');current.value='';await current.fire('input');
 const updated=JSON.parse(saved.get('jmd_draft_v1'));
 assert.ok(updated.selectedIngredientIds.length>1);
 assert.equal(updated.activeInterestIds.includes('onion'),false);
 assert.match(body.textContent,/선택 메뉴 1개/);
});

test('장보기 보유별 구획·현재 인원·횟수·복사·체크와 초기화 취소·확인이 연결됨',async()=>{
 const {body,saved}=await load('shopping-list',['excluded'],{pantry:['onion'],draft:{schemaVersion:1,selectedIngredientIds:['squid'],selectedRecipes:[{recipeId:'squid-stir',times:2}],activeRecommendationMode:'재료 최대 활용형',checkedIngredientIds:[]}});
 assert.match(body.textContent,/구매할 재료/);assert.match(body.textContent,/집에 있는 재료/);assert.match(body.textContent,/양념/);
 assert.match(body.textContent,/4인분/);
 await button(body,'+').click();
 assert.match(body.textContent,/5인분/);
 const owned=find(body,x=>x.className.includes('owned-disclosure'));owned.open=true;await owned.fire('toggle');
 const check=document.getElementById('check-squid');check.checked=true;await check.fire('change');
 let copied='';Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{copied=text;}}}});
 await button(body,'목록 복사').click();
 assert.match(copied,/^오징어:/);assert.equal(copied.includes('양파'),false);assert.equal(copied.split('\n').length,1);
 await button(body,'새 장보기 시작').click();let dialog=find(body,x=>x.tagName==='dialog');await button(dialog,'취소').click();
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes[0].servings,5);
 await button(body,'새 장보기 시작').click();dialog=find(body,x=>x.tagName==='dialog');await button(dialog,'새 장보기 시작').click();
 assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes,[]);
 assert.deepEqual(JSON.parse(saved.get('jmd_recipe_preferences_v1')).pantryIngredientIds,['onion']);
 assert.deepEqual(JSON.parse(saved.get('jmd_recipe_preferences_v1')).excludedRecipeIds,['excluded']);
});

test('이전 홈 보유 링크는 재료 선택 보유 탭으로 연결하고 보유 편집을 직접 열 수 있음',async()=>{
 await load('home',[],{hash:'#pantry'});
 assert.match(location.assigned,/ingredients.html\?tab=pantry$/);
 await load('ingredients',[],{search:'?tab=pantry'});
 assert.ok(document.getElementById('pantry-search'));
 assert.equal(document.getElementById('ingredient-search'),undefined);
 await document.getElementById('source-planned').click();
 assert.ok(document.getElementById('ingredient-search'));
});

test('재료 카테고리는 한 종류씩 표시하며 검색은 다른 종류도 찾고 저장한 재료를 유지',async()=>{
 const {body,saved}=await load('ingredients',[],{search:'?tab=planned'});
 assert.ok(document.getElementById('ingredient-quick-carrot'));
 assert.equal(document.getElementById('ingredient-quick-squid'),undefined);
 await document.getElementById('ingredient-category-1').click();
 assert.equal(document.getElementById('ingredient-quick-onion'),undefined);
 await document.getElementById('ingredient-quick-squid').click();
 assert.ok(JSON.parse(saved.get('jmd_draft_v1')).selectedIngredientIds.includes('squid'));
 const input=document.getElementById('ingredient-search');input.value='양파';await input.fire('input');
 assert.match(document.getElementById('ingredient-results').textContent,/양파/);
 await document.getElementById('ingredient-category-0').click();
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedIngredientIds.includes('squid'),true);
});
test('선택 메뉴는 최초 세 행·항상 보이는 횟수 조정, 상세 펼침과 구매 체크는 독립',async()=>{
 const raw=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const {body,saved}=await load('shopping-list',[],{pantry:['salt'],draft:{schemaVersion:1,selectedIngredientIds:['onion'],selectedRecipes:raw.slice(0,5).map(r=>({recipeId:r.id,times:1})),activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]}});
 const rows=()=>all(body).filter(x=>x.className==='selected-line');
 assert.equal(rows().length,3);
 assert.equal(document.getElementById(`minus-${raw[0].id}`).disabled,false);
 await document.getElementById(`plus-${raw[0].id}`).click();
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes[0].servings,3);
 await document.getElementById('toggle-selected').click();assert.equal(rows().length,5);
 const detail=all(body).find(x=>x.id?.startsWith('ingredient-detail-'));
 const useId=detail.attrs['aria-controls'];assert.equal(document.getElementById(useId).hidden,true);
 await detail.click();assert.equal(document.getElementById(useId).hidden,false);
 const ingredientId=useId.slice('uses-'.length);const check=document.getElementById(`check-${ingredientId}`);check.checked=true;await check.fire('change');
 assert.equal(document.getElementById(useId).hidden,false);
 await document.getElementById(`ingredient-detail-${ingredientId}`).click();assert.equal(document.getElementById(useId).hidden,true);
});

test('구매 최소는 관심 버튼을 숨기고 두 방식 모두 음식 종류를 노출하며 관심 선택을 보존',async()=>{
 const {body,saved}=await load('recipes');
 await document.getElementById('interest-onion').click();
 assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).activeInterestIds,[]);
 await document.getElementById('mode-0').click();
 assert.equal(document.getElementById('interest-onion'),undefined);
 assert.ok(document.getElementById('food-8'));
 assert.equal(find(body,x=>x.className==='food-disclosure'),undefined);
 assert.ok(find(body,x=>x.className==='recipe-card panel'));
 await document.getElementById('mode-1').click();
 assert.equal(document.getElementById('interest-onion').attrs['aria-pressed'],'false');
});

test('한 글자 검색 목록·더 보기·추천 제외 무시·직접 담기와 모든 재료·양념의 장보기 연결',async()=>{
 const raw=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const recipe=raw.find(r=>r.id==='kimchi-stew');
 const {body,saved}=await load('recipes',[recipe.id],{draft:{schemaVersion:1,selectedIngredientIds:[],selectedRecipes:[],activeRecommendationMode:'추가 구매 최소',activeInterestIds:[],checkedIngredientIds:[],selectedFoodCategories:['양식']}});
 const input=document.getElementById('menu-search');
 assert.equal(document.getElementById('menu-search-list').hidden,true);
 input.value='김';await input.fire('input');
 const options=()=>all(body).filter(x=>x.className.includes('search-menu-option'));
 assert.equal(document.getElementById('menu-search-list').hidden,false);assert.equal(options().length,8);
 await button(body,'검색 결과 더 보기').click();assert.equal(options().length,16);
 input.value=recipe.name;await input.fire('input');
 const choice=options().find(x=>x.attrs['aria-label']===`${recipe.name} 담기`);assert.ok(choice);
 await input.fire('keydown',{key:'ArrowDown'});assert.ok(document.activeElement.className.includes('search-menu-option'));
 await choice.click();
 const draft=JSON.parse(saved.get('jmd_draft_v1'));assert.equal(draft.selectedRecipes[0].recipeId,recipe.id);assert.equal(draft.menuQuery,'');
 assert.equal(document.getElementById('menu-search-list').hidden,true);
 input.value=recipe.name;const current=document.getElementById('menu-search');current.value=recipe.name;await current.fire('input');
 assert.ok(options().find(x=>x.attrs['aria-label']===`${recipe.name} 담김`).disabled);
 const shopping=await load('shopping-list',[],{draft,pantry:['onion']});
 assert.equal(document.getElementById('check-water'),undefined);
 for(const id of new Set(recipe.ingredients.map(i=>i.ingredientId).filter(id=>id!=='water')))assert.ok(document.getElementById(`ingredient-detail-${id}`),`장보기 누락: ${id}`);
 assert.match(shopping.body.textContent,/양념/);
});

test('검색 메뉴를 담으면 재료가 자동 추가되고 삭제 시 직접 선택 재료만 보존',async()=>{
 const {body,saved}=await load('recipes',[],{draft:{schemaVersion:1,selectedIngredientIds:['onion'],selectedRecipes:[],activeRecommendationMode:'추가 구매 최소',activeInterestIds:['onion'],checkedIngredientIds:[]}});
 const input=document.getElementById('menu-search');input.value='김치찌개';await input.fire('input');
 const choice=all(body).find(x=>x.className.includes('search-menu-option'));await choice.click();
 let d=JSON.parse(saved.get('jmd_draft_v1'));assert.ok(d.selectedIngredientIds.length>1);assert.deepEqual(d.manualIngredientIds,['onion']);
 await document.getElementById('selected-drawer-toggle').click();
 await document.getElementById(`minus-${d.selectedRecipes[0].recipeId}`).click();await document.getElementById(`minus-${d.selectedRecipes[0].recipeId}`).click();await button(body,'메뉴 삭제').click();
 d=JSON.parse(saved.get('jmd_draft_v1'));assert.deepEqual(d.selectedRecipes,[]);assert.deepEqual(d.selectedIngredientIds,['onion']);
});

test('관심 재료 전체 선택·전체 해제·부분 선택 상태와 모드 전환 후 유지',async()=>{
 const {body,saved}=await load('recipes',[],{draft:{schemaVersion:1,selectedIngredientIds:['onion','squid'],selectedRecipes:[],activeRecommendationMode:'관심 재료 활용',activeInterestIds:['onion'],checkedIngredientIds:[]}});
 assert.equal(document.getElementById('toggle-all-interests').textContent,'모두 선택');
 await document.getElementById('toggle-all-interests').click();
 assert.deepEqual(new Set(JSON.parse(saved.get('jmd_draft_v1')).activeInterestIds),new Set(['onion','squid']));
 assert.equal(document.getElementById('toggle-all-interests').textContent,'모두 해제');
 await document.getElementById('toggle-all-interests').click();
 assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).activeInterestIds,[]);
 assert.equal(document.getElementById('toggle-all-interests').textContent,'모두 선택');
 await document.getElementById('interest-squid').click();
 assert.equal(document.getElementById('toggle-all-interests').textContent,'모두 선택');
 await document.getElementById('mode-0').click();assert.equal(document.getElementById('toggle-all-interests'),undefined);
 await document.getElementById('mode-1').click();
 assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).activeInterestIds,['squid']);
});

test('보유·구매 예정 재료는 선택하면 아래에서 숨고 위에서 해제하면 복원',async()=>{
 for(const tab of ['pantry','planned']) {
  const {body}=await load('ingredients',[],{search:`?tab=${tab}`,draft:{schemaVersion:1,selectedIngredientIds:[],selectedRecipes:[],activeRecommendationMode:'추가 구매 최소',activeInterestIds:[],checkedIngredientIds:[]}});
  const prefix=tab==='pantry'?'pantry':'ingredient';
  assert.ok(document.getElementById(`${prefix}-quick-onion`));
  await document.getElementById(`${prefix}-quick-onion`).click();
  assert.equal(document.getElementById(`${prefix}-quick-onion`),undefined);
  const selected=all(body).find(x=>x.tagName==='button'&&x.attrs['aria-label']==='양파 선택 해제');assert.ok(selected);await selected.click();
  assert.ok(document.getElementById(`${prefix}-quick-onion`));
 }
});

test('보유 선택 태그의 측정된 첫 두 줄만 표시하며 더 보기·접기와 폭 변경을 처리',async()=>{
 let measure;
 globalThis.ResizeObserver=class {constructor(callback){measure=callback;}observe(){}disconnect(){}};
 try {
  const {body}=await load('ingredients',[],{search:'?tab=pantry',pantry:['onion','potato','carrot','enoki','salt','oil']});
  const chips=document.getElementById('pantry-selected-chips').children.filter(x=>!x.className.includes('selection-more'));
  chips.forEach((chip,index)=>{chip.offsetTop=Math.floor(index/2)*56;});measure();
  assert.equal(chips.filter(x=>!x.hidden).length,4);
  await button(body,'+ 더 보기').click();assert.equal(chips.filter(x=>!x.hidden).length,6);
  await button(body,'− 접기').click();assert.equal(chips.filter(x=>!x.hidden).length,4);
  chips.forEach(chip=>{chip.offsetTop=0;});measure();
  assert.equal(chips.filter(x=>!x.hidden).length,6);assert.equal(button(body,'+ 더 보기').hidden,true);
  assert.match(body.textContent,/선택한 재료 6개/);
 } finally {delete globalThis.ResizeObserver;}
});

test('관심 선택 태그의 측정된 첫 두 줄만 표시하며 더 보기·접기와 폭 변경을 처리',async()=>{
 let measure;
 globalThis.ResizeObserver=class {constructor(callback){measure=callback;}observe(){}disconnect(){}};
 try {
  const {body}=await load('ingredients',[],{search:'?tab=planned',draft:{schemaVersion:1,selectedIngredientIds:['onion','potato','carrot','enoki','salt','oil'],selectedRecipes:[],activeRecommendationMode:'추가 구매 최소',activeInterestIds:[],checkedIngredientIds:[]}});
  const chips=document.getElementById('ingredient-selected-chips').children.filter(x=>!x.className.includes('selection-more'));
  chips.forEach((chip,index)=>{chip.offsetTop=Math.floor(index/2)*56;});measure();
  assert.equal(chips.filter(x=>!x.hidden).length,4);
  await button(body,'+ 더 보기').click();assert.equal(chips.filter(x=>!x.hidden).length,6);
  await button(body,'− 접기').click();assert.equal(chips.filter(x=>!x.hidden).length,4);
  chips.forEach(chip=>{chip.offsetTop=0;});measure();
  assert.equal(chips.filter(x=>!x.hidden).length,6);assert.equal(button(body,'+ 더 보기').hidden,true);
  assert.match(body.textContent,/선택한 재료 6개/);
 } finally {delete globalThis.ResizeObserver;}
});

test('검색 담기 알림은 보유·기존 구매를 빼고 새 재료와 양념만 표시하며 닫아도 선택 유지',async()=>{
 const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
 const {aggregate,partitionShoppingRows}=await import('../js/shopping-list.js');
 const target=recipes.find(r=>r.id==='kimchi-stew');
 const draft={schemaVersion:1,selectedIngredientIds:[],selectedRecipes:[{recipeId:'squid-stir',times:1}],activeRecommendationMode:'추가 구매 최소',activeInterestIds:[],checkedIngredientIds:[]};
 const pantry=['kimchi'];
 const before=new Set(partitionShoppingRows(aggregate(ingredients,recipes,draft.selectedRecipes,2),pantry,ingredients)[0].rows.map(r=>r.ingredient.id));
 const {body,saved}=await load('recipes',[],{draft,pantry});
 const input=document.getElementById('menu-search');input.value=target.name;await input.fire('input');
 await all(body).find(x=>x.className.includes('search-menu-option')&&x.attrs['aria-label']===`${target.name} 담기`).click();
 const feedback=document.getElementById('added-menu-feedback');assert.match(feedback.textContent,/새로 추가된 구매 재료/);
 const after=JSON.parse(saved.get('jmd_draft_v1'));
 const added=partitionShoppingRows(aggregate(ingredients,recipes,after.selectedRecipes,2),pantry,ingredients)[0].rows.filter(r=>!before.has(r.ingredient.id));
 for(const row of added)assert.ok(feedback.textContent.includes(row.ingredient.name));
 const whole=all(feedback).filter(x=>x.tagName==='li').map(x=>x.textContent);
 if(added.length>3)assert.deepEqual(whole,added.map(r=>r.ingredient.name));
 await button(feedback,'닫기').click();assert.equal(feedback.textContent,'');
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,2);
});
test('추천 카드 담기도 알림을 표시하고 모두 보유하면 추가 구매 없음으로 안내',async()=>{
 const raw=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
 const {body}=await load('recipes',[],{pantry:raw.map(i=>i.id)});
 const card=all(body).find(x=>x.className==='recipe-card panel');assert.ok(card);
 await button(card,'담기 +').click();
 assert.match(document.getElementById('added-menu-feedback').textContent,/추가로 구매할 재료가 없어요/);
});


test('원본 4인분도 설정 인분으로 시작하고 1인분 증감·취소·삭제·복원을 처리',async()=>{
 const {aggregate,totalText}=await import('../js/shopping-list.js');
 const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
 const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const recipe=recipes.find(r=>r.id==='kimchi-stew');assert.equal(recipe.baseServings,4);
 for(const people of [2,3]) {
  const draft={schemaVersion:1,selectedIngredientIds:[],selectedRecipes:[{recipeId:recipe.id,times:1}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]};
  const {body,saved}=await load('shopping-list',[],{people,draft});
  const count=()=>find(body,x=>x.className==='times-value').textContent;
  assert.match(body.textContent,new RegExp(`${people}인 · 설정`));
  assert.equal(count(),`${people}인분`);
  const meat=recipe.ingredients.find(i=>i.amount!==null&&i.unit==='g');
  const verifyAmount=servings=>{
   const row=aggregate(ingredients,recipes,[{recipeId:recipe.id,times:1,servings}],people).find(r=>r.ingredient.id===meat.ingredientId);
   assert.ok(document.getElementById(`ingredient-detail-${meat.ingredientId}`).textContent.includes(totalText(row)));
  };
  verifyAmount(people);
  await document.getElementById(`plus-${recipe.id}`).click();assert.equal(count(),`${people+1}인분`);verifyAmount(people+1);
  await document.getElementById(`minus-${recipe.id}`).click();assert.equal(count(),`${people}인분`);
  for(let i=people;i>1;i--)await document.getElementById(`minus-${recipe.id}`).click();
  assert.equal(count(),'1인분');verifyAmount(1);
  await document.getElementById(`minus-${recipe.id}`).click();
  let dialog=find(body,x=>x.tagName==='dialog');assert.equal(dialog.open,true);
  assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes[0].servings,1);
  await button(dialog,'취소').click();assert.equal(count(),'1인분');
  await document.getElementById(`minus-${recipe.id}`).click();dialog=find(body,x=>x.tagName==='dialog');
  await dialog.fire('cancel');dialog.close();assert.equal(count(),'1인분');
  const restored=await load('shopping-list',[],{people:4,draft:JSON.parse(saved.get('jmd_draft_v1'))});
  assert.equal(find(restored.body,x=>x.className==='times-value').textContent,'1인분');
  await document.getElementById(`minus-${recipe.id}`).click();
  await button(find(restored.body,x=>x.tagName==='dialog'),'메뉴 삭제').click();
  assert.match(restored.body.textContent,/선택 메뉴 0개/);
  assert.equal(document.getElementById(`check-${meat.ingredientId}`),undefined);
 }
});


test('구매 재료 전체 선택·해제, 선택 복사·제외, 필요량 갱신·저장 복원·초기화',async()=>{
 const draft={schemaVersion:1,selectedIngredientIds:[],selectedRecipes:[{recipeId:'squid-stir',times:1,servings:2}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]};
 const {body,saved}=await load('shopping-list',[],{pantry:['onion'],draft});
 assert.equal(document.getElementById('copy-selected').disabled,true);
 assert.equal(document.getElementById('exclude-selected-ingredients').disabled,true);
 assert.equal(document.getElementById('check-onion'),undefined);
 await document.getElementById('toggle-shopping-selection').fire('change');
 assert.equal(document.getElementById('toggle-shopping-selection').checked,true);
 const purchaseIds=JSON.parse(saved.get('jmd_draft_v1')).checkedIngredientIds;assert.ok(purchaseIds.length>1);assert.equal(purchaseIds.includes('onion'),false);
 await document.getElementById('toggle-shopping-selection').fire('change');assert.equal(document.getElementById('copy-selected').disabled,true);
 const select=async id=>{const check=document.getElementById(`check-${id}`);check.checked=true;await check.fire('change');};
 await select('squid');await select('salt');
 let copied='';Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{copied=text;}}}});
 await document.getElementById('copy-selected').click();assert.equal(copied.split('\n').length,2);assert.ok(copied.includes('오징어:'));assert.ok(copied.includes('소금:'));assert.equal(copied.includes('양파'),false);
 await document.getElementById('exclude-selected-ingredients').click();
 await find(body,x=>x.tagName==='button'&&x.textContent.startsWith('지금은 안 사고 싶어요')).click();
 assert.equal(document.getElementById('check-squid'),undefined);assert.equal(document.getElementById('check-salt'),undefined);
 assert.match(document.getElementById('excluded-shopping-summary').textContent,/2개/);
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
 const before=find(body,x=>x.className.includes('excluded-shopping')).textContent;
 await document.getElementById('plus-squid-stir').click();
 assert.notEqual(find(body,x=>x.className.includes('excluded-shopping')).textContent,before);
 await document.getElementById('toggle-shopping-selection').fire('change');await document.getElementById('copy-selected').click();
 assert.equal(copied.includes('오징어:'),false);assert.equal(copied.includes('소금:'),false);
 const restored=await load('shopping-list',[],{pantry:['onion'],draft:JSON.parse(saved.get('jmd_draft_v1'))});
 assert.equal(document.getElementById('check-squid'),undefined);
 await find(restored.body,x=>x.attrs['aria-label']==='오징어 구매 목록에 복원').click();
 assert.equal(document.getElementById('check-squid').checked,false);
 assert.match(document.getElementById('excluded-shopping-summary').textContent,/1개/);
 await document.getElementById('toggle-shopping-selection').fire('change');
 // A failed clipboard call offers exactly the same selected text for manual copying.
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async()=>{throw Error('blocked');}}}});
 await document.getElementById('copy-selected').click();
 const fallback=find(restored.body,x=>x.tagName==='textarea');assert.ok(fallback);assert.equal(fallback.value.includes('소금:'),false);assert.equal(fallback.value.includes('양파:'),false);
 await button(restored.body,'새 장보기 시작').click();await button(find(restored.body,x=>x.tagName==='dialog'),'새 장보기 시작').click();
 assert.deepEqual(JSON.parse(restored.saved.get('jmd_draft_v1')).excludedShoppingIngredientIds||[],[]);
});


test('제목 체크는 부분 선택을 나타내고 제외 이유 취소·보유 저장·재방문을 처리',async()=>{
 const draft={schemaVersion:1,selectedIngredientIds:[],selectedRecipes:[{recipeId:'squid-stir',times:1,servings:2}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]};
 const {body,saved}=await load('shopping-list',[],{draft});
 assert.equal(find(body,x=>x.className.includes('shopping-toolbar')),undefined);
 assert.equal(document.getElementById('toggle-shopping-selection').checked,false);
 const check=document.getElementById('check-minced-garlic')||all(body).find(x=>x.tagName==='input'&&x.id.startsWith('check-')&&x.attrs['aria-label'].includes('마늘'));
 assert.ok(check);const id=check.id.slice(6);check.checked=true;await check.fire('change');
 assert.equal(document.getElementById('toggle-shopping-selection').indeterminate,true);
 assert.equal(find(body,x=>x.className.includes('purchase-selection-count')).textContent,'선택 1종');
 await document.getElementById('exclude-selected-ingredients').click();
 let dialog=find(body,x=>x.tagName==='dialog');await button(dialog,'취소').click();
 assert.equal(document.getElementById(`check-${id}`).checked,true);
 assert.deepEqual(JSON.parse(saved.get('jmd_recipe_preferences_v1')).pantryIngredientIds,[]);
 await document.getElementById('exclude-selected-ingredients').click();
 dialog=find(body,x=>x.tagName==='dialog');await find(dialog,x=>x.tagName==='button'&&x.textContent.startsWith('이미 있어요')).click();
 assert.equal(document.getElementById(`check-${id}`),undefined);
 assert.ok(document.getElementById(`ingredient-detail-${id}`));
 assert.equal(find(body,x=>x.className.includes('owned-disclosure')).open,true);
 assert.ok(JSON.parse(saved.get('jmd_recipe_preferences_v1')).pantryIngredientIds.includes(id));
 const current=JSON.parse(saved.get('jmd_draft_v1'));assert.equal(current.excludedShoppingIngredientIds.includes(id),false);assert.equal(current.checkedIngredientIds.includes(id),false);
 const restored=await load('shopping-list',[],{pantry:[id],draft:current});
 assert.equal(document.getElementById(`check-${id}`),undefined);
 assert.ok(document.getElementById(`ingredient-detail-${id}`));
 await button(restored.body,'새 장보기 시작').click();await button(find(restored.body,x=>x.tagName==='dialog'),'새 장보기 시작').click();
 assert.ok(JSON.parse(restored.saved.get('jmd_recipe_preferences_v1')).pantryIngredientIds.includes(id));
});


test('추천 카드 공식 사진은 지연 로딩하고 실패 시 숨기며 메뉴 담기는 유지',async()=>{
 const {body,saved}=await load('recipes');
 const image=all(body).find(x=>x.tagName==='img'&&x.className==='recipe-image'&&x.attrs.src.startsWith('https://'));assert.ok(image);
 assert.equal(image.attrs.loading,'lazy');assert.equal(image.attrs.decoding,'async');
 assert.ok(image.attrs.src.startsWith('https://www.foodsafetykorea.go.kr/'));
 await image.fire('error');assert.equal(image.hidden,true);
 const card=image.parent.parent;await button(card,'담기 +').click();assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
 const shopping=await load('shopping-list',[],{draft:JSON.parse(saved.get('jmd_draft_v1'))});assert.equal(all(shopping.body).some(x=>x.tagName==='img'),false);
});


test('추천의 생성 사진에는 AI 표시가 있고 검색 결과는 사진 없이 유지',async()=>{
 const {body}=await load('recipes');
 const label=all(body).find(x=>x.className==='ai-image-label');assert.ok(label);assert.equal(label.textContent,'AI 생성 이미지');
 const image=label.parent.children.find(x=>x.tagName==='img');assert.ok(image.attrs.src.includes('/assets/images/generated/'));
 const input=document.getElementById('menu-search');input.value='김치찌개';await input.fire('input');
 assert.equal(all(document.getElementById('menu-search-list')).some(x=>x.tagName==='img'),false);
});
