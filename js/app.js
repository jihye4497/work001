import { syncMenuIngredients } from './menu-ingredients.js';
import { loadData, CATEGORIES, searchIngredients, quickPickIngredients } from './ingredients.js';
import { MODES, MODE_DESCRIPTIONS, recommend, pageResults, searchMenus, recipeAvailability, replacementsFor } from './recommendations.js';
import { aggregate, selectedServings, totalText, quantity, selectedCopyText, partitionShoppingRows } from './shopping-list.js';
import { createStore } from './storage.js';
import { el, button, link, empty } from './ui.js';
import { servingLabel } from './servings.js';
import { FOOD_CATEGORIES, toggleFoodCategory, excludedRecipeResults } from './recipe-filters.js';

const page = document.body.dataset.page;
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
document.querySelectorAll('[data-settings]').forEach(a => { a.href = settingsUrl(); a.textContent = `${store.settings['기본 식사 인원']}인 · 설정`; });
warnings();
if (!store.configured && ['ingredients', 'recipes', 'shopping-list'].includes(page)) {
  warningArea.append(el('p', { class: 'notice' }, [link('홈에서 식사 인원과 집에 있는 재료를 확인해 주세요.', url('index.html'))]));
}

function resetVisible() { visible = 8; }
function selectedPanel(compact = false) {
  const entries = store.draft.selectedRecipes.map(s => {
    const recipe = data.recipes.find(r => r.id === s.recipeId);
    return el('div', {class:'selected-item'}, [
      el('div', {class:'selected-line'}, [
        el('div', {class:'selected-menu-label'}, [
          el('strong', {class:'selected-name'}, recipe.name),
          ...Object.entries(s.ingredientReplacements||{}).map(([from,to])=>el('span',{class:'muted selected-basis'},`${data.ingredients.find(i=>i.id===from)?.name} → ${data.ingredients.find(i=>i.id===to)?.name} 활용`))
        ]),
        el('div', {class:'counter', role:'group', 'aria-label':`${recipe.name} 준비할 인분`}, [
          button('−',()=>changeTimes(s,-1,compact),'secondary square',{id:`minus-${s.recipeId}`,'aria-label':`${recipe.name} 인분 줄이기`}),
          el('span',{class:'times-value'},`${selectedServings(s,store.settings['기본 식사 인원'])}인분`),
          button('+',()=>changeTimes(s,1,compact),'secondary square',{id:`plus-${s.recipeId}`,disabled:selectedServings(s,store.settings['기본 식사 인원'])>=Number.MAX_SAFE_INTEGER,'aria-label':`${recipe.name} 인분 늘리기`})
        ])
      ])
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
function changeTimes(selection, difference, compact = false) {
  if(difference<0&&selectedServings(selection,store.settings['기본 식사 인원'])===1) {
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
    dialog.addEventListener('close',()=>{dialog.remove();focus(`minus-${selection.recipeId}`);});
    document.body.append(dialog);dialog.showModal();cancel.focus();return;
  }
  selection.servings = Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, selectedServings(selection,store.settings['기본 식사 인원']) + difference));
  resetVisible(); save(); draw();
  focus(`${difference > 0 ? 'plus' : 'minus'}-${selection.recipeId}`);
  announce(`준비할 양을 ${selection.servings}인분으로 변경했어요. 필요량을 다시 계산했어요.`);
}

function ingredientPicker(pantry = false) {
  const prefix = pantry ? 'pantry' : 'ingredient';
  const selectedIds = () => pantry ? store.pantryIngredientIds : store.draft.selectedIngredientIds;
  const selected = el('div', { class: 'chips', id:`${prefix}-selected-chips` });
  let selectionExpanded=false;
  const moreSelected=button('+ 더 보기',()=>{selectionExpanded=!selectionExpanded;measureSelection();},'secondary selection-more',{hidden:true,'aria-expanded':'false','aria-controls':selected.id});
  let selectionObserver;
  function measureSelection() {
    if(selected.isConnected===false){selectionObserver?.disconnect();return;}
    moreSelected.hidden=true;
    moreSelected.textContent=selectionExpanded?'− 접기':'+ 더 보기';
    const chips=[...selected.children].filter(node=>node!==moreSelected&&node.tagName?.toLowerCase()==='button');
    chips.forEach(node=>{node.hidden=false;});
    const positions=chips.map(chip=>chip.offsetTop);
    const rows=[];
    for(const top of positions)if(!rows.some(row=>Math.abs(row-top)<2))rows.push(top);
    const cutoff=rows[2];
    const overflow=rows.length>2;
    if(overflow&&!selectionExpanded)chips.forEach((node,index)=>{node.hidden=positions[index]>=cutoff-1;});
    moreSelected.hidden=!overflow;
    if(overflow&&!selectionExpanded) {
      const visibleChips=chips.filter(node=>!node.hidden);
      while(visibleChips.length&&moreSelected.offsetTop>rows[1]+1)visibleChips.pop().hidden=true;
    }
    moreSelected.setAttribute('aria-expanded',String(selectionExpanded&&overflow));
  }
  function scheduleSelectionMeasure(){if(typeof requestAnimationFrame==='function')requestAnimationFrame(measureSelection);}
  const quick = el('div', { class: 'quick-sections' });
  let activeCategory = CATEGORIES[0];
  const categoryTabs = el('div', {class:'ingredient-categories',role:'group','aria-label':'재료 종류'});
  const selectedSummary = el('p', {class:'selection-heading'});
  const selection = el('section', {class:'ingredient-selection','aria-label':'선택한 재료'}, [selectedSummary, selected]);
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
    if(sourceButton)sourceButton.textContent=`${pantry?'집에 있는 재료':'새로 살 관심 재료'} ${next.length}`;
    update(); announce(`${pantry ? '집에 있는 재료' : '새로 살 재료'} ${next.length}개를 선택했어요.`);
  }
  function update() {
    selectedSummary.textContent = `선택한 재료 ${selectedIds().length}개`;
    const categoryLabels = [['채소','버섯'],['육류','해산물'],['두부·계란','기타'],['양념','조미료']];
    categoryTabs.replaceChildren(...CATEGORIES.map((category,index)=>button(
      categoryLabels[index].map(line=>el('span',{},line)),
      ()=>{activeCategory=category;update();focus(`${prefix}-category-${index}`);},
      category===activeCategory?'secondary selected':'secondary',
      {id:`${prefix}-category-${index}`,'aria-label':category,'aria-pressed':String(category===activeCategory)})));
    selected.replaceChildren(...selectedIds().map(id => {
      const item = data.ingredients.find(i => i.id === id);
      return button(`${item.name} ×`, () => { toggle(id); input.focus(); }, 'secondary selected', { 'aria-label': `${item.name} 선택 해제` });
    }));
    if(selected.childNodes.length)selected.append(moreSelected);
    if (!selected.childNodes.length) selected.append(el('p', { class: 'muted' }, '선택한 재료가 없어요.'));
    quick.replaceChildren(...CATEGORIES.map(category => {
      const group = quickPickIngredients(data.ingredients, category).filter(i => !selectedIds().includes(i.id));
      if (category !== activeCategory) return null;
      if (!group.length) return null;
      return el('section', {}, [el('h3', {}, category), el('div', { class: 'chips' }, group.map(i => {
        const checked = selectedIds().includes(i.id);
        return button(`${checked ? '✓ ' : '+ '}${i.name}`, () => { toggle(i.id); focus(`${prefix}-category-${CATEGORIES.indexOf(category)}`); }, checked ? 'secondary selected' : 'secondary', { id: `${prefix}-quick-${i.id}`, 'aria-pressed': String(checked) });
      }))]);
    }).filter(Boolean));
    search();
    scheduleSelectionMeasure();
  }
  function choose(item) { toggle(item.id, true); input.value = ''; close(); input.focus(); }
  function close() { results.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; hint.textContent = ''; }
  function search() {
    matches = searchIngredients(data.ingredients, input.value).slice(0, 30); active = -1;
    results.hidden = !input.value.trim();
    input.setAttribute('aria-expanded', String(!results.hidden)); input.removeAttribute('aria-activedescendant');
    results.replaceChildren(...matches.map((item, index) => el('div', { id: `${prefix}-option-${index}`, role: 'option', 'aria-selected': 'false', class: 'search-option', onmousedown: event => event.preventDefault(), onclick: () => choose(item) }, [el('span', {class:'search-result-name'}, item.name), selectedIds().includes(item.id) ? el('span', {class:'search-result-status'}, '✓ 선택됨') : null])));
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


    selection, categoryTabs,
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
    document.querySelectorAll('[data-settings]').forEach(a=>{a.textContent=`${n}인 · 설정`;});
  },store.settings['기본 식사 인원']===n?'secondary selected':'secondary',{id:`people-${n}`,'aria-pressed':String(store.settings['기본 식사 인원']===n)})));
  host.replaceChildren(...[
    !store.configured?el('section',{class:'panel people-setup'},[el('h2',{},'보통 몇 명이 드시나요?'),people]):null,
    el('a',{id:'home-start',href:url('ingredients.html'),class:'button primary'},'재료 선택하러 가기 →'),
    el('details',{class:'home-mode-guide'},[el('summary',{},'추천 방식이 궁금하다면'),
      el('p',{},'추가 구매 최소 · 담은 재료로 만들며 더 살 재료를 줄여요.'),
      el('p',{},'관심 재료 활용 · 고른 관심 재료가 모두 들어가는 메뉴를 찾아요.')])
  ].filter(Boolean));
}
function drawIngredients() {
  const selectedPantry=ingredientTab==='pantry';
  const tabs=el('div',{class:'ingredient-source-tabs',role:'tablist','aria-label':'재료 선택 구분'},[
    ['pantry',`집에 있는 재료 ${store.pantryIngredientIds.length}`],['planned',`새로 살 관심 재료 ${store.draft.selectedIngredientIds.length}`]
  ].map(([tab,label])=>button(label,()=>{ingredientTab=tab;drawIngredients();focus(`source-${tab}`);},ingredientTab===tab?'secondary selected':'secondary',{id:`source-${tab}`,role:'tab','aria-selected':String(ingredientTab===tab),'aria-controls':'ingredient-source-panel'})));
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
      newRows.length?el('p',{},[el('strong',{},'새로운 재료: '),newRows.map(row=>row.ingredient.name).join(', ')]):null,
      interestRows.length?el('p',{},[el('strong',{},'관심 재료: '),interestRows.map(row=>row.ingredient.name).join(', ')]):null,
      !purchasing.length?el('p',{},'집에 있는 재료로 만들 수 있어요.'):null
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
  const tabs = el('div', {class: 'mode-tabs', role: 'tablist', 'aria-label': '추천 방식'}, MODES.map((mode,index) => button(mode, () => setMode(mode), index === modeIndex ? 'secondary selected' : 'secondary', {
    id: `mode-${index}`, role: 'tab', 'aria-selected': String(index === modeIndex), 'aria-controls': 'recommendations-panel', tabIndex: index === modeIndex ? 0 : -1,
    onkeydown: event => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();setMode(MODES[event.key === 'Home' ? 0 : event.key === 'End' ? MODES.length-1 : (index+(event.key === 'ArrowRight'?1:-1)+MODES.length)%MODES.length]);
    }
  })));
  const allInterestsSelected=interests.length>0&&interests.every(i=>store.draft.activeInterestIds.includes(i.id));
  const toggleAllInterests=button(allInterestsSelected?'모두 해제':'모두 선택',()=>{
    store.draft.activeInterestIds=allInterestsSelected?[]:interests.map(i=>i.id);
    resetVisible();save();drawRecipes();focus('toggle-all-interests');
    announce(allInterestsSelected?'관심 재료 선택을 모두 해제했어요.':'관심 재료를 모두 선택했어요.');
  },'secondary interest-select-all',{id:'toggle-all-interests',disabled:!interests.length});
  const interestChips = el('div', {class: 'chips interest-chips', role: 'group', 'aria-label': '활용할 관심 재료'}, interests.map(i => {
    const checked = store.draft.activeInterestIds.includes(i.id);
    return button(`${checked ? '✓ ' : ''}${i.name}`, () => {
      store.draft.activeInterestIds = checked ? store.draft.activeInterestIds.filter(id=>id!==i.id) : [...store.draft.activeInterestIds,i.id];
      resetVisible();save();drawRecipes();focus(`interest-${i.id}`);
    }, checked ? 'secondary selected' : 'secondary', {id: `interest-${i.id}`, 'aria-pressed': String(checked)});
  }));
  const filters = el('div', {class: 'food-filters horizontal-buttons', role: 'group', 'aria-label': '음식 종류 · 여러 개 선택 가능'}, ['전체',...FOOD_CATEGORIES].map((category,index) => {
    const checked = category === '전체' ? !store.draft.selectedFoodCategories.length : store.draft.selectedFoodCategories.includes(category);
    return button(`${checked?'✓ ':''}${category}`, () => {
      store.draft.selectedFoodCategories = toggleFoodCategory(store.draft.selectedFoodCategories,category);
      resetVisible();save();drawRecipes();focus(`food-${index}`);
    }, checked?'secondary selected':'secondary', {id:`food-${index}`, 'aria-pressed':String(checked)});
  }));
  const input = el('input', {id:'menu-search', type:'search', value:store.draft.menuQuery, maxLength:200, placeholder:'먹고 싶은 메뉴가 있다면 검색해 보세요', autocomplete:'off', 'aria-controls':'menu-search-list'});
  const searchList=el('section',{id:'menu-search-list',class:'menu-search-list',hidden:true,'aria-label':'전체 메뉴 검색 결과'});
  const content = el('div', {id:'menu-results'});
  const resultTitle=el('h2',{id:'results-title',tabIndex:-1},'추천 메뉴');
  const resultCount=el('span',{class:'muted'});
  const resultHeading=el('div',{class:'section-heading results-heading'},[resultTitle,resultCount]);
  function renderResults() {
    const query = store.draft.menuQuery.trim();
    const results = query ? searchMenus(data.recipes,query).map(recipe => {
      const availability = recipeAvailability(recipe,data.ingredients,store.pantryIngredientIds);
      return {recipe, reasons:[`집에 있는 재료 ${availability.owned.length}종 · 구매할 재료 ${availability.buy.length}종`, availability.buy.length ? `구매할 재료: ${availability.buy.join('·')}` : '양념·조미료는 장보기 목록에서 확인해 주세요.'], replacements:replacementsFor(recipe,data.ingredients,[...store.draft.selectedIngredientIds,...store.pantryIngredientIds])};
    }) : recommend(data.ingredients,data.recipes,store.draft,store.excludedRecipeIds,store.pantryIngredientIds);
    const slice = pageResults(results,visible);
    resultTitle.textContent=query?'메뉴 검색 결과':'추천 메뉴';
    resultCount.textContent=`${results.length}개 중 ${slice.items.length}개`;
    searchList.hidden=!query;
    content.hidden=Boolean(query);
    if(query) {
      const choices=slice.items.map(({recipe,replacements})=>{
        const added=store.draft.selectedRecipes.some(s=>s.recipeId===recipe.id);
        return button([el('span',{class:'search-menu-name search-result-name'},recipe.name),el('span',{class:'search-result-status'},added?'✓ 담김':'담기 +'),el('span',{class:'search-result-meta'},servingLabel(recipe))],()=>{
          addMenu(recipe,replacements,true);
        },'search-menu-option',{disabled:added,'aria-label':`${recipe.name} ${added?'담김':'담기'}`});
      });
      choices.forEach((choice,index)=>choice.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();input.focus();searchList.hidden=true;}
        if(!['ArrowDown','ArrowUp'].includes(event.key))return;
        event.preventDefault();const enabled=choices.filter(b=>!b.disabled),current=enabled.indexOf(choice);
        const next=enabled[current+(event.key==='ArrowDown'?1:-1)];if(next)next.focus();else input.focus();
      }));
      searchList.replaceChildren(...[
        el('div',{class:'search-list-heading'},[el('span',{role:'status'},`전체 메뉴 검색 · ${results.length}개`),button('검색 지우기',()=>{store.draft.menuQuery='';input.value='';resetVisible();save();renderResults();input.focus();},'secondary')]),
        ...choices,
        !choices.length?el('p',{class:'muted'},'검색 결과가 없어요. 다른 메뉴 이름을 입력해 주세요.'):null,
        slice.hasMore?button('검색 결과 더 보기',()=>{visible+=8;renderResults();},'secondary list-more'):null
      ].filter(Boolean));
      return;
    }
    searchList.replaceChildren();
    const cards = slice.items.map(({recipe,reasons,replacements}) => {
      const added = store.draft.selectedRecipes.some(s=>s.recipeId===recipe.id);
      return el('article', {class:'recipe-card panel'}, [
        recipe.imagePath ? el('div',{class:'recipe-visual'},[el('img', {src:recipe.imagePath, alt:'', loading:'lazy', decoding:'async', referrerPolicy:'no-referrer', width:480, height:300, class:'recipe-image', onerror:event=>{event.target.hidden=true;const visual=event.target.closest?.('.recipe-visual');if(visual)visual.hidden=true;}}),recipe.imageKind==='generated'?el('span',{class:'ai-image-label'},'AI 생성 이미지'):null]) : null,
        el('h3', {},recipe.name), el('p', {class:'muted recipe-meta'},servingLabel(recipe)),
        el('div', {class:'recipe-card-actions'}, [button(added?'담김':'담기 +', () => {
          addMenu(recipe,replacements);
        }, 'primary', {disabled:added, 'aria-label':`${recipe.name} 담기`}),
        el('details', {class:'recipe-options'}, [el('summary', {'aria-label':`${recipe.name} 더 보기`},'⋯'), el('div', {class:'recipe-options-content'}, [
          el('ul', {class:'reasons'},reasons.map(reason=>el('li',{},reason))),
          button('앞으로 추천받지 않기',()=>excludeRecipe(recipe),'secondary')
        ])])])
      ]);
    });
    content.replaceChildren(...[
      query ? el('div',{class:'search-scope'},[el('span',{class:'muted'},'전체 메뉴 검색 중 · 추천 조건 미적용'),button('검색 지우기',()=>{store.draft.menuQuery='';input.value='';resetVisible();save();renderResults();input.focus();},'secondary')]) : null,
      cards.length ? el('div',{class:'card-grid'},cards) : empty(query?'검색 결과가 없어요.':'현재 조건에 맞는 추천 메뉴가 없어요.',query?'메뉴 이름을 짧게 바꿔 검색해 주세요.':'관심 재료를 선택하거나 음식 종류를 바꿔 주세요. 메뉴 이름으로 직접 검색할 수도 있어요.'),
      slice.hasMore ? button('더 보기',()=>{visible+=8;renderResults();focus('more');},'secondary',{id:'more'}) : null,
      slice.items.some(item=>item.recipe.imagePath&&item.recipe.imageKind!=='generated')?el('p',{class:'photo-credit'},link('사진 출처 · 식품의약품안전처', 'https://www.data.go.kr/data/15060073/openapi.do')):null].filter(Boolean));
  }
  input.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    if(event.key==='Escape'){searchList.hidden=true;}
    if(['ArrowDown','Enter'].includes(event.key)&&!searchList.hidden){const first=[...searchList.children].find(node=>node.className?.includes('search-menu-option')&&!node.disabled);if(first){event.preventDefault();first.focus();}}
  });
  input.addEventListener('input',()=>{store.draft.menuQuery=input.value.slice(0,200);resetVisible();save();renderResults();});
  host.replaceChildren(
    el('section',{id:'recommendations-panel','aria-label':'추천 메뉴와 검색'},[
      el('section',{class:'recommendation-controls'},[
        tabs,
        el('div',{class:'food-kinds'},[el('span',{class:'flow-heading'},'음식 종류'),filters]),
        modeIndex===1?el('div',{class:'interest-section'},[el('div',{class:'section-heading'},[el('span',{class:'field-label'},'관심 재료'),el('div',{class:'interest-actions'},[toggleAllInterests,link('재료 수정',url('ingredients.html?tab=planned'))])]),interests.length?interestChips:link('관심 재료 고르기',url('ingredients.html?tab=planned'))]):null
      ]),el('div',{id:'recipe-feedback',role:'status','aria-live':'polite'}),
      resultHeading,
      el('label',{htmlFor:input.id,class:'flow-heading'},'메뉴 검색'),input,searchList,content
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
  showUndo(`${recipe.name} 메뉴를 추천에서 제외했어요.`, () => {
    store.setExcludedRecipeIds(store.excludedRecipeIds.filter(id => id !== recipe.id)); warnings(); drawRecipes(); focus('results-title'); announce(`${recipe.name} 메뉴를 다시 추천해요.`);
  });
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
      announce(`${selectedIds.length}개 재료를 ${owned?'집에 있는 재료로 저장했어요.':'이번 구매에서 제외했어요.'}`);
    }
    const dialog=el('dialog',{'aria-labelledby':'exclude-ingredients-title','aria-describedby':'exclude-ingredients-description'},[
      el('h2',{id:'exclude-ingredients-title'},'구매 목록에서 제외할까요?'),
      el('p',{id:'exclude-ingredients-description'},`선택한 재료 ${selectedIds.length}종의 제외 이유를 골라 주세요.`),
      el('div',{class:'exclusion-reasons'},[
        button([el('strong',{},'이미 있어요'),el('span',{class:'muted'},'집에 있는 재료로 저장해 다음 장보기에도 반영해요.')],()=>applyReason(true),'secondary'),
        button([el('strong',{},'지금은 안 사고 싶어요'),el('span',{class:'muted'},'이번 장보기에서만 제외해요. 나중에 복원할 수 있어요.')],()=>applyReason(false),'secondary')
      ]),cancel
    ]);
    dialog.addEventListener('close',()=>{dialog.remove();if(!applied)focus('exclude-selected-ingredients');});
    document.body.append(dialog);dialog.showModal();cancel.focus();
  },'secondary',{id:'exclude-selected-ingredients',disabled:!selectedRows.length});
  const excludedSection=excludedRows.length?el('details',{class:'shopping-category excluded-shopping',open:excludedShoppingOpen},[
    el('summary',{id:'excluded-shopping-summary'},`구매에서 제외한 재료 ${excludedRows.length}개`),
    ...excludedRows.map(row=>el('div',{class:'excluded-shopping-row'},[
      el('span',{},row.ingredient.name),el('span',{class:'quantity'},totalText(row)),
      button('복원',()=>{
        store.draft.excludedShoppingIngredientIds=excludedIds.filter(id=>id!==row.ingredient.id);
        store.draft.checkedIngredientIds=store.draft.checkedIngredientIds.filter(id=>id!==row.ingredient.id);
        save();drawShopping();focus(`check-${row.ingredient.id}`);announce(`${row.ingredient.name} 재료를 복원했어요.`);
      },'secondary',{'aria-label':`${row.ingredient.name} 구매 목록에 복원`})
    ]))
  ]):null;
  excludedSection?.addEventListener('toggle',()=>{excludedShoppingOpen=excludedSection.open;});
  const groups = partitions.map(({title,rows:group})=>{
    if(!group.length&&title!=='구매할 재료')return null;
    const list=group.map(row=>{
      const id=row.ingredient.id, checked=store.draft.checkedIngredientIds.includes(id);
      const check=el('input',{type:'checkbox',id:`check-${id}`,checked,'aria-label':`${row.ingredient.name} 선택`,onchange:event=>{
        store.draft.checkedIngredientIds=event.target.checked?[...new Set([...store.draft.checkedIngredientIds,id])]:store.draft.checkedIngredientIds.filter(x=>x!==id);
        save();drawShopping();focus(`check-${id}`);
      }});
      const open=expandedIngredients.has(id);
      return el('div',{class:`shopping-row${checked?' is-checked':''}`},[
        el('div',{class:`shopping-main${title==='집에 있는 재료'?' owned-main':''}`},[title==='집에 있는 재료'?null:el('label',{class:'check-label',htmlFor:check.id},check),
          button([el('span',{class:'ingredient-name'},[row.ingredient.name,row.ingredient.isSeasoning?el('span',{class:'seasoning-tag'},'양념'):null]),el('span',{class:'quantity'},totalText(row)),el('span',{'aria-hidden':'true'},open?'⌃':'⌄')],()=>{
            if(open)expandedIngredients.delete(id);else expandedIngredients.add(id);
            drawShopping();focus(`ingredient-detail-${id}`);
          },'ingredient-detail',{id:`ingredient-detail-${id}`,'aria-expanded':String(open),'aria-controls':`uses-${id}`})
        ]),
        el('ul',{class:'uses',id:`uses-${id}`,hidden:!open},row.uses.map(use=>el('li',{},[
          el('span',{class:'use-name'},use.name),' ',el('span',{class:'use-detail'},`· ${use.servings*use.times}인분`),' ',el('span',{class:'use-detail'},`· ${quantity(use.amount,use.unit)}`)
        ])))
      ]);
    });
    if(title==='집에 있는 재료') {
      const details=el('details',{class:'shopping-category owned-disclosure',open:ownedOpen},[el('summary',{id:'owned-shopping-summary',tabIndex:-1},`집에 있는 재료 ${group.length}종 · 필요량 확인`),...list]);
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
    el('p', { id: 'reset-description' }, '현재 관심 식재료, 선택 메뉴, 인분, 재료 선택과 구매 제외를 지우고 새 장보기를 시작할까요? 기본 설정·집에 있는 재료·제외한 메뉴는 유지돼요.'),
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
  const mode = store.settings['기본 추천 방식'];
  let chosenMode = mode, chosenPeople = store.settings['기본 식사 인원'];
  const description = el('div', { class: 'notice setting-example', role: 'status' });
  const choices = MODES;
  const form = el('form', { class: 'panel settings-form' });
  function radios(legend, name, values, chosen, action, cls) {
    return el('fieldset', {}, [el('legend', {}, legend), el('div', { class: cls }, values.map(value => el('label', { class: 'radio-card' }, [
      el('input', { type: 'radio', name, value, checked: value === chosen, required: true, onchange: () => action(value) }), el('span', {}, typeof value === 'number' ? `${value}명` : value)
    ])))]);
  }
  function describe() {
    const text = MODE_DESCRIPTIONS[MODES.indexOf(chosenMode)];
    description.replaceChildren(el('strong', {}, '오징어·팽이버섯·양파·감자를 골랐다면'), el('p', {}, text),
      el('p', { class: 'muted' }, '예: 오징어볶음은 오징어·양파를, 감자채볶음은 감자·양파를 활용해요. 버섯초계탕은 팽이버섯·양파를 함께 활용해요.'));
  }
  const allowed = ['index.html', 'ingredients.html', 'recipes.html', 'shopping-list.html', 'guides/index.html', 'guides/squid.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', '404.html'];
  const requested = new URLSearchParams(location.search).get('return');
  const returnPath = store.configured && allowed.includes(requested) ? requested : 'ingredients.html';
  const result = el('div', { role: 'status' });
  form.append(radios('기본 식사 인원', 'servings', [1, 2, 3, 4], chosenPeople, value => { chosenPeople = value; }, 'people-options'),
    radios('기본 추천 방식', 'mode', choices, chosenMode, value => { chosenMode = value; describe(); }, 'mode-options'), description,
    el('button', { type: 'submit', class: 'button primary' }, store.configured ? '저장하고 돌아가기' : '저장하고 재료 선택'), result);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const changed = store.settings['기본 추천 방식'] !== chosenMode;
    const ok = store.saveSettings({ '기본 식사 인원': chosenPeople, '기본 추천 방식': chosenMode });
    if (changed) store.draft.activeRecommendationMode = MODES.includes(chosenMode) ? chosenMode : MODES[0];
    const draftSaved = store.saveDraft(); warnings();
    if (ok && draftSaved) location.assign(url(returnPath));
    else result.replaceChildren(el('p', {}, '설정을 이 브라우저에 저장하지 못했어요. 저장을 다시 시도해 주세요.'));
  });
  const manage = button(`제외한 메뉴 관리 · ${store.excludedRecipeIds.length}개`, async () => {
    manage.disabled = true;
    try { data ||= await loadData(); openExcludedManager(manage); }
    catch { announce('제외한 메뉴를 불러오지 못했어요. 연결을 확인하고 다시 눌러 주세요.'); }
    finally { manage.disabled = false; }
  }, 'secondary', { id: 'manage-excluded' });
  host.replaceChildren(form, link('집에 있는 재료 수정', url('ingredients.html?tab=pantry'), 'button secondary'), el('section', { class: 'panel exclusion-settings' }, [el('h2', {}, '추천 제외 설정'), manage, el('p', { class: 'muted' }, '제외한 메뉴는 새 장보기를 시작해도 유지돼요. 여기서 다시 추천받을 수 있어요.')])); describe();
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
