import {isOfferedRecipe} from './catalog-exclusions.js';
import { ingredientDisplayName } from './ingredient-display-names.js';
import { ingredientIcon } from './ingredient-icons.js';
import { recipeSource } from './recipe-sources.js';
import { BROWSE_CATEGORIES, BROWSE_SUBCATEGORIES, browseIngredients, seasonalIngredients } from './ingredient-browse.js';
import { syncMenuIngredients } from './menu-ingredients.js';
import { loadData, CATEGORIES, searchIngredients } from './ingredients.js';
import { MODES, MODE_LABELS, MODE_DESCRIPTIONS, recommend, pageResults, searchMenus, recipeAvailability, replacementsFor } from './recommendations.js';
import { aggregate, selectedServings, totalText, quantity, selectedCopyText, partitionShoppingRows, preparationText, recipeMaterialNames } from './shopping-list.js';
import { createStore } from './storage.js';
import { el, button, link, empty } from './ui.js';
import { servingLabel } from './servings.js';
import { selectedBatchCount } from './recipe-calculation-basis.js';
import { FOOD_CATEGORIES, toggleFoodCategory, excludedRecipeResults } from './recipe-filters.js';

const page = document.body.dataset.page;
// Temporarily keep recommendation cards text-only; image data stays available.
const showRecipeImages = false;
const root = new URL('../', import.meta.url);
const url = file => new URL(file, root).href;
const settingsUrl = () => {
  const current = location.pathname.startsWith(root.pathname) ? location.pathname.slice(root.pathname.length) : 'index.html';
  return `${url('settings.html')}?return=${encodeURIComponent(current || 'index.html')}`;
};
const host = document.querySelector('#app');
const warningArea = document.querySelector('#warnings');
const live = document.querySelector('#live');
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { throw new Error(); }, setItem() { throw new Error(); } }; }
const store = createStore(storage);
let data, visible = 8, toastTimer, selectedExpanded = false;
let selectedDrawerOpen = false, ownedOpen = false, excludedShoppingOpen = false;
const expandedIngredients = new Set();
let ingredientTab = new URLSearchParams(location.search).get('tab') === 'planned' ? 'planned' : 'pantry';

function announce(message, autoClear = false) {
  clearTimeout(toastTimer);
  live.textContent = message;
  if (autoClear) toastTimer = setTimeout(() => { live.textContent = ''; }, 4000);
}
function warnings() {
  warningArea.replaceChildren(...store.warnings.map(text => el('p', { class: 'notice warning' }, text)));
}
function save() { for(const selection of store.draft.selectedRecipes)selection.servings ??= selectedServings(selection,store.settings['기본 식사 인원']); if(data)syncMenuIngredients(store.draft,data.ingredients,data.recipes,store.pantryIngredientIds); store.saveDraft(); warnings(); }
function focus(id) { document.getElementById(id)?.focus({ preventScroll: true }); }
document.querySelectorAll('[data-settings]').forEach(a => { a.href = settingsUrl(); a.setAttribute('aria-label','설정'); a.setAttribute('title','설정'); });
warnings();
if (!store.configured && ['ingredients', 'recipes', 'shopping-list'].includes(page)) {
  warningArea.append(el('p', { class: 'notice' }, [link('홈에서 식사 인원과 우리 집 재료를 확인해 주세요.', url('index.html'))]));
}

