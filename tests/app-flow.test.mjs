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
  contains(node){return this===node||this.childNodes.some(child=>child.contains(node));}
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
  globalThis.document={body,addEventListener:(name,fn)=>body.addEventListener(name,fn),createElement:tag=>new Element(tag),createTextNode:text=>{const n=new Element('#text');n.textContent=text;return n;},getElementById:id=>find(body,x=>x.id===id),querySelector:selector=>selector.startsWith('#')?find(body,x=>x.id===selector.slice(1)):find(body,x=>x.className.split(' ').includes(selector.slice(1))),querySelectorAll:()=>[setting]};
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
  for(let i=0;i<10&&!find(body,x=>x.className.includes(page==='recipes'?'recipe-card':page==='home'?'people-setup':page==='shopping-list'?'shopping-category':'settings-form'));i++)await new Promise(resolve=>setTimeout(resolve,10));
  return {body,saved};
};

test('수육과 무김치 수량 버튼은 독립 계산·0회 제외·새로고침 복원을 지원',async()=>{
 const id='mincook-blog-91';
 const draft={schemaVersion:1,selectedIngredientIds:[],activeInterestIds:[],selectedRecipes:[{recipeId:id,times:1,servings:2}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]};
 let {body,saved}=await load('shopping-list',[],{draft});
 const mixed=find(body,n=>n.className==='selected-item selected-composite');
 assert.ok(mixed);
 const basis=all(mixed).filter(n=>n.className==='muted selected-basis');
 assert.deepEqual(basis.map(n=>n.textContent),['수육 3인분(추정)','무김치 1회 제조량']);
 assert.equal(all(mixed).filter(n=>n.className==='component-control').length,2);
 await document.getElementById(`batch-plus-${id}-radish-kimchi`).click();
 let selection=JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes[0];
 assert.equal(selection.servings,2);assert.equal(selection.componentBatches['radish-kimchi'],2);
 await document.getElementById(`plus-${id}`).click();
 selection=JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes[0];
 assert.equal(selection.servings,3);assert.equal(selection.componentBatches['radish-kimchi'],2);
 await document.getElementById(`batch-minus-${id}-radish-kimchi`).click();
 await document.getElementById(`batch-minus-${id}-radish-kimchi`).click();
 assert.equal(document.getElementById(`batch-minus-${id}-radish-kimchi`).disabled,true);
 const nextDraft=JSON.parse(saved.get('jmd_draft_v1'));
 assert.equal(nextDraft.selectedRecipes[0].componentBatches['radish-kimchi'],0);
 assert.equal(nextDraft.selectedRecipes.length,1);
 ({body,saved}=await load('shopping-list',[],{draft:nextDraft}));
 assert.equal(document.getElementById(`batch-minus-${id}-radish-kimchi`).disabled,true);
 assert.match(body.textContent,/수육 3인분/);
});

test('장보기 총량은 소수1자리 올림·상세 사용량은2자리 표시',async()=>{
 const draft={schemaVersion:1,selectedIngredientIds:[],activeInterestIds:[],selectedRecipes:[{recipeId:'mincook-blog-91',times:1,servings:2}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]};
 const {body}=await load('shopping-list',[],{draft});
 const garlic=find(body,n=>n.className==='ingredient-name'&&n.textContent==='마늘');assert.ok(garlic);
 const detail=garlic.parent;assert.match(detail.textContent,/6.7개/);
 await detail.click();assert.equal(document.getElementById(detail.id).attrs['aria-expanded'],'true');
 assert.ok(find(body,n=>n.className==='use-detail'&&n.textContent==='· 6.67개'));
});

test('감동란은 제조횟수로 담고 증감·삭제 취소·재방문 후 유지',async()=>{
 const id='moony-UOWYEGyvVs0';
 const draft={schemaVersion:1,selectedIngredientIds:[],activeInterestIds:[],selectedRecipes:[{recipeId:id,times:1,servings:2}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]};
 let {body,saved}=await load('shopping-list',[],{draft});
 assert.match(body.textContent,/1회 제조량 · 달걀 6개/);
 assert.equal(find(body,n=>n.className==='times-value').textContent,'1회');
 await document.getElementById(`plus-${id}`).click();
 assert.equal(find(body,n=>n.className==='times-value').textContent,'2회');
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes[0].batchCount,2);
 const next=JSON.parse(saved.get('jmd_draft_v1'));
 ({body,saved}=await load('shopping-list',[],{draft:next,people:4}));
 assert.equal(find(body,n=>n.className==='times-value').textContent,'2회');
 await document.getElementById(`minus-${id}`).click();
 await document.getElementById(`minus-${id}`).click();
 assert.equal(document.getElementById('remove-menu-title').textContent,'메뉴를 삭제할까요?');
 await button(find(body,n=>n.tagName==='dialog'),'취소').click();
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
});

