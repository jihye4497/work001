import { loadData, CATEGORIES, searchIngredients } from './ingredients.js';
import { MODES, MODE_DESCRIPTIONS, recommend, pageResults } from './recommendations.js';
import { aggregate, totalText, quantity, copyText } from './shopping-list.js';
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
let data, visible = 8, openedRecipe = null, toastTimer, selectedExpanded = false;

function announce(message, autoClear = false) {
  clearTimeout(toastTimer);
  live.textContent = message;
  if (autoClear) toastTimer = setTimeout(() => { live.textContent = ''; }, 4000);
}
function warnings() {
  warningArea.replaceChildren(...store.warnings.map(text => el('p', { class: 'notice warning' }, text)));
}
function save() { store.saveDraft(); warnings(); }
function focus(id) { document.getElementById(id)?.focus({ preventScroll: true }); }
document.querySelectorAll('[data-settings]').forEach(a => { a.href = settingsUrl(); a.textContent = `${store.settings['기본 식사 인원']}명 · 설정`; });
warnings();
if (!store.configured && ['ingredients', 'recipes', 'shopping-list'].includes(page)) {
  warningArea.append(el('p', { class: 'notice' }, [link('기본 설정을 확인해 주세요.', settingsUrl())]));
}

function resetVisible() { visible = 8; }
function selectedPanel() {
  const entries = store.draft.selectedRecipes.map(s => {
    const recipe = data.recipes.find(r => r.id === s.recipeId);
    const id = `selected-${s.recipeId}`;
    const isOpen = openedRecipe === s.recipeId;
    return el('div', { class: 'selected-item' }, [
      button([el('strong', {}, recipe.name), el('span', { class: 'muted' }, servingLabel(recipe)), el('span', {}, `×${s.times}회`)], () => { openedRecipe = isOpen ? null : s.recipeId; draw(); focus(id); }, 'secondary selected selected-menu-button', { id, 'aria-expanded': String(isOpen), 'aria-controls': `edit-${s.recipeId}` }),
      isOpen ? el('div', { class: 'counter', id: `edit-${s.recipeId}` }, [
        button('−', () => changeTimes(s, -1), 'secondary square', { id: `minus-${s.recipeId}`, disabled: s.times <= 1, 'aria-label': `${recipe.name} 조리 횟수 줄이기` }),
        el('span', { class: 'quantity' }, `${s.times}회`),
        button('+', () => changeTimes(s, 1), 'secondary square', { id: `plus-${s.recipeId}`, disabled: s.times >= Number.MAX_SAFE_INTEGER, 'aria-label': `${recipe.name} 조리 횟수 늘리기` }),
        button('삭제', () => { store.draft.selectedRecipes = store.draft.selectedRecipes.filter(x => x.recipeId !== s.recipeId); openedRecipe = null; resetVisible(); save(); draw(); focus('selected-title'); announce(`${recipe.name} 메뉴를 삭제했어요.`); }, 'text-danger', { 'aria-label': `${recipe.name} 삭제` })
      ]) : null
    ]);
  });
  return el('section', { class: 'panel selected-panel', 'aria-labelledby': 'selected-title' }, [
    el('div', { class: 'section-heading' }, [el('h2', { id: 'selected-title', tabIndex: -1 }, `선택 메뉴 ${entries.length}개`), entries.length > 3 ? button(selectedExpanded ? '접기' : `전체 ${entries.length}개 보기`, () => { selectedExpanded = !selectedExpanded; draw(); focus('toggle-selected'); }, 'secondary', { id: 'toggle-selected', 'aria-expanded': String(selectedExpanded), 'aria-controls': 'selected-menu-list' }) : null]),
    entries.length ? el('div', { class: 'chips', id: 'selected-menu-list' }, selectedExpanded ? entries : entries.slice(0,3)) : el('p', { class: 'muted' }, '추천 메뉴를 담아 주세요.')
  ]);
}
function changeTimes(selection, difference) {
  selection.times = Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, selection.times + difference));
  resetVisible(); save(); draw();
  focus(selection.times === 1 ? `plus-${selection.recipeId}` : `${difference > 0 ? 'plus' : 'minus'}-${selection.recipeId}`);
  announce(`조리 횟수를 ${selection.times}회로 변경했어요. 필요량을 다시 계산했어요.`);
}