function resetVisible() { visible = 8; }
let openRecipeInfo=null;
function closeRecipeInfo(restoreFocus=false) {
  if(!openRecipeInfo)return;
  const {details,summary}=openRecipeInfo;
  details.open=false;summary.setAttribute('aria-expanded','false');openRecipeInfo=null;
  if(restoreFocus)summary.focus();
}
function positionRecipeInfo() {
  if(!openRecipeInfo)return;
  const panel=openRecipeInfo.panel;
  if(!panel.style||!panel.getBoundingClientRect)return;
  panel.style.transform='';
  const rect=panel.getBoundingClientRect(),width=document.documentElement?.clientWidth||window.innerWidth;
  if(!width)return;
  const gutter=typeof getComputedStyle==='function'?parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter'))||0:0;
  const shift=rect.left<gutter?gutter-rect.left:rect.right>width-gutter?width-gutter-rect.right:0;
  panel.style.transform=`translateX(${shift}px)`;
}
function recipeInfo(recipe,materials) {
  const summary=el('summary',{'aria-label':`${recipe.name} 재료 정보`,'aria-expanded':'false'},'재료 정보');
  const details=el('details',{class:'recipe-options'});
  const panel=el('div',{class:'recipe-options-content'},[
    el('div',{class:'recipe-info-header'},[button('×',()=>closeRecipeInfo(true),'recipe-info-close',{'aria-label':`${recipe.name} 재료 정보 닫기`})]),
    el('dl',{class:'recipe-materials'},[
      el('dt',{},'우리 집 재료'),el('dd',{},materials.owned.join(', ')||'없음'),
      el('dt',{},'새로 살 재료'),el('dd',{},materials.buy.join(', ')||'없음')
    ]),
    recipe.accompanimentNote?el('p',{class:'muted'},recipe.accompanimentNote):null,
    button([el('span',{class:'recipe-exclude-icon','aria-hidden':'true'},'⊘'),' 앞으로 추천에서 제외'],()=>excludeRecipe(recipe),'recipe-exclude',{'aria-label':'앞으로 추천에서 제외'})
  ]);
  details.append(summary,panel);
  summary.addEventListener('click',event=>{
    event.preventDefault();
    if(details.open){closeRecipeInfo();return;}
    closeRecipeInfo();details.open=true;summary.setAttribute('aria-expanded','true');openRecipeInfo={details,summary,panel};
    positionRecipeInfo();
  });
  return details;
}
if(page==='recipes') {
  document.addEventListener('click',event=>{if(openRecipeInfo&&!openRecipeInfo.details.contains(event.target))closeRecipeInfo();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&openRecipeInfo){event.preventDefault();closeRecipeInfo(true);}});
  window.addEventListener?.('resize',positionRecipeInfo);
}
function confirmRecipeSource(source, origin) {
  if(document.getElementById('recipe-source-dialog'))return;
  const hostname=new URL(source.url).hostname;
  const youtube=hostname==='youtu.be'||hostname==='youtube.com'||hostname.endsWith('.youtube.com');
  const blog=hostname==='blog.naver.com'||hostname.endsWith('.tistory.com');
  const destination=youtube?'유튜브':blog?'블로그':'출처 사이트';
  const cancel=button('취소',()=>dialog.close(),'secondary',{id:'cancel-recipe-source'});
  const open=el('a',{id:'open-recipe-source',class:'button primary',href:source.url,target:'_blank',rel:'noopener noreferrer',onclick:()=>setTimeout(()=>dialog.close(),0)},youtube?'유튜브 열기':blog?'블로그 열기':'원문 열기');
  const dialog=el('dialog',{id:'recipe-source-dialog','aria-labelledby':'recipe-source-title','aria-describedby':'recipe-source-description'},[
    el('h2',{id:'recipe-source-title'},`${destination}에서 원본 레시피를 볼까요?`),
    el('p',{id:'recipe-source-description'},'새 창에서 열려요.'),
    el('div',{class:'actions'},[cancel,open])
  ]);
  dialog.addEventListener('close',()=>{dialog.remove();origin.focus();});
  document.body.append(dialog);dialog.showModal();cancel.focus();
}
function sourceLabel(recipe) {
  const source = recipeSource(recipe);
  if (!source) return null;
  if(!source.url)return el('span', {class:'recipe-source'}, source.name);
  const anchor=el('a', {class:'recipe-source', href:source.url, target:'_blank', rel:'noopener noreferrer', 'aria-haspopup':'dialog', 'aria-label':`${recipe.name} 출처: ${source.name} (확인 후 새 창)`,onclick:event=>{
    event.preventDefault();confirmRecipeSource(source,anchor);
  }}, `${source.name} ↗`);
  return anchor;
}
function selectedPanel(compact = false) {
  const entries = store.draft.selectedRecipes.map(s => {
    const recipe = data.recipes.find(r => r.id === s.recipeId);
    const batch=recipe.calculationMode==='batch';
    const currentQuantity=batch?selectedBatchCount(s):selectedServings(s,store.settings['기본 식사 인원']);
    const quantityUnit=batch?'회':'인분';
    return el('div', {class:recipe.components?'selected-item selected-composite':'selected-item'}, [
      compact?null:el('div',{class:'selected-item-heading'},[
        el('strong',{class:'selected-name'},recipe.name),
        button('×',()=>confirmMenuRemoval(s,false,`remove-${recipe.id}`),'secondary selected-remove',{id:`remove-${recipe.id}`,'aria-label':`${recipe.name} 전체 삭제`,title:'메뉴 전체 삭제'})
      ]),
      el('div', {class:recipe.components?'selected-line component-heading':'selected-line',style:recipe.components?`grid-row: ${compact?1:2} / span ${recipe.components.length}`:null}, [
        el('div', {class:'selected-menu-label'}, [
          compact?el('strong', {class:'selected-name'}, recipe.name):null,
          ...(recipe.components||[]).map(c=>el('span',{class:'muted selected-basis'},servingLabel({...recipe,components:[c]}))),
          !recipe.components?el('div',{class:'selected-meta'},[
            el('span',{class:'muted selected-basis'},servingLabel(recipe)),
            el('span',{'aria-hidden':'true',class:'muted'},'·'),
            sourceLabel(recipe)
          ]):sourceLabel(recipe),
          ...Object.entries(s.ingredientReplacements||{}).map(([from,to])=>el('span',{class:'muted selected-basis'},`${ingredientDisplayName(data.ingredients.find(i=>i.id===from))} → ${ingredientDisplayName(data.ingredients.find(i=>i.id===to))} 활용`))
        ]),
        recipe.components?null:el('div', {class:'counter', role:'group', 'aria-label':`${recipe.name} ${batch?'제조 횟수':'준비할 인분'}`}, [
          button('−',()=>changeTimes(s,-1,compact),'secondary square',{id:`minus-${s.recipeId}`,'aria-label':`${recipe.name} ${quantityUnit} 줄이기`}),
          el('span',{class:'times-value'},`${currentQuantity}${quantityUnit}`),
          button('+',()=>changeTimes(s,1,compact),'secondary square',{id:`plus-${s.recipeId}`,disabled:currentQuantity>=Number.MAX_SAFE_INTEGER,'aria-label':`${recipe.name} ${quantityUnit} 늘리기`})
        ])
      ]),
      ...(recipe.components||[]).map(c=>el('div',{class:'component-control'},[
        el('span',{class:'component-control-name'},c.name),
        c.mode==='servings'?el('div',{class:'counter',role:'group','aria-label':`${c.name} 준비할 인분`},[
          button('−',()=>changeTimes(s,-1,compact),'secondary square',{id:`minus-${s.recipeId}`,'aria-label':`${c.name} 인분 줄이기`}),
          el('span',{class:'times-value'},`${selectedServings(s,store.settings['기본 식사 인원'])}인분`),
          button('+',()=>changeTimes(s,1,compact),'secondary square',{id:`plus-${s.recipeId}`,disabled:selectedServings(s,store.settings['기본 식사 인원'])>=Number.MAX_SAFE_INTEGER,'aria-label':`${c.name} 인분 늘리기`})
        ]):el('div',{class:'counter',role:'group','aria-label':`${recipe.name} ${c.name} 제조 횟수`},[
          button('−',()=>changeBatch(s,c,-1,compact),'secondary square',{id:`batch-minus-${recipe.id}-${c.id}`,disabled:(s.componentBatches?.[c.id]??1)===0,'aria-label':`${c.name} 제조 횟수 줄이기`}),
          el('span',{class:'times-value'},`${s.componentBatches?.[c.id]??1}회`),
          button('+',()=>changeBatch(s,c,1,compact),'secondary square',{id:`batch-plus-${recipe.id}-${c.id}`,disabled:(s.componentBatches?.[c.id]??1)>=Number.MAX_SAFE_INTEGER,'aria-label':`${c.name} 제조 횟수 늘리기`})
        ])
      ]))
    ]);
  });
  return el('section',{class:'panel selected-panel','aria-label':'선택 메뉴'},[
    compact ? button(`선택 메뉴 ${entries.length}개 ${selectedDrawerOpen?'접기 ▴':'확인 ▾'}`,()=>{selectedDrawerOpen=!selectedDrawerOpen;draw();focus('selected-drawer-toggle');},'secondary drawer-toggle',{id:'selected-drawer-toggle','aria-expanded':String(selectedDrawerOpen),'aria-controls':'selected-content'}) :
      el('div',{class:'section-heading'},[el('h2',{id:'selected-title',tabIndex:-1},`선택 메뉴 ${entries.length}개`),el('span',{class:'muted selected-hint'},'− / + 로 인분 조절')]),
    el('div',{id:'selected-content',hidden:compact&&!selectedDrawerOpen},[
      entries.length ? el('div',{id:'selected-menu-list'},selectedExpanded?entries:entries.slice(0,3)) : el('p',{class:'muted'},'추천 메뉴를 담아 주세요.'),
      entries.length>3 ? button(selectedExpanded?'접기 ▴':`나머지 ${entries.length-3}개 더 보기 ▾`,()=>{selectedExpanded=!selectedExpanded;draw();focus('toggle-selected');},'secondary list-more',{id:'toggle-selected','aria-expanded':String(selectedExpanded)}) : null
    ])
  ]);
}
function changeBatch(selection,component,difference,compact=false){
  const recipe=data.recipes.find(r=>r.id===selection.recipeId);
  const next=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,(selection.componentBatches?.[component.id]??1)+difference));
  if(next===0&&recipe.components.every(c=>c.mode==='batch'&&(c.id===component.id||((selection.componentBatches?.[c.id]??1)===0)))){
    confirmMenuRemoval(selection,compact,`batch-minus-${selection.recipeId}-${component.id}`);return;
  }
  selection.componentBatches??={};
  selection.componentBatches[component.id]=next;
  save();draw();focus(`batch-${difference>0||selection.componentBatches[component.id]===0?'plus':'minus'}-${selection.recipeId}-${component.id}`);
  announce(`${component.name} ${selection.componentBatches[component.id]}회로 변경했어요.`);
}
function confirmMenuRemoval(selection,compact=false,triggerId=`minus-${selection.recipeId}`){
    const recipe=data.recipes.find(r=>r.id===selection.recipeId);
    const cancel=button('취소',()=>dialog.close(),'secondary');
    const dialog=el('dialog',{'aria-labelledby':'remove-menu-title','aria-describedby':'remove-menu-description'},[
      el('h2',{id:'remove-menu-title'},'메뉴를 삭제할까요?'),
      el('p',{id:'remove-menu-description'},`${recipe.name} 메뉴와 이 메뉴에만 필요한 구매 재료를 목록에서 제거해요.`),
      el('div',{class:'actions'},[cancel,button('메뉴 삭제',()=>{
        store.draft.selectedRecipes=store.draft.selectedRecipes.filter(s=>s.recipeId!==selection.recipeId);
        save();draw();dialog.close();focus(compact?'selected-drawer-toggle':'selected-title');
        announce(`${recipe.name} 메뉴를 삭제했어요. 필요량을 다시 계산했어요.`);
      },'danger')])
    ]);
    dialog.addEventListener('close',()=>{dialog.remove();focus(triggerId);});
    document.body.append(dialog);dialog.showModal();cancel.focus();return;
}
function changeTimes(selection, difference, compact = false) {
  const selectedRecipe=data.recipes.find(r=>r.id===selection.recipeId);
  const batch=selectedRecipe.calculationMode==='batch';
  const currentQuantity=batch?selectedBatchCount(selection):selectedServings(selection,store.settings['기본 식사 인원']);
  if(difference<0&&currentQuantity===1){confirmMenuRemoval(selection,compact);return;}
  const nextQuantity=Math.max(1,Math.min(Number.MAX_SAFE_INTEGER,currentQuantity+difference));
  if(batch)selection.batchCount=nextQuantity;
  else selection.servings=nextQuantity;
  resetVisible(); save(); draw();
  focus(`${difference > 0 ? 'plus' : 'minus'}-${selection.recipeId}`);
  announce(`준비할 양을 ${nextQuantity}${batch?'회':'인분'}로 변경했어요. 필요량을 다시 계산했어요.`);
}