test('수박청·에이드 횟수 분리와 에이드 제외·복원·모두 제외 시 삭제 확인',async()=>{
 const id='mincook-blog-601';
 const draft={schemaVersion:1,selectedIngredientIds:[],activeInterestIds:[],selectedRecipes:[{recipeId:id,times:1,servings:2}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]};
 let {body,saved}=await load('shopping-list',[],{draft});
 assert.match(body.textContent,/수박청 & 수박에이드/);
 assert.match(body.textContent,/수박에이드 수량 미기재/);
 assert.ok(find(body,n=>n.className==='ingredient-name'&&n.textContent==='탄산수'));
 await document.getElementById(`batch-minus-${id}-ade`).click();
 assert.ok(!find(body,n=>n.className==='ingredient-name'&&n.textContent==='탄산수'));
 let next=JSON.parse(saved.get('jmd_draft_v1'));
 assert.equal(next.selectedRecipes[0].componentBatches.ade,0);
 ({body,saved}=await load('shopping-list',[],{draft:next}));
 assert.equal(document.getElementById(`batch-minus-${id}-ade`).disabled,true);
 await document.getElementById(`batch-minus-${id}-syrup`).click();
 assert.ok(document.getElementById('remove-menu-title'));
 await button(find(body,n=>n.tagName==='dialog'),'취소').click();
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
 await document.getElementById(`batch-plus-${id}-ade`).click();
 assert.ok(find(body,n=>n.className==='ingredient-name'&&n.textContent==='탄산수'));
 await document.getElementById(`batch-minus-${id}-ade`).click();
 await document.getElementById(`batch-minus-${id}-syrup`).click();
 await button(find(body,n=>n.tagName==='dialog'),'메뉴 삭제').click();
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,0);
});

test('간장양념장은25인분 대신1회 제조와5반찬을 각각 조절·복원',async()=>{
 const id='mincook-blog-623';
 const draft={schemaVersion:1,selectedIngredientIds:[],activeInterestIds:[],selectedRecipes:[{recipeId:id,times:1,servings:2}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]};
 let {body,saved}=await load('shopping-list',[],{draft});
 const entry=find(body,n=>n.className==='selected-item selected-composite');
 assert.equal(entry.children[0].attrs.style,'grid-row: 1 / span 6');
 assert.equal(all(entry).filter(n=>n.className==='component-control').length,6);
 assert.match(entry.textContent,/간장양념장 1회 제조량/);
 assert.ok(!entry.textContent.includes('25인분'));
 assert.ok(find(body,n=>n.className==='use-name'&&n.textContent.endsWith(' · 깻잎찌')));
 await document.getElementById(`batch-minus-${id}-perilla`).click();
 assert.ok(!find(body,n=>n.className==='use-name'&&n.textContent.endsWith(' · 깻잎찌')));
 assert.ok(find(body,n=>n.className==='use-name'&&n.textContent.endsWith(' · 연두부양념장')));
 await document.getElementById(`batch-plus-${id}-fishcake`).click();
 const next=JSON.parse(saved.get('jmd_draft_v1'));
 assert.equal(next.selectedRecipes[0].componentBatches.perilla,0);
 assert.equal(next.selectedRecipes[0].componentBatches.fishcake,2);
 ({body,saved}=await load('shopping-list',[],{draft:next}));
 assert.equal(document.getElementById(`batch-minus-${id}-perilla`).disabled,true);
 assert.ok(find(body,n=>n.className==='use-detail'&&n.textContent.includes('사용자 확인: 약간')));
 await document.getElementById(`batch-plus-${id}-perilla`).click();
 assert.ok(find(body,n=>n.className==='use-name'&&n.textContent.endsWith(' · 깻잎찌')));
});

test('나머지3개 복합메뉴도 활용요리0회 제외와 저장복원을 지원',async()=>{
 for(const [article,count,last,name] of [[728,3,'rice','비빔밥'],[625,3,'sandwich','샌드위치'],[598,2,'pasta','샐러드파스타']]){
  const id=`mincook-blog-${article}`;
  const draft={schemaVersion:1,selectedIngredientIds:[],activeInterestIds:[],selectedRecipes:[{recipeId:id,times:1,servings:2}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]};
  let {body,saved}=await load('shopping-list',[],{draft});
  const entry=find(body,n=>n.className==='selected-item selected-composite');
  assert.equal(entry.children[0].attrs.style,`grid-row: 1 / span ${count}`);
  assert.equal(all(entry).filter(n=>n.className==='component-control').length,count);
  assert.ok(find(body,n=>n.className==='use-name'&&n.textContent.endsWith(` · ${name}`)));
  await document.getElementById(`batch-minus-${id}-${last}`).click();
  assert.ok(!find(body,n=>n.className==='use-name'&&n.textContent.endsWith(` · ${name}`)));
  const next=JSON.parse(saved.get('jmd_draft_v1'));
  assert.equal(next.selectedRecipes.length,1);assert.equal(next.selectedRecipes[0].componentBatches[last],0);
  ({body,saved}=await load('shopping-list',[],{draft:next}));
  assert.equal(document.getElementById(`batch-minus-${id}-${last}`).disabled,true);
  await document.getElementById(`batch-plus-${id}-${last}`).click();
  assert.ok(find(body,n=>n.className==='use-name'&&n.textContent.endsWith(` · ${name}`)));
 }
});

