export function servingLabel(recipe) {
  if(recipe.calculationMode==='batch')return `1회 제조량${recipe.batchSummary?` · ${recipe.batchSummary}`:''}`;
  if(recipe.components)return recipe.components.map(c=>c.mode==='batch'?`${c.name} ${c.quantityUnknown?'수량 미기재':'1회 제조량'}`:`${c.name} ${recipe.baseServings}인분${recipe.servingsStatus==='estimated'?'(추정)':''}`).join(' · ');
  if (recipe.servingsRange) return `${recipe.servingsRange.min}~${recipe.servingsRange.max}인분`;
  return `${recipe.baseServings}인분${recipe.servingsStatus === 'estimated' ? '(추정)' : ''}`;
}