function ingredientPicker(pantry = false) {
  const prefix = pantry ? 'pantry' : 'ingredient';
  const selectedIds = () => pantry ? store.pantryIngredientIds : store.draft.selectedIngredientIds;
  const selected = el('div', { class: 'chips', id:`${prefix}-selected-chips` });
  let selectionExpanded=pantry && new URLSearchParams(location.search).get('expand') === 'pantry';
  const moreSelected=button('+ 더 보기',()=>{selectionExpanded=!selectionExpanded;measureSelection();},'secondary selection-more',{hidden:true,'aria-expanded':'false','aria-controls':selected.id});
  let selectionObserver;
  function measureSelection() {
    if(selected.isConnected===false){selectionObserver?.disconnect();return;}
    moreSelected.hidden=true;
    moreSelected.textContent=selectionExpanded?'− 접기':'+ 더보기';
    const chips=[...selected.children].filter(node=>node!==moreSelected&&node.tagName?.toLowerCase()==='button');
    chips.forEach(node=>{node.hidden=false;});
    const positions=chips.map(chip=>chip.offsetTop);
    const rows=[];
    for(const top of positions)if(!rows.some(row=>Math.abs(row-top)<2))rows.push(top);
    const cutoff=rows[1];
    const overflow=rows.length>1;
    if(overflow&&!selectionExpanded)chips.forEach((node,index)=>{node.hidden=positions[index]>=cutoff-1;});
    moreSelected.hidden=!overflow;
    if(overflow&&!selectionExpanded) {
      const visibleChips=chips.filter(node=>!node.hidden);
      moreSelected.textContent=`+${chips.filter(node=>node.hidden).length}개 더보기`;
      while(visibleChips.length&&moreSelected.offsetTop>rows[0]+1){visibleChips.pop().hidden=true;moreSelected.textContent=`+${chips.filter(node=>node.hidden).length}개 더보기`;}
    }
    moreSelected.setAttribute('aria-expanded',String(selectionExpanded&&overflow));
  }
  function scheduleSelectionMeasure(){if(typeof requestAnimationFrame==='function')requestAnimationFrame(measureSelection);}
  const quick = el('div', { class: 'quick-sections' });
  let activeCategory = BROWSE_CATEGORIES[0];
  let activeSubcategory='전체', ingredientLimit=24;
  const browseTabs=['제철',...BROWSE_CATEGORIES];
  const seasonal=seasonalIngredients(data.ingredients);
  const categoryTabs = el('div', {class:'ingredient-categories',role:'group','aria-label':'재료 종류'});
  const subcategoryTabs=el('div',{class:'ingredient-subcategories',role:'group','aria-label':'재료 세부 종류'});
  const selection = el('section', {class:'ingredient-selection','aria-label':'선택한 재료'}, [selected]);
  const input = el('input', { id: `${prefix}-search`, type: 'search', placeholder: '전체 재료 검색', role: 'combobox', autocomplete: 'off', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': `${prefix}-results` });
  const results = el('div', { id: `${prefix}-results`, role: 'listbox', class: 'search-results', hidden: true });
  const hint = el('p', { class: 'muted', role: 'status' });
  let matches = [], active = -1;
  function toggle(id, addOnly = false) {
    const ids = selectedIds();
    const next = ids.includes(id) ? (addOnly ? ids : ids.filter(x => x !== id)) : [...ids, id];
    if (pantry) { store.setPantryIngredientIds(next); save(); }
    else {
      store.draft.manualIngredientIds ??= [...ids];
      store.draft.suppressedAutoIngredientIds ??= [];
      if(ids.includes(id)&&!addOnly) {
        store.draft.manualIngredientIds=store.draft.manualIngredientIds.filter(x=>x!==id);
        store.draft.suppressedAutoIngredientIds=[...new Set([...store.draft.suppressedAutoIngredientIds,id])];
      } else {
        store.draft.manualIngredientIds=[...new Set([...store.draft.manualIngredientIds,id])];
        store.draft.suppressedAutoIngredientIds=store.draft.suppressedAutoIngredientIds.filter(x=>x!==id);
      }
      store.draft.selectedIngredientIds = next;
      store.draft.activeInterestIds = store.draft.activeInterestIds.filter(x => next.includes(x));
      if (!ids.includes(id)) store.draft.activeInterestIds.push(id);
      save();
    }
    const sourceButton=document.getElementById(pantry?'source-pantry':'source-planned');
    if(sourceButton)sourceButton.replaceChildren(ingredientIcon(pantry?'우리 집 재료':'장바구니 재료'),el('span',{},`${pantry?'우리 집 재료':'장바구니 재료'} ${next.length}`));
    update(); announce(`${pantry ? '우리 집 재료' : '장바구니 재료'} ${next.length}개를 선택했어요.`);
  }
  function update() {
    categoryTabs.replaceChildren(...browseTabs.map((category,index)=>button(
      [ingredientIcon(category),el('span',{},category)],
      ()=>{activeCategory=category;activeSubcategory='전체';ingredientLimit=24;update();focus(`${prefix}-category-${index-1}`);},
      category===activeCategory?'secondary selected':'secondary',
      {id:`${prefix}-category-${index-1}`,'aria-label':category,'aria-pressed':String(category===activeCategory)})));
    subcategoryTabs.hidden=activeCategory==='제철';
    subcategoryTabs.dataset.category=activeCategory;
    const subLines={'면·떡':['면','떡'],'두부·묵':['두부','묵'],'반찬·통조림':['반찬','통조림'],'간편식·간식':['간편식','간식'],'고추·후추':['고추','후추'],'허브·시즈닝':['허브','시즈닝'],'기타 향신':['기타','향신']};
    subcategoryTabs.replaceChildren(...(activeCategory==='제철'?[]:['전체',...BROWSE_SUBCATEGORIES[activeCategory]]).map((sub,index)=>button(el('span',{class:'subcategory-label'},subLines[sub]?[subLines[sub][0],el('br'),subLines[sub][1]]:sub),()=>{
      activeSubcategory=sub;ingredientLimit=24;update();focus(`${prefix}-subcategory-${index}`);
    },sub===activeSubcategory?'secondary selected':'secondary',{id:`${prefix}-subcategory-${index}`,'aria-label':sub,'aria-pressed':String(sub===activeSubcategory)})));
    selected.replaceChildren(...selectedIds().map(id => {
      const item = data.ingredients.find(i => i.id === id);
      return button(`${ingredientDisplayName(item)} ×`, () => { toggle(id); input.focus(); }, 'secondary selected', { 'aria-label': `${ingredientDisplayName(item)} 선택 해제` });
    }));
    if(selected.childNodes.length)selected.append(moreSelected);
    if (!selected.childNodes.length) selected.append(el('p', { class: 'muted' }, '선택한 재료가 없어요.'));
    const group=(activeCategory==='제철'?seasonal.items:browseIngredients(data.ingredients,activeCategory,activeSubcategory)).filter(i=>!selectedIds().includes(i.id));
    quick.replaceChildren(
      ...(activeCategory==='제철'?[el('p',{class:'seasonal-heading'},`${seasonal.month}월 제철 재료`)] : []),
      el('div',{class:'chips'},group.slice(0,ingredientLimit).map(i=>button(`+ ${ingredientDisplayName(i)}`,()=>{toggle(i.id);focus(`${prefix}-category-${browseTabs.indexOf(activeCategory)-1}`);},'secondary',{id:`${prefix}-quick-${i.id}`,'aria-pressed':'false'}))),
      ...(group.length>ingredientLimit?[button(`재료 더보기 (${group.length-ingredientLimit}개)`,()=>{ingredientLimit+=24;update();focus(`${prefix}-ingredient-more`);},'secondary list-more',{id:`${prefix}-ingredient-more`})]:[]),
      ...(!group.length?[el('p',{class:'muted picker-help'},activeCategory==='제철'&&!seasonal.items.length?'이달의 제철 자료를 준비하고 있어요. 전체 검색에서 재료를 골라 주세요.':'이 목록의 재료를 모두 선택했어요. 전체 검색에서 더 찾아보세요.')]:[]),
      ...(activeCategory==='제철'?seasonal.sources.map(source=>el('p',{class:'seasonal-source'},link(source.name,source.url))):[])
    );
    search();
    scheduleSelectionMeasure();
  }
  function choose(item) { toggle(item.id, true); input.value = ''; close(); input.focus(); }
  function close() { results.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; hint.textContent = ''; }
  function search() {
    matches = searchIngredients(data.ingredients, input.value).slice(0, 30); active = -1;
    results.hidden = !input.value.trim();
    input.setAttribute('aria-expanded', String(!results.hidden)); input.removeAttribute('aria-activedescendant');
    results.replaceChildren(...matches.map((item, index) => el('div', { id: `${prefix}-option-${index}`, role: 'option', 'aria-selected': 'false', class: 'search-option', onmousedown: event => event.preventDefault(), onclick: () => choose(item) }, [el('span', {class:'search-result-name'}, ingredientDisplayName(item)), selectedIds().includes(item.id) ? el('span', {class:'search-result-status'}, '✓ 선택됨') : null])));
    hint.textContent = input.value.trim() ? (matches.length ? `${matches.length}개까지 표시해요. 위아래 방향키로 고르고 Enter를 눌러 주세요.` : '등록된 재료가 없어요. 다른 이름으로 검색해 주세요.') : '';
  }
  input.addEventListener('input', search);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    if (event.key === 'Enter') { event.preventDefault(); if (active >= 0 && !results.hidden) choose(matches[active]); return; }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !matches.length) return;
    event.preventDefault(); results.hidden = false; input.setAttribute('aria-expanded', 'true');
    active = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
    [...results.children].forEach((node, index) => node.setAttribute('aria-selected', String(index === active)));
    input.setAttribute('aria-activedescendant', `${prefix}-option-${active}`);
    results.children[active].scrollIntoView({ block: 'nearest' });
  });
  input.addEventListener('blur', close);
  const picker = el('section', {class: 'panel pantry-picker'}, [


    selection, categoryTabs, subcategoryTabs,
    el('label', {htmlFor: input.id, class: 'flow-heading'}, '전체 재료 검색'), input, results, hint, quick
  ]);
  update();
  if(typeof ResizeObserver==='function'){selectionObserver=new ResizeObserver(measureSelection);selectionObserver.observe(selected);}
  if(document.fonts?.ready)document.fonts.ready.then(scheduleSelectionMeasure);
  return picker;
}