test('재료 정보는 하나만 열고 내부 클릭 유지·바깥 클릭·닫기·Esc를 처리',async()=>{
 const {body,saved}=await load('recipes');
 const infos=all(body).filter(n=>n.className==='recipe-options');assert.ok(infos.length>=2);
 const [first,second]=infos;const summary=first.children[0],other=second.children[0];
 const before=[...saved];
 await summary.click();assert.equal(first.open,true);assert.equal(summary.attrs['aria-expanded'],'true');
 await body.fire('click',{target:find(first,n=>n.tagName==='dd')});assert.equal(first.open,true);
 await other.click();assert.equal(first.open,false);assert.equal(second.open,true);
 await button(second,'×').click();assert.equal(second.open,false);assert.equal(document.activeElement,other);
 await summary.click();await body.fire('click',{target:body});assert.equal(first.open,false);
 await summary.click();await body.fire('keydown',{key:'Escape'});assert.equal(first.open,false);assert.equal(document.activeElement,summary);
 await summary.click();const input=document.getElementById('menu-search');input.value='김치';await input.fire('input');assert.equal(first.open,false);
 const after=new Map(saved);const original=new Map(before);
 assert.equal(after.get('jmd_recipe_preferences_v1'),original.get('jmd_recipe_preferences_v1'));
 assert.deepEqual(JSON.parse(after.get('jmd_draft_v1')).selectedRecipes,JSON.parse(original.get('jmd_draft_v1')).selectedRecipes);
});

test('레시피 출처는 유튜브·블로그 확인창에서 취소/확인하고 기존 작업 유지',async()=>{
 const {body,saved}=await load('recipes');
 for(const [query,host,label] of [['김치찌개','youtube.com','유튜브'],['원팬으로 만드는 잡채','tistory.com','블로그']]){
  const input=document.getElementById('menu-search');input.value=query;await input.fire('input');
  const source=find(body,n=>n.className==='recipe-source'&&n.attrs.href?.includes(host));assert.ok(source,query);
  const before=[...saved];let prevented=false;
  await source.fire('click',{preventDefault(){prevented=true;}});
  assert.ok(prevented);assert.equal(document.getElementById('recipe-source-title').textContent,`${label}에서 원본 레시피를 볼까요?`);
  assert.equal(document.getElementById('recipe-source-description').textContent,'새 창에서 열려요.');
  await document.getElementById('cancel-recipe-source').click();assert.ok(!document.getElementById('recipe-source-dialog'));assert.equal(document.activeElement,source);
  await source.click();const open=document.getElementById('open-recipe-source');
  assert.equal(open.attrs.href,source.attrs.href);assert.equal(open.attrs.target,'_blank');assert.equal(open.attrs.rel,'noopener noreferrer');assert.equal(open.textContent,`${label} 열기`);
  await open.click();await new Promise(resolve=>setTimeout(resolve,0));assert.ok(!document.getElementById('recipe-source-dialog'));assert.deepEqual([...saved],before);
 }
});

test('고기 선택 태그와 자동완성은 통일한 표시명을 사용하며 저장 ID 유지',async()=>{
 const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
 const breast=ingredients.find(i=>i.name==='닭 가슴살'),duck=ingredients.find(i=>i.name==='오리로스');
 const {body,saved}=await load('ingredients',[],{search:'?tab=pantry',pantry:[breast.id,duck.id]});
 assert.ok(button(body,'닭고기(가슴살) ×'));assert.ok(button(body,'오리고기 ×'));
 assert.ok(JSON.parse(saved.get('jmd_recipe_preferences_v1')).pantryIngredientIds.includes(breast.id));
 const input=document.getElementById('pantry-search');input.value='닭고기(가슴살)';await input.fire('input');
 assert.match(document.getElementById('pantry-results').textContent,/닭고기\(가슴살\)/);
});

test('장보기는 물전분을 전분으로 표시하고 멸치육수 대체 준비 안내를 노출',async()=>{
 const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const r=recipes.find(r=>r.id==='mfds-cookrcp01-1015');
 const {body}=await load('shopping-list',[],{draft:{schemaVersion:1,selectedIngredientIds:[],activeInterestIds:[],selectedRecipes:[{recipeId:r.id,times:1,servings:1}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]}});
 assert.match(body.textContent,/국멸치 또는 멸치 육수 코인/);
 assert.match(body.textContent,/제품의 물 용량 기준/);
 assert.match(body.textContent,/전분을 물에 풀어 사용/);
 const names=all(body).filter(n=>n.className==='ingredient-name').map(n=>n.textContent);
 assert.ok(names.some(n=>n==='전분'));assert.ok(!names.some(n=>/^(멸치 육수|물전분)$/.test(n)));
});

