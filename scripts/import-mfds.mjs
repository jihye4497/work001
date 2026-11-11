import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validateData } from '../js/ingredients.js';
import { parseWrittenAmount, parsePlainAmount } from './mfds-quantity.mjs';

export const SOURCE = 'https://www.foodsafetykorea.go.kr/api/newDatasetDetail.do?svc_no=COOKRCP01';
export const LICENSE = 'https://www.data.go.kr/catalog/15060073/openapi.json';
export const hash = text => createHash('sha256').update(text).digest('hex');
export const explicitServing = text => text.match(/^\s*(?:재료\s*)?(?:\[\s*(\d+)\s*인분\s*\]|(\d+)\s*인분)(?:\s*기준)?/u);
export const normalizeName = name => name.normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '').toLocaleLowerCase('ko');
const keepFields = row => ({ ...Object.fromEntries(['RCP_SEQ', 'RCP_NM', 'RCP_WAY2', 'RCP_PAT2', 'RCP_PARTS_DTLS'].map(k => [k, row[k] ?? ''])), ...(row.UNQUANTIFIED_INGREDIENTS ? { UNQUANTIFIED_INGREDIENTS: row.UNQUANTIFIED_INGREDIENTS } : {}) });

export function auditAndMerge(snapshots, ingredients, recipes, reviews, date) {
  const identities = new Map(), duplicateIds = [], pending = [], added = [], unchanged = [], duplicateMenus = [];
  const resultIngredients = structuredClone(ingredients), resultRecipes = structuredClone(recipes);
  const ingredientMap = new Map(resultIngredients.map(i => [i.id, i]));
  const nameMap = new Map(resultRecipes.map(r => [normalizeName(r.name), r]));
  let reportedTotal = 0;
  for (const snapshot of snapshots) {
    const api = snapshot.COOKRCP01;
    if (!api || api.RESULT?.CODE !== 'INFO-000' || !Array.isArray(api.row)) throw new Error('정상 API 응답이 아닙니다.');
    reportedTotal = Math.max(reportedTotal, Number(api.total_count) || 0);
    for (const source of api.row) {
      const row = keepFields(source), id = row.RCP_SEQ;
      if (!/^\d+$/.test(id) || !row.RCP_NM || typeof row.RCP_PARTS_DTLS !== 'string') throw new Error('필수 원본 필드가 없습니다.');
      if (identities.has(id)) {
        if (JSON.stringify(identities.get(id)) !== JSON.stringify(row)) throw new Error('같은 원본 ID의 내용이 달라졌습니다. 다시 검수해야 합니다.');
        duplicateIds.push(id); continue;
      }
      identities.set(id, row);
    }
  }
  const seenSourceNames = new Map();
  for (const [id, row] of identities) {
    const nameKey = normalizeName(row.RCP_NM);
    if (seenSourceNames.has(nameKey)) duplicateMenus.push({ id, name: row.RCP_NM, matches: seenSourceNames.get(nameKey) });
    else seenSourceNames.set(nameKey, id);
    if (!row.RCP_PARTS_DTLS.trim()) {
      pending.push({ sourceId: id, name: row.RCP_NM, reason: '원본 재료정보 없음', rawIngredients: '' });
      continue;
    }
    const review = reviews.find(r => r.sourceId === id);
    const recipeId = `mfds-cookrcp01-${id}`;
    if (!review) {
      pending.push({ sourceId: id, name: row.RCP_NM, reason: explicitServing(row.RCP_PARTS_DTLS) ? '재료·단위·표준 ID 대조 검수 필요' : '기준 인분 근거와 재료·단위·표준 ID 검수 필요', sourceHash: hash(row.RCP_PARTS_DTLS), rawIngredients: row.RCP_PARTS_DTLS });
      continue;
    }
    if (review.sourceHash !== hash(row.RCP_PARTS_DTLS)) throw new Error(`원문 변경 감지: ${id}. 재검수 전에는 반영하지 않습니다.`);
    const servingEvidence = review.servingEvidence;
    const explicitServings = servingEvidence && explicitServing(servingEvidence);
    const estimated = review.servingsStatus === 'estimated';
    const userConfirmed = review.servingsStatus === 'user-confirmed';
    if (userConfirmed) {
      if (review.baseServings !== 1 || explicitServing(row.RCP_PARTS_DTLS) || !review.servingsEvidence?.trim() || !review.confirmedOn) throw new Error(`사용자 확인 인분 근거 불일치: ${id}`);
    } else if (estimated) {
      if (review.baseServings !== 1 || explicitServing(row.RCP_PARTS_DTLS) || !review.servingsEvidence?.trim() || !review.assumptionApprovedOn) throw new Error(`추정 인분 근거 불일치: ${id}`);
    } else if (!explicitServings || explicitServings[0] !== servingEvidence || Number(explicitServings[1] || explicitServings[2]) !== review.baseServings || !row.RCP_PARTS_DTLS.startsWith(servingEvidence)) throw new Error(`기준 인분 근거 불일치: ${id}`);
    if (!review.reviewedOn || !Array.isArray(review.ingredients) || !review.ingredients.length) throw new Error(`검수 기록 누락: ${id}`);
    let unreviewed = estimated || userConfirmed ? row.RCP_PARTS_DTLS : row.RCP_PARTS_DTLS.replace(servingEvidence, '');
    for (const label of review.sectionLabels || []) {
      if (!unreviewed.includes(label)) throw new Error(`구획 근거 불일치: ${id}`);
      unreviewed = unreviewed.replace(label, '');
    }
    for (const item of review.ingredients) unreviewed = unreviewed.replace(item.sourceText, '');
    if (unreviewed.replace(/[\s,.:：·●+]/gu, '')) throw new Error(`원문에 대조하지 않은 재료 문구가 남아 있습니다: ${id}`);
    const collision = nameMap.get(nameKey);
    if (collision && collision.id !== recipeId) {
      pending.push({ sourceId: id, name: row.RCP_NM, reason: '기존 메뉴와 이름 중복; 재료·분량 비교 필요', matches: collision.id });
      continue;
    }
    const recipeIngredients = review.ingredients.map(item => {
      if (!row.RCP_PARTS_DTLS.includes(item.sourceText)) throw new Error(`원문 재료 근거 불일치: ${id}`);
      const definition = review.ingredientDefinitions?.find(i => i.id === item.ingredientId);
      const known = ingredientMap.get(item.ingredientId);
      if (!known && !definition) throw new Error(`표준 재료 정의 누락: ${item.ingredientId}`);
      if (known && definition && JSON.stringify(known) !== JSON.stringify(definition)) throw new Error(`기존 재료 정의를 변경할 수 없습니다: ${item.ingredientId}`);
      if (!known) { ingredientMap.set(definition.id, definition); resultIngredients.push(definition); }
      const standard = ingredientMap.get(item.ingredientId);
      const sourceName = item.sourceName || item.sourceAlias || standard.name;
      if (![standard.name, ...standard.aliases].some(name => name.replace(/\s/g,'') === sourceName.replace(/\s/g,''))) throw new Error(`원문 표준 재료명 불일치: ${id}`);
      if (!item.sourceText.startsWith(sourceName)) throw new Error(`원문 재료명 누락: ${id}`);
      let written = item.sourceText.slice(sourceName.length).trim();
      if (item.sourceFormat === 'missing-unit') {
        if(item.amount !== null || item.unit !== null || !/^\d+(?:\.\d+)?$/u.test(written) || !item.note?.includes('단위 미기재')) throw new Error(`미기재 단위 근거 불일치: ${id}`);
      } else if (item.sourceFormat === 'unresolved') {
        if(item.amount !== null || item.unit !== null || !/^\([^]+\)$/u.test(written) || !item.note?.includes('확인 필요')) throw new Error(`보류 수량 근거 불일치: ${id}`);
        let parseable=false;
        try {parseWrittenAmount(written.slice(1,-1));parseable=true;} catch {}
        if(parseable) throw new Error(`확인 가능한 수량 누락: ${id}`);
      } else if (item.sourceFormat === 'qualitative' || item.sourceFormat === 'unquantified') {
        if (item.amount !== null || item.unit !== null || (item.sourceFormat === 'qualitative' ? !['약간','소량','적당량'].includes(written) : written !== '')) throw new Error(`미기재 수량 근거 불일치: ${id}`);
      } else if (item.sourceFormat === 'plain') {
        const parsed = parsePlainAmount(written);
        if (parsed.amount !== item.amount || parsed.unit !== item.unit) throw new Error(`원문 수량·단위 불일치: ${id}`);
      } else if (item.sourceName) {
        if (!written.startsWith('(') || !written.endsWith(')')) throw new Error(`원문 수량 괄호 불일치: ${id}`);
        written = written.slice(1,-1).trim();
        const parsed = parseWrittenAmount(written);
        if (parsed.amount !== item.amount || parsed.unit !== item.unit) throw new Error(`원문 수량·단위 불일치: ${id}`);
      } else {
        const numeric = written.match(/^(\d+(?:\.\d+)?)([a-zA-Z㎖가-힣]+)/u);
        if (item.amount !== null && (!numeric || Number(numeric[1]) !== item.amount || numeric[2] !== item.unit)) throw new Error(`원문 수량·단위 불일치: ${id}`);
        if (item.amount === null && !['약간', '소량', '적당량'].includes(written)) throw new Error(`미기재 수량 근거를 확인하세요: ${id}`);
      }
      return { ingredientId: item.ingredientId, amount: item.amount, unit: item.unit, note: item.note };
    });
    for (const item of review.additionalUnquantifiedIngredients || []) {
      if (!ingredientMap.has(item.ingredientId) || !row.UNQUANTIFIED_INGREDIENTS?.some(e => e.name === ingredientMap.get(item.ingredientId).name && e.evidence === item.evidence)) throw new Error(`수량 미기재 재료의 조리법 근거 불일치: ${id}`);
      recipeIngredients.push({ ingredientId: item.ingredientId, amount: null, unit: null, note: '조리법에 사용되지만 원문 재료 목록에 수량이 없음' });
    }
    const next = { id: recipeId, name: row.RCP_NM, baseServings: review.baseServings, cookMinutes: null, cookingType: review.cookingType, imagePath: null,
      ...(estimated ? { servingsStatus: 'estimated', servingsEvidence: review.servingsEvidence } : {}),
      ...(userConfirmed ? { servingsStatus: 'user-confirmed', servingsEvidence: review.servingsEvidence } : {}),
      sourceNote: `식품의약품안전처 COOKRCP01 / RCP_SEQ=${id}; ${SOURCE}; 이용허락범위 제한 없음: ${LICENSE}; ${userConfirmed ? '1인분 기준; 사용자 확인 ' + review.confirmedOn : estimated ? '1인분 기준(추정); 사용자 승인 ' + review.assumptionApprovedOn : '원문 ' + review.servingEvidence}; 재료·수량·원문 단위 대조 ${review.reviewedOn}; sha256=${review.sourceHash}; 사진·조리 설명 미사용.`, ingredients: recipeIngredients };
    const existing = resultRecipes.find(r => r.id === recipeId);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(next)) {
        const stable = r => JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !['servingsStatus','servingsEvidence','sourceNote'].includes(k))));
        if (existing.servingsStatus === 'estimated' && userConfirmed && stable(existing) === stable(next)) Object.assign(existing,next);
        else throw new Error(`기존 가져온 메뉴와 검수 내용이 다릅니다: ${id}`);
      }
      unchanged.push(recipeId);
    } else { resultRecipes.push(next); nameMap.set(nameKey, next); added.push(recipeId); }
  }
  validateData(resultIngredients, resultRecipes);
  const groupedNames = new Map();
  const groupedIngredients = new Map();
  for (const row of identities.values()) {
    const nameKey = normalizeName(row.RCP_NM);
    groupedNames.set(nameKey, [...(groupedNames.get(nameKey) || []), { id: row.RCP_SEQ, name: row.RCP_NM }]);
    const partsKey = row.RCP_PARTS_DTLS.normalize('NFKC').replace(/\s/g,'');
    if (partsKey) groupedIngredients.set(partsKey, [...(groupedIngredients.get(partsKey) || []), { id: row.RCP_SEQ, name: row.RCP_NM }]);
  }
  const coverage = resultIngredients.filter(i => !i.isSeasoning).map(i => ({ ingredientId: i.id, name: i.name, recipeCount: resultRecipes.filter(r => r.ingredients.some(x => x.ingredientId === i.id)).length }));
  return { ingredients: resultIngredients, recipes: resultRecipes, report: {
    collectedOn: date, source: SOURCE, license: LICENSE, reportedTotal, collectedUnique: identities.size,
    fullCollection: snapshots.some(s => Number(s.COOKRCP01.total_count) === reportedTotal && new Set(s.COOKRCP01.row.map(r => r.RCP_SEQ)).size === reportedTotal),
    supplementalRows: identities.size > reportedTotal ? identities.size - reportedTotal : 0,
    duplicateSourceRows: duplicateIds.length, duplicateSourceIds: duplicateIds, duplicateMenuCandidates: duplicateMenus,
    distinctNormalizedMenuNames: groupedNames.size,
    duplicateNameGroups: [...groupedNames.values()].filter(group => group.length > 1),
    identicalIngredientTextGroups: [...groupedIngredients.values()].filter(group => group.length > 1),
    explicitServingRows: [...identities.values()].filter(row => explicitServing(row.RCP_PARTS_DTLS)).length,
    added, unchanged, pending, totalSiteRecipes: resultRecipes.length, coverage,
    servingClassification: { explicitReviewed: resultRecipes.filter(r => r.id.startsWith('mfds-cookrcp01-') && !['estimated','user-confirmed'].includes(r.servingsStatus)).length, userConfirmed: resultRecipes.filter(r => r.servingsStatus === 'user-confirmed').length, estimated: resultRecipes.filter(r => r.servingsStatus === 'estimated').map(r => ({ id: r.id, name: r.name, evidence: r.servingsEvidence })), pending: pending.length },
    limitation: '확인한 원문과 일치하는 명시적 검수 기록만 반영합니다. 전체 수집 수와 반영 메뉴 수는 다릅니다. 비슷한 메뉴명의 의미상 중복은 최종 수동 검수가 필요합니다.'
  } };
}

