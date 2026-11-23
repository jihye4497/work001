// Display metadata only; never infer a creator from a dish name.
export function recipeSource(recipe) {
  if (typeof recipe.sourceName === 'string' && recipe.sourceName.trim()) {
    let url = null;
    try {
      const parsed = new URL(recipe.sourceUrl);
      if (parsed.protocol === 'https:') url = parsed.href;
    } catch { /* A source without a valid link is still readable. */ }
    return { name: recipe.sourceName.trim(), url };
  }
  const note = recipe.sourceNote || '';
  if (/RCP_SEQ=\d+/.test(note)) return {
    name: '식품의약품안전처',
    url: 'https://www.foodsafetykorea.go.kr/api/newDatasetDetail.do?svc_no=COOKRCP01'
  };
  if (note.startsWith('테팔 터보퀴진 레시피북')) return {
    name: '테팔 레시피북',
    url: 'https://dam.groupeseb.com/m/72b0457b12251391/original/TEFAL_CY7551KR_Recipe-Book.pdf'
  };
  return null;
}