test('어종 미기재 안내는 재료 선택 이름에서 빼고 장보기 목록에 표시',async()=>{
 const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
 const fish=ingredients.find(i=>i.name==='생선살');
 const {body:picker}=await load('ingredients',[],{search:'?tab=pantry',pantry:[fish.id]});
 assert.ok(button(picker,'생선살 ×'));assert.ok(!picker.textContent.includes('어종'));
 const {body}=await load('shopping-list',[],{draft:{schemaVersion:1,selectedIngredientIds:[],activeInterestIds:[],selectedRecipes:[{recipeId:'mfds-cookrcp01-538',times:1,servings:1}],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]}});
 assert.match(body.textContent,/어종이 원문에 명시되지 않았어요/);
 assert.ok(all(body).some(n=>n.className==='ingredient-name'&&n.textContent==='생선살'));
});

test('추천 화면의 다중 선택·담기·횟수 편집·제외와 실행 취소가 연결됨',async()=>{
  const {body,saved}=await load('recipes');
  assert.ok(find(body,x=>x.className.includes('recipe-card')));
  await document.getElementById('food-1').click();await document.getElementById('food-2').click();
  assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).selectedFoodCategories,['한식 주메뉴','한식 반찬']);
  const card=find(body,x=>x.className.includes('recipe-card'));
  await button(card,'담기 +').click();await document.getElementById('confirm-add-menu').click();
  assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
  await document.getElementById('selected-drawer-toggle').click();
  await button(body,'+').click();
  assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes[0].servings,3);
  await document.getElementById('mode-0').click();
  const next=find(body,x=>x.className.includes('recipe-card'));
  assert.match(next.textContent,/우리 집 재료/);assert.match(next.textContent,/새로 살 재료/);
  const selections=JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes;
  await button(next,'⊘ 앞으로 추천에서 제외').click();
  assert.equal(JSON.parse(saved.get('jmd_recipe_preferences_v1')).excludedRecipeIds.length,1);
  assert.equal(document.getElementById('recipe-exclusion-message').textContent,'설정의 ‘제외한 메뉴 관리’에서 해제할 수 있어요.');
  assert.equal(document.getElementById('recipe-exclusion-notice').open,true);
  await document.getElementById('confirm-recipe-exclusion').click();
  assert.ok(!document.getElementById('recipe-exclusion-notice'));
  assert.equal(JSON.parse(saved.get('jmd_recipe_preferences_v1')).excludedRecipeIds.length,1);
  assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes,selections);
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
 assert.match(body.textContent,/재료 선택하고 시작하기/);
});
test('메뉴 검색은 재료 해제 후에도 전체에서 찾고 검색 지우면 추천 조건을 복원',async()=>{
 const {body,saved}=await load('recipes');
 await document.getElementById('interest-onion').click();
 assert.equal(all(body).filter(x=>x.className==='recipe-card panel').length,0);
 const search=document.getElementById('menu-search');search.value='김치찌개';await search.fire('input');
 assert.ok(find(body,x=>x.className.includes('search-menu-option')));
 await find(body,x=>x.className.includes('search-menu-option')).click();await document.getElementById('confirm-add-menu').click();
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
 const current=document.getElementById('menu-search');current.value='';await current.fire('input');
 const updated=JSON.parse(saved.get('jmd_draft_v1'));
 assert.ok(updated.selectedIngredientIds.length>1);
 assert.equal(updated.activeInterestIds.includes('onion'),false);
 assert.match(body.textContent,/선택 메뉴 1개/);
});