export async function download(key = 'sample', fetcher = fetch) {
  const rows = [], seen = new Set(); let total = 0;
  for (let start = 1; ; start += 1000) {
    let response, payload;
    try {
      response = await fetcher(`https://openapi.foodsafetykorea.go.kr/api/${encodeURIComponent(key)}/COOKRCP01/json/${start}/${start + 999}`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error();
      payload = await response.json();
    } catch { throw new Error('식품안전나라 다운로드에 실패했습니다. 네트워크·인증키를 확인하세요. 인증키가 포함된 URL은 출력하지 않습니다.'); }
    const api = payload.COOKRCP01;
    if (!api || api.RESULT?.CODE !== 'INFO-000' || !Array.isArray(api.row)) throw new Error('API가 정상 레시피 응답을 반환하지 않았습니다. 인증키·이용 신청 상태를 확인하세요.');
    total = Number(api.total_count);
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('전체 건수 형식이 올바르지 않습니다.');
    const batch = api.row.map(keepFields);
    if (!batch.length && rows.length < total) throw new Error('전체 수집 전에 빈 페이지가 반환됐습니다.');
    for (const row of batch) {
      if (seen.has(row.RCP_SEQ)) throw new Error('페이지에서 같은 레시피 ID가 반복 반환됐습니다. 전체 수집으로 처리하지 않습니다.');
      seen.add(row.RCP_SEQ); rows.push(row);
    }
    if (key === 'sample' || rows.length >= total) break;
  }
  return { COOKRCP01: { total_count: String(total), row: rows, RESULT: { CODE: 'INFO-000', MSG: '수집 완료; 전체 여부는 별도 검사' } } };
}

async function main() {
  const root = new URL('../', import.meta.url);
  const load = async path => JSON.parse((await readFile(new URL(path, root), 'utf8')).replace(/^\uFEFF/, ''));
  const args = process.argv.slice(2);
  if (args.includes('--download')) {
    const snapshot = await download(process.env.MFDS_API_KEY || 'sample');
    await mkdir(new URL('data/source/', root), { recursive: true });
    await writeFile(new URL('data/source/mfds-response.json', root), JSON.stringify(snapshot, null, 2) + '\n');
    console.log(`API 보고 전체 ${snapshot.COOKRCP01.total_count}건 / 이번 수집 ${snapshot.COOKRCP01.row.length}건`);
  }
  const inputIndex = args.indexOf('--input');
  const inputs = inputIndex < 0 ? ['data/source/mfds-response.json', 'data/source/mfds-supplement.json'] : args.slice(inputIndex + 1).filter(x => !x.startsWith('--'));
  if (!inputs.length) throw new Error('--input 뒤에 원본 JSON 경로를 지정하세요.');
  const snapshots = await Promise.all(inputs.map(load));
  const result = auditAndMerge(snapshots, await load('data/ingredients.json'), await load('data/recipes.json'), await load('data/source/mfds-reviews.json'), new Date().toISOString().slice(0,10));
  // Validate every output before writing; existing Recipe/Ingredient IDs remain untouched.
  await writeFile(new URL('data/source/mfds-import-report.json', root), JSON.stringify(result.report, null, 2) + '\n');
  await writeFile(new URL('data/ingredients.json', root), JSON.stringify(result.ingredients, null, 2) + '\n');
  await writeFile(new URL('data/recipes.json', root), JSON.stringify(result.recipes, null, 2) + '\n');
  console.log(`고유 원본 ${result.report.collectedUnique} / 추가 ${result.report.added.length} / 기존 유지 ${result.report.unchanged.length} / 보류 ${result.report.pending.length} / 사이트 총 ${result.report.totalSiteRecipes}개`);
  if (!result.report.fullCollection) console.log('일부 수집 상태입니다. 전체 수집에는 COOKRCP01 인증키가 필요합니다.');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => {
  // Do not log thrown network error objects: request URLs may contain the API key.
  console.error('가져오기를 완료하지 못했습니다. 원본 JSON, 검수 해시, 인분·재료 근거와 네트워크·인증 상태를 확인하세요.');
  process.exitCode = 1;
});