function drawHome() {
  const people = el('div',{class:'people-options',role:'group','aria-label':'기본 식사 인원'},[1,2,3,4].map(n=>button(`${n}명`,()=>{
    store.saveSettings({...store.settings,'기본 식사 인원':n});warnings();drawHome();focus('home-start');
  },store.settings['기본 식사 인원']===n?'secondary selected':'secondary',{id:`people-${n}`,'aria-pressed':String(store.settings['기본 식사 인원']===n)})));
  host.replaceChildren(...[
    !store.configured?el('section',{class:'panel people-setup'},[el('h2',{},'몇 명이 드실 예정인가요?'),el('p',{class:'people-help'},'선택한 인원에 맞춰 재료량을 계산해요.'),people]):null,
    el('a',{id:'home-start',href:url('ingredients.html'),class:'button primary'},'재료 선택하고 시작하기 →')
  ].filter(Boolean));
}
function drawIngredients() {
  const selectedPantry=ingredientTab==='pantry';
  const tabs=el('div',{class:'ingredient-source-tabs',role:'tablist','aria-label':'재료 선택 구분'},[
    ['pantry',`우리 집 재료 ${store.pantryIngredientIds.length}`],['planned',`장바구니 재료 ${store.draft.selectedIngredientIds.length}`]
  ].map(([tab,label])=>button([ingredientIcon(tab==='pantry'?'우리 집 재료':'장바구니 재료'),el('span',{},label)],()=>{ingredientTab=tab;drawIngredients();focus(`source-${tab}`);},ingredientTab===tab?'secondary selected':'secondary',{id:`source-${tab}`,role:'tab','aria-selected':String(ingredientTab===tab),'aria-controls':'ingredient-source-panel'})));
  host.replaceChildren(tabs,el('div',{id:'ingredient-source-panel',role:'tabpanel','aria-labelledby':`source-${ingredientTab}`},ingredientPicker(selectedPantry)),
    el('div',{class:'actions'},link('추천 메뉴 →',url('recipes.html'),'button primary')));
}

function addMenu(recipe, replacements = {}, fromSearch = false) {
  if(store.draft.selectedRecipes.some(s=>s.recipeId===recipe.id)||document.getElementById('add-menu-dialog'))return;
  const trigger=document.activeElement;
  const selection={recipeId:recipe.id,times:1,servings:store.settings['기본 식사 인원'],...(Object.keys(replacements).length?{ingredientReplacements:replacements}:{})};
  const purchasing=partitionShoppingRows(aggregate(data.ingredients,[recipe],[selection],selection.servings),store.pantryIngredientIds,data.ingredients)[0].rows;
  const interests=new Set(store.draft.selectedIngredientIds);
  const newRows=purchasing.filter(row=>!interests.has(row.ingredient.id));
  const interestRows=purchasing.filter(row=>interests.has(row.ingredient.id));
  let confirmed=false;
  const dialog=el('dialog',{id:'add-menu-dialog',class:'add-menu-dialog','aria-labelledby':'add-menu-title','aria-describedby':'add-menu-materials'},[
    el('h2',{id:'add-menu-title'},`${recipe.name} 메뉴를 담으시겠습니까?`),
    el('div',{id:'add-menu-materials',class:'add-menu-materials'},[
      newRows.length?el('p',{},[el('strong',{},'새로운 재료: '),newRows.map(row=>ingredientDisplayName(row.ingredient)).join(', ')]):null,
      interestRows.length?el('p',{},[el('strong',{},'장바구니 재료: '),interestRows.map(row=>ingredientDisplayName(row.ingredient)).join(', ')]):null,
      !purchasing.length?el('p',{},'우리 집 재료로 만들 수 있어요.'):null
    ]),
    el('div',{class:'actions'},[
      button('아니요',()=>dialog.close(),'secondary',{id:'cancel-add-menu'}),
      button('네, 담기',()=>{
        if(confirmed)return;confirmed=true;
        if(!store.draft.selectedRecipes.some(s=>s.recipeId===recipe.id))store.draft.selectedRecipes.push(selection);
        if(fromSearch)store.draft.menuQuery='';
        resetVisible();save();drawRecipes();dialog.close();focus(fromSearch?'menu-search':'results-title');
      },'primary',{id:'confirm-add-menu'})
    ])
  ]);
  dialog.addEventListener('close',()=>{dialog.remove();if(!confirmed)trigger?.focus({preventScroll:true});});
  document.body.append(dialog);dialog.showModal();focus('cancel-add-menu');
}