test('장보기 보유별 구획·현재 인원·횟수·복사·체크와 초기화 취소·확인이 연결됨',async()=>{
 const {body,saved}=await load('shopping-list',['excluded'],{pantry:['onion'],draft:{schemaVersion:1,selectedIngredientIds:['squid'],selectedRecipes:[{recipeId:'squid-stir',times:2}],activeRecommendationMode:'재료 최대 활용형',checkedIngredientIds:[]}});
 assert.match(body.textContent,/구매할 재료/);assert.match(body.textContent,/우리 집 재료/);assert.match(body.textContent,/양념/);
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
 const order=all(body);
 assert.ok(order.indexOf(document.getElementById('mode-0'))<order.indexOf(input));
 assert.ok(order.indexOf(input)<order.indexOf(document.getElementById('food-0')));
 assert.equal(all(body).find(x=>x.className==='menu-search-total').textContent,`${raw.length}개`);
 assert.equal(document.getElementById('menu-search-list').hidden,true);
 assert.equal(document.getElementById('clear-menu-search').hidden,true);
 input.value='김';await input.fire('input');
 const options=()=>all(body).filter(x=>x.className.includes('search-menu-option'));
 assert.equal(document.getElementById('menu-search-list').hidden,false);assert.equal(options().length,8);
 const count=()=>all(body).find(x=>x.className==='menu-search-total').textContent;
 const heading=all(body).find(x=>x.className.includes('results-heading'));
 assert.equal(heading.hidden,true);assert.equal(document.getElementById('recommendation-filters').hidden,true);
 assert.equal(document.getElementById('menu-search-list').parent, input.parent.parent);
 assert.equal(input.parent.parent.children[1],document.getElementById('menu-search-list'));
 assert.match(count(),/\d+개$/);assert.ok(!count().includes('개 중'));
 const firstCount=count();
 assert.match(firstCount,/검색 결과 \d+개$/);
 assert.equal(document.getElementById('clear-menu-search').hidden,false);
 assert.ok(!all(body).some(x=>x.className==='search-list-heading'));
 await button(body,'검색 결과 더 보기').click();assert.equal(options().length,16);
 assert.equal(count(),firstCount);
 await document.getElementById('clear-menu-search').click();
 assert.equal(input.value,'');assert.equal(document.activeElement,input);
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).menuQuery,'');
 assert.equal(document.getElementById('clear-menu-search').hidden,true);
 assert.equal(document.getElementById('menu-search-list').hidden,true);
 assert.equal(document.getElementById('menu-results').hidden,false);
 assert.ok(!count().includes('검색 결과'));
 assert.equal(count(),`${raw.length}개`);assert.equal(heading.hidden,false);
 assert.equal(document.getElementById('recommendation-filters').hidden,false);
 assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).selectedFoodCategories,['양식']);
 input.value='고추장';await input.fire('input');await input.fire('keydown',{key:'Escape'});
 assert.equal(input.value,'');assert.equal(document.getElementById('recommendation-filters').hidden,false);
 input.value=recipe.name;await input.fire('input');
 const choice=options().find(x=>x.attrs['aria-label']===`${recipe.name} 담기`);assert.ok(choice);
 await input.fire('keydown',{key:'ArrowDown'});assert.ok(document.activeElement.className.includes('search-menu-option'));
 await choice.click();await document.getElementById('confirm-add-menu').click();
 const draft=JSON.parse(saved.get('jmd_draft_v1'));assert.equal(draft.selectedRecipes[0].recipeId,recipe.id);assert.equal(draft.menuQuery,'');
 assert.equal(document.getElementById('menu-search-list').hidden,true);
 input.value=recipe.name;const current=document.getElementById('menu-search');current.value=recipe.name;await current.fire('input');
 assert.ok(options().find(x=>x.attrs['aria-label']===`${recipe.name} 담김`).disabled);
 const shopping=await load('shopping-list',[],{draft,pantry:['onion']});
 assert.equal(document.getElementById('check-water'),undefined);
 for(const id of new Set(recipe.ingredients.map(i=>i.ingredientId).filter(id=>id!=='water')))assert.ok(document.getElementById(`ingredient-detail-${id}`),`장보기 누락: ${id}`);
 assert.match(shopping.body.textContent,/양념/);
});

test('검색 목록은 줄바꿈으로 높이가 다른 실제 행 여섯 개를 수용',async()=>{
 const {body}=await load('recipes');
 const previous=globalThis.requestAnimationFrame,frames=[];
 globalThis.requestAnimationFrame=callback=>{frames.push(callback);return frames.length;};
 try{
  const input=document.getElementById('menu-search');input.value='고추장';await input.fire('input');
  const list=document.getElementById('menu-search-list');list.style={};
  const rows=all(body).filter(node=>node.className==='search-menu-entry');assert.equal(rows.length,8);
  const heights=[88,112,88,136,112,88,150,150];
  rows.forEach((row,n)=>{row.getBoundingClientRect=()=>({height:heights[n]});});
  assert.ok(frames.length);for(const frame of frames)frame();
  assert.equal(list.style.maxHeight,'626px');
 }finally{
  if(previous)globalThis.requestAnimationFrame=previous;else delete globalThis.requestAnimationFrame;
 }
});

test('검색 메뉴를 담으면 재료가 자동 추가되고 삭제 시 직접 선택 재료만 보존',async()=>{
 const {body,saved}=await load('recipes',[],{draft:{schemaVersion:1,selectedIngredientIds:['onion'],selectedRecipes:[],activeRecommendationMode:'추가 구매 최소',activeInterestIds:['onion'],checkedIngredientIds:[]}});
 const input=document.getElementById('menu-search');input.value='김치찌개';await input.fire('input');
 const choice=all(body).find(x=>x.className.includes('search-menu-option'));await choice.click();await document.getElementById('confirm-add-menu').click();
 let d=JSON.parse(saved.get('jmd_draft_v1'));assert.ok(d.selectedIngredientIds.length>1);assert.deepEqual(d.manualIngredientIds,['onion']);
 await document.getElementById('selected-drawer-toggle').click();
 await document.getElementById(`minus-${d.selectedRecipes[0].recipeId}`).click();await document.getElementById(`minus-${d.selectedRecipes[0].recipeId}`).click();await button(body,'메뉴 삭제').click();
 d=JSON.parse(saved.get('jmd_draft_v1'));assert.deepEqual(d.selectedRecipes,[]);assert.deepEqual(d.selectedIngredientIds,['onion']);
});

