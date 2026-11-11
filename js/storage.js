import { MODES, LEGACY_MODES, normalizeMode } from './recommendations.js';
import { validFoodCategories } from './recipe-filters.js';
import { matchIngredient } from './ingredient-matching.js';
export const KEYS = { settings: 'jmd_settings_v1', draft: 'jmd_draft_v1', meta: 'jmd_meta_v1', preferences: 'jmd_recipe_preferences_v1' };
export const defaultSettings = () => ({ '기본 식사 인원': 1, '기본 추천 방식': MODES[0] });
export const defaultDraft = (mode = MODES[0]) => ({ schemaVersion: 1, selectedIngredientIds: [], selectedRecipes: [], activeRecommendationMode: normalizeMode(mode), checkedIngredientIds: [], selectedFoodCategories: [], activeInterestIds: [], menuQuery: '' });
export function validSettings(s) {
  return s && Number.isInteger(s['기본 식사 인원']) && s['기본 식사 인원'] >= 1 && s['기본 식사 인원'] <= 4 && [...MODES,...LEGACY_MODES].includes(s['기본 추천 방식']);
}
export function validDraft(d) {
  return d && d.schemaVersion === 1 && [...MODES,...LEGACY_MODES].includes(d.activeRecommendationMode) &&
    (d.activeInterestIds === undefined || (Array.isArray(d.activeInterestIds) && d.activeInterestIds.every(id=>typeof id==='string') && new Set(d.activeInterestIds).size===d.activeInterestIds.length)) &&
    (d.menuQuery === undefined || (typeof d.menuQuery==='string'&&d.menuQuery.length<=200)) &&
    (d.selectedFoodCategories === undefined || validFoodCategories(d.selectedFoodCategories)) &&
    ['selectedIngredientIds', 'checkedIngredientIds'].every(k => Array.isArray(d[k]) && d[k].every(id => typeof id === 'string') && new Set(d[k]).size === d[k].length) &&
    Array.isArray(d.selectedRecipes) && d.selectedRecipes.every(s => s && typeof s.recipeId === 'string' && Number.isSafeInteger(s.times) && s.times >= 1 && (s.ingredientReplacements===undefined || (s.ingredientReplacements&&typeof s.ingredientReplacements==='object'&&!Array.isArray(s.ingredientReplacements)&&Object.values(s.ingredientReplacements).every(id=>typeof id==='string')))) &&
    new Set(d.selectedRecipes.map(s => s.recipeId)).size === d.selectedRecipes.length;
}