function drawRecipes() {
  const foodScroll = document.querySelector('.food-filters')?.scrollLeft || 0;
  const interests = data.ingredients.filter(i => store.draft.selectedIngredientIds.includes(i.id) && !i.isSeasoning);
  const modeIndex = MODES.indexOf(store.draft.activeRecommendationMode);
  const tabs = el('div', {class: 'mode-tabs', role: 'tablist', 'aria-label': '추천 방식'}, MODES.map((mode,index) => button([ingredientIcon(MODE_LABELS[index]),el('span',{},MODE_LABELS[index])], () => setMode(mode), index === modeIndex ? 'secondary selected' : 'secondary', {
    id: `mode-${index}`, role: 'tab', 'aria-selected': String(index === modeIndex), 'aria-controls': 'recommendations-panel', tabIndex: index === modeIndex ? 0 : -1,
    onkeydown: event => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();setMode(MODES[event.key === 'Home' ? 0 : event.key === 'End' ? MODES.length-1 : (index+(event.key === 'ArrowRight'?1:-1)+MODES.length)%MODES.length]);
    }
  })));
  const interestHeading=el('span',{class:'field-label'},'이번 요리에 어떤 재료를 쓸까요?');
  const toggleAllInterests=button('선택 해제',()=>{
    store.draft.activeInterestIds=[];
    resetVisible();save();drawRecipes();focus('toggle-all-interests');
    announce('이번 요리에 쓸 재료 선택을 해제했어요.');
  },'secondary interest-select-all',{id:'toggle-all-interests',disabled:!store.draft.activeInterestIds.length});
  const interestChips = el('div', {class: 'chips interest-chips', role: 'group', 'aria-label': '활용할 장바구니 재료'}, interests.map(i => {
    const checked = store.draft.activeInterestIds.includes(i.id);
    return button(`${checked ? '✓ ' : ''}${ingredientDisplayName(i)}`, () => {
      store.draft.activeInterestIds = checked ? store.draft.activeInterestIds.filter(id=>id!==i.id) : [...store.draft.activeInterestIds,i.id];
      resetVisible();save();drawRecipes();focus(`interest-${i.id}`);
    }, checked ? 'secondary selected' : 'secondary', {id: `interest-${i.id}`, 'aria-pressed': String(checked)});
  }));
  const filters = el('div', {class: 'food-filters horizontal-buttons', role: 'group', 'aria-label': '음식 종류 · 여러 개 선택 가능'}, ['전체',...FOOD_CATEGORIES].map((category,index) => {
    const checked = category === '전체' ? !store.draft.selectedFoodCategories.length : store.draft.selectedFoodCategories.includes(category);
    const lines={'메인요리':['메인','요리'],'면요리':['면','요리'],'국·찌개':['국','찌개'],'밥·죽':['밥','죽'],'소스·음료':['소스','음료']}[category]||[category];
    return button([el('span',{class:'food-filter-check','aria-hidden':'true'},checked?'✓':''),el('span',{class:'food-filter-label'},lines.length===2?[lines[0],el('br'),lines[1]]:lines[0])], () => {
      store.draft.selectedFoodCategories = toggleFoodCategory(store.draft.selectedFoodCategories,category);
      resetVisible();save();drawRecipes();focus(`food-${index}`);
    }, checked?'secondary selected':'secondary', {id:`food-${index}`, 'aria-label':category,'aria-pressed':String(checked)});
  }));
  const input = el('input', {id:'menu-search', type:'search', value:store.draft.menuQuery, maxLength:200, placeholder:'먹고 싶은 메뉴가 있으신가요?', autocomplete:'off', 'aria-controls':'menu-search-list'});
  function clearMenuSearch(){
    store.draft.menuQuery='';input.value='';resetVisible();save();renderResults();input.focus();
  }
  const clearSearch=button(el('span',{'aria-hidden':'true'},'×'),clearMenuSearch,'menu-search-clear',{id:'clear-menu-search','aria-label':'검색어 지우기',title:'검색어 지우기',hidden:!input.value.length});
  const offeredMenuCount=data.recipes.filter(isOfferedRecipe).length;
  const searchTotal=el('span',{class:'menu-search-total',role:'status','aria-label':'전체 메뉴 수'},`${offeredMenuCount}개`);
  const searchList=el('section',{id:'menu-search-list',class:'menu-search-list',hidden:true,'aria-label':'전체 메뉴 검색 결과'});
  const browseControls=el('div',{id:'recommendation-filters'},[
    el('div',{class:'food-kinds'},[el('span',{class:'flow-heading'},'음식 종류'),filters]),
    modeIndex===1?el('div',{class:'interest-section'},[el('div',{class:'section-heading'},[interestHeading,el('div',{class:'interest-actions'},[toggleAllInterests,link('재료 수정',url('ingredients.html?tab=planned'))])]),interests.length?interestChips:link('장바구니 재료 고르기',url('ingredients.html?tab=planned'))]):null
  ]);
  const content = el('div', {id:'menu-results'});
  const resultTitle=el('h2',{id:'results-title',class:'flow-heading',tabIndex:-1},'추천 메뉴');
  const resultCount=el('span',{class:'muted',role:'status'});
  const resultHeading=el('div',{class:'section-heading results-heading'},[resultTitle,resultCount]);
  function renderResults() {
    closeRecipeInfo();
    const query = store.draft.menuQuery.trim();
    const results = query ? searchMenus(data.recipes,query).map(recipe => {
      const availability = recipeAvailability(recipe,data.ingredients,store.pantryIngredientIds);
      return {recipe, reasons:[`우리 집 재료 ${availability.owned.length}종 · 구매할 재료 ${availability.buy.length}종`, availability.buy.length ? `구매할 재료: ${availability.buy.join('·')}` : '양념·조미료는 장보기 목록에서 확인해 주세요.'], replacements:replacementsFor(recipe,data.ingredients,[...store.draft.selectedIngredientIds,...store.pantryIngredientIds])};
    }) : recommend(data.ingredients,data.recipes,store.draft,store.excludedRecipeIds,store.pantryIngredientIds);
    if(modeIndex===1) {
      const hasSelection=interests.some(i=>store.draft.activeInterestIds.includes(i.id));
      interestHeading.textContent=!hasSelection?'이번 요리에 어떤 재료를 쓸까요?':query||results.length?'고른 재료가 모두 들어가는 메뉴를 찾아요.':'재료를 줄이거나 음식 종류를 바꿔 보세요.';
    }
    const slice = pageResults(results,visible);
    resultTitle.textContent=query?'메뉴 검색 결과':'추천 메뉴';
    resultCount.textContent=`${results.length}개`;
    resultHeading.hidden=Boolean(query);
    searchTotal.textContent=query?`검색 결과 ${results.length}개`:`${offeredMenuCount}개`;
    searchTotal.setAttribute('aria-label',query?'검색 결과 수':'전체 메뉴 수');
    clearSearch.hidden=!input.value.length;
    searchList.hidden=!query;
    input.setAttribute('aria-expanded',String(Boolean(query)));
    browseControls.hidden=Boolean(query);
    content.hidden=Boolean(query);
    if(query) {
      const choices=slice.items.map(({recipe,replacements})=>{
        const added=store.draft.selectedRecipes.some(s=>s.recipeId===recipe.id);
        return button([el('span',{class:'search-menu-name search-result-name'},recipe.name),el('span',{class:'search-result-status'},added?'✓ 담김':'담기 +'),el('span',{class:'search-result-meta'},servingLabel(recipe))],()=>{
          addMenu(recipe,replacements,true);
        },'search-menu-option',{disabled:added,'aria-label':`${recipe.name} ${added?'담김':'담기'}`});
      });
      choices.forEach((choice,index)=>choice.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();clearMenuSearch();return;}
        if(!['ArrowDown','ArrowUp'].includes(event.key))return;
        event.preventDefault();const enabled=choices.filter(b=>!b.disabled),current=enabled.indexOf(choice);
        const next=enabled[current+(event.key==='ArrowDown'?1:-1)];if(next)next.focus();else input.focus();
      }));
      searchList.replaceChildren(...[
        ...choices.map((choice,index)=>el('div',{class:'search-menu-entry'},[choice,sourceLabel(slice.items[index].recipe)])),
        !choices.length?el('p',{class:'muted'},'검색 결과가 없어요. 다른 메뉴 이름을 입력해 주세요.'):null,
        slice.hasMore?button('검색 결과 더 보기',()=>{visible+=8;renderResults();},'secondary list-more'):null
      ].filter(Boolean));
      // Size for six actual rows, including wrapped names and source labels.
      const fitSearchRows=()=>{
        if(searchList.hidden)return;
        const rows=[...searchList.children].filter(node=>node.className==='search-menu-entry').slice(0,6);
        const height=rows.reduce((sum,row)=>sum+(row.getBoundingClientRect?.().height||0),0);
        if(rows.length&&height>0)searchList.style.maxHeight=`${Math.ceil(height+2)}px`;
      };
      if(typeof requestAnimationFrame==='function')requestAnimationFrame(fitSearchRows);
      if(document.fonts?.ready)document.fonts.ready.then(fitSearchRows);
      return;
    }
    searchList.replaceChildren();
    const cards = slice.items.map(({recipe,reasons,replacements}) => {
      const added = store.draft.selectedRecipes.some(s=>s.recipeId===recipe.id);
      const materials=recipeMaterialNames(recipe,data.ingredients,store.pantryIngredientIds,replacements);
      return el('article', {class:'recipe-card panel'}, [
        showRecipeImages && recipe.imagePath ? el('div',{class:'recipe-visual'},[el('img', {src:recipe.imagePath, alt:'', loading:'lazy', decoding:'async', referrerPolicy:'no-referrer', width:480, height:300, class:'recipe-image', onerror:event=>{event.target.hidden=true;const visual=event.target.closest?.('.recipe-visual');if(visual)visual.hidden=true;}}),recipe.imageKind==='generated'?el('span',{class:'ai-image-label'},'AI 생성 이미지'):null]) : null,
        el('h3', {},recipe.name), sourceLabel(recipe), el('p', {class:'muted recipe-meta'},servingLabel(recipe)),
        el('div', {class:'recipe-card-actions'}, [button(added?'담김':'담기 +', () => {
          addMenu(recipe,replacements);
        }, 'primary', {disabled:added, 'aria-label':`${recipe.name} 담기`}),
        recipeInfo(recipe,materials)])
      ]);
    });
    content.replaceChildren(...[
      cards.length ? el('div',{class:'card-grid'},cards) : query
        ? empty('검색 결과가 없어요.','메뉴 이름을 짧게 바꿔 검색해 주세요.')
        : modeIndex===1
          ? interests.some(i=>store.draft.activeInterestIds.includes(i.id))
            ? empty('선택한 재료를 모두 활용한 추천 메뉴가 없어요.','재료를 줄이거나 음식 종류를 바꿔 보세요.')
            : el('div',{class:'empty'},el('p',{},'재료를 고르면 추천 메뉴가 여기에 보여요.'))
          : empty('현재 조건에 맞는 추천 메뉴가 없어요.','장바구니 재료를 선택하거나 음식 종류를 바꿔 주세요. 메뉴 이름으로 직접 검색할 수도 있어요.'),
      slice.hasMore ? button('더 보기',()=>{visible+=8;renderResults();focus('more');},'secondary',{id:'more'}) : null,
      showRecipeImages && slice.items.some(item=>item.recipe.imagePath&&item.recipe.imageKind!=='generated')?el('p',{class:'photo-credit'},link('사진 출처 · 식품의약품안전처', 'https://www.data.go.kr/data/15060073/openapi.do')):null].filter(Boolean));
  }
  input.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    if(event.key==='Escape'){event.preventDefault();clearMenuSearch();return;}
    if(['ArrowDown','Enter'].includes(event.key)&&!searchList.hidden){const first=[...searchList.children].flatMap(node=>[node,...node.children]).find(node=>node.className?.includes('search-menu-option')&&!node.disabled);if(first){event.preventDefault();first.focus();}}
  });
  input.addEventListener('input',()=>{store.draft.menuQuery=input.value.slice(0,200);resetVisible();save();renderResults();});
  host.replaceChildren(
    el('section',{id:'recommendations-panel','aria-label':'추천 메뉴와 검색'},[
      el('section',{class:'recommendation-controls'},[
        tabs,
        el('label',{htmlFor:input.id,class:'flow-heading'},'전체 메뉴 검색'),
        el('div',{class:'menu-search-group'},[
          el('div',{class:'menu-search-field'},[input,el('div',{class:'menu-search-tools'},[searchTotal,clearSearch])]),searchList
        ]),browseControls
      ]),el('div',{id:'recipe-feedback',role:'status','aria-live':'polite'}),
      resultHeading,content
    ]),
    el('div',{class:'recipe-bottom'},[selectedPanel(true),link('장보기 목록 →',url('shopping-list.html'),'button primary')])
  );
  filters.scrollLeft=foodScroll;renderResults();
  function setMode(mode){store.draft.activeRecommendationMode=mode;resetVisible();save();drawRecipes();focus(`mode-${MODES.indexOf(mode)}`);}
}