test('이번 요리 재료 선택 해제·개별 재선택과 모드 전환 후 유지',async()=>{
 const {body,saved}=await load('recipes',[],{draft:{schemaVersion:1,selectedIngredientIds:['onion','squid'],selectedRecipes:[],activeRecommendationMode:'관심 재료 활용',activeInterestIds:['onion'],checkedIngredientIds:[]}});
 assert.ok(document.getElementById('toggle-all-interests'));
 assert.equal(body.textContent.includes('여러 개를 고르면, 그 재료가 모두'),false);
 assert.equal(document.getElementById('toggle-all-interests').textContent,'선택 해제');
 await document.getElementById('toggle-all-interests').click();
 assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).activeInterestIds,[]);
 assert.equal(document.getElementById('toggle-all-interests').disabled,true);
 assert.match(body.textContent,/이번 요리에 어떤 재료를 쓸까요/);
 assert.equal(document.getElementById('menu-results').textContent,'재료를 고르면 추천 메뉴가 여기에 보여요.');
 await document.getElementById('interest-squid').click();
 assert.equal(document.getElementById('toggle-all-interests').disabled,false);
 await document.getElementById('mode-0').click();assert.equal(document.getElementById('toggle-all-interests'),undefined);
 await document.getElementById('mode-1').click();
 assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).activeInterestIds,['squid']);
 assert.deepEqual(JSON.parse(saved.get('jmd_draft_v1')).selectedIngredientIds,['onion','squid']);
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

test('보유 선택 태그의 측정된 첫 한 줄만 표시하며 더 보기·접기와 폭 변경을 처리',async()=>{
 let measure;
 globalThis.ResizeObserver=class {constructor(callback){measure=callback;}observe(){}disconnect(){}};
 try {
  const {body}=await load('ingredients',[],{search:'?tab=pantry',pantry:['onion','potato','carrot','enoki','salt','oil']});
  const chips=document.getElementById('pantry-selected-chips').children.filter(x=>!x.className.includes('selection-more'));
  chips.forEach((chip,index)=>{chip.offsetTop=Math.floor(index/2)*56;});measure();
  assert.equal(chips.filter(x=>!x.hidden).length,2);
  await find(body,x=>x.className.includes('selection-more')).click();assert.equal(chips.filter(x=>!x.hidden).length,6);
  await button(body,'− 접기').click();assert.equal(chips.filter(x=>!x.hidden).length,2);
  chips.forEach(chip=>{chip.offsetTop=0;});measure();
  assert.equal(chips.filter(x=>!x.hidden).length,6);assert.equal(find(body,x=>x.className.includes('selection-more')).hidden,true);
  assert.equal(find(body,x=>x.className==='selection-heading'),undefined);
 } finally {delete globalThis.ResizeObserver;}
});

test('관심 선택 태그의 측정된 첫 한 줄만 표시하며 더 보기·접기와 폭 변경을 처리',async()=>{
 let measure;
 globalThis.ResizeObserver=class {constructor(callback){measure=callback;}observe(){}disconnect(){}};
 try {
  const {body}=await load('ingredients',[],{search:'?tab=planned',draft:{schemaVersion:1,selectedIngredientIds:['onion','potato','carrot','enoki','salt','oil'],selectedRecipes:[],activeRecommendationMode:'추가 구매 최소',activeInterestIds:[],checkedIngredientIds:[]}});
  const chips=document.getElementById('ingredient-selected-chips').children.filter(x=>!x.className.includes('selection-more'));
  chips.forEach((chip,index)=>{chip.offsetTop=Math.floor(index/2)*56;});measure();
  assert.equal(chips.filter(x=>!x.hidden).length,2);
  await find(body,x=>x.className.includes('selection-more')).click();assert.equal(chips.filter(x=>!x.hidden).length,6);
  await button(body,'− 접기').click();assert.equal(chips.filter(x=>!x.hidden).length,2);
  chips.forEach(chip=>{chip.offsetTop=0;});measure();
  assert.equal(chips.filter(x=>!x.hidden).length,6);assert.equal(find(body,x=>x.className.includes('selection-more')).hidden,true);
  assert.equal(find(body,x=>x.className==='selection-heading'),undefined);
 } finally {delete globalThis.ResizeObserver;}
});