function drawIngredients() {
  const selected = el('div', { class: 'chips' });
  const heading = el('h2');
  const quick = el('div', { class: 'quick-sections' });
  const input = el('input', { id: 'ingredient-search', type: 'search', placeholder: '예: 오징어, 양파', role: 'combobox', autocomplete: 'off', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': 'search-results' });
  const results = el('div', { id: 'search-results', role: 'listbox', class: 'search-results', hidden: true });
  const hint = el('p', { class: 'muted', role: 'status' });
  let matches = [], active = -1;
  function toggle(id, addOnly = false) {
    const ids = store.draft.selectedIngredientIds;
    if (ids.includes(id)) { if (!addOnly) store.draft.selectedIngredientIds = ids.filter(x => x !== id); }
    else ids.push(id);
    save(); update(); announce(`관심 식재료 ${store.draft.selectedIngredientIds.length}개를 선택했어요.`);
  }
  function update() {
    heading.textContent = `선택한 재료 ${store.draft.selectedIngredientIds.length}개`;
    selected.replaceChildren(...store.draft.selectedIngredientIds.map(id => {
      const item = data.ingredients.find(i => i.id === id);
      return button(`${item.name} ×`, () => { toggle(id); input.focus(); }, 'secondary selected', { 'aria-label': `${item.name} 선택 해제` });
    }));
    if (!selected.childNodes.length) selected.append(el('p', { class: 'muted' }, '아래 재료를 누르거나 이름을 검색해 주세요.'));
    quick.replaceChildren(...CATEGORIES.map(category => {
      const group = data.ingredients.filter(i => i.category === category && i.isQuickPick);
      if (!group.length) return null;
      return el('section', {}, [el('h2', {}, category), el('div', { class: 'chips' }, group.map(i => {
        const checked = store.draft.selectedIngredientIds.includes(i.id);
        return button(`${checked ? '✓ ' : '+ '}${i.name}`, () => { toggle(i.id); focus(`quick-${i.id}`); }, checked ? 'secondary selected' : 'secondary', { id: `quick-${i.id}`, 'aria-pressed': String(checked) });
      }))]);
    }).filter(Boolean));
    search();
  }
  function choose(item) { toggle(item.id, true); input.value = ''; close(); input.focus(); }
  function close() { results.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; hint.textContent = ''; }
  function search() {
    matches = searchIngredients(data.ingredients, input.value); active = -1;
    results.hidden = !input.value.trim();
    input.setAttribute('aria-expanded', String(!results.hidden)); input.removeAttribute('aria-activedescendant');
    results.replaceChildren(...matches.map((item, index) => el('div', { id: `option-${index}`, role: 'option', 'aria-selected': 'false', class: 'search-option', onmousedown: event => event.preventDefault(), onclick: () => choose(item) }, `${item.name}${store.draft.selectedIngredientIds.includes(item.id) ? ' · 선택됨' : ''}`)));
    hint.textContent = input.value.trim() ? (matches.length ? `${matches.length}개 결과. 위아래 방향키로 고르고 Enter를 눌러 주세요.` : '등록된 재료가 없어요. 다른 이름으로 검색해 주세요.') : '';
  }
  input.addEventListener('input', search);
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); return; }
    if (event.key === 'Enter') { event.preventDefault(); if (active >= 0 && !results.hidden) choose(matches[active]); return; }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key) || !matches.length) return;
    event.preventDefault(); results.hidden = false; input.setAttribute('aria-expanded', 'true');
    active = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
    [...results.children].forEach((node, index) => node.setAttribute('aria-selected', String(index === active)));
    input.setAttribute('aria-activedescendant', `option-${active}`);
    results.children[active].scrollIntoView({ block: 'nearest' });
  });
  input.addEventListener('blur', close);
  host.replaceChildren(el('div', { class: 'ingredient-layout' }, [
    el('section', { class: 'panel ingredient-tools' }, [el('label', { htmlFor: input.id, class: 'field-label' }, '재료명 검색'), input, results, hint, heading, selected,
      el('p', { class: 'muted' }, '재료를 바꿔도 이미 담은 메뉴는 유지돼요.'), link('메뉴 추천 →', url('recipes.html'), 'button primary')]),
    el('div', {}, [quick, el('p', { class: 'notice' }, '양념·조미료는 추천 점수에서 제외하고 장보기 목록에는 포함해요.')])
  ]));
  update();
}