function showUndo(message, action) {
  clearTimeout(toastTimer);
  const feedback = document.getElementById('recipe-feedback') || live;
  feedback.replaceChildren(el('span', {}, message), button('실행 취소', action, 'secondary'));
}
function excludeRecipe(recipe) {
  store.setExcludedRecipeIds([...store.excludedRecipeIds, recipe.id]); warnings(); resetVisible(); drawRecipes(); focus('results-title');
  const confirm=button('확인',()=>dialog.close(),'primary',{id:'confirm-recipe-exclusion'});
  const dialog=el('dialog',{id:'recipe-exclusion-notice','aria-label':'추천 제외 안내','aria-describedby':'recipe-exclusion-message'},[
    el('p',{id:'recipe-exclusion-message'},'설정의 ‘제외한 메뉴 관리’에서 해제할 수 있어요.'),
    el('div',{class:'actions'},confirm)
  ]);
  dialog.addEventListener('close',()=>{dialog.remove();focus(`mode-${MODES.indexOf(store.draft.activeRecommendationMode)}`);});
  document.body.append(dialog);dialog.showModal();confirm.focus();
}

function drawShopping() {
  const rows = aggregate(data.ingredients, data.recipes, store.draft.selectedRecipes, store.settings['기본 식사 인원']);
  const partitions = partitionShoppingRows(rows,store.pantryIngredientIds,data.ingredients);
  const excludedIds=store.draft.excludedShoppingIngredientIds || [];
  const excludedRows=partitions[0].rows.filter(row=>excludedIds.includes(row.ingredient.id));
  partitions[0].rows=partitions[0].rows.filter(row=>!excludedIds.includes(row.ingredient.id));
  const buying=partitions[0].rows;
  const selectedRows=buying.filter(row=>store.draft.checkedIngredientIds.includes(row.ingredient.id));
  const copyFallback = el('div');
  const copyButton = button('목록 복사', async () => {
    const text = selectedCopyText(buying, store.draft.checkedIngredientIds);
    try { await navigator.clipboard.writeText(text); announce('목록을 복사했어요.', true); }
    catch {
      const area = el('textarea', { readOnly: true, rows: 10, value: text, 'aria-label': '복사할 장보기 목록' });
      copyFallback.replaceChildren(el('p', { class: 'notice warning' }, '복사하지 못했어요. 아래 목록을 선택해 복사해 주세요.'), area);
      area.focus(); area.select();
    }
  }, 'secondary', { id:'copy-selected', disabled: !selectedRows.length });
  const allSelected=buying.length>0&&selectedRows.length===buying.length;
  const toggleAll=el('input',{type:'checkbox',id:'toggle-shopping-selection',checked:allSelected,disabled:!buying.length,
    'aria-label':'구매할 재료 전체 선택 또는 해제',onchange:()=>{
      store.draft.checkedIngredientIds=allSelected?[]:buying.map(row=>row.ingredient.id);
      save();drawShopping();focus('toggle-shopping-selection');
    }});
  toggleAll.indeterminate=selectedRows.length>0&&!allSelected;
  const purchaseHeading=el('div',{class:'purchase-heading'},[
    el('h2',{},`구매할 재료 ${buying.length}종`)
  ]);
  const excludeSelected=button('구매 제외',()=>{
    const selectedIds=selectedRows.map(row=>row.ingredient.id);
    let applied=false;
    const cancel=button('취소',()=>dialog.close(),'secondary');
    function applyReason(owned) {
      if(owned) {
        store.setPantryIngredientIds([...new Set([...store.pantryIngredientIds,...selectedIds])]);
        store.draft.excludedShoppingIngredientIds=excludedIds.filter(id=>!selectedIds.includes(id));
        ownedOpen=true;
      } else {
        store.draft.excludedShoppingIngredientIds=[...new Set([...excludedIds,...selectedIds])];
      }
      store.draft.checkedIngredientIds=store.draft.checkedIngredientIds.filter(id=>!selectedIds.includes(id));
      applied=true;save();drawShopping();dialog.close();
      focus(owned?'owned-shopping-summary':'excluded-shopping-summary');
      announce(`${selectedIds.length}개 재료를 ${owned?'우리 집 재료로 저장했어요.':'이번 구매에서 제외했어요.'}`);
    }
    const dialog=el('dialog',{'aria-labelledby':'exclude-ingredients-title','aria-describedby':'exclude-ingredients-description'},[
      el('h2',{id:'exclude-ingredients-title'},'구매 목록에서 제외할까요?'),
      el('p',{id:'exclude-ingredients-description'},`선택한 재료 ${selectedIds.length}종의 제외 이유를 골라 주세요.`),
      el('div',{class:'exclusion-reasons'},[
        button([el('strong',{},'이미 있어요'),el('span',{class:'muted'},'우리 집 재료로 저장해 다음 장보기에도 반영해요.')],()=>applyReason(true),'secondary'),
        button([el('strong',{},'지금은 안 사고 싶어요'),el('span',{class:'muted'},'이번 장보기에서만 제외해요. 나중에 복원할 수 있어요.')],()=>applyReason(false),'secondary')
      ]),cancel
    ]);
    dialog.addEventListener('close',()=>{dialog.remove();if(!applied)focus('exclude-selected-ingredients');});
    document.body.append(dialog);dialog.showModal();cancel.focus();
  },'secondary',{id:'exclude-selected-ingredients',disabled:!selectedRows.length});
  const excludedSection=excludedRows.length?el('details',{class:'shopping-category excluded-shopping',open:excludedShoppingOpen},[
    el('summary',{id:'excluded-shopping-summary'},`구매에서 제외한 재료 ${excludedRows.length}개`),
    ...excludedRows.map(row=>el('div',{class:'excluded-shopping-row'},[
      el('span',{},ingredientDisplayName(row.ingredient)),el('span',{class:'quantity'},totalText(row)),
      button('복원',()=>{
        store.draft.excludedShoppingIngredientIds=excludedIds.filter(id=>id!==row.ingredient.id);
        store.draft.checkedIngredientIds=store.draft.checkedIngredientIds.filter(id=>id!==row.ingredient.id);
        save();drawShopping();focus(`check-${row.ingredient.id}`);announce(`${ingredientDisplayName(row.ingredient)} 재료를 복원했어요.`);
      },'secondary',{'aria-label':`${ingredientDisplayName(row.ingredient)} 구매 목록에 복원`})
    ]))
  ]):null;
  excludedSection?.addEventListener('toggle',()=>{excludedShoppingOpen=excludedSection.open;});
  const groups = partitions.map(({title,rows:group})=>{
    if(!group.length&&title!=='구매할 재료')return null;
    const list=group.map(row=>{
      const id=row.ingredient.id, checked=store.draft.checkedIngredientIds.includes(id);
      const check=el('input',{type:'checkbox',id:`check-${id}`,checked,'aria-label':`${ingredientDisplayName(row.ingredient)} 선택`,onchange:event=>{
        store.draft.checkedIngredientIds=event.target.checked?[...new Set([...store.draft.checkedIngredientIds,id])]:store.draft.checkedIngredientIds.filter(x=>x!==id);
        save();drawShopping();focus(`check-${id}`);
      }});
      const open=expandedIngredients.has(id);
      return el('div',{class:`shopping-row${checked?' is-checked':''}`},[
        el('div',{class:`shopping-main${title==='우리 집 재료'?' owned-main':''}`},[title==='우리 집 재료'?null:el('label',{class:'check-label',htmlFor:check.id},check),
          button([el('span',{class:'ingredient-name'},[ingredientDisplayName(row.ingredient),row.ingredient.isSeasoning?el('span',{class:'seasoning-tag'},'양념'):null]),el('span',{class:'quantity'},totalText(row)),el('span',{'aria-hidden':'true'},open?'⌃':'⌄')],()=>{
            if(open)expandedIngredients.delete(id);else expandedIngredients.add(id);
            drawShopping();focus(`ingredient-detail-${id}`);
          },'ingredient-detail',{id:`ingredient-detail-${id}`,'aria-expanded':String(open),'aria-controls':`uses-${id}`})
        ]),
        preparationText(row)?el('p',{class:'muted'},preparationText(row)):null,
        row.detailNote?el('p',{class:'muted'},row.detailNote):null,
        el('ul',{class:'uses',id:`uses-${id}`,hidden:!open},row.uses.map(use=>el('li',{},[
          el('span',{class:'use-name'},use.name),use.originalIngredientName&&use.originalIngredientName!==ingredientDisplayName(row.ingredient)?el('span',{class:'use-detail'},`· 원문: ${use.originalIngredientName}`):null,' ',el('span',{class:'use-detail'},use.batchTimes!==undefined?`· ${use.batchTimes}회 제조량`:`· ${use.servings*use.times}인분`),' ',el('span',{class:'use-detail'},`· ${quantity(use.amount,use.unit,{detail:true})}`),use.showSourceNote&&use.note?el('span',{class:'use-detail'},` · ${use.note}`):null
        ])))
      ]);
    });
    if(title==='우리 집 재료') {
      const details=el('details',{class:'shopping-category owned-disclosure',open:ownedOpen},[el('summary',{id:'owned-shopping-summary',tabIndex:-1},`우리 집 재료 ${group.length}종 · 필요량 확인`),...list]);
      details.addEventListener('toggle',()=>{ownedOpen=details.open;});return details;
    }
    return el('section',{class:'shopping-category purchase-category'},[purchaseHeading,el('div',{class:'purchase-controls'},[el('div',{class:'purchase-selection-info'},[el('label',{class:'purchase-select-label',htmlFor:toggleAll.id},[toggleAll,'전체 선택']),el('span',{class:'muted purchase-selection-count'},`선택 ${selectedRows.length}종`)]),el('div',{class:'shopping-selection-actions'},[copyButton,excludeSelected])]),copyFallback,...list]);
  }).filter(Boolean);
  host.replaceChildren(selectedPanel(),
    ...(rows.length ? groups : [empty('선택한 메뉴가 없어요.', '메뉴를 담으면 재료별 필요량을 모아드려요.', url('recipes.html'), '추천 메뉴')]),
    ...(excludedSection?[excludedSection]:[]),
    el('p', { class: 'notice' }, '필요량은 선택 메뉴에 표시된 인분으로 계산해요. 최종 구매 여부와 구매 포장 단위는 직접 확인해 주세요.'),
    el('div', { class: 'actions' }, [link('추천 메뉴', url('recipes.html'), 'button secondary'), link('재료 선택', url('ingredients.html'), 'button secondary')]),
    el('div', { class: 'reset-area' }, button('새 장보기 시작', openReset, 'text-danger', { id: 'reset-draft' })));
}