test('검색·추천 담기는 사전 확인 모달로 재료를 나누고 취소·확인 전까지 저장하지 않음',async()=>{
 const draft={schemaVersion:1,selectedIngredientIds:['kimchi'],selectedRecipes:[],activeRecommendationMode:'추가 구매 최소',activeInterestIds:[],checkedIngredientIds:[]};
 const {body,saved}=await load('recipes',[],{draft,pantry:['onion','minced-garlic']});
 const input=document.getElementById('menu-search');input.value='김치찌개';await input.fire('input');
 const choice=all(body).find(x=>x.className.includes('search-menu-option')&&x.attrs['aria-label']==='김치찌개 담기');choice.focus();
 const before=saved.get('jmd_draft_v1');await choice.click();
 let dialog=document.getElementById('add-menu-dialog');assert.ok(dialog.open);assert.equal(saved.get('jmd_draft_v1'),before);
 assert.match(dialog.textContent,/김치찌개 메뉴를 담으시겠습니까/);assert.match(dialog.textContent,/새로운 재료:/);assert.match(dialog.textContent,/장바구니 재료: 김치/);
 assert.equal(document.getElementById('add-menu-materials').textContent.includes('양파'),false);
 await document.getElementById('cancel-add-menu').click();assert.equal(saved.get('jmd_draft_v1'),before);assert.equal(document.activeElement,choice);
 await choice.click();dialog=document.getElementById('add-menu-dialog');await dialog.fire('cancel');dialog.close();assert.equal(saved.get('jmd_draft_v1'),before);
 await choice.click();await document.getElementById('confirm-add-menu').click();
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);assert.equal(document.getElementById('add-menu-dialog'),undefined);assert.equal(document.getElementById('added-menu-feedback'),undefined);
 assert.equal(document.getElementById('menu-search').value,'');
});

test('추천 재료가 모두 보유 상태이면 구매 불필요 표시·확인 후에만 추가',async()=>{
 const ingredients=JSON.parse(await readFile(new URL('../data/ingredients.json',import.meta.url),'utf8'));
 const {body,saved}=await load('recipes',[],{pantry:ingredients.map(i=>i.id)});
 const card=all(body).find(x=>x.className==='recipe-card panel');assert.ok(card);
 await button(card,'담기 +').click();assert.match(document.getElementById('add-menu-dialog').textContent,/우리 집 재료로 만들 수 있어요/);
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,0);
 await document.getElementById('confirm-add-menu').click();assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
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
  assert.equal(find(body,x=>x.attrs['data-settings']!==undefined).getAttribute('aria-label'),'설정');
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


test('공식 사진이 있는 추천도 사진과 출처 여백 없이 메뉴 담기는 유지',async()=>{
 const raw=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const {body,saved}=await load('recipes',raw.filter(r=>r.id!=='mfds-cookrcp01-3296').map(r=>r.id));
 assert.equal(all(body).some(x=>['recipe-image','recipe-visual','photo-credit'].includes(x.className)),false);
 const card=find(body,x=>x.className.includes('recipe-card'));assert.ok(card);await button(card,'담기 +').click();await document.getElementById('confirm-add-menu').click();assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes.length,1);
 const shopping=await load('shopping-list',[],{draft:JSON.parse(saved.get('jmd_draft_v1'))});assert.equal(all(shopping.body).some(x=>x.tagName==='img'),false);
});


test('생성 사진이 있는 추천도 이미지와 AI 표식을 숨기고 검색은 유지',async()=>{
 // Verify the generated-photo card independently of the growing menu ranking.
 const raw=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const {body}=await load('recipes',raw.filter(r=>r.id!=='kimchi-stew').map(r=>r.id));
 assert.equal(all(body).some(x=>x.tagName==='img'||x.className==='ai-image-label'),false);
 const input=document.getElementById('menu-search');input.value='김치찌개';await input.fire('input');
 assert.equal(all(document.getElementById('menu-search-list')).some(x=>x.tagName==='img'),false);
});


test('제철은 별도 분류 탭으로 존재하며 각 보유·관심에 선택하고 농산·육수산 분류 유지',async()=>{
 for(const tab of ['pantry','planned']) {
  const {body,saved}=await load('ingredients',[],{search:`?tab=${tab}`,draft:{schemaVersion:1,selectedIngredientIds:[],selectedRecipes:[],activeRecommendationMode:'추가 구매 최소',activeInterestIds:[],checkedIngredientIds:[]}});
  const prefix=tab==='pantry'?'pantry':'ingredient';
  const tabs=all(body).filter(x=>x.id?.startsWith(`${prefix}-category-`));assert.deepEqual(tabs.map(x=>x.textContent),['제철','농산물','육·수산','기타','양념']);
  assert.ok(document.getElementById(`${prefix}-quick-rice`));
  await document.getElementById(`${prefix}-category-1`).click();
  assert.ok(document.getElementById(`${prefix}-quick-kelp`));
  await document.getElementById(`${prefix}-category--1`).click();
  const candidates=all(body).filter(x=>x.id?.startsWith(`${prefix}-quick-`));
  if(candidates.length){const id=candidates[0].id.slice(`${prefix}-quick-`.length);await candidates[0].click();const ids=tab==='pantry'?JSON.parse(saved.get('jmd_recipe_preferences_v1')).pantryIngredientIds:JSON.parse(saved.get('jmd_draft_v1')).selectedIngredientIds;assert.ok(ids.includes(id));}
 }
});


