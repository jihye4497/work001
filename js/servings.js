export function servingLabel(recipe) {
  if(recipe.components)return recipe.components.map(c=>c.mode==='batch'?`${c.name} 1회 제조량`:`${c.name} ${recipe.baseServings}인분${recipe.servingsStatus==='estimated'?'(추정)':''}`).join(' · ');
  if (recipe.servingsRange) return `${recipe.servingsRange.min}~${recipe.servingsRange.max}인분`;
  return `${recipe.baseServings}인분${recipe.servingsStatus === 'estimated' ? '(추정)' : ''}`;
}
