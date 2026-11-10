import { MODES } from './recommendations.js';
export const KEYS = { settings: 'jmd_settings_v1', draft: 'jmd_draft_v1', meta: 'jmd_meta_v1' };
export const defaultSettings = () => ({ '기본 식사 인원': 1, '기본 추천 방식': MODES[0] });
export const defaultDraft = (mode = MODES[0]) => ({ schemaVersion: 1, selectedIngredientIds: [], selectedRecipes: [], activeRecommendationMode: MODES.includes(mode) ? mode : MODES[0], checkedIngredientIds: [] });
export function validSettings(s) {
  return s && Number.isInteger(s['기본 식사 인원']) && s['기본 식사 인원'] >= 1 && s['기본 식사 인원'] <= 4 && [...MODES, '세 가지 모두 비교'].includes(s['기본 추천 방식']);
}
export function validDraft(d) {
  return d && d.schemaVersion === 1 && MODES.includes(d.activeRecommendationMode) &&
    ['selectedIngredientIds', 'checkedIngredientIds'].every(k => Array.isArray(d[k]) && d[k].every(id => typeof id === 'string') && new Set(d[k]).size === d[k].length) &&
    Array.isArray(d.selectedRecipes) && d.selectedRecipes.every(s => s && typeof s.recipeId === 'string' && Number.isSafeInteger(s.times) && s.times >= 1) &&
    new Set(d.selectedRecipes.map(s => s.recipeId)).size === d.selectedRecipes.length;
}

export function createStore(storage) {
  let settings = defaultSettings(), draft = defaultDraft(), configured = false;
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
    draft = read(KEYS.draft, validDraft, defaultDraft(settings['기본 추천 방식']));
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
  return {
    get settings() { return settings; }, get draft() { return draft; }, get configured() { return configured; },
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
      draft.checkedIngredientIds = draft.checkedIngredientIds.filter(id => ids.has(id));
      draft.selectedRecipes = draft.selectedRecipes.filter(s => rids.has(s.recipeId));
      if (before !== JSON.stringify(draft)) { warn('현재 데이터에 없는 항목을 복구 과정에서 제외했어요. 나머지 선택과 횟수는 유지했어요.'); saveDraft(); }
    },
    reset() { draft = defaultDraft(settings['기본 추천 방식']); return saveDraft(); }
  };
}
