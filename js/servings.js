export function servingLabel(recipe) {
  return `${recipe.baseServings}인분 기준${recipe.servingsStatus === 'estimated' ? '(추정)' : ''}`;
}