function drawRecipes() {
  const previousFoodScroll = document.querySelector('.food-filters')?.scrollLeft || 0;
  const previousModeScroll = document.querySelector('.mode-tabs')?.scrollLeft || 0;
  const interests = data.ingredients.filter(i => store.draft.selectedIngredientIds.includes(i.id));
  const results = recommend(data.ingredients, data.recipes, store.draft, store.excludedRecipeIds);
  const slice = pageResults(results, visible);
  const modeIndex = MODES.indexOf(store.draft.activeRecommendationMode);
  const tabs = el('div', { class: 'mode-tabs', role: 'tablist', 'aria-label': '추천 방식' }, MODES.map((mode, index) => button(mode, () => setMode(mode), index === modeIndex ? 'secondary selected' : 'secondary', {
    id: `mode-${index}`, role: 'tab', 'aria-selected': String(index === modeIndex), 'aria-controls': 'recommendations-panel', tabIndex: index === modeIndex ? 0 : -1,
    onkeydown: event => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + 3) % 3;
      setMode(MODES[next]);
    }
  })));
  const filters = el('div', { class: 'food-filters horizontal-buttons', role: 'group', 'aria-label': '음식 종류 · 여러 개 선택 가능' }, ['전체', ...FOOD_CATEGORIES].map((category,index) => {
    const checked = category === '전체' ? !store.draft.selectedFoodCategories.length : store.draft.selectedFoodCategories.includes(category);
    return button(`${checked ? '✓ ' : ''}${category}`, () => {
      const scroll = document.querySelector('.food-filters').scrollLeft;
      store.draft.selectedFoodCategories = toggleFoodCategory(store.draft.selectedFoodCategories, category);
      resetVisible(); save(); drawRecipes(); document.querySelector('.food-filters').scrollLeft = scroll; focus(`food-${index}`);
      announce(`${store.draft.selectedFoodCategories.join('·') || '전체'} 메뉴를 보여드려요.`);
    }, checked ? 'secondary selected' : 'secondary', { id: `food-${index}`, 'aria-pressed': String(checked) });
  }));
  const cards = slice.items.map(({ recipe, reasons, extra }) => el('article', { class: 'recipe-card panel' }, [
    el('div', { class: 'recipe-heading' }, [el('h3', {}, recipe.name), button('담기 +', () => {
      if (!store.draft.selectedRecipes.some(s => s.recipeId === recipe.id)) store.draft.selectedRecipes.push({ recipeId: recipe.id, times: 1 });
      resetVisible(); save(); draw(); focus('results-title'); announce(`${recipe.name} 메뉴를 담았어요. 추천을 다시 정렬했어요.`);
    }, 'primary', { 'aria-label': `${recipe.name} 담기` }),
      el('details', { class: 'recipe-options' }, [el('summary', { 'aria-label': `${recipe.name} 더 보기` }, '⋯'),
        el('div', { class: 'recipe-options-content' }, [button('앞으로 추천받지 않기', () => excludeRecipe(recipe), 'secondary'), el('ul', { class: 'reasons' }, reasons.map(reason => el('li', {}, reason)))])])]),
    el('p', { class: recipe.servingsStatus === 'estimated' ? 'estimated-label' : 'muted' }, `${servingLabel(recipe)} · ${recipe.cookingType}${recipe.cookMinutes !== null ? ` · ${recipe.cookMinutes}분` : ''}`),
    el('p', { class: 'muted recipe-reason' }, `${reasons[0]} · 추가 재료 ${extra.length}종`)
  ]));
  const panel = el('section', { id: 'recommendations-panel', role: 'tabpanel', 'aria-labelledby': `mode-${modeIndex}` }, [
    el('details', { class: 'mode-description' }, [el('summary', {}, '추천 방식 설명'), el('p', {}, MODE_DESCRIPTIONS[modeIndex])]),
    el('div', { id: 'recipe-feedback', role: 'status', 'aria-live': 'polite' }),
    el('div', { class: 'section-heading' }, [el('h2', { id: 'results-title', tabIndex: -1 }, '추천 메뉴'), el('span', { class: 'muted' }, `${results.length}개 중 ${slice.items.length}개`)]),
    interests.length === 0 ? empty('관심 식재료를 먼저 선택해 주세요.', '재료를 고르면 활용할 메뉴를 보여드려요.', url('ingredients.html'), '재료 선택') :
      !cards.length ? el('div', {}, [empty('현재 조건에 맞는 추천 메뉴가 없어요.', '음식 종류를 전체로 바꾸거나 재료·선택 메뉴·제외한 메뉴를 확인해 주세요.', url('ingredients.html'), '재료 선택'), link('제외한 메뉴 관리', `${settingsUrl()}&excluded=1`, 'button secondary')]) : el('div', { class: 'card-grid' }, cards),
    slice.hasMore ? button('더 보기', () => { visible += 8; draw(); focus('more'); announce(`추천 메뉴 ${Math.min(visible, results.length)}개를 보여드려요.`); }, 'secondary', { id: 'more' }) : null
  ]);
  host.replaceChildren(selectedPanel(), el('div', { class: 'interest-summary' }, [el('p', {}, `관심 식재료: ${interests.map(i => i.name).join('·') || '없음'}`), link('재료 선택', url('ingredients.html'))]), tabs, filters, panel,
    el('div', { class: 'actions' }, link('장보기 목록 →', url('shopping-list.html'), 'button primary')));
  filters.scrollLeft = previousFoodScroll; tabs.scrollLeft = previousModeScroll;
  function setMode(mode) { store.draft.activeRecommendationMode = mode; resetVisible(); save(); drawRecipes(); focus(`mode-${MODES.indexOf(mode)}`); document.getElementById(`mode-${MODES.indexOf(mode)}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); announce(`${mode}으로 추천을 정렬했어요.`); }
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
  const copyFallback = el('div');
  const copyButton = button('목록 복사', async () => {
    const text = copyText(rows, store.draft.checkedIngredientIds);
    try { await navigator.clipboard.writeText(text); announce('목록을 복사했어요.', true); }
    catch {
      const area = el('textarea', { readOnly: true, rows: 10, value: text, 'aria-label': '복사할 장보기 목록' });
      copyFallback.replaceChildren(el('p', { class: 'notice warning' }, '복사하지 못했어요. 아래 목록을 선택해 복사해 주세요.'), area);
      area.focus(); area.select();
    }
  }, 'secondary', { disabled: !rows.length });
  const groups = CATEGORIES.map(category => {
    const group = rows.filter(row => row.ingredient.category === category);
    if (!group.length) return null;
    return el('section', { class: 'panel shopping-category' }, [el('h2', {}, category), ...group.map(row => {
      const checked = store.draft.checkedIngredientIds.includes(row.ingredient.id);
      const check = el('input', { type: 'checkbox', id: `check-${row.ingredient.id}`, checked, onchange: event => {
        const ids = store.draft.checkedIngredientIds;
        store.draft.checkedIngredientIds = event.target.checked ? [...new Set([...ids, row.ingredient.id])] : ids.filter(id => id !== row.ingredient.id);
        save(); draw(); focus(`check-${row.ingredient.id}`);
      } });
      return el('div', { class: `shopping-row${checked ? ' is-checked' : ''}` }, [
        el('div', { class: 'shopping-main' }, [el('label', { class: 'check-label', htmlFor: check.id }, [check, el('span', { class: 'ingredient-name' }, row.ingredient.name)]), el('strong', { class: 'quantity' }, totalText(row))]),
        row.estimated ? el('p', { class: 'muted' }, '인분 추정 포함') : null,
        el('ul', { class: 'uses' }, row.uses.map(use => el('li', {}, `${use.name}${use.servingLabel ? ` · ${use.servingLabel}` : ''} · ${quantity(use.amount, use.unit)}${use.note ? ` (${use.note})` : ''}`)))
      ]);
    })]);
  }).filter(Boolean);
  host.replaceChildren(selectedPanel(), el('div', { class: 'section-heading shopping-toolbar' }, [el('p', { class: 'muted' }, `재료 ${rows.length}종 · 구매 체크 ${rows.filter(r => store.draft.checkedIngredientIds.includes(r.ingredient.id)).length}종`), copyButton]), copyFallback,
    ...(rows.length ? groups : [empty('선택한 메뉴가 없어요.', '메뉴를 담으면 재료별 필요량을 모아드려요.', url('recipes.html'), '메뉴 추천')]),
    el('p', { class: 'notice' }, '필요량은 메뉴의 기준 인분과 조리 횟수로 계산해요. 최종 구매 여부와 구매 포장 단위는 직접 확인해 주세요.'),
    el('div', { class: 'actions' }, [link('메뉴 추천', url('recipes.html'), 'button secondary'), link('재료 선택', url('ingredients.html'), 'button secondary')]),
    el('div', { class: 'reset-area' }, button('새 장보기 시작', openReset, 'text-danger', { id: 'reset-draft' })));
}

function openReset() {
  const cancel = button('취소', () => dialog.close(), 'secondary');
  const dialog = el('dialog', { 'aria-labelledby': 'reset-title', 'aria-describedby': 'reset-description' }, [
    el('h2', { id: 'reset-title' }, '새 장보기 시작'),
    el('p', { id: 'reset-description' }, '현재 관심 식재료, 선택 메뉴, 조리 횟수, 구매 체크를 지우고 새 장보기를 시작할까요? 기본 설정은 유지돼요.'),
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
  const choices = [...MODES, '세 가지 모두 비교'];
  const form = el('form', { class: 'panel settings-form' });
  function radios(legend, name, values, chosen, action, cls) {
    return el('fieldset', {}, [el('legend', {}, legend), el('div', { class: cls }, values.map(value => el('label', { class: 'radio-card' }, [
      el('input', { type: 'radio', name, value, checked: value === chosen, required: true, onchange: () => action(value) }), el('span', {}, typeof value === 'number' ? `${value}명` : value)
    ])))]);
  }
  function describe() {
    const text = chosenMode === '세 가지 모두 비교' ? '메뉴 추천에서 세 가지 탭을 전환하며 비교해요. 처음에는 재료 최대 활용형을 보여드려요.' : MODE_DESCRIPTIONS[MODES.indexOf(chosenMode)];
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
  if (page === 'ingredients') drawIngredients();
  if (page === 'recipes') drawRecipes();
  if (page === 'shopping-list') drawShopping();
}
async function start() {
  if (location.protocol === 'file:') {
    warningArea.append(el('p', { class: 'notice warning' }, '재료와 메뉴를 사용하려면 로컬 웹 서버로 열어 주세요. README.md의 실행 방법을 확인해 주세요.'));
  }
  if (page === 'home') {
    const cta = document.querySelector('#home-start');
    if (store.configured) { cta.textContent = '장보기 이어하기 →'; cta.href = url('ingredients.html'); }
    const summary = document.querySelector('#home-summary');
    if (store.configured) summary.textContent = `저장된 관심 식재료 ${store.draft.selectedIngredientIds.length}개 · 선택 메뉴 ${store.draft.selectedRecipes.length}개`;
    return;
  }
  if (page === 'settings') { drawSettings(); return; }
  if (!host || !['ingredients', 'recipes', 'shopping-list'].includes(page)) return;
  host.setAttribute('aria-busy', 'true');
  host.replaceChildren(el('p', { class: 'loading', role: 'status' }, '재료와 메뉴를 불러오는 중이에요.'));
  try { data = await loadData(); store.reconcile(data.ingredients, data.recipes); warnings(); draw(); }
  catch { host.replaceChildren(empty('데이터를 불러오지 못했어요.', '연결을 확인하고 다시 시도해 주세요. 저장된 장보기는 지우지 않았어요.'), button('다시 시도', start, 'primary')); }
  finally { host.setAttribute('aria-busy', 'false'); }
}
start();