export function createStore(storage) {
  let settings = defaultSettings(), draft = defaultDraft(), configured = false, excludedRecipeIds = [], pantryIngredientIds = [];
  const warnings = new Set();
  const warn = text => warnings.add(text);
  const unavailable = '이 브라우저에 저장하지 못했어요. 지금 화면에서는 계속 사용할 수 있지만 다시 방문하면 내용이 남지 않을 수 있어요.';
  function read(key, validate, fallback) {
    try {
      const raw = storage.getItem(key);
      if (raw === null) return fallback;
      const value = JSON.parse(raw);
      if (!validate(value)) throw new Error('invalid');
      return value;
    } catch {
      warn('저장된 내용을 읽지 못했어요. 읽을 수 없는 항목은 기본값으로 복구했어요. 선택 메뉴와 수량을 확인해 주세요.');
      return fallback;
    }
  }
  function restore() {
    settings = read(KEYS.settings, validSettings, null);
    configured = settings !== null;
    settings ||= defaultSettings();
    settings['기본 추천 방식']=normalizeMode(settings['기본 추천 방식']);
    draft = read(KEYS.draft, validDraft, defaultDraft(settings['기본 추천 방식']));
    draft.activeRecommendationMode=normalizeMode(draft.activeRecommendationMode);
    draft.activeInterestIds ??= [...draft.selectedIngredientIds];
    draft.menuQuery ??= '';
    draft.selectedFoodCategories ||= [];
    const preferences = read(KEYS.preferences, p => p && p.schemaVersion === 1 && Array.isArray(p.excludedRecipeIds) && p.excludedRecipeIds.every(id => typeof id === 'string') && new Set(p.excludedRecipeIds).size === p.excludedRecipeIds.length, { excludedRecipeIds: [] });
    excludedRecipeIds = preferences.excludedRecipeIds;
    if(preferences.pantryIngredientIds!==undefined && (!Array.isArray(preferences.pantryIngredientIds)||!preferences.pantryIngredientIds.every(id=>typeof id==='string'))) warn('집에 있는 재료를 읽지 못해 비웠어요. 선택 메뉴는 유지했어요.');
    else pantryIngredientIds=[...new Set(preferences.pantryIngredientIds||[])];
    read(KEYS.meta, m => m && m.schemaVersion === 1 && typeof m.lastSavedAt === 'string' && Number.isFinite(Date.parse(m.lastSavedAt)), null);
  }
  function saveDraft() {
    try {
      storage.setItem(KEYS.draft, JSON.stringify(draft));
      storage.setItem(KEYS.meta, JSON.stringify({ schemaVersion: 1, lastSavedAt: new Date().toISOString() }));
      return true;
    } catch { warn(unavailable); return false; }
  }
  restore();
  function savePreferences() {
    try { storage.setItem(KEYS.preferences,JSON.stringify({schemaVersion:1,excludedRecipeIds,pantryIngredientIds}));return true; }
    catch {warn(unavailable);return false;}
  }
  return {
    get settings() { return settings; }, get draft() { return draft; }, get configured() { return configured; },
    get excludedRecipeIds() { return [...excludedRecipeIds]; },
    get pantryIngredientIds() { return [...pantryIngredientIds]; },
    setPantryIngredientIds(ids) {
      if(!Array.isArray(ids)||!ids.every(id=>typeof id==='string'))throw Error('보유 재료를 확인해 주세요.');
      pantryIngredientIds=[...new Set(ids)];return savePreferences();
    },
    setExcludedRecipeIds(ids) {
      if (!Array.isArray(ids) || !ids.every(id => typeof id === 'string')) throw new Error('제외한 메뉴를 확인해 주세요.');
      excludedRecipeIds = [...new Set(ids)];
      return savePreferences();
    },
    get warnings() { return [...warnings]; },
    saveDraft,
    saveSettings(next) {
      if (!validSettings(next)) throw new Error('기본 설정을 확인해 주세요.');
      settings = next; configured = true;
      try { storage.setItem(KEYS.settings, JSON.stringify(settings)); } catch { warn(unavailable); return false; }
      return true;
    },
    reconcile(ingredients, recipes) {
      const ids = new Set(ingredients.map(i => i.id)), rids = new Set(recipes.map(r => r.id));
      const before = JSON.stringify(draft);
      draft.selectedIngredientIds = draft.selectedIngredientIds.filter(id => ids.has(id));
      draft.activeInterestIds = draft.activeInterestIds.filter(id=>draft.selectedIngredientIds.includes(id));
      draft.checkedIngredientIds = draft.checkedIngredientIds.filter(id => ids.has(id));
      draft.selectedRecipes = draft.selectedRecipes.filter(s => rids.has(s.recipeId));
      for(const selection of draft.selectedRecipes) if(selection.ingredientReplacements) {
        const sourceIds=new Set(recipes.find(r=>r.id===selection.recipeId).ingredients.map(i=>i.ingredientId));
        const recipe=recipes.find(r=>r.id===selection.recipeId),byId=new Map(ingredients.map(i=>[i.id,i]));
        selection.ingredientReplacements=Object.fromEntries(Object.entries(selection.ingredientReplacements).filter(([from,to])=>sourceIds.has(from)&&ids.has(to)&&matchIngredient(from,to,recipe,byId)>0));
      }
      const pantry=pantryIngredientIds.filter(id=>ids.has(id));
      if(pantry.length!==pantryIngredientIds.length){pantryIngredientIds=pantry;savePreferences();warn('현재 목록에 없는 보유 재료만 제외했어요.');}
      if (before !== JSON.stringify(draft)) { warn('현재 데이터에 없는 항목을 복구 과정에서 제외했어요. 나머지 선택과 횟수는 유지했어요.'); saveDraft(); }
    },
    reset() { draft = defaultDraft(settings['기본 추천 방식']); return saveDraft(); }
  };
}
