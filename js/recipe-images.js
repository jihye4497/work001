// Image metadata is separate from the reviewed recipe quantities and source hashes.
export function sourceSequence(recipe) {
  return recipe.sourceNote?.match(/RCP_SEQ=(\d+)/)?.[1] || recipe.id.match(/^mfds-cookrcp01-(\d+)$/)?.[1] || null;
}
export function safeImageUrl(value) {
  try {
    const url=new URL(value);
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;
    if(!['foodsafetykorea.go.kr','www.foodsafetykorea.go.kr'].includes(url.hostname))return null;
    url.protocol='https:';return url.href;
  } catch {return null;}
}
export function imageEntry(recipe,row) {
  if(sourceSequence(recipe)!==String(row.RCP_SEQ)||recipe.name.normalize('NFKC').replace(/\s/g,'')!==String(row.RCP_NM).normalize('NFKC').replace(/\s/g,''))return null;
  const url=safeImageUrl(row.ATT_FILE_NO_MAIN)||safeImageUrl(row.ATT_FILE_NO_MK);
  return url?{recipeId:recipe.id,sourceSequence:String(row.RCP_SEQ),name:recipe.name,url}:null;
}
export function applyRecipeImages(recipes,metadata,generatedMetadata) {
  const entries=new Map((metadata?.schemaVersion===1&&Array.isArray(metadata.entries)?metadata.entries:[]).map(entry=>[entry.recipeId,entry]));
  const generated=new Map((generatedMetadata?.schemaVersion===1&&Array.isArray(generatedMetadata.entries)?generatedMetadata.entries:[]).map(entry=>[entry.recipeId,entry]));
  return recipes.map(recipe=>{
    const local=generated.get(recipe.id);
    if(local?.name===recipe.name&&local.imageKind==='generated'&&/^assets\/images\/generated\/[a-z0-9-]+\.png$/.test(local.path))return {...recipe,imagePath:new URL('../'+local.path,import.meta.url).href,imageKind:'generated'};
    const entry=entries.get(recipe.id);
    const url=entry&&entry.sourceSequence===sourceSequence(recipe)&&entry.name===recipe.name?safeImageUrl(entry.url):null;
    return url?{...recipe,imagePath:url,imageKind:'official'}:recipe;
  });
}
