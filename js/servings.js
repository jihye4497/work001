export function servingLabel(recipe) {
  if (recipe.servingsRange) return `${recipe.servingsRange.min}~${recipe.servingsRange.max}인분 기준`;
  return `${recipe.baseServings}인분 기준${recipe.servingsStatus === 'estimated' ? '(추정)' : ''}`;
}