function openReset() {
  const cancel = button('취소', () => dialog.close(), 'secondary');
  const dialog = el('dialog', { 'aria-labelledby': 'reset-title', 'aria-describedby': 'reset-description' }, [
    el('h2', { id: 'reset-title' }, '새 장보기 시작'),
    el('p', { id: 'reset-description' }, '현재 관심 식재료, 선택 메뉴, 인분, 재료 선택과 구매 제외를 지우고 새 장보기를 시작할까요? 기본 설정·우리 집 재료·제외한 메뉴는 유지돼요.'),
    el('div', { class: 'actions' }, [cancel, button('새 장보기 시작', () => {
      const saved = store.reset(); dialog.close(); warnings();
      if (saved) location.assign(url('ingredients.html'));
      else { draw(); announce('현재 화면의 작업은 비웠지만 저장하지 못했어요. 재방문 시 이전 장보기가 남을 수 있어요.'); }
    }, 'danger')])
  ]);
  dialog.addEventListener('close', () => { dialog.remove(); focus('reset-draft'); });
  document.body.append(dialog); dialog.showModal(); cancel.focus();
}

function drawSettings() {
  let guideIndex = 0, chosenPeople = store.settings['기본 식사 인원'];
  const description = el('div', { class: 'notice setting-example', role: 'status' });
  const guideTabs = el('div', {class:'mode-tabs', role:'group', 'aria-label':'메뉴 추천 방식 안내'});
  const form = el('form', { class: 'panel settings-form' });
  function radios(legend, name, values, chosen, action, cls) {
    return el('fieldset', {}, [el('legend', {}, legend), el('div', { class: cls }, values.map(value => el('label', { class: 'radio-card' }, [
      el('input', { type: 'radio', name, value, checked: value === chosen, required: true, onchange: () => action(value) }), el('span', {}, typeof value === 'number' ? `${value}명` : value)
    ])))]);
  }
  function describe() {
    guideTabs.replaceChildren(...MODE_LABELS.map((label,index)=>button(label,()=>{guideIndex=index;describe();focus(`guide-mode-${index}`);},index===guideIndex?'secondary selected':'secondary',{id:`guide-mode-${index}`,'aria-pressed':String(index===guideIndex),'aria-controls':'mode-guide-description'})));
    description.id='mode-guide-description';
    description.replaceChildren(el('p',{},MODE_DESCRIPTIONS[guideIndex]),el('p',{class:'muted'},guideIndex===0
      ?'예시) 집에 양파와 대파가 있고, 장바구니에 돼지고기를 담았다면 이 재료들을 활용하면서 추가로 살 재료가 적은 메뉴부터 보여줘요.'
      :'예시) 오징어만 선택하면 오징어가 들어가는 메뉴를, 오징어와 새우를 함께 선택하면 두 재료가 모두 들어가는 메뉴를 보여줘요.'));
  }
  const allowed = ['index.html', 'ingredients.html', 'recipes.html', 'shopping-list.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', '404.html'];
  const requested = new URLSearchParams(location.search).get('return');
  const returnPath = store.configured && allowed.includes(requested) ? requested : 'ingredients.html';
  const result = el('div', { role: 'status' });
  form.append(radios('기본 식사 인원', 'servings', [1, 2, 3, 4], chosenPeople, value => { chosenPeople = value; }, 'people-options'),
    el('section',{class:'mode-guide'},[el('h2',{},'메뉴 추천 방식 안내'),guideTabs,description]),
    el('div',{class:'settings-actions'},[button('우리 집 재료 수정',()=>saveAndNavigate('ingredients.html?tab=pantry&expand=pantry'),'secondary',{id:'edit-pantry'}),el('button', { type: 'submit', class: 'button primary' }, store.configured ? '저장하고 돌아가기' : '저장하고 재료 선택')]), result);
  form.addEventListener('submit', event => {
    event.preventDefault();
    saveAndNavigate(returnPath);
  });
  function saveAndNavigate(destination) {
    const ok = store.saveSettings({ '기본 식사 인원': chosenPeople, '기본 추천 방식': store.settings['기본 추천 방식'] });
    const draftSaved = store.saveDraft(); warnings();
    if (ok && draftSaved) location.assign(url(destination));
    else result.replaceChildren(el('p', {}, '설정을 이 브라우저에 저장하지 못했어요. 저장을 다시 시도해 주세요.'));
  }
  const manage = button(`제외한 메뉴 관리 · ${store.excludedRecipeIds.length}개`, async () => {
    manage.disabled = true;
    try { data ||= await loadData(); openExcludedManager(manage); }
    catch { announce('제외한 메뉴를 불러오지 못했어요. 연결을 확인하고 다시 눌러 주세요.'); }
    finally { manage.disabled = false; }
  }, 'secondary', { id: 'manage-excluded' });
  host.replaceChildren(form, el('section', { class: 'panel exclusion-settings' }, [el('h2', {}, '추천 제외 설정'), manage, el('p', { class: 'muted' }, '제외한 메뉴는 새 장보기를 시작해도 유지돼요. 여기서 다시 추천받을 수 있어요.')])); describe();
  if (new URLSearchParams(location.search).get('excluded') === '1') { manage.click(); history.replaceState(null, '', location.href.replace(/&excluded=1/, '')); }
}