test('하위 분류는 전체 기본·세부 필터·전체 검색·선택 제외·더보기 동작을 보존',async()=>{
 const {body}=await load('ingredients',[],{search:'?tab=planned',draft:{schemaVersion:1,selectedIngredientIds:[],selectedRecipes:[],activeRecommendationMode:'추가 구매 최소',checkedIngredientIds:[]}});
 assert.equal(document.getElementById('ingredient-subcategory-0').attrs['aria-pressed'],'true');
 const quick=()=>all(body).filter(x=>x.id?.startsWith('ingredient-quick-'));
 assert.equal(quick()[0].textContent,'+ 양파');assert.equal(quick().length,24);
 await document.getElementById('ingredient-ingredient-more').click();assert.equal(quick().length,48);
 await document.getElementById('ingredient-subcategory-2').click();
 assert.ok(quick().some(x=>x.textContent==='+ 사과'));assert.equal(document.getElementById('ingredient-quick-onion'),undefined);
 const search=document.getElementById('ingredient-search');search.value='새우';await search.fire('input');assert.match(document.getElementById('ingredient-results').textContent,/새우/);
 await document.getElementById('ingredient-category-1').click();assert.equal(document.getElementById('ingredient-subcategory-0').attrs['aria-pressed'],'true');
 await document.getElementById('ingredient-subcategory-4').click();assert.ok(document.getElementById('ingredient-quick-egg'));
 await document.getElementById('ingredient-quick-egg').click();assert.equal(document.getElementById('ingredient-quick-egg'),undefined);
 await document.getElementById('ingredient-category--1').click();assert.equal(find(body,x=>x.className==='ingredient-subcategories').hidden,true);
});


test('설정 안내는 저장해도 실제 추천 방식을 바꾸지 않음',async()=>{
 const {body,saved}=await load('settings');
 const before=saved.get('jmd_draft_v1');
 assert.equal(all(body).filter(x=>x.tagName==='input'&&x.name==='mode').length,0);
 await document.getElementById('guide-mode-1').click();
 assert.match(document.getElementById('mode-guide-description').textContent,/두 재료가 모두/);
 assert.equal(saved.get('jmd_draft_v1'),before);
 await document.getElementById('guide-mode-0').click();
 assert.match(document.getElementById('mode-guide-description').textContent,/양파와 대파/);
 await find(body,x=>x.tagName==='form').fire('submit');
 assert.equal(JSON.parse(saved.get('jmd_settings_v1'))['기본 추천 방식'],'관심 재료 활용');
 assert.equal(JSON.parse(saved.get('jmd_draft_v1')).activeRecommendationMode,'관심 재료 활용');
});


test('설정에서 보유 편집은 변경 인원을 저장하고 펼친 선택 목록으로 이동',async()=>{
 const {body,saved}=await load('settings');
 const person=all(body).find(x=>x.tagName==='input'&&x.name==='servings'&&x.value===3);
 await person.fire('change');await document.getElementById('edit-pantry').click();
 assert.equal(JSON.parse(saved.get('jmd_settings_v1'))['기본 식사 인원'],3);
 assert.match(location.assigned,/ingredients.html\?tab=pantry&expand=pantry$/);
 let measure;
 globalThis.ResizeObserver=class {constructor(callback){measure=callback;}observe(){}disconnect(){}};
 try {
  const {body:picker}=await load('ingredients',[],{search:'?tab=pantry&expand=pantry',pantry:['onion','potato','carrot','enoki','salt','oil']});
  const chips=document.getElementById('pantry-selected-chips').children.filter(x=>!x.className.includes('selection-more'));
  chips.forEach((chip,index)=>{chip.offsetTop=Math.floor(index/2)*56;});measure();
  assert.equal(chips.filter(x=>!x.hidden).length,6);
  assert.equal(button(picker,'− 접기').getAttribute('aria-expanded'),'true');
  await button(picker,'− 접기').click();assert.equal(chips.filter(x=>!x.hidden).length,2);
 } finally {delete globalThis.ResizeObserver;}
});


test('고른 재료의 결과가 없으면 위 안내와 결과 상태를 갱신하고 검색과 구분',async()=>{
 const recipes=JSON.parse(await readFile(new URL('../data/recipes.json',import.meta.url),'utf8'));
 const {body}=await load('recipes',recipes.map(r=>r.id),{draft:{schemaVersion:1,selectedIngredientIds:['onion'],activeInterestIds:['onion'],selectedRecipes:[],activeRecommendationMode:'관심 재료 활용',checkedIngredientIds:[]}});
 assert.match(body.textContent,/재료를 줄이거나 음식 종류를 바꿔 보세요/);
 assert.equal(document.getElementById('menu-results').textContent,'선택한 재료를 모두 활용한 추천 메뉴가 없어요.재료를 줄이거나 음식 종류를 바꿔 보세요.');
 const input=document.getElementById('menu-search');input.value='김치찌개';await input.fire('input');
 assert.match(body.textContent,/고른 재료가 모두 들어가는 메뉴를 찾아요/);
 input.value='';await input.fire('input');
 assert.match(document.getElementById('menu-results').textContent,/선택한 재료를 모두 활용한 추천 메뉴가 없어요/);
});
