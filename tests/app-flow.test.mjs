// Minimal DOM test double exercises app event wiring; it does not verify rendering.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
class Element {
  constructor(tag='div') { this.tagName=tag;this.childNodes=[];this.attrs={};this.events={};this.hidden=false;this.disabled=false;this.checked=false;this.name='';this.type='';this.value='';this.className='';this.scrollLeft=0;this.dataset={}; }
  append(...nodes) { for(const node of nodes){node.parent=this;this.childNodes.push(node);} }
  replaceChildren(...nodes) { this.childNodes=[];this.append(...nodes); }
  setAttribute(k,v) { this.attrs[k]=String(v);if(k==='id')this.id=v;if(k==='class')this.className=v; }
  getAttribute(k) {return this.attrs[k];}
  addEventListener(k,fn) {(this.events[k] ||= []).push(fn);}
  async fire(k,event={}) {for(const fn of this.events[k]||[])await fn({target:this,preventDefault(){},...event});}
  async click(){if(!this.disabled)await this.fire('click');}
  focus(){document.activeElement=this;}
  scrollIntoView(){}
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
const load=async (page,excludedIds=[])=>{
  globalThis.Node=Element;
  const body=new Element('body');body.dataset.page=page;
  for(const id of ['app','warnings','live']){const node=new Element();node.id=id;body.append(node);}
  const setting=new Element('a');setting.attrs['data-settings']='';body.append(setting);
  globalThis.document={body,createElement:tag=>new Element(tag),createTextNode:text=>{const n=new Element('#text');n.textContent=text;return n;},getElementById:id=>find(body,x=>x.id===id),querySelector:selector=>selector.startsWith('#')?find(body,x=>x.id===selector.slice(1)):find(body,x=>x.className.split(' ').includes(selector.slice(1))),querySelectorAll:()=>[setting]};
  const saved=new Map([['jmd_settings_v1',JSON.stringify({'기본 식사 인원':2,'기본 추천 방식':'재료 최대 활용형'})],['jmd_draft_v1',JSON.stringify({schemaVersion:1,selectedIngredientIds:['onion'],selectedRecipes:[],activeRecommendationMode:'재료 최대 활용형',checkedIngredientIds:[]})]]);
  saved.set('jmd_recipe_preferences_v1',JSON.stringify({schemaVersion:1,excludedRecipeIds:excludedIds}));
  globalThis.window={localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)}};
  globalThis.location={pathname:`/${page}.html`,search:'',protocol:'http:',href:`http://localhost/${page}.html`,assign(){}};
  globalThis.history={replaceState(){}};
  // app.js derives its data URLs from import.meta.url (file: in this test).
  globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
  await import(`../js/app.js?flow=${page}`);
  for(let i=0;i<10&&!find(body,x=>x.className.includes(page==='recipes'?'recipe-card':'settings-form'));i++)await new Promise(resolve=>setTimeout(resolve,10));
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
  const selected=find(body,x=>x.className.includes('selected-menu-button'));await selected.click();
  await button(body,'+').click();
  assert.equal(JSON.parse(saved.get('jmd_draft_v1')).selectedRecipes[0].times,2);
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