function openExcludedManager(trigger) {
  let count = 10;
  const known = new Set(data.recipes.map(r => r.id));
  const recipes = [...data.recipes, ...store.excludedRecipeIds.filter(id => !known.has(id)).map(id => ({ id, name: '목록에서 찾을 수 없는 메뉴' }))];
  const search = el('input', { type: 'search', id: 'excluded-search', placeholder: '메뉴 이름 검색', autocomplete: 'off' });
  const heading = el('h2', { id: 'excluded-title' });
  const summary = el('p', { class: 'muted', role: 'status' });
  const list = el('div', { class: 'excluded-list' });
  const undo = el('div', { class: 'excluded-undo', role: 'status' });
  const warning = el('p', { class: 'notice warning', hidden: true }, '이 브라우저에 저장하지 못했어요. 다시 방문하면 이전 설정이 남을 수 있어요.');
  const more = button('더 보기', () => { count += 10; render(); if (!more.hidden) more.focus(); else search.focus(); }, 'secondary');
  const restoreAll = button('모두 다시 추천받기', () => { confirmation.hidden = false; cancel.focus(); }, 'secondary');
  const cancel = button('취소', () => { confirmation.hidden = true; restoreAll.focus(); }, 'secondary');
  const confirmation = el('section', { class: 'notice', hidden: true }, [el('p', {}, '제외한 메뉴를 모두 다시 추천받을까요?'), el('div', { class: 'actions' }, [cancel, button('모두 다시 추천받기', () => {
    const previous = store.excludedRecipeIds; change([]); confirmation.hidden = true;
    showLocalUndo('모든 메뉴를 다시 추천해요.', () => change([...store.excludedRecipeIds, ...previous])); search.focus();
  }, 'primary')])]);
  const dialog = el('dialog', { class: 'excluded-dialog', 'aria-labelledby': heading.id }, [
    el('div', { class: 'section-heading' }, [heading, button('닫기', () => dialog.close(), 'secondary')]),
    el('label', { htmlFor: search.id, class: 'field-label' }, '제외한 메뉴 검색'), search, summary, warning, undo, list, more,
    el('div', { class: 'reset-area' }, [restoreAll, confirmation])
  ]);
  function change(ids) { warning.hidden = store.setExcludedRecipeIds(ids); warnings(); render(); }
  function showLocalUndo(message, action) {
    undo.replaceChildren(el('span', {}, message), button('실행 취소', () => { action(); undo.replaceChildren(); search.focus(); }, 'secondary'));
  }
  function render() {
    const result = excludedRecipeResults(recipes, store.excludedRecipeIds, search.value, count);
    heading.textContent = `제외한 메뉴 ${store.excludedRecipeIds.length}개`;
    trigger.textContent = `제외한 메뉴 관리 · ${store.excludedRecipeIds.length}개`;
    summary.textContent = `검색 결과 ${result.total}개 · ${result.items.length}개 표시`;
    list.replaceChildren(...(result.items.length ? result.items.map(recipe => el('div', { class: 'excluded-row' }, [el('span', {}, recipe.name), button('다시 추천받기', () => {
      change(store.excludedRecipeIds.filter(id => id !== recipe.id));
      showLocalUndo(`${recipe.name} 메뉴를 다시 추천해요.`, () => change([...store.excludedRecipeIds, recipe.id])); search.focus();
    }, 'secondary', { 'aria-label': `${recipe.name} 다시 추천받기` })])) : [el('p', {}, store.excludedRecipeIds.length ? '검색 결과가 없어요.' : '제외한 메뉴가 없어요.')]));
    more.hidden = !result.hasMore; restoreAll.disabled = !store.excludedRecipeIds.length;
  }
  search.addEventListener('input', () => { count = 10; render(); });
  dialog.addEventListener('cancel', event => { if (!confirmation.hidden) { event.preventDefault(); confirmation.hidden = true; restoreAll.focus(); } });
  dialog.addEventListener('close', () => { dialog.remove(); trigger.focus({ preventScroll: true }); });
  document.body.append(dialog); render(); dialog.showModal(); search.focus();
}

function draw() {
  if (page === 'home') drawHome();
  if (page === 'ingredients') drawIngredients();
  if (page === 'recipes') drawRecipes();
  if (page === 'shopping-list') drawShopping();
}
async function start() {
  if (location.protocol === 'file:') {
    warningArea.append(el('p', { class: 'notice warning' }, '재료와 메뉴를 사용하려면 로컬 웹 서버로 열어 주세요. README.md의 실행 방법을 확인해 주세요.'));
  }
  if (page === 'settings') { drawSettings(); return; }
  if (!host || !['home', 'ingredients', 'recipes', 'shopping-list'].includes(page)) return;
  host.setAttribute('aria-busy', 'true');
  host.replaceChildren(el('p', { class: 'loading', role: 'status' }, '재료와 메뉴를 불러오는 중이에요.'));
  try {
    data = await loadData(); store.reconcile(data.ingredients, data.recipes); save(); draw();
    // The fragment target does not exist until the asynchronous data load finishes.
    if (page === 'home' && location.hash === '#pantry') location.assign(url('ingredients.html?tab=pantry'));
  }
  catch { host.replaceChildren(empty('데이터를 불러오지 못했어요.', '연결을 확인하고 다시 시도해 주세요. 저장된 장보기는 지우지 않았어요.'), button('다시 시도', start, 'primary')); }
  finally { host.setAttribute('aria-busy', 'false'); }
}
start();
